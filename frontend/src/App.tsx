import { Routes, Route } from 'react-router-dom';
import RSVP from './pages/RSVP';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RSVP />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
