import * as core from '@actions/core';
import { execSync } from 'child_process';

import { getInputs } from './getInputs';
import { setOutputs } from './setOutputs';

const CDK_CONFIG = {
  "app": "npx ts-node --prefer-ts-exts ./cdk/index.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {}
};

const CDK_ARGS = `--require-approval never --outputs-file cdk-outputs.json`;

export async function run(): Promise<void> {
  try {
    core.debug(`>>> ENV:\n${JSON.stringify(process.env)}`);

    const { vars, stack, action, folder } = getInputs();

    execSync(`echo "${vars.join('\n')}" > .env`);
    core.debug(`>>> .env:\n${execSync(`cat .env`).toString()}`);

    execSync(`echo ${JSON.stringify(CDK_CONFIG, null, 2)} > ~/.cdk.json`);
    core.debug(`>>> cdk.json:\n${execSync(`cat cdk.json`).toString()}`);

    execSync(`npx cdk ${action} ${stack} ${CDK_ARGS}`);

    setOutputs({ stack, folder });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
