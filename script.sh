#!/bin/bash

cd ./cdk

yarn install --frozen-lockfile

export STACK=$PROJECT_NAME-$ENVIRONMENT

if [ $ENVIRONMENT = "tmp" ]; then
  STACK=$PROJECT_NAME-$ENVIRONMENT-$GITHUB_REF_NAME
fi

echo ">>> STACK -> $STACK"

if [ $CDK_ACTION = "destroy" ]; then
  echo ">>> Destroying the stack"
  npx cdk destroy $STACK --force --require-approval never
else
  echo ">>> Deploying the stack"
  npx cdk $CDK_ACTION $STACK --require-approval never --ci --outputs-file cdk-outputs.json

  # Return the result of the deployment
  BUCKET=$(jq --arg key "$STACK" '.[$key].BucketName' cdk-outputs.json)
  BUCKET=$(echo $BUCKET | sed -e 's/"//g')
  echo "bucket=$BUCKET" >> $GITHUB_OUTPUT
  echo "id=$(jq --arg key "$STACK" '.[$key].DistributionId' cdk-outputs.json)" >> $GITHUB_OUTPUT
  URL=$(jq --arg key "$STACK" '.[$key].DeploymentUrl' cdk-outputs.json)
  URL=$(echo $URL | sed -e 's/"//g')
  echo "url=$URL" >> $GITHUB_OUTPUT

  # Print the outputs
  echo "RESULT >>> cdk-outputs.json ->"
  cat cdk-outputs.json

  # Create the env.json file
  echo $VARIABLES | \
  jq 'with_entries(select(.key | startswith("STACK_") | not))' | \
  jq 'with_entries(select(.key | startswith("CLIENT_")) | .key |= sub("^CLIENT_"; ""))' \
  > env.json

  echo ">>> env.json ->"
  cat env.json

  DISTRIBUTION_ID=$(jq --arg key "$STACK" '.[$key].DistributionId' cdk-outputs.json)
  DISTRIBUTION_ID=$(echo $DISTRIBUTION_ID | sed -e 's/"//g')

  if [ $ENVIRONMENT = "tmp" ]; then
    echo ">>> Deploying the env variables"
    aws s3 cp env.json s3://$BUCKET/$GITHUB_REF_NAME/env.json
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/$GITHUB_REF_NAM/env.json"
  else
    echo ">>> Deploying the env variables to $ENVIRONMENT"
    aws s3 cp env.json s3://$BUCKET/$ENVIRONMENT/env.json
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/$ENVIRONMENT/env.json"
  fi
fi
