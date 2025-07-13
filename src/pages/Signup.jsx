import React, { useState } from 'react';
import '../styles/Home.scss';
import HomepageHeaderWLogo from '../components/HomepageHeaderWLogo';
import logo from '../assets/logo.svg';
import InputWLabel from '../components/InputWLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import SecondaryBtn from '../components/SecondaryBtn';
import { useNavigate } from 'react-router-dom';
import { signup } from '../utils/api';
import { setCookie } from '../utils/cookies';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError('');
    try {
      const result = await signup({ email, password, firstName });
      setCookie('username', result.firstName || result.email);
      // Redirect or show success (example: navigate('/dashboard'))
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign up failed');
    }
  };

  return (
    <div className='homepage-container'>
      <HomepageHeaderWLogo headerText="Sign up for Navicare" logo={logo} logoAltText="GenAI AgentOS Logo" caption="Please sign up using your first name, email, and password or click log into account if you already have one." />
      <InputWLabel label="First Name" type="text" placeholder="First Name" value={firstName} onChange={setFirstName} id="firstName" />
      <InputWLabel label="Email" type="email" placeholder="Email" value={email} onChange={setEmail} id="email" />
      <InputWLabel label="Password" type="password" placeholder="Password" value={password} onChange={setPassword} id="password" />
      {error && <div style={{ color: '#FF535C', marginBottom: 12 }}>{error}</div>}
      <PrimaryBtn text="Sign up" onClick={handleSignup} />
      <SecondaryBtn text="Log into account" to="/signin" />
    </div>
  );
};

export default Signup; 