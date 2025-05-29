import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import BotChat from './components/BotChat';
import UserChat from './components/UserChat';

const App: React.FC = () => {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LINE Mini App
          </Typography>
          <Button color="inherit" component={Link} to="/">
            ボットチャット
          </Button>
          <Button color="inherit" component={Link} to="/user-chat">
            ユーザーチャット
          </Button>
        </Toolbar>
      </AppBar>

      <Container>
        <Routes>
          <Route path="/" element={<BotChat />} />
          <Route path="/user-chat" element={<UserChat />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App; 