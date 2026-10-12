import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Trash2, Plus, Edit2, Edit, ArrowUp, ArrowDown, Check, X, Gift, 
  Utensils, Coffee, Tv, BedDouble, Bath, WashingMachine, Box, User, Loader2,
  ChevronUp, ChevronDown, Minimize2, Maximize2, ArrowLeft, UserPlus, Search
} from 'lucide-react';
import MoneyGiftTab from '../components/MoneyGiftTab';
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
  phone: string | null;
  isConfirmed: boolean;
  message: string | null;
  createdAt?: string;
  dependents?: Guest[];
  parents?: Guest[];
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
  const [activeTab, setActiveTab] = useState<'guests' | 'register' | 'gifts' | 'logs' | 'settings' | 'money'>('guests');
  const [settingsNoivoPhone, setSettingsNoivoPhone] = useState('');
  const [settingsNoivoName, setSettingsNoivoName] = useState('');
  const [settingsNoivaPhone, setSettingsNoivaPhone] = useState('');
  const [settingsNoivaName, setSettingsNoivaName] = useState('');
  const [settingsNameOrder, setSettingsNameOrder] = useState('noivo-first');
  const [settingsPageTitle, setSettingsPageTitle] = useState('');
  const [settingsGiftsMessage, setSettingsGiftsMessage] = useState('');
  const [settingsColorPrimary, setSettingsColorPrimary] = useState('');
  const [settingsColorSecondary, setSettingsColorSecondary] = useState('');
  const [settingsColorAccent, setSettingsColorAccent] = useState('');
  const [settingsPixKey, setSettingsPixKey] = useState('');
  const [settingsPixKeyType, setSettingsPixKeyType] = useState('random');
  const [settingsPixRecipientName, setSettingsPixRecipientName] = useState('');
  const [settingsPixCity, setSettingsPixCity] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const navigate = useNavigate();

  // Loading states
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search state for guests list (with debounce)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Sort state for guests list
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: 'name' | 'createdAt') => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  // Guest editing modal state
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestPhone, setEditGuestPhone] = useState('');
  const [editGuestConfirmed, setEditGuestConfirmed] = useState(true);
  const [editGuestMessage, setEditGuestMessage] = useState('');
  const [savingGuestLoading, setSavingGuestLoading] = useState(false);

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

  const fetchGuests = async (query?: string) => {
    setLoadingGuests(true);
    try {
      const token = localStorage.getItem('token');
      if (!isTokenValid(token)) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const url = query ? `${getApiUrl()}/guests?search=${encodeURIComponent(query)}` : `${getApiUrl()}/guests`;
      const response = await axios.get(url, { headers: getApiHeaders() });
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

  const fetchGifts = async (showLoading = true) => {
    if (showLoading) setLoadingGifts(true);
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    try {
      const response = await axios.get(`${getApiUrl()}/gifts`, { headers: getApiHeaders() });
      setCategories(response.data);
      if (!showLoading) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        });
      }
    } catch (err) {
      console.error('Erro ao buscar presentes:', err);
    } finally {
      if (showLoading) setLoadingGifts(false);
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

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/settings`, { headers: getApiHeaders() });
      setSettingsNoivoPhone(res.data.noivoPhone || '');
      setSettingsNoivoName(res.data.noivoName || '');
      setSettingsNoivaPhone(res.data.noivaPhone || '');
      setSettingsNoivaName(res.data.noivaName || '');
      setSettingsNameOrder(res.data.nameOrder || 'noivo-first');
      setSettingsPageTitle(res.data.pageTitle || '');
      setSettingsGiftsMessage(res.data.giftsMessage || '');
      setSettingsColorPrimary(res.data.colorPrimary || '#86A789');
      setSettingsColorSecondary(res.data.colorSecondary || '#D2E3C6');
      setSettingsColorAccent(res.data.colorAccent || '#739072');
      setSettingsPixKey(res.data.pixKey || '');
      setSettingsPixKeyType(res.data.pixKeyType || 'random');
      setSettingsPixRecipientName(res.data.pixRecipientName || '');
      setSettingsPixCity(res.data.pixCity || '');
      
      // Aplica as cores localmente no painel para preview imediato se já existirem
      if (res.data.colorPrimary) document.documentElement.style.setProperty('--color-primary', res.data.colorPrimary);
      if (res.data.colorSecondary) document.documentElement.style.setProperty('--color-secondary', res.data.colorSecondary);
      if (res.data.colorAccent) document.documentElement.style.setProperty('--color-accent', res.data.colorAccent);
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    }
  };

  useEffect(() => {
    fetchGuests();
    fetchGifts();
    fetchSystemLogs();
    fetchSettings();
  }, [navigate]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'guests') {
      fetchGuests(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);



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

  const handleOpenEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setEditGuestName(guest.name || '');
    setEditGuestPhone(guest.phone || '');
    setEditGuestConfirmed(guest.isConfirmed);
    setEditGuestMessage(guest.message || '');
  };

  const handleSaveEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest || !editGuestName.trim()) return;
    setSavingGuestLoading(true);
    try {
      const payload = {
        name: editGuestName.trim(),
        phone: editGuestPhone.trim() || null,
        isConfirmed: editGuestConfirmed,
        message: editGuestMessage.trim() || null,
      };
      const res = await axios.put(`${getApiUrl()}/guests/${editingGuest.id}`, payload, { headers: getApiHeaders() });
      setGuests(prev => prev.map(g => g.id === res.data.id ? res.data : g));
      setEditingGuest(null);
      setMessage('Convidado atualizado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao atualizar convidado.');
    } finally {
      setSavingGuestLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        noivoPhone: settingsNoivoPhone.replace(/\D/g, ''),
        noivaPhone: settingsNoivaPhone.replace(/\D/g, ''),
        noivoName: settingsNoivoName,
        noivaName: settingsNoivaName,
        nameOrder: settingsNameOrder,
        pageTitle: settingsPageTitle,
        giftsMessage: settingsGiftsMessage,
        colorPrimary: settingsColorPrimary,
        colorSecondary: settingsColorSecondary,
        colorAccent: settingsColorAccent,
        pixKey: settingsPixKey,
        pixKeyType: settingsPixKeyType,
        pixRecipientName: settingsPixRecipientName,
        pixCity: settingsPixCity,
      };
      
      await axios.put(`${getApiUrl()}/settings`, payload, { headers: getApiHeaders() });
      
      // Aplica imediatamente
      document.documentElement.style.setProperty('--color-primary', settingsColorPrimary);
      document.documentElement.style.setProperty('--color-secondary', settingsColorSecondary);
      document.documentElement.style.setProperty('--color-accent', settingsColorAccent);
      
      setMessage('Configurações atualizadas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
      fetchSettings();
    } catch (err) {
      alert('Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetColors = () => {
    setSettingsColorPrimary('#86A789');
    setSettingsColorSecondary('#D2E3C6');
    setSettingsColorAccent('#739072');
    document.documentElement.style.setProperty('--color-primary', '#86A789');
    document.documentElement.style.setProperty('--color-secondary', '#D2E3C6');
    document.documentElement.style.setProperty('--color-accent', '#739072');
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
      await fetchGifts(false);
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
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingCatName } : c));
      setEditingCatId(null);
      await fetchGifts(false);
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
      setCategories(prev => prev.filter(c => c.id !== id));
      await fetchGifts(false);
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
      await fetchGifts(false);
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
      setCategories(prev => prev.map(c => ({
        ...c,
        items: c.items.map(i => i.id === id ? { ...i, name: editingItemName } : i)
      })));
      setEditingItemId(null);
      await fetchGifts(false);
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
      setCategories(prev => prev.map(c => ({
        ...c,
        items: c.items.filter(i => i.id !== id)
      })));
      await fetchGifts(false);
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
      setCategories(prev => prev.map(c => ({
        ...c,
        items: c.items.map(i => i.id === item.id ? { ...i, isReceived, givenBy: isReceived ? (givenBy || null) : null } : i)
      })));
      setReceivingItemId(null);
      setGivenByInput('');
      await fetchGifts(false);
    } catch (err) {
      alert('Erro ao atualizar status do item.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
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
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('settings');
            setMessage('');
          }}
        >
          ⚙️ Configurações
        </button>
        <button 
          className={`tab-button ${activeTab === 'money' ? 'active' : ''}`}
          onClick={() => setActiveTab('money')}
        >
          💰 Presente em Dinheiro
        </button>
      </div>

      {activeTab === 'guests' && (
        <section className="fade-in">
          <div className="guest-search-bar" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--color-bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <Search size={20} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
            <input 
              id="dashboard-search-guests"
              name="searchGuests"
              aria-label="Buscar convidado por nome ou telefone"
              type="text" 
              placeholder="Buscar convidado por nome ou telefone (filtro instantâneo no servidor)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', color: 'var(--color-text)' }}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setSearchQuery('')}
                title="Limpar busca"
              >
                <X size={18} />
              </button>
            )}
          </div>

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
                    <th
                      onClick={() => handleSort('name')}
                      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      title="Ordenar por nome"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        Nome
                        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, color: sortBy === 'name' ? 'var(--color-primary)' : 'var(--color-text-light)', fontSize: '0.7rem' }}>
                          <span style={{ opacity: sortBy === 'name' && sortDir === 'asc' ? 1 : 0.3 }}>▲</span>
                          <span style={{ opacity: sortBy === 'name' && sortDir === 'desc' ? 1 : 0.3 }}>▼</span>
                        </span>
                      </span>
                    </th>
                    <th>Telefone</th>
                    <th>Status</th>
                    <th
                      onClick={() => handleSort('createdAt')}
                      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      title="Ordenar por data de cadastro"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        Cadastro
                        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, color: sortBy === 'createdAt' ? 'var(--color-primary)' : 'var(--color-text-light)', fontSize: '0.7rem' }}>
                          <span style={{ opacity: sortBy === 'createdAt' && sortDir === 'asc' ? 1 : 0.3 }}>▲</span>
                          <span style={{ opacity: sortBy === 'createdAt' && sortDir === 'desc' ? 1 : 0.3 }}>▼</span>
                        </span>
                      </span>
                    </th>
                    <th>Mensagem</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...guests].sort((a, b) => {
                    const dir = sortDir === 'asc' ? 1 : -1;
                    if (sortBy === 'name') return dir * a.name.localeCompare(b.name, 'pt-BR');
                    if (sortBy === 'createdAt') return dir * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
                    return 0;
                  }).map(g => (
                    <tr key={g.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 600 }}>{g.name}</span>
                          {g.parents && g.parents.length > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--color-bg)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--color-border)' }}>
                              👶 Dependente de: <strong>{g.parents.map(p => p.name).join(', ')}</strong>
                            </span>
                          )}
                          {g.dependents && g.dependents.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', marginTop: '0.15rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>👥 Dependentes ({g.dependents.length}):</span>
                              {g.dependents.map(dep => (
                                <span key={dep.id} style={{ fontSize: '0.75rem', background: '#E6F0E8', color: '#2C5E3B', padding: '0.15rem 0.5rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', border: '1px solid #C2DFCA', fontWeight: 500 }}>
                                  {dep.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{g.phone || '-'}</td>
                      <td>
                        <span className={`badge ${g.isConfirmed ? 'confirmed' : 'pending'}`}>
                          {g.isConfirmed ? 'Confirmado' : 'Não'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                        {g.createdAt ? new Date(g.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td>{g.message || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button 
                            type="button" 
                            onClick={() => handleOpenEditGuest(g)}
                            title="Editar dados do convidado"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', height: '36px', minWidth: '115px' }}
                          >
                            <Edit size={15} />
                            Editar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => navigate(`/admin/guests/${g.id}/dependents`)}
                            title="Gerenciar Dependentes"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-primary)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', height: '36px', minWidth: '115px' }}
                          >
                            <UserPlus size={15} />
                            + Dependentes
                          </button>
                          <button 
                            type="button" 
                            className="delete-btn" 
                            onClick={() => handleDeleteGuest(g.id, g.name)}
                            disabled={actionLoading === `delete-guest-${g.id}`}
                            title="Excluir convidado"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', height: '36px', minWidth: '115px', margin: 0 }}
                          >
                            {actionLoading === `delete-guest-${g.id}` ? (
                              <Loader2 size={15} className="spinner" />
                            ) : (
                              <Trash2 size={15} />
                            )} 
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {guests.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
                        Nenhum convidado encontrado.
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
                      id="new-cat-icon"
                      name="newCatIcon"
                      aria-label="Ícone da nova categoria"
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
                      id="new-cat-name"
                      name="newCatName"
                      aria-label="Nome da nova categoria"
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
                              id={`edit-cat-name-${cat.id}`}
                              name={`editCatName_${cat.id}`}
                              aria-label="Editar nome da categoria"
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
                              id={`new-item-name-${cat.id}`}
                              name={`newItemName_${cat.id}`}
                              aria-label="Nome do novo item"
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
                                      id={`edit-item-name-${item.id}`}
                                      name={`editItemName_${item.id}`}
                                      aria-label="Editar nome do item"
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
                                      id={`given-by-${item.id}`}
                                      name={`givenBy_${item.id}`}
                                      aria-label="Quem presenteou"
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
              <label htmlFor="admin-new-username">Usuário</label>
              <input id="admin-new-username" name="newUsername" type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="admin-new-password">Senha</label>
              <input id="admin-new-password" name="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
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

      {activeTab === 'settings' && (
        <section className="fade-in">
          <div className="login-box" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Configurações do Sistema</h2>
            {message && <div className="alert success">{message}</div>}
            
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="settings-grid-2">
                <div className="form-group">
                  <label htmlFor="settings-noivo-name">Nome do Noivo:</label>
                  <input 
                    id="settings-noivo-name"
                    name="settingsNoivoName"
                    type="text" 
                    value={settingsNoivoName} 
                    onChange={e => setSettingsNoivoName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="settings-noivo-phone">Número do Noivo (WhatsApp):</label>
                  <input 
                    id="settings-noivo-phone"
                    name="settingsNoivoPhone"
                    type="text" 
                    placeholder="Ex: 5562999999999"
                    value={settingsNoivoPhone} 
                    onChange={e => setSettingsNoivoPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div className="settings-grid-2">
                <div className="form-group">
                  <label htmlFor="settings-noiva-name">Nome da Noiva:</label>
                  <input 
                    id="settings-noiva-name"
                    name="settingsNoivaName"
                    type="text" 
                    value={settingsNoivaName} 
                    onChange={e => setSettingsNoivaName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="settings-noiva-phone">Número da Noiva (WhatsApp):</label>
                  <input 
                    id="settings-noiva-phone"
                    name="settingsNoivaPhone"
                    type="text" 
                    placeholder="Ex: 5562999999999"
                    value={settingsNoivaPhone} 
                    onChange={e => setSettingsNoivaPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="settings-page-title">Título da Aba do Navegador (Opcional):</label>
                <input 
                  id="settings-page-title"
                  name="settingsPageTitle"
                  type="text" 
                  placeholder="Ex: João & Maria - Casamento"
                  value={settingsPageTitle} 
                  onChange={e => setSettingsPageTitle(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-gifts-message">Mensagem da Lista de Presentes (Opcional):</label>
                <textarea 
                  id="settings-gifts-message"
                  name="settingsGiftsMessage"
                  placeholder="Ex: Sua presença é nosso maior presente! Mas se desejar nos presentear..."
                  value={settingsGiftsMessage} 
                  onChange={e => setSettingsGiftsMessage(e.target.value)}
                  style={{ minHeight: '80px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: '#fff' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-name-order">Ordem dos Nomes (Página Inicial):</label>
                <select 
                  id="settings-name-order"
                  name="settingsNameOrder"
                  value={settingsNameOrder} 
                  onChange={e => setSettingsNameOrder(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: '#fff' }}
                >
                  <option value="noivo-first">Noivo primeiro</option>
                  <option value="noiva-first">Noiva primeiro</option>
                </select>
              </div>

              <div className="settings-grid-3">
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="settings-color-primary">Cor Principal:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input id="settings-color-primary" name="settingsColorPrimaryPicker" aria-label="Seletor de cor principal" type="color" value={settingsColorPrimary} onChange={e => {
                      setSettingsColorPrimary(e.target.value);
                      document.documentElement.style.setProperty('--color-primary', e.target.value);
                    }} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', flexShrink: 0 }} />
                    <input id="settings-color-primary-text" name="settingsColorPrimaryText" aria-label="Código hexadecimal da cor principal" type="text" value={settingsColorPrimary} onChange={e => setSettingsColorPrimary(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="settings-color-secondary">Cor Secundária:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input id="settings-color-secondary" name="settingsColorSecondaryPicker" aria-label="Seletor de cor secundária" type="color" value={settingsColorSecondary} onChange={e => {
                      setSettingsColorSecondary(e.target.value);
                      document.documentElement.style.setProperty('--color-secondary', e.target.value);
                    }} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', flexShrink: 0 }} />
                    <input id="settings-color-secondary-text" name="settingsColorSecondaryText" aria-label="Código hexadecimal da cor secundária" type="text" value={settingsColorSecondary} onChange={e => setSettingsColorSecondary(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="settings-color-accent">Cor de Destaque:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input id="settings-color-accent" name="settingsColorAccentPicker" aria-label="Seletor de cor de destaque" type="color" value={settingsColorAccent} onChange={e => {
                      setSettingsColorAccent(e.target.value);
                      document.documentElement.style.setProperty('--color-accent', e.target.value);
                    }} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', flexShrink: 0 }} />
                    <input id="settings-color-accent-text" name="settingsColorAccentText" aria-label="Código hexadecimal da cor de destaque" type="text" value={settingsColorAccent} onChange={e => setSettingsColorAccent(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                  </div>
                </div>
              </div>

              {/* PIX Configuration */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--color-primary)' }}>
                  🔑 Configuração do PIX (Presente em Dinheiro)
                </h3>
                <div className="settings-grid-2">
                  <div className="form-group">
                    <label htmlFor="settings-pix-key-type">Tipo da Chave PIX:</label>
                    <select
                      id="settings-pix-key-type"
                      name="settingsPixKeyType"
                      value={settingsPixKeyType}
                      onChange={e => setSettingsPixKeyType(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: '#fff' }}
                    >
                      <option value="cpf">🪪 CPF</option>
                      <option value="email">📧 E-mail</option>
                      <option value="phone">📱 Telefone</option>
                      <option value="random">🔑 Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-pix-recipient-name">Nome do Recebedor (Titular):</label>
                    <input
                      id="settings-pix-recipient-name"
                      name="settingsPixRecipientName"
                      type="text"
                      placeholder="Ex: Paulo Adson"
                      value={settingsPixRecipientName}
                      onChange={e => setSettingsPixRecipientName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-grid-2">
                  <div className="form-group">
                    <label htmlFor="settings-pix-key">Chave PIX:</label>
                    <input
                      id="settings-pix-key"
                      name="settingsPixKey"
                      type="text"
                      placeholder="Cole aqui sua chave PIX"
                      value={settingsPixKey}
                      onChange={e => setSettingsPixKey(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-pix-city">Cidade da Conta PIX:</label>
                    <input
                      id="settings-pix-city"
                      name="settingsPixCity"
                      type="text"
                      placeholder="Ex: Goiânia"
                      value={settingsPixCity}
                      onChange={e => setSettingsPixCity(e.target.value)}
                    />
                    <small style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'block', marginTop: '0.25rem' }}>
                      Cidade da sua conta bancária (obrigatório para validar o QR Code no Banco Central).
                    </small>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button type="button" onClick={handleResetColors} style={{ background: '#f1f5f9', color: '#475569', boxShadow: 'none', margin: 0 }}>
                  Restaurar Cores
                </button>
                <button type="submit" disabled={savingSettings} style={{ margin: 0 }}>
                  {savingSettings ? <Loader2 size={18} className="spinner" /> : 'Salvar Configurações'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {activeTab === 'money' && (
        <section className="fade-in">
          <MoneyGiftTab getApiUrl={getApiUrl} getApiHeaders={getApiHeaders} />
        </section>
      )}

    </div>
    
    {/* Modal de Editar Convidado */}
    {editingGuest && (
      <div className="modal-overlay" onClick={() => setEditingGuest(null)}>
        <div className="dep-modal-content" onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={22} /> Editar Convidado: {editingGuest.name}
            </h3>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setEditingGuest(null)}
              title="Fechar"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSaveEditGuest} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label htmlFor="edit-guest-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Nome Completo:</label>
              <input 
                id="edit-guest-name"
                name="editGuestName"
                type="text" 
                required
                value={editGuestName} 
                onChange={e => setEditGuestName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label htmlFor="edit-guest-phone" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Telefone / Celular (ou em branco caso seja criança):</label>
              <input 
                id="edit-guest-phone"
                name="editGuestPhone"
                type="text" 
                value={editGuestPhone} 
                onChange={e => setEditGuestPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label htmlFor="edit-guest-confirmed" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Status da Confirmação:</label>
              <select
                id="edit-guest-confirmed"
                name="editGuestConfirmed"
                value={editGuestConfirmed ? 'true' : 'false'}
                onChange={e => setEditGuestConfirmed(e.target.value === 'true')}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: '#fff' }}
              >
                <option value="true">✅ Presença Confirmada</option>
                <option value="false">❌ Não Comparecerá</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-guest-message" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>Mensagem para os Noivos (Opcional):</label>
              <textarea 
                id="edit-guest-message"
                name="editGuestMessage"
                rows={3}
                value={editGuestMessage} 
                onChange={e => setEditGuestMessage(e.target.value)}
                placeholder="Mensagem ou observação do convidado..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setEditingGuest(null)}
                style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="dep-add-btn"
                disabled={savingGuestLoading}
                style={{ width: 'auto', margin: 0 }}
              >
                {savingGuestLoading ? <Loader2 size={18} className="spinner" /> : '💾 Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    </>
  );
}

export default Dashboard;
