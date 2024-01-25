#!/usr/bin/env node
import 'dotenv/config';
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { PriceClass } from 'aws-cdk-lib/aws-cloudfront';

import { Stack } from './stack';

const app = new cdk.App();

const {
  AWS_ACCOUNT,
  AWS_REGION,
  ORIGIN_PATH,
  PRODUCTION,
  STACK,
  DOMAIN,
  ENV,
  PROJECT_NAME,
  IDENTITY
} = process.env || {};

const isProduction = PRODUCTION ? PRODUCTION === 'true' : false;
const priceClass = isProduction
  ? PriceClass.PRICE_CLASS_ALL
  : PriceClass.PRICE_CLASS_100;

new Stack(app, STACK!, {
  priceClass,
  environment: ENV!,
  project: PROJECT_NAME,
  identity: IDENTITY,
  path: ORIGIN_PATH,
  domain: DOMAIN,
  env: {
    account: AWS_ACCOUNT,
    region: AWS_REGION
  }
});
