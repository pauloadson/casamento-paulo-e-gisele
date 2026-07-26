import { useState, useEffect } from 'react';
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
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      setHasValidToken(isTokenValid(token));
    };

    checkToken();
    window.addEventListener('storage', checkToken);
    return () => window.removeEventListener('storage', checkToken);
  }, [location.pathname]);

  // Se já estivermos no painel de admin ou na tela de login, ou se não houver voucher (token) válido, NÃO exibe nada
  if (location.pathname === '/admin' || location.pathname === '/login' || !hasValidToken) {
    return null;
  }

  return (
    <button 
      className="admin-shortcut-btn"
      onClick={() => navigate('/admin')}
      title="Ir para o Painel de Controle"
      aria-label="Painel de Controle do Admin"
    >
      <ShieldCheck className="admin-shortcut-icon" />
      <span className="admin-shortcut-text">Painel Admin</span>
    </button>
  );
}
