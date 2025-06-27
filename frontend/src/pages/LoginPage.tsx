import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';
import AuthForm from '../components/auth/AuthForm';

const LoginPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(name, password);
      navigate('/chat/new');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        title="Sign In"
        subtitle="Join now to access tools that power real-world AI success."
        buttonText="Sign in"
        name={name}
        setName={setName}
        password={password}
        setPassword={setPassword}
        onSubmit={handleSubmit}
        footerText="Don't have an account?"
        footerLinkText="Sign up"
        footerLinkTo="/signup"
      />
    </AuthLayout>
  );
};

export default LoginPage;
