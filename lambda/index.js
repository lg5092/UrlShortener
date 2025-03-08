const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto");

const dynamo = new DynamoDBClient({ region: "us-west-2" });
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  if (event.httpMethod === "POST") {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return { statusCode: 400, body: "Invalid JSON format" };
    }

    if (!requestBody.url) {
      return { statusCode: 400, body: "Missing 'url' in request body" };
    }

    const shortCode = crypto.randomBytes(3).toString("hex");

    await dynamo.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          shortCode: { S: shortCode },
          originalUrl: { S: requestBody.url },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ shortUrl: `https://${event.headers.Host}/${shortCode}` }),
    };
  }

  if (event.httpMethod === "GET") {
    const shortCode = event.pathParameters.shortCode;
    const result = await dynamo.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { shortCode: { S: shortCode } },
      })
    );

    if (!result.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Short URL not found" }) };
    }

    return {
      statusCode: 301,
      headers: { Location: result.Item.originalUrl.S },
      body: "",
    };
  }

  return { statusCode: 400, body: "Invalid request" };
};
