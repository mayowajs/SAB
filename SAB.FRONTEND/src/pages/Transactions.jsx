import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Sidebar } from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/transfer.css';

export const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/transactions/my?page=${page}&limit=15&search=${search}`).then((data) => {
      if (data.transactions) {
        setTransactions(data.transactions);
        setPages(data.pages);
      }
      setLoading(false);
    });
  }, [page, search]);

  const filtered = transactions.filter((tx) => {
    const isSent = tx.sender._id === user.id || tx.sender.id === user.id;
    if (filter === 'sent') return isSent;
    if (filter === 'received') return !isSent;
    return true;
  });

  const totalSent = transactions
    .filter((tx) => tx.sender._id === user.id || tx.sender.id === user.id)
    .reduce((s, tx) => s + tx.amount, 0);

  const totalReceived = transactions
    .filter((tx) => tx.receiver._id === user.id || tx.receiver.id === user.id)
    .reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <p className="page-title" style={{ margin: 0 }}>Transaction History</p>
          <button
            onClick={async () => {
              const token = localStorage.getItem('sab_token');
              const res = await fetch('http://localhost:5000/api/transactions/statement/pdf', {
                headers: { Authorization: `Bearer ${token}` },
              });
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'SAB_Statement.html'; a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            📄 Download Statement
          </button>
        </div>

        {/* Summary Stats */}
        <div className="transfer-stats">
          <div className="transfer-stat">
            <label>Total Sent</label>
            <p className="sent-color">₦{totalSent.toLocaleString()}</p>
          </div>
          <div className="transfer-stat">
            <label>Total Received</label>
            <p className="received-color">₦{totalReceived.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters + Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'sent', 'received'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#111' : '#fff',
                color: filter === f ? '#fff' : '#111',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <input
            placeholder="Search by name, note or ref..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 260, padding: '8px 14px', fontSize: 13, borderRadius: 8, border: '1px solid #e0e0e0', outline: 'none' }}
          />
        </div>

        <div className="section-card">
          {loading ? (
            <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading...</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><p>No transactions found</p></div>
          ) : (
            filtered.map((tx) => {
              const isSent = tx.sender._id === user.id || tx.sender.id === user.id;
              const type = isSent ? 'sent' : 'received';
              const other = isSent ? tx.receiver : tx.sender;
              return (
                <div key={tx._id} className="tx-item" style={{ cursor: 'pointer' }} onClick={() => setSelected(tx)}>
                  <div className="tx-left">
                    <div className={`tx-icon ${type}`}>{isSent ? '↑' : '↓'}</div>
                    <div>
                      <p className="tx-name">{other.fullName}</p>
                      <p className="tx-date">
                        {new Date(tx.createdAt).toLocaleDateString()} · {tx.note || 'No note'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={`tx-amount ${type}`}>
                      {isSent ? '-' : '+'}₦{tx.amount.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{tx.status}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: page === 1 ? '#ccc' : '#111' }}
            >
              ← Prev
            </button>
            <span style={{ padding: '8px 14px', fontSize: 13, color: '#888' }}>{page} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: page === pages ? '#ccc' : '#111' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const isSent = selected.sender._id === user.id || selected.sender.id === user.id;
              const type = isSent ? 'sent' : 'received';
              return (
                <>
                  <div className="receipt-icon">{isSent ? '💸' : '💰'}</div>
                  <p className="modal-title" style={{ textAlign: 'center' }}>
                    {isSent ? 'Money Sent' : 'Money Received'}
                  </p>
                  {selected.reference && (
                    <p className="receipt-ref">REF: {selected.reference}</p>
                  )}
                  <div className={`modal-amount`} style={{ color: isSent ? '#e53e3e' : '#38a169' }}>
                    {isSent ? '-' : '+'}₦{selected.amount.toLocaleString()}
                  </div>
                  <div className="modal-row">
                    <label>From</label>
                    <span>{selected.sender.fullName}</span>
                  </div>
                  <div className="modal-row">
                    <label>To</label>
                    <span>{selected.receiver.fullName}</span>
                  </div>
                  <div className="modal-row">
                    <label>Note</label>
                    <span>{selected.note || '—'}</span>
                  </div>
                  <div className="modal-row">
                    <label>Date</label>
                    <span>{new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="modal-row">
                    <label>Status</label>
                    <span style={{ color: selected.status === 'success' ? '#38a169' : '#e53e3e' }}>
                      {selected.status === 'success' ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={() => setSelected(null)}>Close</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
