import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'

export interface NetworkConstructProps {
  vpcCidr: string
  publicSubnetCidrAz1: string
  publicSubnetCidrAz2: string
  privateSubnetCidrAz1: string
  privateSubnetCidrAz2: string
  availabilityZone1: string
  availabilityZone2: string
  prefix: string
  environment: string
}

export class NetworkConstruct extends Construct {
  public readonly vpc: ec2.Vpc
  public readonly publicSubnets: ec2.Subnet[]
  public readonly privateSubnets: ec2.Subnet[]
  public readonly albSecurityGroup: ec2.SecurityGroup
  public readonly fargateSecurityGroup: ec2.SecurityGroup
  public readonly rdsSecurityGroup: ec2.SecurityGroup

  constructor(scope: Construct, id: string, props: NetworkConstructProps) {
    super(scope, id)

    // VPC作成 (NAT Gatewayなし、コスト削減)
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${props.prefix}-vpc-${props.environment}`,
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      maxAzs: 2,
      natGateways: 0, // コスト削減: NAT Gatewayなし
      subnetConfiguration: [], // カスタムサブネット構成を使用
    })

    // Public Subnet AZ1 (Fargate配置)
    const publicSubnetAz1 = new ec2.Subnet(this, 'PublicSubnetAz1', {
      vpcId: this.vpc.vpcId,
      cidrBlock: props.publicSubnetCidrAz1,
      availabilityZone: props.availabilityZone1,
      mapPublicIpOnLaunch: true,
    })

    // Public Subnet AZ2 (Fargate配置)
    const publicSubnetAz2 = new ec2.Subnet(this, 'PublicSubnetAz2', {
      vpcId: this.vpc.vpcId,
      cidrBlock: props.publicSubnetCidrAz2,
      availabilityZone: props.availabilityZone2,
      mapPublicIpOnLaunch: true,
    })

    // Private Subnet AZ1 (RDS配置)
    const privateSubnetAz1 = new ec2.Subnet(this, 'PrivateSubnetAz1', {
      vpcId: this.vpc.vpcId,
      cidrBlock: props.privateSubnetCidrAz1,
      availabilityZone: props.availabilityZone1,
    })

    // Private Subnet AZ2 (RDS配置)
    const privateSubnetAz2 = new ec2.Subnet(this, 'PrivateSubnetAz2', {
      vpcId: this.vpc.vpcId,
      cidrBlock: props.privateSubnetCidrAz2,
      availabilityZone: props.availabilityZone2,
    })

    // プロパティに配列として設定
    this.publicSubnets = [publicSubnetAz1, publicSubnetAz2]
    this.privateSubnets = [privateSubnetAz1, privateSubnetAz2]

    // Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, 'IGW', {
      tags: [
        { key: 'Name', value: `${props.prefix}-igw-${props.environment}` },
      ],
    })

    new ec2.CfnVPCGatewayAttachment(this, 'IGWAttachment', {
      vpcId: this.vpc.vpcId,
      internetGatewayId: igw.ref,
    })

    // Public Subnet Route Table
    const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: this.vpc.vpcId,
      tags: [
        {
          key: 'Name',
          value: `${props.prefix}-rt-public-${props.environment}`,
        },
      ],
    })

    new ec2.CfnRoute(this, 'PublicRoute', {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    })

    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnetAz1RTAssoc', {
      subnetId: publicSubnetAz1.subnetId,
      routeTableId: publicRouteTable.ref,
    })

    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnetAz2RTAssoc', {
      subnetId: publicSubnetAz2.subnetId,
      routeTableId: publicRouteTable.ref,
    })

    // Security Groups
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${props.prefix}-sg-alb-${props.environment}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    })

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    )

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    )

    this.fargateSecurityGroup = new ec2.SecurityGroup(
      this,
      'FargateSecurityGroup',
      {
        vpc: this.vpc,
        securityGroupName: `${props.prefix}-sg-fargate-${props.environment}`,
        description: 'Security group for Fargate tasks',
        allowAllOutbound: true,
      }
    )

    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    )

    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${props.prefix}-sg-rds-${props.environment}`,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    })

    this.rdsSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from Fargate'
    )
  }
}
