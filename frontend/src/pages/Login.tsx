import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

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

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (isTokenValid(token)) {
      navigate('/admin');
    } else if (token) {
      localStorage.removeItem('token');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = rawUrl.replace(/\/+$/, '');
      
      const response = await axios.post(`${apiUrl}/auth/login`, 
        { username, password },
        { headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' } }
      );
      localStorage.setItem('token', response.data.access_token);
      navigate('/admin');
    } catch (err) {
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="rsvp-container">
      <h1>Login</h1>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Usuário</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button type="submit">Entrar</button>
          <button 
            type="button" 
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              color: 'var(--color-text-main)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'none'
            }}
          >
            <ArrowLeft size={18} />
            Voltar para o início
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
