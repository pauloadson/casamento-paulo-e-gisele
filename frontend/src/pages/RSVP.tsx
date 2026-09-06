import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Gift } from 'lucide-react';
import AdminShortcut from '../components/AdminShortcut';
import './Gifts.css';

function RSVP() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isConfirmed: 'yes',
    adultsCount: 1,
    childrenCount: 0,
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const apiUrl = rawUrl.replace(/\/+$/, '');
        const res = await axios.get(`${apiUrl}/settings`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
        });
        setSystemSettings(res.data);
        if (res.data.pageTitle) {
          document.title = res.data.pageTitle;
        } else {
          document.title = 'Confirmação de Presença';
        }
        
        if (res.data.colorPrimary) document.documentElement.style.setProperty('--color-primary', res.data.colorPrimary);
        if (res.data.colorSecondary) document.documentElement.style.setProperty('--color-secondary', res.data.colorSecondary);
        if (res.data.colorAccent) document.documentElement.style.setProperty('--color-accent', res.data.colorAccent);
      } catch (err) {
        console.error('Erro ao buscar configurações:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const formatPhone = (val: string) => {
    let clean = val.replace(/\D/g, '');
    
    const isInternational = val.startsWith('+') || clean.length > 11;
    
    if (isInternational) {
      if (clean.length > 13) clean = clean.slice(0, 13);
      if (clean.length === 0) return '+';
      if (clean.length <= 2) return `+${clean}`;
      if (clean.length <= 4) return `+${clean.slice(0, 2)} (${clean.slice(2)}`;
      if (clean.length <= 8) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4)}`;
      if (clean.length <= 12) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
      return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    } else {
      if (clean.length > 11) clean = clean.slice(0, 11);
      if (clean.length === 0) return '';
      if (clean.length <= 2) return `(${clean}`;
      if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
      if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? formatPhone(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = rawUrl.replace(/\/+$/, '');
      const apiKey = import.meta.env.VITE_API_KEY || '';
      
      const res = await fetch(`${apiUrl}/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone.replace(/\D/g, '') || null,
          isConfirmed: formData.isConfirmed === 'yes',
          adultsCount: Number(formData.adultsCount),
          childrenCount: Number(formData.childrenCount),
          message: formData.message,
        }),
      });

      if (!res.ok) throw new Error('Falha no envio');
      
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        isConfirmed: 'yes',
        adultsCount: 1,
        childrenCount: 0,
        message: ''
      });
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const isNoivaFirst = systemSettings.nameOrder === 'noiva-first';
  const name1 = isNoivaFirst ? systemSettings.noivaName : systemSettings.noivoName;
  const name2 = isNoivaFirst ? systemSettings.noivoName : systemSettings.noivaName;

  return (
    <>
    <div style={{ textAlign: 'center', width: '100%', padding: '1rem 0 0.5rem 0', position: 'relative', zIndex: 10 }}>
      <AdminShortcut />
    </div>
    <div className="rsvp-container">
      {isLoadingSettings ? (
        <h1 style={{ minHeight: '48px' }}></h1>
      ) : name1 || name2 ? (
        <h1>
          {name1} 
          {name1 && name2 ? ' & ' : ''} 
          {name2}
        </h1>
      ) : (
        <h1 style={{ fontSize: '1.5rem', color: '#94a3b8' }}>
          Configure os nomes no painel
        </h1>
      )}
      <p className="subtitle">Confirme sua presença conosco!</p>

      {status === 'success' && (
        <div className="alert success">
          Obrigado! Sua resposta foi registrada com sucesso.
        </div>
      )}

      {status === 'error' && (
        <div className="alert error">
          Ops! Ocorreu um erro ao enviar. Tente novamente.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nome Completo</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            value={formData.name}
            onChange={handleChange}
            placeholder="Digite seu nome"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Celular / WhatsApp</label>
          <input 
            type="tel" 
            id="phone" 
            name="phone" 
            value={formData.phone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="form-group">
          <label>Você poderá comparecer?</label>
          <div className="radio-group">
            <label className="radio-option">
              <input 
                type="radio" 
                name="isConfirmed" 
                value="yes"
                checked={formData.isConfirmed === 'yes'}
                onChange={handleChange}
              />
              Sim, estarei lá!
            </label>
            <label className="radio-option">
              <input 
                type="radio" 
                name="isConfirmed" 
                value="no"
                checked={formData.isConfirmed === 'no'}
                onChange={handleChange}
              />
              Infelizmente não poderei
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="message">Deixe uma mensagem (opcional)</label>
          <textarea 
            id="message" 
            name="message" 
            value={formData.message}
            onChange={handleChange}
            placeholder="Deixe um recado carinhoso para os noivos..."
          ></textarea>
        </div>

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enviando...' : 'Salvar'}
        </button>
      </form>
    </div>
    
    <button 
      className="floating-gift-button"
      onClick={() => navigate('/presentes')}
      aria-label="Abrir Lista de Presentes"
    >
      <Gift className="gift-icon" />
      <span className="gift-text">
        Lista de <br className="mobile-break" /> Presentes
      </span>
    </button>
    </>
  );
}

export default RSVP;
