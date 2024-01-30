import type {
  CreateStackCommandOutput,
  DeleteStackCommandOutput
} from '@aws-sdk/client-cloudformation';

import { STSClient } from '@aws-sdk/client-sts';
import { CloudFormation } from '@aws-sdk/client-cloudformation';
import { PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import * as cdk from 'aws-cdk-lib';

import { Stack } from './stack';

type Params = {
  action: 'deploy' | 'destroy';
  optimized: boolean;
  stackName: string;
  environment: string;
  project: string;
  identity: string;
  path: string;
  domain: string;
  env: {
    account: string;
    region: string;
  };
};

export const cdkAction = async ({
  action,
  optimized,
  stackName,
  environment,
  project,
  identity,
  path,
  domain,
  env
}: Params): Promise<CreateStackCommandOutput | DeleteStackCommandOutput> => {
  const app = new cdk.App();

  const priceClass = optimized
    ? PriceClass.PRICE_CLASS_ALL
    : PriceClass.PRICE_CLASS_100;

  const stack = new Stack(app, stackName, {
    priceClass,
    environment,
    project,
    identity,
    path,
    domain,
    env
  });

  const cloudFormationTemplate = app
    .synth()
    .getStackArtifact(stack.artifactId).template;

  const stsClient = new STSClient({
    region: env.region
  });

  const cloudFormation = new CloudFormation({
    region: env.region,
    credentials: stsClient.config.credentials
  });

  if (action === 'destroy') {
    return cloudFormation.deleteStack({
      StackName: stackName
    });
  }

  return cloudFormation.createStack({
    StackName: stackName,
    TemplateBody: JSON.stringify(cloudFormationTemplate)
  });
};
