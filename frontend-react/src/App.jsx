import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import Signup from './pages/Signup';
import IntakeProcess from './pages/IntakeProcess';
import BenefitsOverview from './pages/BenefitsOverview';
import Chat from './pages/Chat';
import './styles/App.scss';
import { useCookies } from 'react-cookie';

function ProtectedRoute({ children }) {
  const [cookies] = useCookies(['username']);
  if (!cookies.username) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/intakeprocess" element={<ProtectedRoute><IntakeProcess /></ProtectedRoute>} />
            <Route path="/benefitsoverview" element={<ProtectedRoute><BenefitsOverview /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 