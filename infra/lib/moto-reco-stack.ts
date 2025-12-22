import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * moto-reco のベーススタック。
 * ここに環境共通のリソースや各種コンポーネントを追加してください。
 */
export class MotoRecoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 例: ここに VPC や S3 Bucket などのリソースを追加する
  }
}
