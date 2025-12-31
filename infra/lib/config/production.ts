export const ProductionConfig = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },

  // 命名規則
  prefix: 'motoreco',
  environment: 'prod',

  // ネットワーク
  network: {
    vpcCidr: '10.0.0.0/16',
    // AZ1 (ap-northeast-1a)
    publicSubnetCidrAz1: '10.0.1.0/24',
    privateSubnetCidrAz1: '10.0.2.0/24',
    // AZ2 (ap-northeast-1b)
    publicSubnetCidrAz2: '10.0.3.0/24',
    privateSubnetCidrAz2: '10.0.4.0/24',
    // Availability Zones
    availabilityZone1: 'ap-northeast-1a',
    availabilityZone2: 'ap-northeast-1c',
  },

  // データベース
  database: {
    allocatedStorage: 20, // GB
    engine: 'postgres',
    databaseName: 'motoreco',
    backupRetention: 7, // days
    multiAz: false, // シングルAZ
  },

  // Fargate
  fargate: {
    cpu: 256, // 0.25 vCPU
    memory: 512, // 0.5 GB
    desiredCount: 1,
    minCapacity: 1,
    maxCapacity: 3,
    containerPort: 3000,
  },

  // 監視
  monitoring: {
    alarms: {
      cpuThreshold: 80, // %
      memoryThreshold: 80, // %
      errorRateThreshold: 5, // %
    },
  },

  // Session Manager
  sessionManager: {
    enabled: true,
    vpcEndpointsEnabled: false, // Phase 1ではfalse、必要に応じてtrueに変更
    auditLogsRetention: 7, // days
  },
} as const
