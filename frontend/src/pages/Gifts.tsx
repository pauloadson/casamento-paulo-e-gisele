import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Utensils, Coffee, Tv, BedDouble, Bath, WashingMachine, Box, MessageCircle } from 'lucide-react';
import './Gifts.css';

const categories = [
  {
    name: 'Cozinha',
    icon: <Utensils size={20} />,
    items: [
      'Jogo de panelas', 'Formas', 'Travessas de vidro', 'Potes herméticos', 
      'Jogo de facas', 'Tábua de corte', 'Escorredor de louças', 
      'Concha, espátula e pegador', 'Jogo de utensílios de cozinha', 
      'Tigelas (bowls)', 'Jarra de água', 'Garrafa térmica', 'Pratos', 
      'Pratos de sobremesa', 'Copos', 'Taças', 'Xícaras de café', 
      'Canecas', 'Pires', 'Jogo americano', 'Lixeira para cozinha'
    ]
  },
  {
    name: 'Eletrodomésticos',
    icon: <Coffee size={20} />,
    items: [
      'Liquidificador', 'Batedeira', 'Sanduicheira', 'Air fryer', 'Micro-ondas'
    ]
  },
  {
    name: 'Sala',
    icon: <Tv size={20} />,
    items: [
      'Sofá', 'Rack ou painel para TV', 'Tapete', 'Cortinas', 'Almofadas'
    ]
  },
  {
    name: 'Quarto',
    icon: <BedDouble size={20} />,
    items: [
      'Cama box', 'Colchão', 'Jogo de lençóis', 'Edredom', 'Cobertor', 
      'Colcha', 'Cesto para roupas', 'Cortinas', 'Tapete'
    ]
  },
  {
    name: 'Banheiro',
    icon: <Bath size={20} />,
    items: [
      'Jogo de toalhas de banho', 'Toalhas de rosto', 'Lixeira', 
      'Porta-sabonete líquido', 'Cesto de roupas'
    ]
  },
  {
    name: 'Área de Serviço',
    icon: <WashingMachine size={20} />,
    items: [
      'Varal de chão', 'Baldes', 'Bacia', 'Pregadores de roupa', 
      'Tábua de passar', 'Ferro de passar', 'Vassoura', 'Rodo', 'Pá de lixo'
    ]
  },
  {
    name: 'Eletros Maiores',
    icon: <Box size={20} />,
    items: [
      'Geladeira', 'Fogão', 'Forno elétrico', 'Máquina de lavar roupas', 
      'Aspirador de pó', 'Televisão'
    ]
  }
];

export default function Gifts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(categories[0].name);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSendWhatsApp = (contact: 'noivo' | 'noiva') => {
    const phone = contact === 'noivo' ? '556295132226' : '556295288086';
    const greeting = contact === 'noivo' ? 'Olá, Paulo!' : 'Olá, Gisele!';
    
    // Group items by category
    const groupedItems: Record<string, string[]> = {};
    selectedItems.forEach(item => {
      const category = categories.find(cat => cat.items.includes(item));
      if (category) {
        if (!groupedItems[category.name]) {
          groupedItems[category.name] = [];
        }
        groupedItems[category.name].push(item);
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
    // encodeURIComponent não encoda asteriscos por padrão, o que pode bugar o redirecionamento do WhatsApp em alguns celulares.
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
            
            <p className="gift-modal-subtitle">
              Sua presença é nosso maior presente! Mas se desejar nos presentear, aqui estão algumas sugestões.
            </p>

            <div className="gift-modal-body">
              <div className="gift-categories">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    className={`category-tab ${activeTab === cat.name ? 'active' : ''}`}
                    onClick={() => setActiveTab(cat.name)}
                  >
                    {cat.icon}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              <div className="gift-items-container">
                {categories.map((cat) => (
                  <div 
                    key={cat.name} 
                    className={`gift-items-grid ${activeTab === cat.name ? 'active' : ''}`}
                  >
                    {cat.items.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`gift-item ${selectedItems.includes(item) ? 'selected' : ''}`}
                        onClick={() => toggleItem(item)}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
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
