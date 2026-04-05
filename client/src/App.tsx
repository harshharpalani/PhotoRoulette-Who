import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import HomePage from './pages/HomePage.js';
import JoinPage from './pages/JoinPage.js';
import LobbyPage from './pages/LobbyPage.js';
import GamePage from './pages/GamePage.js';
import ResultsPage from './pages/ResultsPage.js';
import { getMediaService, isNativeIOSMedia } from './media/mediaService.js';

export default function App() {
  useEffect(() => {
    if (!isNativeIOSMedia()) return;

    const mediaService = getMediaService();
    void mediaService.checkOrRequestLaunchPermission();

    let didUnmount = false;
    let removeListener: (() => void) | null = null;

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void mediaService.checkOrRequestLaunchPermission();
      }
    }).then((listener) => {
      if (didUnmount) {
        void listener.remove();
      } else {
        removeListener = () => {
          void listener.remove();
        };
      }
    });

    return () => {
      didUnmount = true;
      removeListener?.();
    };
  }, []);

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
