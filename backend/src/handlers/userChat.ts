import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.USER_CHAT_TABLE;
const dynamoDB = new DynamoDB();

// ユーザー間のメッセージを保存する関数
const saveUserMessage = async (senderId: string, receiverId: string, message: string) => {
  const timestamp = new Date().toISOString();
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        userId: senderId,
        receiverId: receiverId,
        timestamp,
        message,
        role: 'user',
      },
    })
  );
};

// ユーザー間のチャット履歴を取得する関数
const getUserChatHistory = async (userId: string, otherUserId: string) => {
  const params = {
    TableName: tableName,
    IndexName: 'ReceiverIdIndex',
    KeyConditionExpression: 'receiverId = :receiverId AND #ts >= :minTs',
    FilterExpression: 'userId = :userId',
    ExpressionAttributeNames: {
      '#ts': 'timestamp'
    },
    ExpressionAttributeValues: {
      ':receiverId': otherUserId,
      ':userId': userId,
      ':minTs': '1970-01-01T00:00:00.000Z'
    },
    ScanIndexForward: true,
    Limit: 50
  };
  const result = await docClient.send(new QueryCommand(params));
  return result.Items;
};

// メッセージ送信ハンドラー
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'リクエストボディが必要です' }),
      };
    }

    const { senderId, receiverId, message } = JSON.parse(event.body);

    // メッセージを保存
    await saveUserMessage(senderId, receiverId, message);

    // チャット履歴を取得
    const chatHistory = await getUserChatHistory(senderId, receiverId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ chatHistory }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: '内部サーバーエラーが発生しました' }),
    };
  }
};

// チャット履歴取得ハンドラー
export const getHistoryHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'リクエストボディが必要です' }),
      };
    }

    const { userId, otherUserId } = JSON.parse(event.body);

    // チャット履歴を取得
    const chatHistory = await getUserChatHistory(userId, otherUserId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ messages: chatHistory }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: '内部サーバーエラーが発生しました' }),
    };
  }
};

export const getUsers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const params = {
      TableName: process.env.USER_TABLE || '',
      ProjectionExpression: 'userId, displayName, pictureUrl'
    };

    const result = await docClient.send(new ScanCommand(params));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        users: result.Items
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: '内部サーバーエラーが発生しました'
      })
    };
  }
};

// ユーザー登録ハンドラー
export const registerUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'リクエストボディが必要です' })
      };
    }

    const { userId, displayName, pictureUrl } = JSON.parse(event.body);

    await docClient.send(
      new PutCommand({
        TableName: process.env.USER_TABLE,
        Item: {
          userId,
          displayName,
          pictureUrl,
          updatedAt: new Date().toISOString()
        }
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: 'ユーザー情報が更新されました' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: '内部サーバーエラーが発生しました' })
    };
  }
};

// OPTIONSリクエスト用のハンドラー
export const optionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: '',
  };
}; 