import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.js';
import JoinPage from './pages/JoinPage.js';
import LobbyPage from './pages/LobbyPage.js';
import GamePage from './pages/GamePage.js';
import ResultsPage from './pages/ResultsPage.js';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join/:code?" element={<JoinPage />} />
        <Route path="/lobby/:code" element={<LobbyPage />} />
        <Route path="/game/:code" element={<GamePage />} />
        <Route path="/results/:code" element={<ResultsPage />} />
      </Routes>
    </div>
  );
}
