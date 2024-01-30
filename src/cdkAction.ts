import type { CreateStackOutput } from 'aws-sdk/clients/cloudformation';
import CloudFormation from 'aws-sdk/clients/cloudformation';
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
}: Params): Promise<CreateStackOutput | unknown> => {
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

  const cloudFormation = new CloudFormation({
    region: env.region
  });

  if (action === 'destroy') {
    return cloudFormation
      .deleteStack(
        {
          StackName: stackName
        },
        (err, data) => {
          if (err) {
            console.error('Error deleting stack', err);
          } else {
            console.log('Stack deletion initiated:', data);
          }
        }
      )
      .promise();
  }

  return cloudFormation
    .createStack(
      {
        StackName: stackName,
        TemplateBody: JSON.stringify(cloudFormationTemplate)
      },
      (err, data) => {
        if (err) {
          console.error('Error creating stack', err);
        } else {
          console.log('Stack creation initiated:', data);
        }
      }
    )
    .promise();
};
