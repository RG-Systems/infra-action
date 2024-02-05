#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { PriceClass } from 'aws-cdk-lib/aws-cloudfront';

import { Stack, Config } from './stack';

const app = new cdk.App();

const config: Config = {
  path: process.env.GITHUB_SHA?.slice(0, 6) || 'undefined',
  project: process.env.PROJECT_NAME || 'undefined',
  environment: process.env.ENVIRONMENT || 'undefined',
  domain: process.env.DOMAIN || 'undefined',
  priceClass: process.env.OPTIMIZED ? PriceClass.PRICE_CLASS_ALL : PriceClass.PRICE_CLASS_100,
  identity: process.env.AWS_ORIGIN_ACCESS_IDENTITY,
  zoneID: process.env.AWS_ZONE_ID,
}

if (process.env.ENVIRONMENT === 'tmp' && process.env.GITHUB_REF_NAME) {
  config.path = `${process.env.GITHUB_REF_NAME}/${config.path}`;
  config.domain = `${process.env.GITHUB_REF_NAME}-${config.domain}`;
}

new Stack(app, process.env.STACK!, config);
