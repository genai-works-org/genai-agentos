import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import Signup from './pages/Signup';
import IntakeProcess from './pages/IntakeProcess';
import BenefitsOverview from './pages/BenefitsOverview';
import Chat from './pages/Chat';
import './styles/App.scss';

function App() {
  return (
    <Router>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/intakeprocess" element={<IntakeProcess />} />
            <Route path="/benefitsoverview" element={<BenefitsOverview />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 