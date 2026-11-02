import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import RSVP from './pages/RSVP';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Gifts from './pages/Gifts';
import GuestDependents from './pages/GuestDependents';
import MoneyGift from './pages/MoneyGift';

function HomePage() {
  const [mainPage, setMainPage] = useState<string>(() => {
    return localStorage.getItem('cachedMainPage') || 'rsvp';
  });

  useEffect(() => {
    const fetchMainPage = async () => {
      try {
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const apiUrl = rawUrl.replace(/\/+$/, '');
        const res = await axios.get<Record<string, string>>(`${apiUrl}/settings`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
        });
        const configured = res.data.mainPage || 'rsvp';
        setMainPage(configured);
        localStorage.setItem('cachedMainPage', configured);
      } catch (err) {
        // Mantém valor em cache se falhar
      }
    };
    fetchMainPage();
  }, []);

  if (mainPage === 'gifts') {
    return <Gifts />;
  }

  if (mainPage === 'money') {
    return <MoneyGift />;
  }

  return <RSVP />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/rsvp" element={<RSVP />} />
      <Route path="/confirmacao" element={<RSVP />} />
      <Route path="/confirmar-presenca" element={<RSVP />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/guests/:id/dependents" element={<GuestDependents />} />
      <Route path="/presentes" element={<Gifts />} />
      <Route path="/presente-em-dinheiro" element={<MoneyGift />} />
      <Route path="/dinheiro" element={<MoneyGift />} />
    </Routes>
  );
}

export default App;
