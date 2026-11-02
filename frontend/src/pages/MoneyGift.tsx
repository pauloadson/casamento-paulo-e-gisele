import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Banknote,
  QrCode,
  Wallet,
  Smartphone,
  Gift,
  XCircle,
} from "lucide-react";
import AlertModal from "../components/AlertModal";
import { generatePixPayload } from "../utils/pix";
import "./MoneyGift.css";

type GiftType = "pix" | "cash" | "both";
type Step = "form" | "qrcode";

const PRESET_VALUES = [5, 10, 20, 30, 40, 50, 75, 100, 150, 200, 300, 500];

const getApiUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return rawUrl.replace(/\/+$/, "");
};

const getApiHeaders = () => ({
  "x-api-key": import.meta.env.VITE_API_KEY || "",
});

export default function MoneyGift() {
  const navigate = useNavigate();

  // Settings
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState(""); // 'cpf', 'email', 'phone', 'random'
  const [pixRecipientName, setPixRecipientName] = useState("");
  const [pixCity, setPixCity] = useState("");
  const pageTitle = "Presente em Dinheiro";

  // Form state
  const [guestName, setGuestName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [giftType, setGiftType] = useState<GiftType>("pix");
  const [step, setStep] = useState<Step>("form");
  const [registeredGiftId, setRegisteredGiftId] = useState<number | null>(null);

  // Pix copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Modal alert state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "warning" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
  });

  const showAlert = (
    title: string,
    message: string,
    type: "warning" | "error" | "info" = "warning",
  ) => {
    setModalState({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get<Record<string, string>>(
          `${getApiUrl()}/settings`,
          {
            headers: getApiHeaders(),
          },
        );
        if (res.data.pixKey) {
          setPixKey(res.data.pixKey);
        } else {
          setGiftType("cash");
        }
        setPixKeyType(res.data.pixKeyType || "");
        setPixRecipientName(res.data.pixRecipientName || "");
        setPixCity(res.data.pixCity || "");
        if (res.data.pageTitle) {
          document.title = res.data.pageTitle;
        }
        if (res.data.colorPrimary)
          document.documentElement.style.setProperty(
            "--color-primary",
            res.data.colorPrimary,
          );
        if (res.data.colorSecondary)
          document.documentElement.style.setProperty(
            "--color-secondary",
            res.data.colorSecondary,
          );
        if (res.data.colorAccent)
          document.documentElement.style.setProperty(
            "--color-accent",
            res.data.colorAccent,
          );
      } catch {
        // Silently fail
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleBack = () => {
    if (
      window.history.state &&
      typeof window.history.state.idx === "number" &&
      window.history.state.idx > 0
    ) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalState.isOpen) {
          closeModal();
        } else if (confirmCancelOpen) {
          setConfirmCancelOpen(false);
        } else if (step === "qrcode") {
          setStep("form");
        } else {
          handleBack();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState.isOpen, confirmCancelOpen, step]);

  const handleSelectType = (type: GiftType) => {
    if ((type === "pix" || type === "both") && !pixKey.trim()) {
      showAlert(
        "Chave PIX em Configuração",
        "Os noivos ainda não cadastraram a chave PIX no sistema. Por favor, utilize a opção em Dinheiro ou tente novamente mais tarde.",
        "warning",
      );
      return;
    }
    setGiftType(type);
  };

  // Formatação monetária automática para "Outro valor"
  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      setCustomValue("");
      return;
    }
    const num = parseInt(digits, 10) / 100;
    const formatted = num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setCustomValue(formatted);
    setSelectedValue(null);
  };

  const getFinalValue = (): number => {
    if (selectedValue !== null) return selectedValue;
    if (!customValue) return 0;
    const digits = customValue.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) / 100 : 0;
  };

  const getFinalName = () =>
    isAnonymous ? "Anônimo" : guestName.trim() || "Anônimo";

  const handlePresent = async () => {
    const amount = getFinalValue();
    if (amount <= 0) {
      showAlert(
        "Valor do Presente",
        "Por favor, selecione um dos valores sugeridos ou digite o valor que deseja presentear.",
        "warning",
      );
      return;
    }
    if (!isAnonymous && !guestName.trim()) {
      showAlert(
        "Identificação",
        'Por favor, digite seu nome ou selecione a opção "Anônimo".',
        "warning",
      );
      return;
    }

    if ((giftType === "pix" || giftType === "both") && !pixKey.trim()) {
      showAlert(
        "Chave PIX em Configuração",
        'Os noivos ainda não cadastraram a chave PIX no sistema. Por favor, escolha a opção "Dinheiro" ou tente novamente mais tarde.',
        "warning",
      );
      return;
    }

    setSubmitting(true);
    try {
      let pixAmount: number | undefined;
      let cashAmount: number | undefined;

      if (giftType === "pix") {
        pixAmount = amount;
      } else if (giftType === "cash") {
        cashAmount = amount;
      } else {
        // both - pix portion is the amount, cash will be brought on the day
        pixAmount = amount;
      }

      const response = await axios.post<{ id: number }>(
        `${getApiUrl()}/money-gifts`,
        {
          guestName: getFinalName(),
          amount,
          type: giftType,
          pixAmount: pixAmount ?? null,
          cashAmount: cashAmount ?? null,
        },
        { headers: getApiHeaders() },
      );

      if (response.data && response.data.id) {
        setRegisteredGiftId(response.data.id);
      }

      setStep("qrcode");
    } catch {
      showAlert(
        "Ops, erro ao registrar",
        "Não foi possível registrar o presente. Verifique sua conexão e tente novamente.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelGift = async () => {
    if (!registeredGiftId) {
      handleBack();
      return;
    }
    setCancelling(true);
    try {
      await axios.patch(
        `${getApiUrl()}/money-gifts/${registeredGiftId}/cancel`,
        {},
        { headers: getApiHeaders() },
      );
      setConfirmCancelOpen(false);
      showAlert(
        "Presente Cancelado",
        "O presente foi cancelado com sucesso no sistema.",
        "info",
      );
      setTimeout(() => {
        handleBack();
      }, 1500);
    } catch {
      showAlert(
        "Erro ao cancelar",
        "Não foi possível cancelar o presente. Tente novamente.",
        "error",
      );
    } finally {
      setCancelling(false);
      setConfirmCancelOpen(false);
    }
  };

  const amount = getFinalValue();
  const showPix = giftType === "pix" || giftType === "both";
  const showCash = giftType === "cash" || giftType === "both";

  const pixPayload = useMemo(() => {
    if (!pixKey) return "";
    return generatePixPayload({
      pixKey,
      pixKeyType,
      recipientName: pixRecipientName || "Casamento",
      city: pixCity || "BRASILIA",
      amount: amount > 0 ? amount : undefined,
      description: "Presente Casamento",
    });
  }, [pixKey, pixKeyType, pixRecipientName, pixCity, amount]);

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyPixCode = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (loadingSettings) {
    return (
      <div className="gifts-page">
        <div className="money-gift-content">
          <div className="loading-state">
            <Loader2
              size={36}
              className="spinner"
              style={{ color: "var(--color-primary)" }}
            />
            <span>Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === "qrcode") {
    return (
      <div className="gifts-page">
        <div className="money-gift-content money-gift-qr fade-in">
          <div className="gift-modal-header">
            <button
              className="close-button"
              onClick={() => {
                setStep("form");
                setCopiedCode(false);
                setCopiedKey(false);
              }}
              aria-label="Voltar para o formulário"
            >
              <ArrowLeft size={24} />
            </button>
            <h2>Presente Registrado!</h2>
            <div style={{ width: 40 }} />
          </div>

          <div className="money-gift-qr-body">
            <div className="money-gift-thankyou">
              <p className="thankyou-name">
                {isAnonymous ? (
                  "Obrigado pelo presente!"
                ) : (
                  <>
                    Obrigado, <strong>{getFinalName()}</strong>!
                  </>
                )}
              </p>
              <p className="thankyou-amount">
                Valor: <strong>R$ {amount.toFixed(2).replace(".", ",")}</strong>
              </p>
              <p className="thankyou-type">
                {giftType === "pix" && "✅ Pagamento via PIX"}
                {giftType === "cash" && "✅ Pagamento em dinheiro no dia"}
                {giftType === "both" && "✅ PIX + Dinheiro no dia"}
              </p>
            </div>

            {showPix && pixKey && (
              <div className="pix-section">
                <div className="pix-qr-wrapper">
                  <div className="pix-qr-label">
                    <QrCode size={20} />
                    <span>QR Code PIX</span>
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pixPayload)}&margin=10&ecc=M`}
                    alt="QR Code PIX"
                    className="qr-code-img"
                    width={220}
                    height={220}
                  />
                  <p className="pix-qr-hint">
                    Aponte a câmera do aplicativo do seu banco para o QR Code
                  </p>
                </div>

                {/* Botão de PIX Copia e Cola */}
                <div
                  className="pix-copy-paste-card"
                  style={{
                    width: "100%",
                    background: "#f8fafc",
                    border: "1.5px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "var(--color-primary-dark)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    <Smartphone size={18} />
                    <span>Está no celular? Use o PIX Copia e Cola:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPixCode}
                    className={`pix-copy-btn ${copiedCode ? "copied" : ""}`}
                    style={{
                      width: "100%",
                      padding: "0.8rem 1rem",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      justifyContent: "center",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                    {copiedCode
                      ? "Código PIX Copiado!"
                      : "Copiar Código PIX (Copia e Cola)"}
                  </button>
                  {copiedCode && (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "#166534",
                        textAlign: "center",
                        fontWeight: 500,
                      }}
                    >
                      Abra o app do seu banco e selecione a opção{" "}
                      <strong>Pix Copia e Cola</strong>.
                    </span>
                  )}
                </div>

                <div className="pix-key-section">
                  <p className="pix-key-label">
                    {pixKeyType && (
                      <span className="pix-key-type-badge">
                        {pixKeyType === "cpf" && "🪪 CPF"}
                        {pixKeyType === "email" && "📧 E-mail"}
                        {pixKeyType === "phone" && "📱 Telefone"}
                        {pixKeyType === "random" && "🔑 Chave Aleatória"}
                        {!["cpf", "email", "phone", "random"].includes(
                          pixKeyType,
                        ) && "🔑 Chave PIX"}
                      </span>
                    )}
                    Ou se preferir, copie a chave manual
                    {pixRecipientName && ` (${pixRecipientName})`}:
                  </p>
                  <div className="pix-key-copy">
                    <span className="pix-key-value">{pixKey}</span>
                    <button
                      className={`pix-copy-btn ${copiedKey ? "copied" : ""}`}
                      onClick={handleCopyPixKey}
                      title="Copiar chave PIX"
                    >
                      {copiedKey ? <Check size={18} /> : <Copy size={18} />}
                      {copiedKey ? "Copiada!" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCash && (
              <div className="cash-section">
                <Banknote
                  size={48}
                  style={{
                    color: "var(--color-primary)",
                    marginBottom: "0.75rem",
                  }}
                />
                <p className="cash-message">
                  {giftType === "cash"
                    ? "Você escolheu presentear em dinheiro. Traga o envelope no dia da festa! 🎊"
                    : "Traga também o complemento em dinheiro no dia da festa! 🎊"}
                </p>
              </div>
            )}

            {showPix && !pixKey && (
              <div className="no-pix-warning">
                <p>
                  ⚠️ A chave PIX ainda não foi configurada pelos noivos. Por
                  favor, apresente-se pessoalmente no dia da festa.
                </p>
              </div>
            )}

            {/* Ações: Voltar e Cancelar */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                width: "100%",
                marginTop: "0.5rem",
              }}
            >
              <button className="btn-back-home" onClick={handleBack}>
                Voltar
              </button>

              <button
                type="button"
                className="btn-cancel-gift"
                onClick={() => setConfirmCancelOpen(true)}
                disabled={cancelling}
              >
                {cancelling ? (
                  <Loader2 size={16} className="spinner" />
                ) : (
                  <XCircle size={18} />
                )}
                Cancelar Presente
              </button>
            </div>
          </div>
        </div>

        <AlertModal
          isOpen={confirmCancelOpen}
          title="Cancelar Presente"
          message="Tem certeza que deseja cancelar este presente?"
          type="confirm"
          confirmText="Sim, cancelar"
          cancelText="Não cancelar"
          onConfirm={handleCancelGift}
          onCancel={() => setConfirmCancelOpen(false)}
        />
        <AlertModal
          isOpen={modalState.isOpen}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
          onConfirm={closeModal}
        />
      </div>
    );
  }

  return (
    <div className="gifts-page">
      <div className="money-gift-content fade-in">
        {/* Header - Voltar inteligente */}
        <div className="gift-modal-header">
          <button
            className="close-button"
            onClick={handleBack}
            aria-label="Voltar"
          >
            <ArrowLeft size={24} />
          </button>
          <h2>{pageTitle || "Presente em Dinheiro"}</h2>
          <div style={{ width: 40 }} />
        </div>

        <p className="gift-modal-subtitle">
          Obrigado por ajudar! Escolha o valor e a forma de pagamento abaixo.
        </p>

        <div className="money-gift-body">
          {/* Nome / Anônimo com IDs e Labels associados */}
          <div className="mg-section">
            <label htmlFor="mg-guest-name" className="mg-label">
              Seu nome
            </label>
            <div className="mg-name-row">
              <input
                id="mg-guest-name"
                name="guestName"
                type="text"
                className="mg-input"
                placeholder="Digite seu nome..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                disabled={isAnonymous}
              />
              <label htmlFor="mg-anonymous" className="mg-anonymous-label">
                <input
                  id="mg-anonymous"
                  name="anonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mg-checkbox"
                />
                <span>Anônimo</span>
              </label>
            </div>
          </div>

          {/* Tipo de presente */}
          <div className="mg-section">
            <span className="mg-label">Como você vai presentear?</span>
            <div className="mg-type-cards">
              <button
                type="button"
                className={`mg-type-card ${giftType === "pix" ? "active" : ""}`}
                onClick={() => handleSelectType("pix")}
              >
                <QrCode size={32} />
                <span className="mg-type-title">PIX</span>
                <span className="mg-type-desc">Transferência pelo app</span>
              </button>
              <button
                type="button"
                className={`mg-type-card ${giftType === "cash" ? "active" : ""}`}
                onClick={() => handleSelectType("cash")}
              >
                <Banknote size={32} />
                <span className="mg-type-title">Dinheiro</span>
                <span className="mg-type-desc">Trago em envelope</span>
              </button>
              <button
                type="button"
                className={`mg-type-card ${giftType === "both" ? "active" : ""}`}
                onClick={() => handleSelectType("both")}
              >
                <Wallet size={32} />
                <span className="mg-type-title">PIX + Dinheiro</span>
                <span className="mg-type-desc">
                  Parte no PIX, parte em espécie
                </span>
              </button>
            </div>
          </div>

          {/* Valor */}
          <div className="mg-section">
            <label htmlFor="mg-custom-value" className="mg-label">
              Valor do presente
            </label>
            <div className="mg-values-grid">
              {PRESET_VALUES.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`mg-value-btn ${selectedValue === val ? "active" : ""}`}
                  onClick={() => {
                    setSelectedValue(val);
                    setCustomValue("");
                  }}
                >
                  R$ {val}
                </button>
              ))}
            </div>

            <div className="mg-custom-value">
              <input
                id="mg-custom-value"
                name="customValue"
                type="text"
                inputMode="numeric"
                className="mg-input mg-custom-input"
                placeholder="R$ 0,00 (Outro valor)"
                aria-label="Outro valor em dinheiro"
                value={customValue ? `R$ ${customValue}` : ""}
                onChange={handleCustomValueChange}
              />
            </div>

            {amount > 0 && (
              <p className="mg-value-preview">
                Você vai presentear com{" "}
                <strong>R$ {amount.toFixed(2).replace(".", ",")}</strong>
              </p>
            )}
          </div>

          {/* Botão principal */}
          <button
            className="mg-submit-btn"
            onClick={handlePresent}
            disabled={submitting || amount <= 0}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="spinner" /> Registrando...
              </>
            ) : (
              "Presentear"
            )}
          </button>
        </div>
      </div>

      {/* Botão flutuante redondo para ir aos presentes */}
      <button
        className="floating-gift-button floating-gift-round"
        onClick={() => navigate("/presentes")}
        aria-label="Abrir Lista de Presentes"
      >
        <Gift className="gift-icon" />
      </button>

      <AlertModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={closeModal}
      />
    </div>
  );
}
