import { useEffect, useState } from 'react';
import './App.css';
import liff from '@line/liff';

function App() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: '2007468508-wZv3Kp4v' });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setUserId(profile.userId);
        } else {
          liff.login({ redirectUri: 'https://duatf9ekr0yxv.cloudfront.net' });
        }
      } catch (error) {
        console.error('Error initializing LIFF:', error);
      }
    };

    initializeLiff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) {
      console.log('Input or userId is empty:', { input, userId });
      return;
    }

    // ユーザーのメッセージを即座に表示
    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      console.log('Sending request to backend...');
      const response = await fetch('https://7wnt68q97c.execute-api.ap-northeast-1.amazonaws.com/dev/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: input,
        }),
      });

      const data = await response.json();
      console.log('Response from backend:', data);

      // ボットの応答を表示
      if (data.response) {
        const botMessage = { role: 'assistant', content: data.response };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      }

      // チャット履歴を更新（存在する場合）
      if (data.chatHistory) {
        const formattedHistory = data.chatHistory
          .map((msg: any) => ({
            role: msg.role,
            content: msg.message,
            timestamp: msg.timestamp
          }))
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // 新しいメッセージと応答を履歴に追加
        const updatedHistory = [...formattedHistory, userMessage];
        if (data.response) {
          updatedHistory.push({ role: 'assistant', content: data.response });
        }
        
        setMessages(updatedHistory);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setInput('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>チャットボット</h1>
      </header>
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
        />
        <button type="submit">送信</button>
      </form>
    </div>
  );
}

export default App; 