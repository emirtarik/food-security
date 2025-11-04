// Use CommonJS style for Lambda in Node.js 16/18
const AWS = require('aws-sdk');

// S3 client (SDK v2)
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log("Incoming event:", JSON.stringify(event));

  // 1. Body parse
  let payload = {};
  try {
    payload = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : (event.body || {});
  } catch (e) {
    console.error("Failed to parse body:", e);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const bucketName = process.env.STORAGE_FOODSECURITYBACKBE4B1CDD_BUCKETNAME;

  const incomingName = payload.fileName || payload.key;
  const incomingType = payload.fileType || payload.contentType;

  if (!bucketName || !incomingName || !incomingType) {
    console.error("Missing required data", {
      bucketName,
      incomingName,
      incomingType,
    });
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        error: 'Missing bucketName / fileName(key) / fileType(contentType)',
      }),
    };
  }

  // we will store object under this key
  const objectKey = incomingName;

  // 3. Build presign params
  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Expires: 300, // seconds
    ContentType: incomingType,
  };

  try {
    // getSignedUrlPromise for PUT
    const uploadURL = await s3.getSignedUrlPromise('putObject', params);
    console.log("Generated presigned URL for key:", objectKey);

    // 4. Return URL + key (IMPORTANT for frontend)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        uploadURL,
        key: objectKey,
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        error: 'Failed to generate presigned URL',
        details: error.message,
      }),
    };
  }
};
