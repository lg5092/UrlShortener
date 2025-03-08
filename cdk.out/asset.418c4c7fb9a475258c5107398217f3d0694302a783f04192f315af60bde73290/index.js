const AWS = require('aws-sdk');
const crypto = require('crypto');

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  if (event.httpMethod === 'POST') {
    // URL Shortening Logic
    const requestBody = JSON.parse(event.body);
    const originalUrl = requestBody.url;
    const shortCode = crypto.randomBytes(3).toString('hex');

    // Store in DynamoDB
    await dynamo.put({
      TableName: TABLE_NAME,
      Item: { shortCode, originalUrl }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ shortUrl: `https://${event.headers.Host}/${shortCode}` })
    };
  } 
  
  else if (event.httpMethod === 'GET') {
    // Redirect Logic
    const shortCode = event.pathParameters.shortCode;
    const result = await dynamo.get({
      TableName: TABLE_NAME,
      Key: { shortCode }
    }).promise();

    if (!result.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Short URL not found" }) };
    }

    return {
      statusCode: 301,
      headers: { Location: result.Item.originalUrl },
      body: ''
    };
  }

  return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
};
