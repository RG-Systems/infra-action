import * as github from '@actions/github';

type Result = {
  vars: string[];
  stack: string;
  folder: string;
  action: string;
};

export const getInputs = (): Result => {
  const pr = github.context?.payload?.pull_request?.number;
  const folder = github.context?.sha.slice(0, 7);
  const variables = JSON.parse(process.env.VARIABLES || '{}');
  const action = process.env.ACTION;
  const environment = process.env.ENVIRONMENT;
  const project = process.env.PROJECT_NAME;
  const domain = variables?.DOMAIN;
  const vars = [];
  const stack = pr
    ? `${pr}-${environment}-${project}`
    : `${environment}-${project}`;

  if (!domain) throw new Error('Missing DOMAIN variable');
  if (!project) throw new Error('Missing name input');
  if (!action) throw new Error('Missing action input');

  for (const [key, value] of Object.entries(variables)) {
    vars.push(`${key}=${value}`);
  }

  return { vars, stack, folder, action };
};
