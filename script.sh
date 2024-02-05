#!/bin/bash
cd ./cdk

yarn install --frozen-lockfile

export STACK=$PROJECT_NAME-$ENVIRONMENT

if [ $ENVIRONMENT = "tmp" ]; then
  STACK=$PROJECT_NAME-$ENVIRONMENT-$GITHUB_REF_NAME
fi

echo "RESULT >>> STACK -> $STACK"

# Check if the stack exists else create it
if [ $CDK_ACTION = "destroy" ]; then
  echo "RESULT >>> Destroying the stack"
  npx cdk destroy $STACK --force --require-approval never
  exit 0
else
  npx cdk $CDK_ACTION $STACK --require-approval never --ci --outputs-file cdk-outputs.json

  # Return the result of the deployment
  BUCKET=$(jq --arg key "$STACK" '.[$key].BucketName' cdk-outputs.json)
  echo "bucket=$(echo $BUCKET | sed -e 's/"//g')" >> $GITHUB_OUTPUT
  echo "id=$(jq --arg key "$STACK" '.[$key].DistributionId' cdk-outputs.json)" >> $GITHUB_OUTPUT
  URL=$(jq --arg key "$STACK" '.[$key].DeploymentUrl' cdk-outputs.json)
  echo "url=$(echo $URL | sed -e 's/"//g')" >> $GITHUB_OUTPUT

  # Print the outputs
  echo "RESULT >>> cdk-outputs.json ->"
  cat cdk-outputs.json
  exit 0
fi

echo "VARIABLES: $VARIABLES"
