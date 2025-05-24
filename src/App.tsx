import React, { useEffect, useState } from 'react';
import liff from '@line/liff';

const LIFF_ID = '2007468508-wZv3Kp4v';

const App: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        console.log('LIFF初期化成功');
        
        if (!liff.isLoggedIn()) {
          console.log('ログインしていないため、ログイン画面にリダイレクトします');
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setProfile(profile);
      } catch (err: any) {
        console.error('LIFF初期化エラー:', err);
        setError(err.message);
      }
    };

    initializeLiff();
  }, []);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>エラーが発生しました: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>LINEミニアプリへようこそ！</h1>
      {profile && (
        <div>
          <p>ユーザー名: {profile.displayName}</p>
          <img src={profile.pictureUrl} alt="プロフィール画像" style={{ width: '100px', borderRadius: '50%' }} />
        </div>
      )}
    </div>
  );
};

export default App; 