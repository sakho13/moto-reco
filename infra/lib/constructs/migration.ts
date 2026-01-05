import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface MigrationConstructProps {
  cluster: ecs.ICluster
  vpc: ec2.IVpc
  subnets: ec2.ISubnet[]
  securityGroup: ec2.ISecurityGroup
  migrationDatabaseUrlParameter: ssm.IStringParameter
  prefix: string
  environment: string
}

export class MigrationConstruct extends Construct {
  public readonly taskDefinition: ecs.FargateTaskDefinition
  public readonly repository: ecr.Repository

  constructor(scope: Construct, id: string, props: MigrationConstructProps) {
    super(scope, id)

    // ECR Repository for migration
    this.repository = new ecr.Repository(this, 'MigrationRepository', {
      repositoryName: `${props.prefix}-ecr-migration-${props.environment}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep last 2 images',
          maxImageCount: 2,
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // Task Execution Role
    const executionRole = new iam.Role(this, 'MigrationExecutionRole', {
      roleName: `${props.prefix}-migration-execution-role-${props.environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    })

    // SSM Parameter Store読み取り権限
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameters', 'ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:ap-northeast-1:*:parameter/${props.prefix}/${props.environment}/*`,
        ],
      })
    )

    // Task Role
    const taskRole = new iam.Role(this, 'MigrationTaskRole', {
      roleName: `${props.prefix}-migration-task-role-${props.environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    // CloudWatch Logs
    const logGroup = new logs.LogGroup(this, 'MigrationLogGroup', {
      logGroupName: `/ecs/${props.prefix}-migration-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'MigrationTaskDefinition',
      {
        family: `${props.prefix}-migration-${props.environment}`,
        cpu: 256,
        memoryLimitMiB: 512,
        executionRole,
        taskRole,
      }
    )

    // Container Definition
    this.taskDefinition.addContainer('MigrationContainer', {
      containerName: 'migration',
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'migration',
      }),
      environment: {
        NODE_ENV: 'production',
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSsmParameter(
          props.migrationDatabaseUrlParameter
        ),
      },
    })
  }
}
