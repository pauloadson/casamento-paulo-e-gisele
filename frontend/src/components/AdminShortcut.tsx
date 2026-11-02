import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import './AdminShortcut.css';

const isTokenValid = (token: string | null) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export default function AdminShortcut() {
  const navigate = useNavigate();
  const location = useLocation();

  // Não exibe se já estivermos na tela de login ou em qualquer rota do painel admin
  if (location.pathname === '/login' || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleClick = () => {
    const token = localStorage.getItem('token');
    if (isTokenValid(token)) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  return (
    <button 
      className="admin-shortcut-floating"
      onClick={handleClick}
      title="Painel de Controle (Admin)"
      aria-label="Painel de Controle do Admin"
    >
      <ShieldCheck className="admin-shortcut-icon" />
    </button>
  );
}
