import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import OpenAI from 'openai';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tableName = process.env.CHAT_HISTORY_TABLE;

// チャット履歴を取得する関数
const getChatHistory = async (userId: string) => {
  const response = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // 降順で取得
      Limit: 20, // 最新の20件を取得
    })
  );

  return response.Items;
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'リクエストボディが必要です' }),
      };
    }

    const { userId, message } = JSON.parse(event.body);

    // チャット履歴を取得
    const chatHistory = await getChatHistory(userId);

    // ユーザーのメッセージを保存
    const timestamp = new Date().toISOString();
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          userId,
          timestamp,
          message,
          role: 'user',
        },
      })
    );

    // OpenAI APIを使用して応答を生成
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'gpt-3.5-turbo',
    });

    const response = completion.choices[0].message.content;

    // ボットの応答を保存
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          userId,
          timestamp: new Date().toISOString(),
          message: response,
          role: 'assistant',
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ response, chatHistory }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: '内部サーバーエラーが発生しました' }),
    };
  }
}; 