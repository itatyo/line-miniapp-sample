import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

interface Message {
  userId: string;
  receiverId: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  currentUserId: string;
  otherUserId: string;
}

const Chat: React.FC<ChatProps> = ({ currentUserId, otherUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChatHistory();
    // 定期的にチャット履歴を更新
    const interval = setInterval(fetchChatHistory, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('https://7wnt68q97c.execute-api.ap-northeast-1.amazonaws.com/dev/user-chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          otherUserId: otherUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('チャット履歴の取得に失敗しました');
      }

      const data = await response.json();
      setMessages(data.chatHistory || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('https://7wnt68q97c.execute-api.ap-northeast-1.amazonaws.com/dev/user-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: otherUserId,
          message: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('メッセージの送信に失敗しました');
      }

      setNewMessage('');
      fetchChatHistory(); // メッセージ送信後に履歴を更新
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        チャット
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
                justifyContent: msg.userId === currentUserId ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor: msg.userId === currentUserId ? '#e3f2fd' : '#ffffff',
                }}
              >
                <ListItemText
                  primary={msg.message}
                  secondary={new Date(msg.timestamp).toLocaleString()}
                />
              </Paper>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="メッセージを入力..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={sendMessage}
          disabled={!newMessage.trim()}
        >
          送信
        </Button>
      </Box>
    </Box>
  );
};

export default Chat; 