import React from 'react';
import './ChatMessage.scss';

const ChatMessage = ({ message, from }) => (
  <div className={`chat-message ${from === 'user' ? 'chat-message-user' : 'chat-message-ai'}`}> 
    {message}
  </div>
);

export default ChatMessage; 