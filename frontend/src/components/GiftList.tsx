import { useState } from 'react';
import { Gift, X, Utensils, Coffee, Tv, BedDouble, Bath, WashingMachine, Box } from 'lucide-react';
import './GiftList.css';

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

export function GiftList() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(categories[0].name);

  return (
    <>
      <button 
        className="floating-gift-button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir Lista de Presentes"
      >
        <Gift className="gift-icon" />
        <span className="gift-text">
          Lista de <br className="mobile-break" /> Presentes
        </span>
      </button>

      {isOpen && (
        <div className="gift-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="gift-modal-content" onClick={e => e.stopPropagation()}>
            <div className="gift-modal-header">
              <h2>Nossa Lista de Sugestões</h2>
              <button 
                className="close-button" 
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                <X size={24} />
              </button>
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
                      <div key={idx} className="gift-item">
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
