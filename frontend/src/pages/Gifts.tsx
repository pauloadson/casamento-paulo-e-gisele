import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Utensils, Coffee, Tv, BedDouble, Bath, WashingMachine, Box, MessageCircle, Loader2, Check } from 'lucide-react';
import './Gifts.css';

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

export default function Gifts() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<GiftCategoryData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const apiUrl = rawUrl.replace(/\/+$/, '');
        
        // Busca os presentes
        const response = await axios.get<GiftCategoryData[]>(`${apiUrl}/gifts`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
        });
        
        const sortedData = response.data.map(cat => ({
          ...cat,
          items: [...cat.items].sort((a, b) => {
            if (a.isReceived === b.isReceived) return 0;
            return a.isReceived ? 1 : -1;
          })
        }));

        setCategories(sortedData);
        if (sortedData.length > 0) {
          setActiveTab(sortedData[0].name);
        }

        // Busca configurações do sistema
        try {
          const settingsRes = await axios.get<Record<string, string>>(`${apiUrl}/settings`, {
            headers: { 'x-api-key': import.meta.env.VITE_API_KEY || '' }
          });
          setSystemSettings(settingsRes.data);
        } catch (settingsError) {
          console.error('Erro ao buscar configurações:', settingsError);
        }
      } catch (error) {
        console.error('Erro ao buscar lista de presentes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

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

  const toggleItem = (item: GiftItemData) => {
    if (item.isReceived) return;
    setSelectedItems(prev => 
      prev.includes(item.name) ? prev.filter(i => i !== item.name) : [...prev, item.name]
    );
  };

  const handleSendWhatsApp = (contact: 'noivo' | 'noiva') => {
    const phone = contact === 'noivo' ? (systemSettings.noivoPhone || '') : (systemSettings.noivaPhone || '');
    if (!phone) {
      alert(`O número d${contact === 'noivo' ? 'o noivo' : 'a noiva'} ainda não foi configurado no sistema.`);
      return;
    }
    const name = contact === 'noivo' ? systemSettings.noivoName : systemSettings.noivaName;
    const greeting = name ? `Olá, ${name}!` : 'Olá!';
    
    // Group items by category
    const groupedItems: Record<string, string[]> = {};
    selectedItems.forEach(itemName => {
      const category = categories.find(cat => cat.items.some(i => i.name === itemName));
      if (category) {
        if (!groupedItems[category.name]) {
          groupedItems[category.name] = [];
        }
        groupedItems[category.name].push(itemName);
      }
    });

    let itemsText = '';
    Object.keys(groupedItems).forEach(catName => {
      itemsText += `*${catName.toUpperCase()}*\n`;
      groupedItems[catName].forEach(item => {
        itemsText += `- ${item}\n`;
      });
      itemsText += '\n';
    });

    const isPlural = selectedItems.length > 1;
    const introText = isPlural 
      ? 'com os seguintes itens'
      : 'com o seguinte item';

    const text = `${greeting} Gostaria de presentear vocês ${introText} da lista de casamento:\n\n${itemsText.trim()}`;
    const encodedText = encodeURIComponent(text).replace(/\*/g, '%2A');
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  return (
    <div className="gifts-page" style={{ flexDirection: 'column', padding: '1rem' }}>
      <div className="gift-modal-content" onClick={e => e.stopPropagation()}>
        <div className="gift-modal-header">
          <button 
            className="close-button" 
            onClick={() => navigate('/')}
            aria-label="Voltar"
          >
            <ArrowLeft size={24} />
          </button>
          <h2>Nossa Lista de Sugestões</h2>
          <div style={{ width: 24 }}></div>
        </div>
        <p className="gift-modal-subtitle">
          Sua presença é nosso maior presente! Mas se desejar nos presentear, aqui estão algumas sugestões.
        </p>

        <div className="gift-modal-body">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={36} className="spinner" style={{ color: 'var(--color-primary)' }} />
              <span>Carregando sugestões de presentes...</span>
            </div>
          ) : (
            <>
              <div className="gift-categories">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-tab ${activeTab === cat.name ? 'active' : ''}`}
                    onClick={() => setActiveTab(cat.name)}
                  >
                    {renderCategoryIcon(cat.icon)}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              <div className="gift-items-container">
                {categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className={`gift-items-grid ${activeTab === cat.name ? 'active' : ''}`}
                  >
                    {cat.items.map((item) => {
                      const isSelected = selectedItems.includes(item.name);
                      const isReceived = item.isReceived;
                      return (
                        <div 
                          key={item.id} 
                          className={`gift-item ${isSelected ? 'selected' : ''} ${isReceived ? 'received' : ''}`}
                          onClick={() => toggleItem(item)}
                          title={isReceived ? `Este item já foi escolhido${item.givenBy ? ` (${item.givenBy})` : ''}` : ''}
                        >
                          <span>{item.name}</span>
                          {isReceived && (
                            <Check size={20} className="received-check-icon" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className="gift-modal-footer">
            <p>
              Você selecionou <strong>{selectedItems.length}</strong> {selectedItems.length === 1 ? 'item' : 'itens'}. 
              Avisar:
            </p>
            <div className="whatsapp-buttons">
              <button className="whatsapp-btn" onClick={() => handleSendWhatsApp('noiva')}>
                <MessageCircle size={18} /> Noiva
              </button>
              <button className="whatsapp-btn" onClick={() => handleSendWhatsApp('noivo')}>
                <MessageCircle size={18} /> Noivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
