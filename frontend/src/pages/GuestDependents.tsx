import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  Users
} from 'lucide-react';
import './GuestDependents.css';

interface Guest {
  id: number;
  name: string;
  phone?: string;
  isConfirmed: boolean;
  message?: string;
  dependents?: Guest[];
}

const GuestDependents: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Quick create dependent state
  const [newDepName, setNewDepName] = useState('');
  const [newDepConfirmed, setNewDepConfirmed] = useState(true);
  const [creatingDepLoading, setCreatingDepLoading] = useState(false);

  // Search existing guest state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // Edit dependent state
  const [editingDep, setEditingDep] = useState<Guest | null>(null);
  const [editDepName, setEditDepName] = useState('');
  const [editDepPhone, setEditDepPhone] = useState('');
  const [editDepConfirmed, setEditDepConfirmed] = useState(true);
  const [savingDepLoading, setSavingDepLoading] = useState(false);

  const getApiUrl = () => {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return rawUrl.replace(/\/+$/, '');
  };

  const getApiHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_KEY || ''
    };
  };

  const fetchGuest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${getApiUrl()}/guests/${id}`, { headers: getApiHeaders() });
      setGuest(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados do convidado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuest();
  }, [id]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim() || !guest) {
        setSearchResults([]);
        return;
      }
      try {
        setLoadingSearch(true);
        const res = await axios.get(`${getApiUrl()}/guests?search=${encodeURIComponent(debouncedSearchQuery)}`, { headers: getApiHeaders() });
        const filtered = res.data.filter((g: Guest) => 
          g.id !== guest.id && !guest.dependents?.some(dep => dep.id === g.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Erro ao buscar convidados para vínculo', err);
      } finally {
        setLoadingSearch(false);
      }
    };
    performSearch();
  }, [debouncedSearchQuery, guest]);

  const handleLinkDependent = async (dependentId: number) => {
    if (!guest) return;
    setActionLoading(`link-${dependentId}`);
    try {
      const res = await axios.post(`${getApiUrl()}/guests/${guest.id}/dependents/${dependentId}`, {}, { headers: getApiHeaders() });
      setGuest(res.data);
      setSearchQuery('');
      setSearchResults([]);
      setMessage('Dependente vinculado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erro ao vincular dependente.');
    } finally {
      setActionLoading('');
    }
  };

  const handleUnlinkDependent = async (dependentId: number) => {
    if (!guest) return;
    if (!window.confirm('Tem certeza que deseja desvincular este dependente?')) return;
    setActionLoading(`unlink-${dependentId}`);
    try {
      const res = await axios.delete(`${getApiUrl()}/guests/${guest.id}/dependents/${dependentId}`, { headers: getApiHeaders() });
      setGuest(res.data);
      setMessage('Dependente desvinculado.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erro ao desvincular dependente.');
    } finally {
      setActionLoading('');
    }
  };

  const handleQuickCreateDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest || !newDepName.trim()) return;
    setCreatingDepLoading(true);
    try {
      const payload = {
        name: newDepName.trim(),
        phone: '',
        isConfirmed: newDepConfirmed,
        message: null,
        parentId: guest.id,
      };
      await axios.post(`${getApiUrl()}/guests`, payload, { headers: getApiHeaders() });
      await fetchGuest();
      setNewDepName('');
      setMessage('Novo dependente cadastrado e vinculado!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erro ao cadastrar novo dependente.');
    } finally {
      setCreatingDepLoading(false);
    }
  };

  const handleOpenEditDep = (dep: Guest) => {
    setEditingDep(dep);
    setEditDepName(dep.name || '');
    setEditDepPhone(dep.phone || '');
    setEditDepConfirmed(dep.isConfirmed);
  };

  const handleSaveEditDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDep || !editDepName.trim()) return;
    setSavingDepLoading(true);
    try {
      const payload = {
        name: editDepName.trim(),
        phone: editDepPhone.trim() || null,
        isConfirmed: editDepConfirmed,
        message: editingDep.message || null,
      };
      await axios.put(`${getApiUrl()}/guests/${editingDep.id}`, payload, { headers: getApiHeaders() });
      await fetchGuest(); // Refresh the parent to get updated dependents
      setEditingDep(null);
      setMessage('Dependente atualizado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao atualizar dependente.');
    } finally {
      setSavingDepLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="guest-dependents-page" style={{ justifyContent: 'center' }}>
        <Loader2 size={36} className="spinner" style={{ color: 'var(--color-primary)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-light)' }}>Carregando dependentes...</p>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="guest-dependents-page" style={{ justifyContent: 'center' }}>
        <div className="guest-dependents-container" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#D32F2F', marginBottom: '1rem' }}>{error || 'Convidado não encontrado'}</h3>
          <Link to="/admin" className="back-btn">
            <ArrowLeft size={18} /> Voltar para o Painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-dependents-page">
      <div className="guest-dependents-container">
        {message && (
          <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid #C8E6C9', fontWeight: 600, textAlign: 'center' }}>
            {message}
          </div>
        )}

        <div className="guest-dependents-header">
          <Link to="/admin" className="back-btn">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <div>
            <h1 className="guest-dependents-title">
              <Users size={26} /> Dependentes de {guest.name}
            </h1>
            <p className="guest-dependents-subtitle">
              {guest.phone ? `Tel: ${guest.phone}` : 'Sem telefone'} • {guest.isConfirmed ? 'Presença Confirmada' : 'Não Confirmado'}
            </p>
          </div>
        </div>

        {/* SECÇÃO 1: CADASTRO RÁPIDO (MAIS COMUM) */}
        <div className="dep-section-card">
          <h2 className="dep-section-title">
            ✨ Cadastrar Novo Dependente (Sem Celular)
          </h2>
          <p className="dep-section-desc">
            Ideal para adicionar filhos, bebês ou familiares que não possuem número próprio. Eles ficarão vinculados a {guest.name}.
          </p>
          <form onSubmit={handleQuickCreateDep}>
            <div className="dep-form-group">
              <label htmlFor="dep-quick-name" className="dep-form-label">Nome Completo do Dependente:</label>
              <input 
                id="dep-quick-name"
                name="quickDepName"
                type="text" 
                required
                placeholder="Ex: Pedrinho (Filho)"
                className="dep-form-input"
                value={newDepName}
                onChange={e => setNewDepName(e.target.value)}
              />
            </div>
            <div className="dep-checkbox-group">
              <input 
                type="checkbox" 
                id="depConfirmed" 
                checked={newDepConfirmed} 
                onChange={e => setNewDepConfirmed(e.target.checked)} 
              />
              <label htmlFor="depConfirmed" className="dep-checkbox-label">
                Já confirmar presença no evento
              </label>
            </div>
            <button 
              type="submit" 
              className="dep-submit-btn"
              disabled={creatingDepLoading}
            >
              {creatingDepLoading ? <Loader2 size={18} className="spinner" /> : (
                <>
                  <Plus size={20} /> Adicionar Dependente
                </>
              )}
            </button>
          </form>
        </div>

        {/* SECÇÃO 2: LISTA DE DEPENDENTES VINCULADOS */}
        <div className="dep-list-container">
          <h3 className="dep-list-title">
            <span>👥 Familiares Vinculados</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, background: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
              {guest.dependents?.length || 0}
            </span>
          </h3>

          {(!guest.dependents || guest.dependents.length === 0) ? (
            <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Nenhum dependente vinculado a {guest.name} no momento.
            </div>
          ) : (
            <div>
              {guest.dependents.map(dep => (
                <div key={dep.id} className="dep-item-card">
                  <div className="dep-item-info">
                    <strong>{dep.name}</strong>
                    <span>
                      {dep.phone ? `Tel: ${dep.phone}` : 'Sem telefone (Bebê/Criança)'} •{' '}
                      <b style={{ color: dep.isConfirmed ? '#2E7D32' : '#D32F2F' }}>
                        {dep.isConfirmed ? 'Confirmado' : 'Não Confirmado'}
                      </b>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <button 
                      type="button"
                      style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => handleOpenEditDep(dep)}
                      title="Editar dependente"
                    >
                      Editar
                    </button>
                    <button 
                      type="button"
                      className="dep-unlink-btn"
                      onClick={() => handleUnlinkDependent(dep.id)}
                      disabled={actionLoading === `unlink-${dep.id}`}
                      title="Desvincular dependente"
                    >
                      {actionLoading === `unlink-${dep.id}` ? <Loader2 size={15} className="spinner" /> : <Trash2 size={15} />}
                      Desvincular
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECÇÃO 3: BUSCAR E VINCULAR CONVIDADO EXISTENTE */}
        <div className="dep-search-box">
          <h3 className="dep-section-title" style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
            <Search size={18} style={{ color: 'var(--color-primary)' }} /> Ou vincule um convidado já cadastrado
          </h3>
          <p className="dep-section-desc" style={{ marginBottom: '1rem' }}>
            Pesquise no sistema por nome ou celular de alguém que já preencheu o RSVP com celular próprio:
          </p>
          <div className="dep-search-input-wrapper">
            <Search size={18} style={{ color: 'var(--color-text-light)' }} />
            <input 
              id="dep-search-query"
              name="searchQuery"
              aria-label="Buscar convidado para vincular"
              type="text"
              placeholder="Ex: Nome do cônjuge ou (11) 9999..."
              className="dep-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {loadingSearch && <Loader2 size={18} className="spinner" style={{ color: 'var(--color-primary)' }} />}
          </div>

          {searchQuery.trim() && (
            <div style={{ marginTop: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
              {loadingSearch && searchResults.length === 0 && (
                 <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', textAlign: 'center', padding: '1rem' }}>Buscando no servidor...</div>
              )}
              {!loadingSearch && searchResults.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', textAlign: 'center', padding: '1rem' }}>Nenhum outro convidado encontrado com "{searchQuery}".</div>
              )}
              {searchResults.map(res => (
                <div key={res.id} className="dep-search-result-item">
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--color-text)' }}>{res.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {res.phone || 'Sem celular'} • {res.isConfirmed ? 'Confirmado' : 'Pendente'}
                    </span>
                  </div>
                  <button 
                    type="button"
                    className="dep-link-action-btn"
                    onClick={() => handleLinkDependent(res.id)}
                    disabled={actionLoading === `link-${res.id}`}
                  >
                    {actionLoading === `link-${res.id}` ? <Loader2 size={14} className="spinner" /> : '+ Vincular'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Editar Dependente */}
      {editingDep && (
        <div className="modal-overlay" onClick={() => setEditingDep(null)}>
          <div className="dep-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                Editar Dependente: {editingDep.name}
              </h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setEditingDep(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditDep} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label htmlFor="edit-dep-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Nome Completo:</label>
                <input 
                  id="edit-dep-name"
                  name="editDepName"
                  type="text" 
                  required
                  value={editDepName} 
                  onChange={e => setEditDepName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label htmlFor="edit-dep-phone" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Telefone / Celular (ou em branco caso seja criança):</label>
                <input 
                  id="edit-dep-phone"
                  name="editDepPhone"
                  type="text" 
                  value={editDepPhone} 
                  onChange={e => setEditDepPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label htmlFor="edit-dep-confirmed" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Status da Confirmação:</label>
                <select
                  id="edit-dep-confirmed"
                  name="editDepConfirmed"
                  value={editDepConfirmed ? 'true' : 'false'}
                  onChange={e => setEditDepConfirmed(e.target.value === 'true')}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: '#fff' }}
                >
                  <option value="true">✅ Presença Confirmada</option>
                  <option value="false">❌ Não Comparecerá</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingDep(null)}
                  style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="dep-add-btn"
                  disabled={savingDepLoading}
                  style={{ width: 'auto', margin: 0 }}
                >
                  {savingDepLoading ? <Loader2 size={18} className="spinner" /> : '💾 Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestDependents;
