import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    <div className="rsvp-container" style={{ position: 'relative' }}>
      <button 
        onClick={() => navigate('/')}
        style={{ 
          position: 'absolute', 
          top: '2rem', 
          left: '2rem', 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer', 
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem',
          borderRadius: '50%',
          transition: 'all 0.2s ease'
        }}
        aria-label="Voltar"
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(134, 167, 137, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <ArrowLeft size={24} />
      </button>
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
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;
