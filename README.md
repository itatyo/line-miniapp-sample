# LINE Mini App チャットアプリケーション

## システム概要

このアプリケーションは、LINE Mini Appを使用したチャットアプリケーションです。以下の機能を提供します：

- LINEログインによるユーザー認証
- ボットとのチャット機能
- ユーザー間のチャット機能
- チャット履歴の保存と表示

## アーキテクチャ

### フロントエンド
- React + TypeScript
- Material-UI
- LINE LIFF SDK
- AWS CloudFront + S3 でホスティング

### バックエンド
- AWS Lambda + API Gateway
- DynamoDB
- Serverless Framework

### データベース設計

#### ChatHistoryTable
- ボットとのチャット履歴を保存
- パーティションキー: userId
- ソートキー: timestamp

#### UserChatTable
- ユーザー間のチャット履歴を保存
- パーティションキー: userId
- ソートキー: timestamp
- GSI: ReceiverIdIndex (receiverId, timestamp)

#### UserTable
- ユーザー情報を保存
- パーティションキー: userId

## デプロイ手順

### 前提条件
- Node.js 18.x以上
- AWS CLI がインストール済み
- AWS SSO の設定済み
- LINE Developers アカウント
- LINE LIFF アプリの作成済み

### 環境変数の設定

#### バックエンド
```bash
# backend/.env
OPENAI_API_KEY=your_openai_api_key
```

#### フロントエンド
```bash
# frontend/.env
REACT_APP_LIFF_ID=your_liff_id
REACT_APP_API_ENDPOINT=your_api_gateway_endpoint
```

### バックエンドのデプロイ

1. 依存関係のインストール
```bash
cd backend
npm install
```

2. デプロイ
```bash
serverless deploy
```

### フロントエンドのデプロイ

1. 依存関係のインストール
```bash
cd frontend
npm install
```

2. ビルド
```bash
npm run build
```

3. S3へのデプロイ
```bash
aws s3 sync build/ s3://your-bucket-name --profile your-aws-profile
```

4. CloudFrontのキャッシュ無効化
```bash
aws cloudfront create-invalidation --distribution-id your-distribution-id --paths "/*" --profile your-aws-profile
```

## 開発環境のセットアップ

### バックエンド
```bash
cd backend
npm install
npm run dev
```

### フロントエンド
```bash
cd frontend
npm install
npm start
```

## 注意事項

### ソースコード管理
以下のファイルはセキュリティ上の理由からソースコード管理に含めていません：

- `.env` ファイル
- `node_modules` ディレクトリ
- AWS認証情報
- LINE LIFF ID

これらのファイルや情報は、デプロイ時に手動で設定する必要があります。

### セキュリティ
- APIキーやシークレットは環境変数として管理
- CORSの設定は適切に行う
- AWS IAMロールは最小権限の原則に従う

## トラブルシューティング

### よくある問題と解決方法

1. CORSエラー
   - API GatewayのCORS設定を確認
   - Lambda関数のレスポンスヘッダーを確認

2. 502 Bad Gateway
   - Lambda関数のログを確認
   - ハンドラー名が正しいか確認

3. ユーザーリストが表示されない
   - DynamoDBのテーブルを確認
   - ユーザー登録が正しく行われているか確認

## ライセンス

MIT License