import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

interface Guest {
  id: number;
  name: string;
  phone: string;
  isConfirmed: boolean;
  message: string;
}

function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'guests' | 'register'>('guests');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const apiUrl = rawUrl.replace(/\/+$/, '');
        
        const response = await axios.get(`${apiUrl}/guests`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_API_KEY || ''
          }
        });
        setGuests(response.data);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchGuests();
  }, [navigate]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = rawUrl.replace(/\/+$/, '');
      
      await axios.post(`${apiUrl}/users`, { username: newUsername, password: newPassword }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-api-key': import.meta.env.VITE_API_KEY || ''
        }
      });
      setMessage('Usuário criado com sucesso!');
      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      setMessage('Erro ao criar usuário.');
    }
  };

  const handleDeleteGuest = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o registro de "${name}"?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = rawUrl.replace(/\/+$/, '');

      await axios.delete(`${apiUrl}/guests/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-api-key': import.meta.env.VITE_API_KEY || ''
        }
      });
      setGuests(guests.filter(g => g.id !== id));
    } catch (err) {
      alert('Erro ao excluir convidado. Tente novamente.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="rsvp-container dashboard-container">
      <div className="header-container">
        <h1>Painel de Controle</h1>
        <button onClick={logout} className="logout-btn">Sair</button>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'guests' ? 'active' : ''}`}
          onClick={() => setActiveTab('guests')}
        >
          Lista de Presença
        </button>
        <button 
          className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('register');
            setMessage('');
          }}
        >
          Cadastrar Usuário
        </button>
      </div>

      {activeTab === 'guests' && (
        <section className="fade-in">
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Mensagem</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {guests.map(g => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td>{g.phone || '-'}</td>
                    <td>
                      <span className={`badge ${g.isConfirmed ? 'confirmed' : 'pending'}`}>
                        {g.isConfirmed ? 'Confirmado' : 'Não'}
                      </span>
                    </td>
                    <td>{g.message || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        className="delete-btn" 
                        onClick={() => handleDeleteGuest(g.id, g.name)}
                        title="Excluir convidado"
                      >
                        <Trash2 size={16} /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
                      Nenhum convidado confirmou presença ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'register' && (
        <section className="fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-primary)' }}>Novo Administrador</h2>
          {message && <div className={`alert ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</div>}
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Usuário</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <button type="submit">Cadastrar</button>
          </form>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
