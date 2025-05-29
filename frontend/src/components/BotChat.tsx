import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import liff from '@line/liff';

interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

const BotChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        ボットチャット
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1, 
          mb: 2, 
          overflow: 'auto',
          p: 2,
          backgroundColor: '#f5f5f5'
        }}
      >
        <List>
          {messages.map((msg, index) => (
            <ListItem
              key={index}
              sx={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#ffffff',
                }}
              >
                <ListItemText
                  primary={msg.content}
                  secondary={msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                />
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="メッセージを入力..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!input.trim()}
        >
          送信
        </Button>
      </Box>
    </Box>
  );
};

export default BotChat; 