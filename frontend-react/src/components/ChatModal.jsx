import React, { useState } from 'react';
import { FiChevronRight, FiMessageSquare } from 'react-icons/fi';
import { PiSlidersHorizontalBold } from 'react-icons/pi';
import './ChatModal.scss';

const defaultChats = [
  { id: 1, title: 'Schedule Appoint for...' },
  { id: 2, title: 'Recovery Plan for ba...' },
];

const ChatModal = ({ chats = defaultChats }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`chat-modal-sidebar${open ? ' open' : ''}`}>  
      <div className="chat-modal-icons-group">
        <button className="expand-btn" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse Sidebar' : 'Expand Sidebar'}>
          <FiChevronRight size={32} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {!open && <button tabIndex={-1} aria-label="Chat" className='chat-modal-icon'><FiMessageSquare size={32} /></button>}
        {!open && <button tabIndex={-1} aria-label="Agentic View" className='chat-modal-icon'><PiSlidersHorizontalBold size={32} /></button>}
      </div>
      {open && (
        <div className="chat-modal-expand-content"> 
          <div className="chat-modal-header">
            <button className="chat-modal-btn primary">New Chat <FiMessageSquare /></button>
            <button className="chat-modal-btn primary">Agentic View <PiSlidersHorizontalBold /></button>
          </div>
          <div className="chat-modal-chats-section">
            <div className="chat-modal-chats-title">Chats</div>
            <div className="chat-modal-chats-list">
              {chats.map(chat => (
                <div className="chat-modal-chat-item" key={chat.id}>{chat.title}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatModal; 