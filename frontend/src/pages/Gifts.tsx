import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Utensils, Coffee, Tv, BedDouble, Bath, WashingMachine, Box, MessageCircle, Loader2, Check } from 'lucide-react';
import AdminShortcut from '../components/AdminShortcut';
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const apiUrl = rawUrl.replace(/\/+$/, '');
        const response = await axios.get<GiftCategoryData[]>(`${apiUrl}/gifts`, {
          headers: {
            'x-api-key': import.meta.env.VITE_API_KEY || ''
          }
        });
        setCategories(response.data);
        if (response.data.length > 0) {
          setActiveTab(response.data[0].name);
        }
      } catch (error) {
        console.error('Erro ao buscar lista de presentes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGifts();
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
    const phone = contact === 'noivo' ? '556295132226' : '556295288086';
    const greeting = contact === 'noivo' ? 'Olá, Paulo!' : 'Olá, Gisele!';
    
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
    <div className="gifts-page">
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
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <AdminShortcut />
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
