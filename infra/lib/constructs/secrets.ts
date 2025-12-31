import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'

export interface SecretsConstructProps {
  prefix: string
  environment: string
}

export class SecretsConstruct extends Construct {
  public readonly databaseSecret: secretsmanager.Secret
  public readonly firebasePrivateKeySecret: secretsmanager.Secret
  public readonly ssmParameters: {
    firebaseProjectId: ssm.StringParameter
    firebaseClientEmail: ssm.StringParameter
    firebaseApiKey: ssm.StringParameter
    firebaseAuthDomain: ssm.StringParameter
    firebaseStorageBucket: ssm.StringParameter
    firebaseMessagingSenderId: ssm.StringParameter
    firebaseAppId: ssm.StringParameter
    databaseUrl: ssm.StringParameter
  }

  constructor(scope: Construct, id: string, props: SecretsConstructProps) {
    super(scope, id)

    // RDS認証情報 (自動生成パスワード)
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `${props.prefix}/rds/${props.environment}`,
      description: 'RDS PostgreSQL root user credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'motoreco_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    })

    // Firebase秘密鍵 (手動設定用プレースホルダー)
    this.firebasePrivateKeySecret = new secretsmanager.Secret(
      this,
      'FirebasePrivateKeySecret',
      {
        secretName: `${props.prefix}/firebase-private-key/${props.environment}`,
        description: 'Firebase service account private key',
        // 手動でAWS CLIまたはコンソールから設定
      }
    )

    // SSM Parameter Store パス定義
    const parameterPrefix = `/${props.prefix}/${props.environment}`
    const ssmParameterPaths = {
      firebaseProjectId: `${parameterPrefix}/firebase/project-id`,
      firebaseClientEmail: `${parameterPrefix}/firebase/client-email`,
      firebaseApiKey: `${parameterPrefix}/firebase/api-key`,
      firebaseAuthDomain: `${parameterPrefix}/firebase/auth-domain`,
      firebaseStorageBucket: `${parameterPrefix}/firebase/storage-bucket`,
      firebaseMessagingSenderId: `${parameterPrefix}/firebase/messaging-sender-id`,
      firebaseAppId: `${parameterPrefix}/firebase/app-id`,
      databaseUrl: `${parameterPrefix}/database-url`,
    }

    // SSMパラメータの定義 (値は手動で設定)
    this.ssmParameters = {
      firebaseProjectId: new ssm.StringParameter(
        this,
        'FirebaseProjectIdParameter',
        {
          parameterName: ssmParameterPaths.firebaseProjectId,
          stringValue: 'PLACEHOLDER',
        }
      ),
      firebaseClientEmail: new ssm.StringParameter(
        this,
        'FirebaseClientEmailParameter',
        {
          parameterName: ssmParameterPaths.firebaseClientEmail,
          stringValue: 'PLACEHOLDER',
        }
      ),
      firebaseApiKey: new ssm.StringParameter(this, 'FirebaseApiKeyParameter', {
        parameterName: ssmParameterPaths.firebaseApiKey,
        stringValue: 'PLACEHOLDER',
      }),
      firebaseAuthDomain: new ssm.StringParameter(
        this,
        'FirebaseAuthDomainParameter',
        {
          parameterName: ssmParameterPaths.firebaseAuthDomain,
          stringValue: 'PLACEHOLDER',
        }
      ),
      firebaseStorageBucket: new ssm.StringParameter(
        this,
        'FirebaseStorageBucketParameter',
        {
          parameterName: ssmParameterPaths.firebaseStorageBucket,
          stringValue: 'PLACEHOLDER',
        }
      ),
      firebaseMessagingSenderId: new ssm.StringParameter(
        this,
        'FirebaseMessagingSenderIdParameter',
        {
          parameterName: ssmParameterPaths.firebaseMessagingSenderId,
          stringValue: 'PLACEHOLDER',
        }
      ),
      firebaseAppId: new ssm.StringParameter(this, 'FirebaseAppIdParameter', {
        parameterName: ssmParameterPaths.firebaseAppId,
        stringValue: 'PLACEHOLDER',
      }),
      databaseUrl: new ssm.StringParameter(this, 'DatabaseUrlParameter', {
        parameterName: ssmParameterPaths.databaseUrl,
        stringValue: 'PLACEHOLDER',
      }),
    }
  }
}
