import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import liff from '@line/liff';

interface Message {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: number;
}

interface User {
  userId: string;
  displayName: string;
  pictureUrl: string;
}

const UserChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = process.env.REACT_APP_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID is not set in environment variables');
        }
        await liff.init({ liffId });
        const profile = await liff.getProfile();
        setUserId(profile.userId);

        // ユーザー登録
        await fetch('https://7wnt68q97c.execute-api.ap-northeast-1.amazonaws.com/dev/register-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl
          }),
        });
      } catch (error) {
        console.error('LIFF initialization failed:', error);
      }
    };

    initializeLiff();
  }, []);

  // userIdが設定された後にユーザー一覧を取得
  useEffect(() => {
    if (userId) {
      fetchUsers();
    }
  }, [userId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://7wnt68q97c.execute-api.ap-northeast-1.amazonaws.com/dev/users');
      const data = await response.json();
      setUsers(data.users.filter((user: User) => user.userId !== userId));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchChatHistory();
      const interval = setInterval(fetchChatHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const fetchChatHistory = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('https://7wnt68q97c.execute-api.ap-northeast-1.amazonaws.com/dev/user-chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otherUserId: selectedUser
        }),
      });

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await fetch('https://7wnt68q97c.execute-api.ap-northeast-1.amazonaws.com/dev/user-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: userId,
          receiverId: selectedUser,
          message: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchChatHistory();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <FormControl fullWidth>
          <InputLabel>チャット相手を選択</InputLabel>
          <Select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            label="チャット相手を選択"
          >
            {users.map((user) => (
              <MenuItem key={user.userId} value={user.userId}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar src={user.pictureUrl} sx={{ mr: 1 }} />
                  {user.displayName}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg, index) => (
          <ListItem
            key={index}
            sx={{
              justifyContent: msg.senderId === userId ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                bgcolor: msg.senderId === userId ? 'primary.main' : 'grey.300',
                color: msg.senderId === userId ? 'white' : 'text.primary',
                borderRadius: 2,
                p: 1,
              }}
            >
              <Typography variant="body1">{msg.message}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {new Date(msg.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={!selectedUser}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!selectedUser || !newMessage.trim()}
          >
            送信
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default UserChat; 