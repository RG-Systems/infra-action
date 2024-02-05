import type { Construct } from 'constructs';

import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export type Config = {
  environment: string;
  domain: string;
  path: string;
  project: string;
  priceClass: cloudfront.PriceClass;
  identity?: string;
  zoneID?: string;
};

type Props = cdk.StackProps & Config;

export class Stack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    {
      environment,
      path,
      domain,
      project,
      priceClass,
      identity,
      zoneID,
      ...props
    }: Props
  ) {
    super(scope, id, {
      ...props,
      tags: {
        lob: 'tech_dev_n2p_office',
        team_name: 'n2p-ui',
        application_group: 'n2p',
        application: `n2p-${project}`,
        opsgenie_service_name: 'N2P UI',
      },
    });

    const originAccessIdentity = this.getOriginAccessIdentity(identity);
    const bucket = this.getBucket(project || id, originAccessIdentity);
    const zone = this.getZone(domain, zoneID);
    const distribution = this.getDistribution(
      bucket,
      originAccessIdentity,
      zone,
      domain,
      path,
      priceClass
    );

    distribution.addBehavior('/env.json', this.getEnvOrigin(
      bucket,
      originAccessIdentity,
      environment,
      path,
    ), {
      compress: true,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    });

    this.createSubdomainRecords(distribution, zone, domain);
    this.createOutput(distribution, bucket, domain);
  }

  private getOriginAccessIdentity(
    identity?: string
  ): cloudfront.OriginAccessIdentity {
    if (!identity) {
      return new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
    }

    const oai = cloudfront.OriginAccessIdentity.fromOriginAccessIdentityId(
      this,
      'OriginAccessIdentity',
      identity
    );
    if (oai) return oai as cloudfront.OriginAccessIdentity;
    return new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
  }

  private getBucket(
    projectName: string,
    originAccessIdentity: cloudfront.OriginAccessIdentity
  ): s3.Bucket {
    const bucketName = `${projectName}-storage`;
    const existingBucket = s3.Bucket.fromBucketName(this, 'Bucket', bucketName);
    if (existingBucket) return existingBucket as s3.Bucket;

    const bucket = new s3.Bucket(this, 'Bucket', {
      bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.PRIVATE,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [bucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          )
        ]
      })
    );

    return bucket;
  }

  private getZone(
    domain?: string,
    zoneID?: string
  ): route53.IHostedZone | undefined {
    if (domain) {
      const [, ...domains] = domain.split('.');
      const domainName = domains.join('.');
      return route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
        hostedZoneId: zoneID || '',
        zoneName: domainName
      });
    }

    return undefined;
  }

  private getCertificate(
    zone?: route53.IHostedZone,
    domain?: string
  ): acm.ICertificate | undefined {
    if (domain && zone) {
      return new acm.Certificate(this, 'Certificate', {
        domainName: domain,
        validation: acm.CertificateValidation.fromDns(zone)
      });
    }

    return undefined;
  }

  private getApplicationOrigin(
    bucket: s3.Bucket,
    originAccessIdentity: cloudfront.OriginAccessIdentity,
    path?: string
  ): origins.S3Origin {
    return new origins.S3Origin(bucket, {
      originPath: path,
      originAccessIdentity
    });
  }

  private getDistribution(
    bucket: s3.Bucket,
    originAccessIdentity: cloudfront.OriginAccessIdentity,
    zone?: route53.IHostedZone,
    domain?: string,
    path?: string,
    priceClass?: cloudfront.PriceClass
  ): cloudfront.Distribution {
    const certificate = this.getCertificate(zone, domain);
    const origin = this.getApplicationOrigin(bucket, originAccessIdentity, path);

    return new cloudfront.Distribution(this, 'Distribution', {
      certificate,
      priceClass: priceClass ?? cloudfront.PriceClass.PRICE_CLASS_100,
      domainNames: domain ? [domain] : undefined,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ],
      defaultBehavior: {
        origin,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    });
  }

  private getEnvOrigin(
    bucket: s3.Bucket,
    originAccessIdentity: cloudfront.OriginAccessIdentity,
    environment: string,
    path: string,
  ): origins.S3Origin{
    if (environment === 'tmp') {
      const [env] = path.split('/');
      return this.getApplicationOrigin(
        bucket,
        originAccessIdentity,
        `/${env}/env.json`
      );
    }

    return this.getApplicationOrigin(
      bucket,
      originAccessIdentity,
      `/${environment}/env.json`
    );
  }

  private createSubdomainRecords(
    distribution: cloudfront.Distribution,
    zone?: route53.IHostedZone,
    domain?: string
  ): void {
    if (domain && zone) {
      const [subdomain] = domain.split('.');
      new route53.ARecord(this, 'ARecord', {
        zone,
        recordName: subdomain,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        )
      });

      new route53.AaaaRecord(this, 'AliasRecord', {
        zone,
        recordName: subdomain,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        )
      });
    }
  }

  private createOutput(
    distribution: cloudfront.Distribution,
    bucket: s3.Bucket,
    domain?: string
  ): void {
    new cdk.CfnOutput(this, 'DeploymentUrl', {
      value: `https://${domain}`
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.domainName}`
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName
    });

    new cdk.CfnOutput(this, 'Variables', {
      value: bucket.bucketArn
    });
  }
}
