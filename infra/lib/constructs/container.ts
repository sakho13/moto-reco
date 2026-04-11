import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { RemovalPolicy, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface ContainerConstructProps {
  vpc: ec2.IVpc
  subnets: ec2.ISubnet[]
  albSecurityGroup: ec2.ISecurityGroup
  fargateSecurityGroup: ec2.ISecurityGroup
  databaseSecret: secretsmanager.ISecret
  firebasePrivateKeySecret: secretsmanager.ISecret
  ssmParameters: {
    firebaseProjectId: ssm.IStringParameter
    firebaseClientEmail: ssm.IStringParameter
    firebaseApiKey: ssm.IStringParameter
    firebaseAuthDomain: ssm.IStringParameter
    firebaseStorageBucket: ssm.IStringParameter
    firebaseMessagingSenderId: ssm.IStringParameter
    firebaseAppId: ssm.IStringParameter
    firebaseMeasurementId: ssm.IStringParameter
    databaseUrl: ssm.IStringParameter
  }
  databaseEndpoint: string
  cpu: number
  memory: number
  desiredCount: number
  containerPort: number
  prefix: string
  environment: string
}

export class ContainerConstruct extends Construct {
  public readonly repository: ecr.Repository
  public readonly cluster: ecs.Cluster
  public readonly service: ecs.FargateService
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer
  public readonly targetGroup: elbv2.ApplicationTargetGroup

  constructor(scope: Construct, id: string, props: ContainerConstructProps) {
    super(scope, id)

    // ECR Repository
    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: `${props.prefix}-ecr-web-${props.environment}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `${props.prefix}-ecs-cluster-${props.environment}`,
      vpc: props.vpc,
      containerInsights: true,
    })

    // Task Execution Role
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: `${props.prefix}-ecs-execution-role-${props.environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    })

    // Secret読み取り権限
    props.databaseSecret.grantRead(executionRole)
    props.firebasePrivateKeySecret.grantRead(executionRole)

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

    // Task Role (アプリケーション用)
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `${props.prefix}-ecs-task-role-${props.environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    // Session Manager権限をTask Roleに追加
    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    )

    // CloudWatch Logs (アプリケーション用)
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${props.prefix}-web-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // CloudWatch Logs (Session Manager監査ログ用)
    const execLogGroup = new logs.LogGroup(this, 'ExecLogGroup', {
      logGroupName: `/aws/ssm/ecs-exec/${props.prefix}-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // Session Manager監査ログ書き込み権限
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [execLogGroup.logGroupArn],
      })
    )

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        family: `${props.prefix}-web-${props.environment}`,
        cpu: props.cpu,
        memoryLimitMiB: props.memory,
        executionRole,
        taskRole,
      }
    )

    // Container Definition
    const container = taskDefinition.addContainer('WebContainer', {
      containerName: 'web',
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'web',
      }),
      environment: {
        NODE_ENV: 'production',
        WEB_PORT: props.containerPort.toString(),
        AWS_REGION: 'ap-northeast-1',
        NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'false',
      },
      secrets: {
        // SSM Parameter Store経由 - データベース接続
        DATABASE_URL: ecs.Secret.fromSsmParameter(
          props.ssmParameters.databaseUrl
        ),
        // Secrets Manager経由 - Firebase
        FIREBASE_PRIVATE_KEY: ecs.Secret.fromSecretsManager(
          props.firebasePrivateKeySecret
        ),
        // SSM Parameter Store経由 - Firebase設定
        FIREBASE_PROJECT_ID: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseProjectId
        ),
        FIREBASE_CLIENT_EMAIL: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseClientEmail
        ),
        NEXT_PUBLIC_FIREBASE_API_KEY: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseApiKey
        ),
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseAuthDomain
        ),
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseProjectId
        ),
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseStorageBucket
        ),
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseMessagingSenderId
        ),
        NEXT_PUBLIC_FIREBASE_APP_ID: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseAppId
        ),
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ecs.Secret.fromSsmParameter(
          props.ssmParameters.firebaseMeasurementId
        ),
      },
    })

    container.addPortMappings({
      containerPort: props.containerPort,
      protocol: ecs.Protocol.TCP,
    })

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `${props.prefix}-alb-${props.environment}`,
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      vpcSubnets: {
        subnets: props.subnets,
      },
    })

    // Target Group
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `${props.prefix}-tg-${props.environment}`,
      vpc: props.vpc,
      port: props.containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/api/v1/health',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: Duration.seconds(30),
    })

    // Listener
    const listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    })

    // HTTPSは手動で設定済み

    // Fargate Service
    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: `${props.prefix}-web-service-${props.environment}`,
      cluster: this.cluster,
      taskDefinition,
      desiredCount: props.desiredCount,
      assignPublicIp: true, // Public Subnet配置
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: {
        subnets: props.subnets,
      },
      healthCheckGracePeriod: Duration.seconds(60),
      enableExecuteCommand: true, // ECS Exec有効化
    })

    // Target Groupに登録
    this.service.attachToApplicationTargetGroup(this.targetGroup)

    // Auto Scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    })

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    })
  }
}
