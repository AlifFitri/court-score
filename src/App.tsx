import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import PlayerPage from './pages/PlayerPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/matches" element={<MatchPage />} />
            <Route path="/players" element={<PlayerPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
