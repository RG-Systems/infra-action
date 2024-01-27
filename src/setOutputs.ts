import * as core from '@actions/core';
import { execSync } from 'child_process';

type Params = {
  stack: string;
  folder: string;
};

export const setOutputs = ({ stack, folder }: Params): void => {
  const outputs = JSON.parse(execSync(`cat ./cdk-outputs.json`).toString());

  core.debug(`>>> Outputs:\n${JSON.stringify(outputs)}`);

  // Set outputs for other workflow steps to use
  core.setOutput('folder', folder);
  core.setOutput('bucket', outputs[stack].BucketName);
  core.setOutput('id', outputs[stack].DistributionId);
  core.setOutput('url', outputs[stack].DeploymentUrl);
};
