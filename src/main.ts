import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';

import { PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import * as cdk from 'aws-cdk-lib';

import { Stack } from './stack';

export async function run(): Promise<void> {
  try {
    const AWS_REGION = core.getInput('aws-region', { required: true });
    const AWS_ACCOUNT = core.getInput('aws-account', { required: true });
    const project = core.getInput('name', { required: true });
    const identity = core.getInput('identity');
    const zoneID = core.getInput('zone');
    const environment = core.getInput('environment') || 'tmp';
    const optimized = core.getInput('optimized') === 'true';
    const variables = JSON.parse(core.getInput('variables') || '{}');
    const pr = github.context?.payload?.pull_request?.number;
    const folder = github.context?.sha.slice(0, 7);
    const domain = variables?.DOMAIN;
    const vars = [];
    const stackName = pr
      ? `${pr}-${environment}-${project}`
      : `${environment}-${project}`;

    if (!domain) throw new Error('Missing DOMAIN variable');
    if (!project) throw new Error('Missing name input');

    for (const [key, value] of Object.entries(variables)) {
      vars.push(`${key}=${value}`);
    }

    execSync(`echo "${vars.join('\n')}" > .env`);
    core.debug(`>>> .env:\n${execSync(`cat .env`).toString()}`);

    const app = new cdk.App();

    app.node.setContext('@aws-cdk/core:availability-zones', [AWS_REGION]);

    const stack = new Stack(app, stackName, {
      priceClass: optimized
        ? PriceClass.PRICE_CLASS_ALL
        : PriceClass.PRICE_CLASS_100,
      path: folder,
      environment,
      project,
      identity,
      zoneID,
      domain,
      env: {
        account: AWS_ACCOUNT,
        region: AWS_REGION
      }
    });

    const stackArtifact = app.synth().getStackArtifact(stack.artifactId);
    execSync(`cp ${stackArtifact.templateFullPath} ./template.json`);

    core.setOutput('stack', stackName);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
