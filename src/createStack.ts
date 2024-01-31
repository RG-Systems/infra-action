import type { CloudFormationStackArtifact } from 'aws-cdk-lib/cx-api';

import { PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import * as cdk from 'aws-cdk-lib';

import { Stack } from './stack';

type Params = {
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

export const createStack = ({
  optimized,
  stackName,
  environment,
  project,
  identity,
  path,
  domain,
  env
}: Params): CloudFormationStackArtifact => {
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

  return app.synth().getStackArtifact(stack.artifactId);
};
