import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, X } from 'lucide-react';

export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function AlertModal({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Entendido',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: AlertModalProps) {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={40} style={{ color: '#ef4444' }} />;
      case 'confirm':
        return <HelpCircle size={40} style={{ color: '#f59e0b' }} />;
      case 'info':
        return <CheckCircle2 size={40} style={{ color: 'var(--color-primary)' }} />;
      case 'warning':
      default:
        return <AlertTriangle size={40} style={{ color: '#f59e0b' }} />;
    }
  };

  const isConfirmDialog = type === 'confirm';

  return (
    <div className="modal-overlay" onClick={onCancel || onConfirm}>
      <div 
        className="dep-modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '440px', 
          textAlign: 'center', 
          padding: '2rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <button
          type="button"
          className="close-button"
          onClick={onCancel || onConfirm}
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: type === 'error' ? '#fee2e2' : type === 'info' ? '#ecfdf5' : '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.25rem'
        }}>
          {renderIcon()}
        </div>

        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>
          {title}
        </h3>

        <p style={{ margin: 0, fontSize: '0.98rem', color: 'var(--color-text-light)', lineHeight: '1.5' }}>
          {message}
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          width: '100%', 
          marginTop: '0.75rem',
          justifyContent: 'center' 
        }}>
          {isConfirmDialog && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.8rem 1rem',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: 'none',
                margin: 0
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.8rem 1rem',
              background: type === 'error' ? '#ef4444' : isConfirmDialog ? '#dc2626' : 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              margin: 0,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
