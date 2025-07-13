import React, { useState, useRef } from 'react';
import { FiSend } from 'react-icons/fi';
import './ChatInput.scss';

const ChatInput = ({ placeholder = 'Type your message...', onSend }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (value.trim() && onSend) {
      onSend(value);
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <form className="chat-input-bar" onSubmit={handleSend}>
      <textarea
        ref={textareaRef}
        className="chat-input-field chat-input-textarea"
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        rows={1}
        style={{ resize: 'none', overflow: 'hidden' }}
      />
      <button className="chat-input-send" type="submit" aria-label="Send">
        <FiSend size={20} />
      </button>
    </form>
  );
};

export default ChatInput; 