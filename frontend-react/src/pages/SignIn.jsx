import React, { useState } from 'react';
import '../styles/Home.scss';
import HomepageHeaderWLogo from '../components/HomepageHeaderWLogo';
import logo from '../assets/logo.svg';
import InputWLabel from '../components/InputWLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import SecondaryBtn from '../components/SecondaryBtn';
import { useNavigate } from 'react-router-dom';
import { signin } from '../utils/api';
import { setCookie } from '../utils/cookies';

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignin = async () => {
    try {
      const result = await signin({ email, password });
      setCookie('userId', result.access_token);
      // Redirect or show success (example: navigate('/dashboard'))
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign in failed');
    }
  };

  return (
    <div className='homepage-container'>
      <HomepageHeaderWLogo headerText="Sign into Navicare" logo={logo} logoAltText="GenAI AgentOS Logo" caption="Please sign in using your existing email and password  or create a new account." />
      <InputWLabel label="Email" type="email" placeholder="Email" value={email} onChange={setEmail} id="email" />
      <InputWLabel label="Password" type="password" placeholder="Password" value={password} onChange={setPassword} id="password" />
      {error && <div style={{ color: '#FF535C', marginBottom: 12, textAlign: 'center', marginInline: 'auto', width:"fit-content" }}>{error}</div>}
      <div className='form-btn-container'>
      <PrimaryBtn text="Log into Account" onClick={handleSignin} />
      <SecondaryBtn text="Switch to Sign up" onClick={() => {navigate('/signup')}} />
      </div>
    </div>
  );
};

export default Signin; 