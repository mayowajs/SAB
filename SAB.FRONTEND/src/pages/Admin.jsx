import { useEffect, useState } from 'react';
import { api } from '../api';
import { Sidebar } from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/admin.css';

export const Admin = () => {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [editingBalance, setEditingBalance] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/transactions'),
    ]).then(([u, t]) => {
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(t)) setTransactions(t);
      setLoading(false);
    });
  }, []);

  const handleFreezeUser = async (id, isFrozen) => {
    const res = await api.patch(`/admin/users/${id}/freeze`);
    if (res.message) setUsers(users.map((u) => u._id === id ? { ...u, isFrozen: res.isFrozen } : u));
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(users.filter((u) => u._id !== id));
  };

  const handleSaveBalance = async (id) => {
    const res = await api.patch(`/admin/users/${id}/balance`, { balance: Number(newBalance) });
    if (res._id) {
      setUsers(users.map((u) => (u._id === id ? { ...u, balance: res.balance } : u)));
      setEditingBalance(null);
      setNewBalance('');
    }
  };

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
  const totalTx = transactions.length;
  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.accountNumber.includes(search)
  );

  const filteredTx = transactions.filter(
    (t) =>
      t.sender?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.receiver?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <p className="page-title">Admin Panel 🛡️</p>

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon"><span>👥</span></div>
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><span>📋</span></div>
            <div className="stat-value">{totalTx}</div>
            <div className="stat-label">Transactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><span>💰</span></div>
            <div className="stat-value">₦{totalVolume.toLocaleString()}</div>
            <div className="stat-label">Total Volume</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><span>🏦</span></div>
            <div className="stat-value">₦{totalBalance.toLocaleString()}</div>
            <div className="stat-label">Total Deposits</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            Users
          </button>
          <button className={`tab-btn ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>
            Transactions
          </button>
        </div>

        {/* Search */}
        <input
          className="search-bar"
          placeholder={tab === 'users' ? 'Search users...' : 'Search transactions...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p style={{ color: '#888', fontSize: 14 }}>Loading...</p>
        ) : tab === 'users' ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Account No.</th>
                  <th>Balance</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.accountNumber}</td>
                    <td>
                      {editingBalance === u._id ? (
                        <div className="balance-edit">
                          <input
                            type="number"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            placeholder={u.balance}
                          />
                          <button className="btn-sm save" onClick={() => handleSaveBalance(u._id)}>Save</button>
                          <button className="btn-sm edit" onClick={() => setEditingBalance(null)}>✕</button>
                        </div>
                      ) : (
                        <span>₦{u.balance.toLocaleString()}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.isAdmin ? 'admin' : 'user'}`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                      {u.isFrozen && <span className="badge" style={{ background: '#fff0f0', color: '#e53e3e', marginLeft: 4 }}>Frozen</span>}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-sm edit" onClick={() => { setEditingBalance(u._id); setNewBalance(u.balance); }}>Edit Balance</button>
                        <button className="btn-sm" style={{ background: u.isFrozen ? '#f0fff4' : '#fff0f0', color: u.isFrozen ? '#38a169' : '#e53e3e' }}
                          onClick={() => handleFreezeUser(u._id, u.isFrozen)}>
                          {u.isFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                        <button className="btn-sm delete" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((t) => (
                  <tr key={t._id}>
                    <td>{t.sender?.fullName}</td>
                    <td>{t.receiver?.fullName}</td>
                    <td>₦{t.amount.toLocaleString()}</td>
                    <td>{t.note || '—'}</td>
                    <td>
                      <span className={`badge ${t.status}`}>{t.status}</span>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
