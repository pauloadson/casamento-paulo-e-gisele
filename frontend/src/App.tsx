import { Routes, Route } from 'react-router-dom';
import RSVP from './pages/RSVP';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Gifts from './pages/Gifts';
import GuestDependents from './pages/GuestDependents';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RSVP />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/guests/:id/dependents" element={<GuestDependents />} />
      <Route path="/presentes" element={<Gifts />} />
    </Routes>
  );
}

export default App;
