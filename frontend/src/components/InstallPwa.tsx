import { useState, useEffect } from 'react';
import { Smartphone, X, Share, PlusSquare, MoreVertical } from 'lucide-react';
import './InstallPwa.css';

export default function InstallPwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBtn, setShowBtn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Verificamos se já está rodando como aplicativo instalado (Tela Inicial)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Já está instalado, não exibe o botão
    }

    // Verifica se o usuário já fechou/descartou o aviso anteriormente
    const dismissed = localStorage.getItem('pwa_dismissed');
    if (dismissed === 'true') {
      return;
    }

    // Detecta se é dispositivo iOS (iPhone / iPad)
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(iosDevice);

    // No Android / Chrome / Edge desktop, o navegador dispara este evento
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Se for iOS ou navegador móvel que não suporta o evento nativo, mostramos o botão para abrir o guia
    if (iosDevice || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setShowBtn(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Dispara o prompt nativo de instalação do Android / Chrome / Edge
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBtn(false);
      }
      setDeferredPrompt(null);
    } else {
      // Abre o modal explicando passo a passo no iPhone ou navegadores alternativos
      setShowModal(true);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBtn(false);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showBtn) return null;

  return (
    <>
      <div className="pwa-install-btn" onClick={handleInstallClick} title="Adicionar aplicativo à Tela Inicial">
        <Smartphone size={18} />
        <span>Instalar App</span>
        <button className="pwa-close-badge" onClick={handleDismiss} title="Não mostrar novamente">
          <X size={14} />
        </button>
      </div>

      {showModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pwa-modal-content" onClick={e => e.stopPropagation()}>
            <h3>
              <Smartphone size={24} /> Adicionar à Tela Inicial
            </h3>
            <p>
              Tenha acesso rápido e fácil à lista de presentes e confirmação do casamento diretamente na tela do seu celular!
            </p>

            {isIos ? (
              <ul className="pwa-step-list">
                <li>
                  <span className="pwa-step-number">1</span>
                  <div>
                    Toque no botão <strong>Compartilhar</strong> <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> na barra inferior do Safari.
                  </div>
                </li>
                <li>
                  <span className="pwa-step-number">2</span>
                  <div>
                    Role as opções para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.
                  </div>
                </li>
                <li>
                  <span className="pwa-step-number">3</span>
                  <div>
                    Toque em <strong>Adicionar</strong> no canto superior direito para confirmar.
                  </div>
                </li>
              </ul>
            ) : (
              <ul className="pwa-step-list">
                <li>
                  <span className="pwa-step-number">1</span>
                  <div>
                    Toque no ícone do menu <strong>(3 pontinhos)</strong> <MoreVertical size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> no canto superior ou inferior do navegador.
                  </div>
                </li>
                <li>
                  <span className="pwa-step-number">2</span>
                  <div>
                    Selecione a opção <strong>Adicionar à tela inicial</strong> ou <strong>Instalar aplicativo</strong>.
                  </div>
                </li>
                <li>
                  <span className="pwa-step-number">3</span>
                  <div>
                    Confirme clicando em <strong>Instalar</strong> para criar o ícone na sua tela!
                  </div>
                </li>
              </ul>
            )}

            <button className="pwa-modal-close-btn" onClick={() => setShowModal(false)}>
              Entendi!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
