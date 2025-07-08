import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';
import AuthForm from '../components/auth/AuthForm';

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
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        title="Sign Up"
        subtitle="Join now to access tools that power real-world AI success."
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
    </AuthLayout>
  );
};

export default SignupPage;
