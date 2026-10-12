import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Trash2, RefreshCw, Banknote, QrCode, Wallet, TrendingUp, XCircle, CheckCircle2 } from 'lucide-react';
import AlertModal from './AlertModal';

interface MoneyGiftRecord {
  id: number;
  guestName: string;
  amount: number;
  type: 'pix' | 'cash' | 'both';
  pixAmount: number | null;
  cashAmount: number | null;
  status?: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

interface MoneyGiftSummary {
  totalPix: number;
  totalCash: number;
  totalBoth: number;
  totalCombined: number;
  totalCancelled?: number;
  count: number;
  cancelledCount?: number;
}

interface Props {
  getApiUrl: () => string;
  getApiHeaders: () => Record<string, string>;
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  pix: { label: 'PIX', icon: <QrCode size={14} /> },
  cash: { label: 'Dinheiro', icon: <Banknote size={14} /> },
  both: { label: 'PIX + Dinheiro', icon: <Wallet size={14} /> },
};

const TYPE_COLORS: Record<string, string> = {
  pix: '#0ea5e9',
  cash: '#10b981',
  both: '#8b5cf6',
};

export default function MoneyGiftTab({ getApiUrl, getApiHeaders }: Props) {
  const [records, setRecords] = useState<MoneyGiftRecord[]>([]);
  const [summary, setSummary] = useState<MoneyGiftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const fmt = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        axios.get<MoneyGiftRecord[]>(`${getApiUrl()}/money-gifts`, { headers: getApiHeaders() }),
        axios.get<MoneyGiftSummary>(`${getApiUrl()}/money-gifts/summary`, { headers: getApiHeaders() }),
      ]);
      setRecords(recordsRes.data);
      setSummary(summaryRes.data);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, [getApiUrl, getApiHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (record: MoneyGiftRecord) => {
    const newStatus = record.status === 'CANCELLED' ? 'CONFIRMED' : 'CANCELLED';
    setTogglingId(record.id);
    try {
      await axios.patch(
        `${getApiUrl()}/money-gifts/${record.id}/status`,
        { status: newStatus },
        { headers: getApiHeaders() },
      );
      setRecords(prev =>
        prev.map(r => (r.id === record.id ? { ...r, status: newStatus } : r)),
      );
      const summaryRes = await axios.get<MoneyGiftSummary>(
        `${getApiUrl()}/money-gifts/summary`,
        { headers: getApiHeaders() },
      );
      setSummary(summaryRes.data);
    } catch {
      setAlertModal({
        isOpen: true,
        title: 'Erro ao alterar status',
        message: 'Não foi possível alterar o status do presente. Tente novamente.',
        type: 'error',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingId(id);
    setDeleteTarget(null);

    try {
      await axios.delete(`${getApiUrl()}/money-gifts/${id}`, { headers: getApiHeaders() });
      setRecords(prev => prev.filter(r => r.id !== id));
      const summaryRes = await axios.get<MoneyGiftSummary>(`${getApiUrl()}/money-gifts/summary`, { headers: getApiHeaders() });
      setSummary(summaryRes.data);
    } catch {
      setAlertModal({
        isOpen: true,
        title: 'Erro ao excluir',
        message: 'Não foi possível excluir este presente. Tente novamente.',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spinner" style={{ color: 'var(--color-primary)' }} />
        <span>Carregando presentes em dinheiro...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header with refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.4rem' }}>
            💰 Presentes em Dinheiro
          </h2>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
            Total de registros: <strong>{records.length}</strong>
            {summary?.cancelledCount ? (
              <span style={{ marginLeft: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                ({summary.cancelledCount} cancelado{summary.cancelledCount > 1 ? 's' : ''})
              </span>
            ) : null}
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', background: 'var(--color-primary)',
            color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            width: 'auto', margin: 0, boxShadow: '0 3px 10px rgba(134,167,137,0.3)',
            transition: 'all 0.2s ease',
          }}
          title="Atualizar lista"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Total PIX */}
          <div style={{ background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
            <QrCode size={28} style={{ color: '#0ea5e9', marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Total PIX</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem', fontWeight: 700, color: '#0284c7' }}>{fmt(summary.totalPix)}</p>
          </div>

          {/* Total Dinheiro */}
          <div style={{ background: 'linear-gradient(135deg, #d1fae5, #ecfdf5)', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
            <Banknote size={28} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Total Dinheiro</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem', fontWeight: 700, color: '#059669' }}>{fmt(summary.totalCash)}</p>
          </div>

          {/* Total Misto (PIX + Dinheiro) */}
          <div style={{ background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
            <Wallet size={28} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6d28d9', fontWeight: 600, textTransform: 'uppercase' }}>PIX + Dinheiro</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem', fontWeight: 700, color: '#7c3aed' }}>{fmt(summary.totalBoth)}</p>
          </div>

          {/* Total Geral */}
          <div style={{ background: 'linear-gradient(135deg, rgba(134,167,137,0.15), rgba(210,227,198,0.25))', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
            <TrendingUp size={28} style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase' }}>Total Geral</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(summary.totalCombined)}</p>
          </div>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#64748b' }}>
          <p style={{ fontSize: '1.1rem' }}>Nenhum presente em dinheiro registrado ainda.</p>
          <span style={{ fontSize: '0.9rem' }}>Assim que os convidados registrarem, aparecerão aqui!</span>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Convidado</th>
                <th>Status</th>
                <th>Forma de Pagamento</th>
                <th>Valor Total</th>
                <th>Detalhe</th>
                <th>Data / Hora</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const dateObj = new Date(record.createdAt);
                const formatted = `${dateObj.toLocaleDateString('pt-BR')} ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                const typeInfo = TYPE_LABELS[record.type] || { label: record.type, icon: null };
                const color = TYPE_COLORS[record.type] || '#64748b';
                const isCancelled = record.status === 'CANCELLED';

                let detailText = '100% no PIX';
                if (record.type === 'cash') detailText = '100% em Dinheiro físico';
                if (record.type === 'both') detailText = 'Misto (PIX + Dinheiro na festa)';

                return (
                  <tr key={record.id} style={{ opacity: isCancelled ? 0.65 : 1, backgroundColor: isCancelled ? '#fff5f5' : undefined }}>
                    <td style={{ fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                      {record.guestName}
                    </td>
                    <td>
                      {isCancelled ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.78rem',
                          fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
                        }}>
                          <XCircle size={13} /> Cancelado
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.78rem',
                          fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac',
                        }}>
                          <CheckCircle2 size={13} /> Confirmado
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.8rem',
                        fontWeight: 700, backgroundColor: `${color}18`, color, border: `1px solid ${color}35`,
                      }}>
                        {typeInfo.icon}
                        {typeInfo.label}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: 700,
                      color: isCancelled ? '#94a3b8' : 'var(--color-primary)',
                      fontSize: '1rem',
                      textDecoration: isCancelled ? 'line-through' : 'none',
                    }}>
                      {fmt(record.amount)}
                      {isCancelled && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#dc2626', fontWeight: 500 }}>
                          (Desconsiderado)
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                      {detailText}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{formatted}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(record)}
                          disabled={togglingId === record.id}
                          title={isCancelled ? 'Restaurar presente (Confirmar)' : 'Marcar presente como Cancelado'}
                          style={{
                            margin: 0,
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            minWidth: 'auto',
                            background: isCancelled ? '#dcfce7' : '#fee2e2',
                            color: isCancelled ? '#15803d' : '#b91c1c',
                            border: `1px solid ${isCancelled ? '#86efac' : '#fca5a5'}`,
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          {togglingId === record.id ? (
                            <Loader2 size={13} className="spinner" />
                          ) : isCancelled ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <XCircle size={13} />
                          )}
                          {isCancelled ? 'Restaurar' : 'Cancelar'}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => setDeleteTarget({ id: record.id, name: record.guestName })}
                          disabled={deletingId === record.id}
                          title="Excluir registro permanentemente"
                          style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.65rem', minWidth: 'auto' }}
                        >
                          {deletingId === record.id ? <Loader2 size={14} className="spinner" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <AlertModal
        isOpen={!!deleteTarget}
        title="Excluir Presente"
        message={`Tem certeza que deseja excluir permanentemente o registro de presente de "${deleteTarget?.name}"?`}
        type="confirm"
        confirmText="Sim, excluir"
        cancelText="Voltar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal de Alerta / Erro */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="Entendido"
        onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
