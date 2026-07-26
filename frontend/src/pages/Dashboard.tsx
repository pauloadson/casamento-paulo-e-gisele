import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Trash2, Plus, Edit2, ArrowUp, ArrowDown, Check, X, Gift, 
  Utensils, Coffee, Tv, BedDouble, Bath, WashingMachine, Box, User, Loader2,
  ChevronUp, ChevronDown, Minimize2, Maximize2, ArrowLeft
} from 'lucide-react';
import './Dashboard.css';

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

interface Guest {
  id: number;
  name: string;
  phone: string;
  isConfirmed: boolean;
  message: string;
}

interface GiftItemData {
  id: number;
  categoryId: number;
  name: string;
  isReceived: boolean;
  givenBy?: string | null;
}

interface GiftCategoryData {
  id: number;
  name: string;
  icon: string;
  sequence: number;
  items: GiftItemData[];
}

interface SystemLogData {
  id: number;
  action: string;
  details: string;
  performedBy: string;
  createdAt: string;
}

function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [categories, setCategories] = useState<GiftCategoryData[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogData[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'guests' | 'register' | 'gifts' | 'logs'>('guests');
  const navigate = useNavigate();

  // Loading states
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // State for inline editing in Gifts tab
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  // State for marking received / editing who gave item
  const [receivingItemId, setReceivingItemId] = useState<number | null>(null);
  const [givenByInput, setGivenByInput] = useState('');

  // State for adding new item
  const [addingItemToCatId, setAddingItemToCatId] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // State for adding new category
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Box');

  // State and helpers for minimizing categories
  const [minimizedCatIds, setMinimizedCatIds] = useState<number[]>([]);

  const toggleMinimizeCat = (catId: number) => {
    setMinimizedCatIds(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleMinimizeAll = () => {
    setMinimizedCatIds(categories.map(c => c.id));
  };

  const handleExpandAll = () => {
    setMinimizedCatIds([]);
  };

  useEffect(() => {
    document.body.classList.add('dashboard-active');
    return () => {
      document.body.classList.remove('dashboard-active');
    };
  }, []);

  const getApiHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_KEY || ''
    };
  };

  const getApiUrl = () => {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return rawUrl.replace(/\/+$/, '');
  };

  const fetchGuests = async () => {
    setLoadingGuests(true);
    try {
      const token = localStorage.getItem('token');
      if (!isTokenValid(token)) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const response = await axios.get(`${getApiUrl()}/guests`, { headers: getApiHeaders() });
      setGuests(response.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
      }
      navigate('/login');
    } finally {
      setLoadingGuests(false);
    }
  };

  const fetchGifts = async () => {
    setLoadingGifts(true);
    try {
      const response = await axios.get(`${getApiUrl()}/gifts`, { headers: getApiHeaders() });
      setCategories(response.data);
    } catch (err) {
      console.error('Erro ao buscar presentes:', err);
    } finally {
      setLoadingGifts(false);
    }
  };

  const fetchSystemLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await axios.get(`${getApiUrl()}/system-logs`, { headers: getApiHeaders() });
      setSystemLogs(response.data);
    } catch (err) {
      console.error('Erro ao buscar logs do sistema:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchGuests();
    fetchGifts();
    fetchSystemLogs();
  }, [navigate]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-user');
    try {
      await axios.post(`${getApiUrl()}/users`, { username: newUsername, password: newPassword }, {
        headers: getApiHeaders()
      });
      setMessage('Usuário criado com sucesso!');
      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      setMessage('Erro ao criar usuário.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGuest = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o registro de "${name}"?`)) {
      return;
    }
    setActionLoading(`delete-guest-${id}`);
    try {
      await axios.delete(`${getApiUrl()}/guests/${id}`, { headers: getApiHeaders() });
      setGuests(guests.filter(g => g.id !== id));
    } catch (err) {
      alert('Erro ao excluir convidado. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Utensils': return <Utensils size={20} />;
      case 'Coffee': return <Coffee size={20} />;
      case 'Tv': return <Tv size={20} />;
      case 'BedDouble': return <BedDouble size={20} />;
      case 'Bath': return <Bath size={20} />;
      case 'WashingMachine': return <WashingMachine size={20} />;
      case 'Box': default: return <Box size={20} />;
    }
  };

  // Category sequence movement
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];

    const newOrder = [
      { id: currentCat.id, sequence: targetCat.sequence },
      { id: targetCat.id, sequence: currentCat.sequence }
    ];

    setActionLoading(`move-${direction}-${currentCat.id}`);
    try {
      const res = await axios.put(`${getApiUrl()}/gifts/categories/reorder`, { order: newOrder }, { headers: getApiHeaders() });
      setCategories(res.data);
    } catch (err) {
      alert('Erro ao reordenar categorias.');
    } finally {
      setActionLoading(null);
    }
  };

  // Create category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setActionLoading('create-cat');
    try {
      await axios.post(`${getApiUrl()}/gifts/categories`, { name: newCatName, icon: newCatIcon }, { headers: getApiHeaders() });
      setNewCatName('');
      setIsAddingCat(false);
      await fetchGifts();
    } catch (err) {
      alert('Erro ao criar categoria.');
    } finally {
      setActionLoading(null);
    }
  };

  // Update category name
  const handleSaveCategoryName = async (id: number) => {
    if (!editingCatName.trim()) return;
    setActionLoading(`save-cat-${id}`);
    try {
      await axios.put(`${getApiUrl()}/gifts/categories/${id}`, { name: editingCatName }, { headers: getApiHeaders() });
      setEditingCatId(null);
      await fetchGifts();
    } catch (err) {
      alert('Erro ao atualizar categoria.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${name}" e todos os seus itens?`)) return;
    setActionLoading(`del-cat-${id}`);
    try {
      await axios.delete(`${getApiUrl()}/gifts/categories/${id}`, { headers: getApiHeaders() });
      await fetchGifts();
    } catch (err) {
      alert('Erro ao excluir categoria.');
    } finally {
      setActionLoading(null);
    }
  };

  // Create gift item
  const handleCreateItem = async (categoryId: number) => {
    if (!newItemName.trim()) return;
    setActionLoading(`create-item-${categoryId}`);
    try {
      await axios.post(`${getApiUrl()}/gifts/items`, { categoryId, name: newItemName }, { headers: getApiHeaders() });
      setNewItemName('');
      setAddingItemToCatId(null);
      await fetchGifts();
    } catch (err) {
      alert('Erro ao adicionar item.');
    } finally {
      setActionLoading(null);
    }
  };

  // Update item name
  const handleSaveItemName = async (id: number) => {
    if (!editingItemName.trim()) return;
    setActionLoading(`save-item-${id}`);
    try {
      await axios.put(`${getApiUrl()}/gifts/items/${id}`, { name: editingItemName }, { headers: getApiHeaders() });
      setEditingItemId(null);
      await fetchGifts();
    } catch (err) {
      alert('Erro ao atualizar item.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o item "${name}"?`)) return;
    setActionLoading(`del-item-${id}`);
    try {
      await axios.delete(`${getApiUrl()}/gifts/items/${id}`, { headers: getApiHeaders() });
      await fetchGifts();
    } catch (err) {
      alert('Erro ao excluir item.');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle received status / Save givenBy
  const handleSaveReceivedStatus = async (item: GiftItemData, isReceived: boolean, givenBy?: string | null) => {
    setActionLoading(`received-item-${item.id}`);
    try {
      await axios.put(`${getApiUrl()}/gifts/items/${item.id}`, {
        isReceived,
        givenBy: isReceived ? (givenBy || null) : null
      }, { headers: getApiHeaders() });
      setReceivingItemId(null);
      setGivenByInput('');
      await fetchGifts();
    } catch (err) {
      alert('Erro ao atualizar status do item.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="rsvp-container dashboard-container">
      <div className="header-container">
        <h1>Painel de Controle</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/')} className="back-home-btn" title="Voltar para a página inicial">
            <ArrowLeft size={16} /> Voltar para o site
          </button>
          <button onClick={logout} className="logout-btn">Sair</button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'guests' ? 'active' : ''}`}
          onClick={() => setActiveTab('guests')}
        >
          Lista de Presença ({guests.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'gifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('gifts')}
        >
          <Gift size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          Lista de Presentes
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
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('logs');
            fetchSystemLogs();
          }}
        >
          📋 Histórico de Logs
        </button>
      </div>

      {activeTab === 'guests' && (
        <section className="fade-in">
          {loadingGuests ? (
            <div className="loading-state">
              <Loader2 size={36} className="spinner" style={{ color: 'var(--color-primary)' }} />
              <span>Carregando lista de convidados...</span>
            </div>
          ) : (
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
                          disabled={actionLoading === `delete-guest-${g.id}`}
                          title="Excluir convidado"
                        >
                          {actionLoading === `delete-guest-${g.id}` ? (
                            <Loader2 size={16} className="spinner" />
                          ) : (
                            <Trash2 size={16} />
                          )} 
                          Excluir
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
          )}
        </section>
      )}

      {activeTab === 'gifts' && (
        <section className="fade-in dashboard-gifts">
          {loadingGifts ? (
            <div className="loading-state">
              <Loader2 size={36} className="spinner" style={{ color: 'var(--color-primary)' }} />
              <span>Carregando categorias e presentes do banco de dados...</span>
            </div>
          ) : (
            <>
              <div className="dashboard-actions-bar">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="icon-btn" onClick={handleMinimizeAll} title="Minimizar todas as categorias">
                    <Minimize2 size={16} /> Minimizar Todas
                  </button>
                  <button type="button" className="icon-btn" onClick={handleExpandAll} title="Expandir todas as categorias">
                    <Maximize2 size={16} /> Expandir Todas
                  </button>
                </div>

                {!isAddingCat ? (
                  <button className="add-category-btn" onClick={() => setIsAddingCat(true)}>
                    <Plus size={18} /> Nova Categoria
                  </button>
                ) : (
                  <form onSubmit={handleCreateCategory} className="inline-edit-box" style={{ maxWidth: '500px', margin: '0 0 1rem auto' }}>
                    <select 
                      value={newCatIcon} 
                      onChange={e => setNewCatIcon(e.target.value)}
                      style={{ width: '130px', padding: '0.5rem' }}
                    >
                      <option value="Utensils">Talheres (Cozinha)</option>
                      <option value="Coffee">Café (Eletros)</option>
                      <option value="Tv">TV (Sala)</option>
                      <option value="BedDouble">Cama (Quarto)</option>
                      <option value="Bath">Banho (Banheiro)</option>
                      <option value="WashingMachine">Máquina (Área)</option>
                      <option value="Box">Caixa (Geral)</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Nome da categoria..." 
                      value={newCatName} 
                      onChange={e => setNewCatName(e.target.value)} 
                      autoFocus
                      required
                    />
                    <button type="submit" className="icon-btn success" disabled={actionLoading === 'create-cat'} title="Salvar">
                      {actionLoading === 'create-cat' ? <Loader2 size={16} className="spinner" /> : <Check size={18} />}
                    </button>
                    <button type="button" className="icon-btn" onClick={() => setIsAddingCat(false)} title="Cancelar"><X size={18} /></button>
                  </form>
                )}
              </div>

              {categories.map((cat, index) => {
                const isMinimized = minimizedCatIds.includes(cat.id);
                return (
                  <div key={cat.id} className="category-admin-card">
                    <div className={`category-admin-header ${isMinimized ? 'minimized' : ''}`}>
                      <div className="category-admin-title">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => toggleMinimizeCat(cat.id)}
                          title={isMinimized ? "Expandir categoria" : "Minimizar categoria"}
                          style={{ border: 'none', padding: '0.2rem', background: 'transparent' }}
                        >
                          {isMinimized ? <ChevronDown size={20} style={{ color: 'var(--color-primary)' }} /> : <ChevronUp size={20} style={{ color: 'var(--color-primary)' }} />}
                        </button>
                        {renderCategoryIcon(cat.icon)}
                        {editingCatId === cat.id ? (
                          <div className="inline-edit-box">
                            <input 
                              type="text" 
                              value={editingCatName} 
                              onChange={e => setEditingCatName(e.target.value)}
                              autoFocus
                            />
                            <button type="button" className="icon-btn success" disabled={actionLoading === `save-cat-${cat.id}`} onClick={() => handleSaveCategoryName(cat.id)}>
                              {actionLoading === `save-cat-${cat.id}` ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                            </button>
                            <button type="button" className="icon-btn" onClick={() => setEditingCatId(null)}><X size={16} /></button>
                          </div>
                        ) : (
                          <>
                            <h3 onClick={() => toggleMinimizeCat(cat.id)} style={{ cursor: 'pointer' }} title="Clique para minimizar ou expandir">
                              {cat.name}
                            </h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 'normal', marginLeft: '0.25rem' }}>
                              ({cat.items.length} {cat.items.length === 1 ? 'item' : 'itens'})
                            </span>
                            <button 
                              type="button" 
                              className="icon-btn" 
                              onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                              title="Editar nome da categoria"
                            >
                              <Edit2 size={14} />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="category-admin-controls">
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginRight: '0.5rem' }}>Ordem:</span>
                        <button 
                          type="button" 
                          className="icon-btn" 
                          onClick={() => handleMoveCategory(index, 'up')} 
                          disabled={index === 0 || actionLoading === `move-up-${cat.id}`}
                          title="Subir categoria"
                        >
                          {actionLoading === `move-up-${cat.id}` ? <Loader2 size={16} className="spinner" /> : <ArrowUp size={16} />} Subir
                        </button>
                        <button 
                          type="button" 
                          className="icon-btn" 
                          onClick={() => handleMoveCategory(index, 'down')} 
                          disabled={index === categories.length - 1 || actionLoading === `move-down-${cat.id}`}
                          title="Descer categoria"
                        >
                          {actionLoading === `move-down-${cat.id}` ? <Loader2 size={16} className="spinner" /> : <ArrowDown size={16} />} Descer
                        </button>
                        
                        <button 
                          type="button" 
                          className="icon-btn success" 
                          style={{ marginLeft: '0.5rem' }}
                          onClick={() => { 
                            if (isMinimized) toggleMinimizeCat(cat.id);
                            setAddingItemToCatId(cat.id); 
                            setNewItemName(''); 
                          }}
                        >
                          <Plus size={16} /> Item
                        </button>
                        <button 
                          type="button" 
                          className="icon-btn danger" 
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          disabled={actionLoading === `del-cat-${cat.id}`}
                          title="Excluir categoria"
                        >
                          {actionLoading === `del-cat-${cat.id}` ? <Loader2 size={16} className="spinner" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>

                    {!isMinimized && (
                      <>
                        {addingItemToCatId === cat.id && (
                          <div className="inline-edit-box" style={{ marginBottom: '1rem', background: '#F4F8F4' }}>
                            <input 
                              type="text" 
                              placeholder="Nome do novo item..." 
                              value={newItemName} 
                              onChange={e => setNewItemName(e.target.value)}
                              autoFocus
                            />
                            <button type="button" className="icon-btn success" disabled={actionLoading === `create-item-${cat.id}`} onClick={() => handleCreateItem(cat.id)}>
                              {actionLoading === `create-item-${cat.id}` ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                            </button>
                            <button type="button" className="icon-btn" onClick={() => setAddingItemToCatId(null)}><X size={16} /></button>
                          </div>
                        )}

                        <div className="items-admin-list">
                          {cat.items.map(item => (
                            <div key={item.id} className={`item-admin-row ${item.isReceived ? 'is-received' : ''}`}>
                              <div className="item-admin-info">
                                {editingItemId === item.id ? (
                                  <div className="inline-edit-box">
                                    <input 
                                      type="text" 
                                      value={editingItemName} 
                                      onChange={e => setEditingItemName(e.target.value)} 
                                      autoFocus
                                    />
                                    <button type="button" className="icon-btn success" disabled={actionLoading === `save-item-${item.id}`} onClick={() => handleSaveItemName(item.id)}>
                                      {actionLoading === `save-item-${item.id}` ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                                    </button>
                                    <button type="button" className="icon-btn" onClick={() => setEditingItemId(null)}><X size={16} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="item-admin-name">{item.name}</span>
                                    <button 
                                      type="button" 
                                      className="icon-btn" 
                                      style={{ padding: '0.2rem 0.4rem', border: 'none' }}
                                      onClick={() => { setEditingItemId(item.id); setEditingItemName(item.name); }}
                                      title="Editar nome do item"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  </>
                                )}

                                {item.isReceived && (
                                  <span className="received-info-tag">
                                    <User size={14} /> 
                                    {item.givenBy ? `Recebido por: ${item.givenBy}` : 'Já recebido (Sem nome)'}
                                  </span>
                                )}
                              </div>

                              <div className="item-admin-actions">
                                {receivingItemId === item.id ? (
                                  <div className="inline-edit-box" style={{ minWidth: '260px' }}>
                                    <input 
                                      type="text" 
                                      placeholder="Quem deu? (Ex: Tios...)" 
                                      value={givenByInput} 
                                      onChange={e => setGivenByInput(e.target.value)}
                                      autoFocus
                                    />
                                    <button 
                                      type="button" 
                                      className="icon-btn success" 
                                      disabled={actionLoading === `received-item-${item.id}`}
                                      onClick={() => handleSaveReceivedStatus(item, true, givenByInput)}
                                      title="Salvar"
                                    >
                                      {actionLoading === `received-item-${item.id}` ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                                    </button>
                                    <button 
                                      type="button" 
                                      className="icon-btn" 
                                      onClick={() => setReceivingItemId(null)}
                                      title="Cancelar"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {!item.isReceived ? (
                                      <button 
                                        type="button" 
                                        className="icon-btn success" 
                                        disabled={actionLoading === `received-item-${item.id}`}
                                        onClick={() => { setReceivingItemId(item.id); setGivenByInput(''); }}
                                      >
                                        {actionLoading === `received-item-${item.id}` ? <Loader2 size={16} className="spinner" /> : <Check size={16} />} Marcar como Recebido
                                      </button>
                                    ) : (
                                      <>
                                        <button 
                                          type="button" 
                                          className="icon-btn" 
                                          disabled={actionLoading === `received-item-${item.id}`}
                                          onClick={() => { setReceivingItemId(item.id); setGivenByInput(item.givenBy || ''); }}
                                          title="Editar quem deu"
                                        >
                                          <Edit2 size={14} /> Quem Deu
                                        </button>
                                        <button 
                                          type="button" 
                                          className="icon-btn danger" 
                                          disabled={actionLoading === `received-item-${item.id}`}
                                          onClick={() => handleSaveReceivedStatus(item, false, null)}
                                          title="Desmarcar como recebido"
                                        >
                                          {actionLoading === `received-item-${item.id}` ? <Loader2 size={16} className="spinner" /> : 'Desmarcar'}
                                        </button>
                                      </>
                                    )}

                                    <button 
                                      type="button" 
                                      className="icon-btn danger" 
                                      disabled={actionLoading === `del-item-${item.id}`}
                                      onClick={() => handleDeleteItem(item.id, item.name)}
                                      title="Excluir item"
                                    >
                                      {actionLoading === `del-item-${item.id}` ? <Loader2 size={16} className="spinner" /> : <Trash2 size={16} />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          {cat.items.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '1rem', fontStyle: 'italic' }}>
                              Nenhum item nesta categoria.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </>
          )}
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
            <button type="submit" disabled={actionLoading === 'create-user'}>
              {actionLoading === 'create-user' ? <Loader2 size={18} className="spinner" style={{ marginRight: '8px', verticalAlign: 'middle' }} /> : null}
              Cadastrar
            </button>
          </form>
        </section>
      )}

      {activeTab === 'logs' && (
        <section className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>📋 Tráfego e Histórico de Ações</h2>
              <p style={{ margin: '0.3rem 0 0 0', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                Registro contínuo e completo de auditoria do sistema e ações realizadas.
              </p>
            </div>
            <button 
              className="action-button primary" 
              onClick={fetchSystemLogs} 
              disabled={loadingLogs}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
            >
              🔄 Atualizar Logs
            </button>
          </div>

          {loadingLogs ? (
            <div className="loading-state">
              <Loader2 size={36} className="spinner" style={{ color: 'var(--color-primary)' }} />
              <span>Carregando trilha de auditoria...</span>
            </div>
          ) : systemLogs.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Nenhum registro de atividade encontrado ainda.</p>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Assim que ações forem realizadas, elas aparecerão listadas aqui em tempo real!</span>
            </div>
          ) : (
            <div className="table-wrapper" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
              <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', width: '160px', color: '#475569', fontSize: '0.85rem' }}>DATA / HORA</th>
                    <th style={{ padding: '1rem', width: '180px', color: '#475569', fontSize: '0.85rem' }}>TIPO DE AÇÃO</th>
                    <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem' }}>DETALHES DA ATIVIDADE</th>
                    <th style={{ padding: '1rem', width: '160px', color: '#475569', fontSize: '0.85rem' }}>EXECUTADO POR</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLogs.map((log) => {
                    const dateObj = new Date(log.createdAt);
                    const formattedDate = `${dateObj.toLocaleDateString('pt-BR')} ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
                    
                    let badgeColor = '#64748b';
                    if (log.action.includes('CRIAR') || log.action.includes('LOGIN') || log.action.includes('RSVP')) badgeColor = '#10b981';
                    if (log.action.includes('EXCLUIR') || log.action.includes('FALHOU') || log.action.includes('REMOVER')) badgeColor = '#ef4444';
                    if (log.action.includes('EDITAR') || log.action.includes('ATUALIZAR') || log.action.includes('REORDENAR')) badgeColor = '#f59e0b';
                    if (log.action.includes('MARCAR')) badgeColor = '#8b5cf6';
                    if (log.action.includes('DESMARCAR')) badgeColor = '#64748b';

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap', color: '#64748b' }}>{formattedDate}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '50px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: `${badgeColor}15`,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}30`
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '500', color: '#1e293b', fontSize: '0.95rem' }}>{log.details}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ 
                            fontWeight: '600', 
                            color: log.performedBy.toLowerCase().includes('admin') || log.performedBy.toLowerCase() === 'sistema' ? 'var(--color-primary)' : '#475569',
                            fontSize: '0.85rem',
                            background: '#f1f5f9',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}>
                            👤 {log.performedBy}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Dashboard;
