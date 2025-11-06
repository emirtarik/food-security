/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */// CommonJS style (Node 16/18)
const AWS = require('aws-sdk');
const s3 = new AWS.S3();


const BUCKET_NAME = process.env.META_BUCKET_NAME;
const META_KEY = process.env.META_OBJECT_KEY || 'data/DocumentsRPCA.json';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  let payload;
  try {
    payload = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body || {};
  } catch (e) {
    console.error('Body parse error:', e);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const requiredFields = [
    'title',
    'img',
    'flag',
    'datecontent',
    'bllink',
    'permalink',
    'content', // { Published, Description, Countries, Themes, Scale, Langs }
  ];

  const missing = requiredFields.filter((f) => payload[f] == null);
  if (missing.length > 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing required fields',
        details: missing,
      }),
    };
  }

  try {
   
    const obj = await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: META_KEY,
      })
      .promise();

    let docs;
    try {
      docs = JSON.parse(obj.Body.toString('utf-8'));
    } catch {
      docs = [];
    }
    if (!Array.isArray(docs)) docs = [];

    docs.push(payload);

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: META_KEY,
        Body: JSON.stringify(docs, null, 2),
        ContentType: 'application/json',
      })
      .promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('S3 error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to update metadata file' }),
    };
  }
};
S