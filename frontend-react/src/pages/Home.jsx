import React from 'react';
import '../styles/Home.scss';
import HomepageHeaderWLogo from '../components/HomepageHeaderWLogo';
import logo from '../assets/logo.svg';
import PrimaryBtn from '../components/PrimaryBtn';
import SecondaryBtn from '../components/SecondaryBtn';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className='homepage-container'>
      <HomepageHeaderWLogo 
        headerText="Navicare Your Agentic Health Assistant" 
        logo={logo} 
        logoAltText="GenAI AgentOS Logo" 
        caption="Navicare helps you confidently navigate your healthcare journey — from booking doctor visits and using your health benefits to preparing for and recovering from surgery." 
      />
      <div className="homepage-actions">
        <PrimaryBtn text="Sign In" onClick={() => navigate('/signin')} />
        <SecondaryBtn text="Sign Up" onClick={() => navigate('/signup')} />
      </div>
    </div>
  );
};

export default Home; 