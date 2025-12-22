import { App } from 'aws-cdk-lib';
import { MotoRecoStack } from '../lib/moto-reco-stack';

const app = new App();

new MotoRecoStack(app, 'MotoRecoStack', {
  /* 環境指定が必要な場合は以下を設定
   * env: {
   *   account: process.env.CDK_DEFAULT_ACCOUNT,
   *   region: process.env.CDK_DEFAULT_REGION,
   * },
   */
});

app.synth();
