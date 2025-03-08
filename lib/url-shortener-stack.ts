import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class UrlShortenerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB Table
    const table = new dynamodb.Table(this, 'UrlsTable', {
      partitionKey: { name: 'shortCode', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create Lambda Function
    const urlShortenerLambda = new lambda.Function(this, 'UrlShortenerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    // Grant Lambda permissions to access DynamoDB
    table.grantReadWriteData(urlShortenerLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'UrlShortenerApi', {
      restApiName: 'URL Shortener Service'
    });

    // Define API Routes
    const shortenResource = api.root.addResource('shorten');
    shortenResource.addMethod('POST', new apigateway.LambdaIntegration(urlShortenerLambda));

    const redirectResource = api.root.addResource('{shortCode}');
    redirectResource.addMethod('GET', new apigateway.LambdaIntegration(urlShortenerLambda));
  }
}
