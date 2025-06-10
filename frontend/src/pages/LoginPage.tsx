import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    try {
      await login(name, password);
      navigate('/chat/new');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <Layout>
      <AuthForm
        title="Sign in to your account"
        buttonText="Sign in"
        error={error}
        name={name}
        setName={setName}
        password={password}
        setPassword={setPassword}
        onSubmit={handleSubmit}
        footerText="Don't have an account?"
        footerLinkText="Sign up"
        footerLinkTo="/signup"
      />
    </Layout>
  );
};

export default LoginPage;
