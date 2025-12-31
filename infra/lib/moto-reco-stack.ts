import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { NetworkConstruct } from './constructs/network'
import { SecretsConstruct } from './constructs/secrets'
import { DatabaseConstruct } from './constructs/database'
import { ContainerConstruct } from './constructs/container'
import { MonitoringConstruct } from './constructs/monitoring'
import { ProductionConfig } from './config/production'

/**
 * moto-reco の本番環境スタック。
 */
export class MotoRecoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const config = ProductionConfig

    // 1. Network
    const network = new NetworkConstruct(this, 'Network', {
      vpcCidr: config.network.vpcCidr,
      publicSubnetCidrAz1: config.network.publicSubnetCidrAz1,
      publicSubnetCidrAz2: config.network.publicSubnetCidrAz2,
      privateSubnetCidrAz1: config.network.privateSubnetCidrAz1,
      privateSubnetCidrAz2: config.network.privateSubnetCidrAz2,
      availabilityZone1: config.network.availabilityZone1,
      availabilityZone2: config.network.availabilityZone2,
      prefix: config.prefix,
      environment: config.environment,
    })

    // 2. Secrets
    const secrets = new SecretsConstruct(this, 'Secrets', {
      prefix: config.prefix,
      environment: config.environment,
    })

    // 3. Database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: network.vpc,
      subnets: network.privateSubnets,
      securityGroup: network.rdsSecurityGroup,
      databaseSecret: secrets.databaseSecret,
      allocatedStorage: config.database.allocatedStorage,
      engine: config.database.engine,
      databaseName: config.database.databaseName,
      backupRetention: config.database.backupRetention,
      multiAz: config.database.multiAz,
      prefix: config.prefix,
      environment: config.environment,
    })

    // 4. Container
    const container = new ContainerConstruct(this, 'Container', {
      vpc: network.vpc,
      subnets: network.publicSubnets,
      albSecurityGroup: network.albSecurityGroup,
      fargateSecurityGroup: network.fargateSecurityGroup,
      databaseSecret: secrets.databaseSecret,
      firebasePrivateKeySecret: secrets.firebasePrivateKeySecret,
      ssmParameters: secrets.ssmParameters,
      databaseEndpoint: database.endpoint,
      cpu: config.fargate.cpu,
      memory: config.fargate.memory,
      desiredCount: config.fargate.desiredCount,
      containerPort: config.fargate.containerPort,
      prefix: config.prefix,
      environment: config.environment,
    })

    // 5. Monitoring
    new MonitoringConstruct(this, 'Monitoring', {
      service: container.service,
      loadBalancer: container.loadBalancer,
      targetGroup: container.targetGroup,
      database: database.instance,
      cpuThreshold: config.monitoring.alarms.cpuThreshold,
      memoryThreshold: config.monitoring.alarms.memoryThreshold,
      errorRateThreshold: config.monitoring.alarms.errorRateThreshold,
      prefix: config.prefix,
      environment: config.environment,
      // alertEmail: 'your-email@example.com', // 必要に応じて設定
    })

    // Outputs
    new CfnOutput(this, 'VpcId', {
      value: network.vpc.vpcId,
      description: 'VPC ID',
    })

    new CfnOutput(this, 'DatabaseEndpoint', {
      value: database.endpoint,
      description: 'RDS endpoint',
    })

    new CfnOutput(this, 'EcrRepositoryUri', {
      value: container.repository.repositoryUri,
      description: 'ECR repository URI',
    })

    new CfnOutput(this, 'LoadBalancerDns', {
      value: container.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
      exportName: `${config.prefix}-alb-dns-${config.environment}`,
    })

    new CfnOutput(this, 'EcsClusterName', {
      value: container.cluster.clusterName,
      description: 'ECS Cluster name',
    })

    new CfnOutput(this, 'EcsServiceName', {
      value: container.service.serviceName,
      description: 'ECS Service name',
    })
  }
}
