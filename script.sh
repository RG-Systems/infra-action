#!/bin/bash

# Copy need files to the deployment directory
mkdir cdk
cp -r $GITHUB_ACTION_PATH/* ./cdk
cd ./cdk
yarn install --frozen-lockfile

# Set the stack name
export STACK=$PROJECT_NAME-$ENV

if [ $ENV = "tmp" ]; then
  STACK=$PROJECT_NAME-$ENV-$PR_NUMBER
fi

echo "RESULT >>> STACK -> $STACK"

# Deploy the infrastructure
npx cdk deploy $STACK --require-approval never --outputs-file cdk-outputs.json
BUCKET=$(jq --arg key "$STACK" '.[$key].BucketName' cdk-outputs.json)
echo "bucket=$(echo $BUCKET | sed -e 's/"//g')" >> $GITHUB_OUTPUT
echo "id=$(jq --arg key "$STACK" '.[$key].DistributionId' cdk-outputs.json)" >> $GITHUB_OUTPUT
URL=$(jq --arg key "$STACK" '.[$key].DeploymentUrl' cdk-outputs.json)
echo "url=$(echo $URL | sed -e 's/"//g')" >> $GITHUB_OUTPUT
echo "RESULT >>>"
cat cdk-outputs.json
