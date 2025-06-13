import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import AuthForm from '../components/AuthForm';
import type { FormEvent } from 'react';
const SignupPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validatePasswords = () => {
    if (password !== repeatPassword) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    try {
      await signup(name, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <AuthForm
        title="Create your account"
        buttonText="Sign up"
        name={name}
        setName={setName}
        password={password}
        setPassword={setPassword}
        repeatPassword={repeatPassword}
        setRepeatPassword={setRepeatPassword}
        onRepeatPasswordBlur={validatePasswords}
        onSubmit={handleSubmit}
        footerText="Already have an account?"
        footerLinkText="Sign in"
        footerLinkTo="/login"
      />
    </Layout>
  );
};

export default SignupPage;
