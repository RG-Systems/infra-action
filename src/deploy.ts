import AWS from 'aws-sdk';
import { PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import * as cdk from 'aws-cdk-lib';
import { Stack } from './stack';
import { CreateStackOutput } from 'aws-sdk/clients/cloudformation';

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

export const deploy = async ({
  optimized,
  stackName,
  environment,
  project,
  identity,
  path,
  domain,
  env
}: Params): Promise<CreateStackOutput> => {
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

  AWS.config.update({ region: env.region });
  const cloudFormation = new AWS.CloudFormation();

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
