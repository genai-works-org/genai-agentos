import React, { useState } from 'react';
import '../styles/Home.scss';
import HomepageHeaderWLogo from '../components/HomepageHeaderWLogo';
import logo from '../assets/logo.svg';
import InputWLabel from '../components/InputWLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import SecondaryBtn from '../components/SecondaryBtn';
import { useNavigate } from 'react-router-dom';
const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  return (
<div className='homepage-container'>
  <HomepageHeaderWLogo headerText="Sign up for Navicare" logo={logo} logoAltText="GenAI AgentOS Logo" caption="Please sign up using you first name, email, and password or click log into account if you already have one." />
  <InputWLabel label="First Name" type="text" placeholder="First Name" value={firstName} onChange={setFirstName} id="firstName" />
  <InputWLabel label="Email" type="email" placeholder="Email" value={email} onChange={setEmail} id="email" />
  <InputWLabel label="Password" type="password" placeholder="Password" value={password} onChange={setPassword} id="password" />
  <div className='form-btn-container'>
  <PrimaryBtn text="Sign up" onClick={() => {navigate('/intakeprocess')}} />
  <SecondaryBtn text="Log into account" onClick={() => {navigate('/signin')}} />
  </div>
</div>
  );
};

export default Signup; 