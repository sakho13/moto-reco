import * as rds from 'aws-cdk-lib/aws-rds'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { RemovalPolicy, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface DatabaseConstructProps {
  vpc: ec2.IVpc
  subnets: ec2.ISubnet[]
  securityGroup: ec2.ISecurityGroup
  databaseSecret: secretsmanager.ISecret
  allocatedStorage: number
  engine: string
  databaseName: string
  backupRetention: number
  multiAz: boolean
  prefix: string
  environment: string
}

export class DatabaseConstruct extends Construct {
  public readonly instance: rds.DatabaseInstance
  public readonly endpoint: string

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id)

    // Subnet Group (マルチAZ対応)
    const subnetGroup = new rds.SubnetGroup(this, 'SubnetGroup', {
      subnetGroupName: `${props.prefix}-rds-subnet-group-${props.environment}`,
      description: 'Subnet group for RDS across multiple AZs',
      vpc: props.vpc,
      vpcSubnets: {
        subnets: props.subnets,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // Parameter Group
    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_7,
      }),
      description: 'Custom parameter group for PostgreSQL 17',
      parameters: {
        shared_preload_libraries: 'pg_stat_statements',
        log_statement: 'all',
        log_duration: 'on',
      },
    })

    // RDS Instance
    this.instance = new rds.DatabaseInstance(this, 'Instance', {
      instanceIdentifier: `${props.prefix}-rds-${props.environment}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_7,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      subnetGroup,
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(props.databaseSecret),
      databaseName: props.databaseName,
      allocatedStorage: props.allocatedStorage,
      maxAllocatedStorage: 100, // Auto scaling
      storageType: rds.StorageType.GP3,
      multiAz: props.multiAz,
      publiclyAccessible: false,
      parameterGroup,
      backupRetention: Duration.days(props.backupRetention),
      preferredBackupWindow: '17:00-18:00', // JST 02:00-03:00
      preferredMaintenanceWindow: 'sun:18:00-sun:19:00', // JST Sun 03:00-04:00
      deletionProtection: true, // 本番環境保護
      removalPolicy: RemovalPolicy.SNAPSHOT,
      cloudwatchLogsExports: ['postgresql'],
      storageEncrypted: true,
    })

    this.endpoint = this.instance.dbInstanceEndpointAddress
  }
}
