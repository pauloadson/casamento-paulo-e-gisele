import { useState } from 'react';

function RSVP() {
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
      
      const response = await fetch(`${apiUrl}/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY || '',
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.replace(/\D/g, ''),
          isConfirmed: formData.isConfirmed === 'yes',
        }),
      });

      if (!response.ok) throw new Error('Falha ao confirmar');
      
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

  return (
    <div className="rsvp-container">
      <h1>Paulo & Gisele</h1>
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
  );
}

export default RSVP;
