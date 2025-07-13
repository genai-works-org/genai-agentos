import React, { useState } from 'react';
import '../styles/Home.scss';
import HomepageHeaderWLogo from '../components/HomepageHeaderWLogo';
import logo from '../assets/logo.svg';
import InputWLabel from '../components/InputWLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import SecondaryBtn from '../components/SecondaryBtn';
import { useNavigate } from 'react-router-dom';
const Signin = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  return (
<div className='homepage-container'>
  <HomepageHeaderWLogo headerText="Sign into Navicare" logo={logo} logoAltText="GenAI AgentOS Logo" caption="Please sign in using your existing email and password  or create a new account." />
  <InputWLabel label="Email" type="email" placeholder="Email" value={email} onChange={setEmail} id="email" />
  <InputWLabel label="Password" type="password" placeholder="Password" value={password} onChange={setPassword} id="password" />
  <div className='form-btn-container'>
  <PrimaryBtn text="Log into Account" onClick={() => {navigate('/intakeprocess')}} />
  <SecondaryBtn text="Switch to Sign up" onClick={() => {navigate('/signup')}} />
  </div>
</div>
  );
};

export default Signin; 