import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfilePhotoSrc } from '../api';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../api';
import { Sidebar } from '../components/Sidebar';
import '../styles/dashboard.css';

export const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [transactions, setTransactions] = useState([]);
  const [hideBalance, setHideBalance] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((data) => { if (data.user) updateUser({ ...user, ...data.user }); })
      .catch(() => {}); // silently keep stale data on failure
    api.get('/transactions/my?limit=5').then((data) => {
      if (data.transactions) setTransactions(data.transactions.slice(0, 5));
      setLoadingTx(false);
    }).catch(() => setLoadingTx(false));
  }, []);

  const isSent = (tx) => {
    const senderId = tx.sender?._id ?? tx.sender?.id ?? tx.sender;
    return String(senderId) === String(user.id);
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <p className="page-title" style={{ margin: 0 }}>Good day, {user.fullName.split(' ')[0]} 👋</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowNotifs(!showNotifs); markAllRead(); }}
                style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 12, width: 42, height: 42, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔔
              </button>
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#e53e3e', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>
              )}
              {showNotifs && (
                <div style={{ position: 'fixed', right: 16, top: 70, background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, width: 'min(300px, calc(100vw - 32px))', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>
                  <p style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #f5f5f5' }}>Notifications</p>
                  {notifications.length === 0 ? (
                    <p style={{ padding: '20px 16px', color: '#bbb', fontSize: 13, textAlign: 'center' }}>No notifications yet</p>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                        <p style={{ fontWeight: 600, color: '#38a169' }}>💰 {n.message}</p>
                        <p style={{ color: '#bbb', fontSize: 11, marginTop: 3 }}>{new Date(n.createdAt).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Profile Photo */}
            {user.photo && (
              <img src={getProfilePhotoSrc(user.photo)} alt="profile"
                style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ebebeb' }} />
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="balance-card fade-in">
          <div className="balance-top">
            <div>
              <p className="balance-label">Total Balance</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setHideBalance(!hideBalance)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>
                {hideBalance ? '👁️' : '🙈'}
              </button>
              <span className="balance-badge">Savings</span>
            </div>
          </div>
          <p className="balance-amount">{hideBalance ? '₦ ••••••' : `₦${user.balance.toLocaleString()}.00`}</p>
          <div className="balance-bottom">
            <div>
              <p className="balance-account">ACC: {user.accountNumber}</p>
              <p className="balance-name">{user.fullName}</p>
            </div>
            <span style={{ fontSize: 28 }}>🏦</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/transfer" className="action-btn">
            <div className="action-icon-wrap"><span className="action-icon">💸</span></div>
            <span>Transfer</span>
          </Link>
          <Link to="/transactions" className="action-btn">
            <div className="action-icon-wrap"><span className="action-icon">📋</span></div>
            <span>History</span>
          </Link>
          <Link to="/card" className="action-btn">
            <div className="action-icon-wrap"><span className="action-icon">💳</span></div>
            <span>My Card</span>
          </Link>
          <Link to="/settings" className="action-btn">
            <div className="action-icon-wrap"><span className="action-icon">⚙️</span></div>
            <span>Settings</span>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="section-card">
          <div className="section-header">
            <h3>Recent Transactions</h3>
            <Link to="/transactions">See all</Link>
          </div>
          {loadingTx ? (
            [1,2,3].map((i) => (
              <div key={i} className="tx-item">
                <div className="tx-left">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f0f0f0' }} />
                  <div>
                    <div style={{ width: 120, height: 12, borderRadius: 6, background: '#f0f0f0', marginBottom: 6 }} />
                    <div style={{ width: 80, height: 10, borderRadius: 6, background: '#f5f5f5' }} />
                  </div>
                </div>
                <div style={{ width: 70, height: 14, borderRadius: 6, background: '#f0f0f0' }} />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const sent = isSent(tx);
              const type = sent ? 'sent' : 'received';
              const other = sent ? tx.receiver : tx.sender;
              const otherName = other?.fullName || (sent ? tx.recipientName : null) || 'Account unavailable';
              return (
                <div key={tx._id} className="tx-item">
                  <div className="tx-left">
                    <div className={`tx-icon ${type}`}>
                      {type === 'sent' ? '↑' : '↓'}
                    </div>
                    <div>
                      <p className="tx-name">{otherName}</p>
                      <p className="tx-date">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`tx-amount ${type}`}>
                    {type === 'sent' ? '-' : '+'}₦{amount.toLocaleString()}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
