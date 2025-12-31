import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  service: ecs.FargateService;
  loadBalancer: elbv2.ApplicationLoadBalancer;
  targetGroup: elbv2.ApplicationTargetGroup;
  database: rds.DatabaseInstance;
  cpuThreshold: number;
  memoryThreshold: number;
  errorRateThreshold: number;
  prefix: string;
  environment: string;
  alertEmail?: string;
}

export class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // SNS Topic for Alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${props.prefix}-alarms-${props.environment}`,
      displayName: 'MotoReco Production Alarms',
    });

    if (props.alertEmail) {
      this.alarmTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(props.alertEmail)
      );
    }

    // Fargate CPU Alarm
    const fargateCpuAlarm = new cloudwatch.Alarm(this, 'FargateCPUAlarm', {
      alarmName: `${props.prefix}-fargate-cpu-high-${props.environment}`,
      metric: props.service.metricCpuUtilization(),
      threshold: props.cpuThreshold,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    fargateCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Fargate Memory Alarm
    const fargateMemoryAlarm = new cloudwatch.Alarm(
      this,
      'FargateMemoryAlarm',
      {
        alarmName: `${props.prefix}-fargate-memory-high-${props.environment}`,
        metric: props.service.metricMemoryUtilization(),
        threshold: props.memoryThreshold,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    fargateMemoryAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // ALB Target 5XX Errors
    const alb5xxAlarm = new cloudwatch.Alarm(this, 'ALB5XXAlarm', {
      alarmName: `${props.prefix}-alb-5xx-errors-${props.environment}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensionsMap: {
          LoadBalancer: props.loadBalancer.loadBalancerFullName,
          TargetGroup: props.targetGroup.targetGroupFullName,
        },
        statistic: 'Sum',
        period: Duration.minutes(1),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    alb5xxAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // RDS CPU Alarm
    const rdsCpuAlarm = new cloudwatch.Alarm(this, 'RDSCPUAlarm', {
      alarmName: `${props.prefix}-rds-cpu-high-${props.environment}`,
      metric: props.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    rdsCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // RDS Storage Space Alarm
    const rdsStorageAlarm = new cloudwatch.Alarm(this, 'RDSStorageAlarm', {
      alarmName: `${props.prefix}-rds-storage-low-${props.environment}`,
      metric: props.database.metricFreeStorageSpace(),
      threshold: 2 * 1024 * 1024 * 1024, // 2GB
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
    rdsStorageAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // RDS Connection Count Alarm
    const rdsConnectionAlarm = new cloudwatch.Alarm(
      this,
      'RDSConnectionAlarm',
      {
        alarmName: `${props.prefix}-rds-connections-high-${props.environment}`,
        metric: props.database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    rdsConnectionAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Dashboard
    new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${props.prefix}-${props.environment}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Fargate CPU & Memory',
            left: [props.service.metricCpuUtilization()],
            right: [props.service.metricMemoryUtilization()],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'ALB Request Count & Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                metricName: 'RequestCount',
                dimensionsMap: {
                  LoadBalancer: props.loadBalancer.loadBalancerFullName,
                },
                statistic: 'Sum',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                metricName: 'HTTPCode_Target_5XX_Count',
                dimensionsMap: {
                  LoadBalancer: props.loadBalancer.loadBalancerFullName,
                },
                statistic: 'Sum',
              }),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'RDS CPU & Connections',
            left: [props.database.metricCPUUtilization()],
            right: [props.database.metricDatabaseConnections()],
          }),
        ],
      ],
    });
  }
}
