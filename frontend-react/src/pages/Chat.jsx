import React, { useState, useRef, useEffect } from 'react';
import ChatModal from '../components/ChatModal';
import BenefitCard from '../components/BenefitCard';
import { FaPiggyBank, FaRegClipboard, FaHeartbeat } from 'react-icons/fa';
import logo from '../assets/logo.svg';
import PageHeader from '../components/PageHeader';
import HomepageHeaderWLogo from '../components/HomepageHeaderWLogo';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import './ChatPageCustom.scss';
import { getConversationHistory, sendMessage, openAgentStatusSocket } from '../utils/api';

const benefitCards = [
  {
    icon: <FaPiggyBank size={30} />, 
    title: 'Smart Visit Planning',
    description: 'Let AI find the right doctor, book appointments, and manage your schedule.'
  },
  {
    icon: <FaRegClipboard size={30} />,
    title: 'Maximize Your Benefits',
    description: 'Unlock hidden perks like free rides, therapy, and gym access covered by your plan.'
  },
  {
    icon: <FaHeartbeat size={30} />,
    title: 'Custom Recovery Plans',
    description: 'Get daily check-ins, recovery tips, and reminders tailored to your surgery.'
  }
];

const Chat = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [agentStatus, setAgentStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const prevMsgCount = useRef(chatMessages.length);
  const wsRef = useRef(null);

  useEffect(() => {
    // Fetch conversation history on mount
    getConversationHistory().then(setChatMessages).catch(() => setChatMessages([]));
    // Open websocket for agent status
    wsRef.current = openAgentStatusSocket((status) => setAgentStatus(status.status));
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleSend = async (message) => {
    setLoading(true);
    try {
      const res = await sendMessage(message);
      // Assume API returns the updated conversation
      if (Array.isArray(res)) {
        setChatMessages(res);
      } else if (res && res.message) {
        setChatMessages(prev => [...prev, res]);
      }
    } catch (e) {
      // Optionally show error
    }
    setLoading(false);
  };

  useEffect(() => {
    if (chatMessages.length > prevMsgCount.current) {
      if (chatEndRef.current) {
        chatEndRef.current?.parentNode?.scrollTo({
          top: chatEndRef.current.offsetTop,
          behavior: 'smooth'
        });
      }
    }
    prevMsgCount.current = chatMessages.length;
  }, [chatMessages]);

  const chatActive = chatMessages.length > 0;

  return (
    <div style={{ display: 'flex' }}>
      <ChatModal />
      <div style={{ flex: 1, paddingLeft: 24 }}>
        <PageHeader />
        {!chatActive && (
          <>
            <div className='chat-container' style={{ width: 'fit-content', margin: '32px auto 0 auto' }}>
              <HomepageHeaderWLogo
                headerText="Chat"
                logo={logo}
                logoAltText="GenAI AgentOS Logo"
                caption="Ask me anything about your care journey from booking doctors and using benefits to planning surgery and recovery."
              />
            </div>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', margin: '32px 0' }}>
              {benefitCards.map((card, i) => (
                <BenefitCard key={i} {...card} />
              ))}
            </div>
          </>
        )}
        {chatActive && (
          <div
            className="chat-messages-scrollable"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              margin: '32px auto',
              maxWidth: 760,
              minHeight: 300,
              maxHeight: 400,
              overflowY: 'auto',
              width: '100%'
            }}
          >
            {chatMessages.map((msg, i) => (
              <ChatMessage key={i} from={msg.from} message={msg.message} />
            ))}
            {loading && <div style={{ color: '#FF535C', textAlign: 'center', margin: 8 }}>Sending...</div>}
            {agentStatus === 'processing' && <div style={{ color: '#2B8AC6', textAlign: 'center', margin: 8 }}>Agent is processing...</div>}
            <div ref={chatEndRef} />
          </div>
        )}
        <ChatInput placeholder="What is a good recovery program for someone just out of back surgery" onSend={handleSend} />
      </div>
    </div>
  );
};

export default Chat;