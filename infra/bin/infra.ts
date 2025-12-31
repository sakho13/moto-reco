import { App } from 'aws-cdk-lib'
import { MotoRecoStack } from '../lib/moto-reco-stack'
import { ProductionConfig } from '../lib/config/production'

const app = new App()

new MotoRecoStack(app, 'MotoRecoProductionStack', {
  env: ProductionConfig.env,
  description: 'MotoReco Production Infrastructure',
  tags: {
    Environment: 'production',
    Project: 'motoreco',
    ManagedBy: 'CDK',
  },
})

app.synth()
