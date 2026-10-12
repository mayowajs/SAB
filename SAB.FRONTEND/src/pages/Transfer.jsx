import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { Sidebar } from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/auth.css';
import '../styles/transfer.css';

export const Transfer = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [tab, setTab] = useState('sab');

  // SAB transfer state
  const [sabForm, setSabForm] = useState({ accountNumber: location.state?.accountNumber || '', amount: '', note: '' });
  const [recipient, setRecipient] = useState(location.state ? { fullName: location.state.fullName, accountNumber: location.state.accountNumber } : null);
  const [recipientError, setRecipientError] = useState('');
  const debounceRef = useRef(null);
  const [nameSearch, setNameSearch] = useState('');
  const [nameResults, setNameResults] = useState([]);
  const nameDebounceRef = useRef(null);

  // Inter-bank state
  const [banks, setBanks] = useState([]);
  const [ibForm, setIbForm] = useState({ bankCode: '', bankName: '', accountNumber: '', amount: '', note: '' });
  const [accountName, setAccountName] = useState('');
  const [accountNameError, setAccountNameError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const ibDebounceRef = useRef(null);

  // Shared
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load banks once
  useEffect(() => {
    if (user.isAdmin) return;
    api.get('/transactions/banks').then((data) => {
      if (Array.isArray(data)) setBanks(data);
    });
  }, [user.isAdmin]);

  // SAB name search
  useEffect(() => {
    setNameResults([]);
    if (nameSearch.trim().length < 2) return;
    clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(async () => {
      const res = await api.get(`/transactions/search-users?name=${encodeURIComponent(nameSearch)}`);
      if (Array.isArray(res)) setNameResults(res);
    }, 400);
  }, [nameSearch]);

  const selectNameResult = (u) => {
    setSabForm({ ...sabForm, accountNumber: u.accountNumber });
    setRecipient({ fullName: u.fullName, accountNumber: u.accountNumber });
    setNameSearch('');
    setNameResults([]);
  };

  // SAB recipient auto-lookup
  useEffect(() => {
    setRecipient(null); setRecipientError('');
    if (sabForm.accountNumber.length !== 10) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await api.get(`/transactions/verify/${sabForm.accountNumber}`);
      if (res.fullName) setRecipient(res);
      else setRecipientError(res.message || 'Account not found');
    }, 500);
  }, [sabForm.accountNumber]);

  // Inter-bank account name lookup
  useEffect(() => {
    setAccountName(''); setAccountNameError('');
    setVerifying(false);
    let isCurrentLookup = true;
    if (ibForm.accountNumber.length !== 10 || !ibForm.bankCode) {
      return () => { isCurrentLookup = false; };
    }

    ibDebounceRef.current = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await api.post('/transactions/verify-bank-account', {
          accountNumber: ibForm.accountNumber,
          bankCode: ibForm.bankCode,
        });
        if (!isCurrentLookup) return;
        if (res.accountName) setAccountName(res.accountName);
        else setAccountNameError(res.message || 'Could not verify account');
      } catch (err) {
        if (isCurrentLookup) setAccountNameError(err.message || 'Could not verify account');
      } finally {
        if (isCurrentLookup) setVerifying(false);
      }
    }, 700);

    return () => {
      isCurrentLookup = false;
      clearTimeout(ibDebounceRef.current);
    };
  }, [ibForm.accountNumber, ibForm.bankCode]);

  const handleBankChange = (e) => {
    const selected = banks.find((b) => b.code === e.target.value);
    setIbForm({ ...ibForm, bankCode: e.target.value, bankName: selected?.name || '' });
    setAccountName(''); setAccountNameError('');
  };

  // SAB submit
  const handleSabSubmit = (e) => {
    e.preventDefault();
    if (!recipient) return toast('Enter a valid SAB account number', 'error');
    if (!sabForm.amount || Number(sabForm.amount) <= 0) return toast('Enter a valid amount', 'error');
    if (Number(sabForm.amount) > user.balance) return toast('Insufficient balance', 'error');
    setShowConfirm(true);
  };

  // Inter-bank submit
  const handleIbSubmit = (e) => {
    e.preventDefault();
    if (!accountName) return toast('Verify the account number first', 'error');
    if (!ibForm.amount || Number(ibForm.amount) <= 0) return toast('Enter a valid amount', 'error');
    if (Number(ibForm.amount) > user.balance) return toast('Insufficient balance', 'error');
    setShowConfirm(true);
  };

  // Confirm SAB transfer
  const handleSabConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.post('/transactions/transfer', {
        accountNumber: sabForm.accountNumber,
        amount: Number(sabForm.amount),
        note: sabForm.note,
      });
      if (res.message === 'Transfer successful') {
        updateUser({ ...user, balance: res.balance });
        setReceipt({ ...res.transaction, recipientName: recipient.fullName, recipientAccount: recipient.accountNumber, type: 'internal' });
        api.post('/auth/beneficiaries', { fullName: recipient.fullName, accountNumber: recipient.accountNumber }).catch(() => {});
        setSabForm({ accountNumber: '', amount: '', note: '' });
        setRecipient(null);
      } else {
        toast(res.message || 'Transfer failed', 'error');
      }
    } catch (err) {
      toast(err.message || 'Transfer failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Confirm inter-bank transfer
  const handleIbConfirm = async () => {
    const res = await api.post('/transactions/interbank-transfer', {
      accountNumber: ibForm.accountNumber,
      bankCode: ibForm.bankCode,
      bankName: ibForm.bankName,
      accountName,
      amount: Number(ibForm.amount),
      note: ibForm.note,
    });
    setLoading(false);
    setShowConfirm(false);
    if (res.transaction) {
      updateUser({ ...user, balance: res.balance });
      setReceipt({ ...res.transaction, recipientName: accountName, recipientAccount: ibForm.accountNumber, type: 'interbank', status: res.status });
      setIbForm({ bankCode: '', bankName: '', accountNumber: '', amount: '', note: '' });
      setAccountName('');
      toast(res.status === 'success' ? 'Transfer successful!' : 'Transfer initiated — processing', res.status === 'success' ? 'success' : 'info');
    } else {
      toast(res.message || 'Transfer failed', 'error');
    }
  };

  const currentAmount = tab === 'sab' ? sabForm.amount : ibForm.amount;
  const currentRecipientName = tab === 'sab' ? recipient?.fullName : accountName;
  const currentRecipientAcc = tab === 'sab' ? recipient?.accountNumber : ibForm.accountNumber;
  const currentBank = tab === 'interbank' ? ibForm.bankName : 'SAB ➤➤';

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <p className="page-title">Transfer Money</p>

        <div className="transfer-stats">
          <div className="transfer-stat">
            <label>Available Balance</label>
            <p>₦{user.balance.toLocaleString()}</p>
          </div>
          <div className="transfer-stat">
            <label>Your Account</label>
            <p style={{ fontSize: 15 }}>{user.accountNumber}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="transfer-tabs">
          <button className={tab === 'sab' ? 'active' : ''} onClick={() => setTab('sab')}>SAB to SAB</button>
          {!user.isAdmin && (
            <button className={tab === 'interbank' ? 'active' : ''} onClick={() => setTab('interbank')}>Other Banks</button>
          )}
        </div>

        {user.isAdmin && <p className="field-hint">Presentation wallet: virtual funds for SAB-to-SAB transfers only. Balance refills when you sign in.</p>}

        <div className="section-card" style={{ maxWidth: 500 }}>

          {/* SAB Transfer */}
          {tab === 'sab' && (
            <form onSubmit={handleSabSubmit}>
              <div className="form-group">
                <div className="field">
                  <label>Search by Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      placeholder="Type a name to search..."
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      autoComplete="off"
                    />
                    {nameResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        {nameResults.map((u) => (
                          <div key={u._id} onClick={() => selectNameResult(u)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {u.fullName[0]}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 14 }}>{u.fullName}</p>
                              <p style={{ fontSize: 12, color: '#999' }}>{u.accountNumber}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="field">
                  <label>Recipient Account Number</label>
                  <input
                    placeholder="Enter 10-digit SAB account number"
                    value={sabForm.accountNumber}
                    onChange={(e) => setSabForm({ ...sabForm, accountNumber: e.target.value })}
                    maxLength={10}
                    required
                  />
                  {recipient && (
                    <div className="recipient-preview">
                      <div className="recipient-avatar">{recipient.fullName[0]}</div>
                      <div>
                        <p className="recipient-name">{recipient.fullName}</p>
                        <p className="recipient-acc">SAB · {recipient.accountNumber}</p>
                      </div>
                    </div>
                  )}
                  {recipientError && <p className="field-error">{recipientError}</p>}
                </div>
                <div className="field">
                  <label>Amount (₦)</label>
                  <input type="number" placeholder="0.00" value={sabForm.amount}
                    onChange={(e) => setSabForm({ ...sabForm, amount: e.target.value })} min="1" required />
                </div>
                <div className="field">
                  <label>Note (optional)</label>
                  <input placeholder="What's this for?" value={sabForm.note}
                    onChange={(e) => setSabForm({ ...sabForm, note: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={!recipient || loading}>Continue</button>
            </form>
          )}

          {/* Inter-bank Transfer */}
          {tab === 'interbank' && (
            <form onSubmit={handleIbSubmit}>
              <div className="form-group">
                <div className="field">
                  <label>Select Bank</label>
                  <select value={ibForm.bankCode} onChange={handleBankChange} required>
                    <option value="">-- Choose bank --</option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Account Number</label>
                  <input placeholder="10-digit account number" value={ibForm.accountNumber}
                    onChange={(e) => setIbForm({ ...ibForm, accountNumber: e.target.value })}
                    maxLength={10} required />
                  {verifying && <p className="field-hint">Verifying account...</p>}
                  {accountName && (
                    <div className="recipient-preview">
                      <div className="recipient-avatar">{accountName[0]}</div>
                      <div>
                        <p className="recipient-name">{accountName}</p>
                        <p className="recipient-acc">{ibForm.bankName} · {ibForm.accountNumber}</p>
                      </div>
                    </div>
                  )}
                  {accountNameError && <p className="field-error">{accountNameError}</p>}
                </div>
                <div className="field">
                  <label>Amount (₦)</label>
                  <input type="number" placeholder="0.00" value={ibForm.amount}
                    onChange={(e) => setIbForm({ ...ibForm, amount: e.target.value })} min="1" required />
                </div>
                <div className="field">
                  <label>Note (optional)</label>
                  <input placeholder="What's this for?" value={ibForm.note}
                    onChange={(e) => setIbForm({ ...ibForm, note: e.target.value })} />
                </div>
              </div>
              <div className="interbank-notice">
                ⚡ Powered by Paystack · Transfers may take a few minutes
              </div>
              <button type="submit" className="btn-primary" disabled={!accountName || loading}>Continue</button>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Confirm Transfer</p>
            <p className="modal-subtitle">Please review before sending</p>
            <div className="modal-amount">₦{Number(currentAmount).toLocaleString()}</div>
            <div className="modal-row"><label>To</label><span>{currentRecipientName}</span></div>
            <div className="modal-row"><label>Account</label><span>{currentRecipientAcc}</span></div>
            <div className="modal-row"><label>Bank</label><span>{currentBank}</span></div>
            <div className="modal-row"><label>Note</label><span>{(tab === 'sab' ? sabForm.note : ibForm.note) || '—'}</span></div>
            <div className="modal-row"><label>New Balance</label><span>₦{(user.balance - Number(currentAmount)).toLocaleString()}</span></div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ width: 'auto' }}
                onClick={() => {
                  setShowConfirm(false);
                  if (user.isAdmin) {
                    handleSabConfirm();
                    return;
                  }
                  setPinValue('');
                  setPinError('');
                  setShowPin(true);
                }}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPin && (
        <div className="modal-overlay" onClick={() => setShowPin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 12 }}>🔐</div>
            <p className="modal-title" style={{ textAlign: 'center' }}>Enter Transaction PIN</p>
            <p className="modal-subtitle" style={{ textAlign: 'center' }}>Enter your 4-digit PIN to authorize this transfer</p>
            <div className="field" style={{ marginBottom: 8 }}>
              <input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pinValue}
                onChange={(e) => { setPinValue(e.target.value); setPinError(''); }}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
                autoFocus
              />
              {pinError && <p className="field-error" style={{ textAlign: 'center' }}>{pinError}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowPin(false)}>Cancel</button>
              <button className="btn-primary" style={{ width: 'auto' }} disabled={loading || pinValue.length !== 4}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const verify = await api.post('/auth/verify-pin', { pin: pinValue });
                    if (!verify.valid) {
                      setPinError(verify.message || 'Incorrect PIN');
                      return;
                    }
                    setShowPin(false);
                    tab === 'sab' ? await handleSabConfirm() : await handleIbConfirm();
                  } catch (err) {
                    toast(err.message || 'Transfer failed', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}>
                {loading ? <><span className="spinner" />Verifying...</> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="modal-overlay" onClick={() => setReceipt(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-icon">{receipt.status === 'pending' ? '⏳' : '✅'}</div>
            <p className="modal-title" style={{ textAlign: 'center' }}>
              {receipt.status === 'pending' ? 'Transfer Processing...' : 'Transfer Successful!'}
            </p>
            <p className="receipt-ref">REF: {receipt.reference}</p>
            <div className="modal-amount" style={{ color: receipt.status === 'pending' ? '#d97706' : '#38a169' }}>
              ₦{receipt.amount?.toLocaleString()}
            </div>
            <div className="modal-row"><label>To</label><span>{receipt.recipientName}</span></div>
            <div className="modal-row"><label>Account</label><span>{receipt.recipientAccount}</span></div>
            {receipt.type === 'interbank' && <div className="modal-row"><label>Bank</label><span>{receipt.bankName}</span></div>}
            <div className="modal-row"><label>Note</label><span>{receipt.note || '—'}</span></div>
            <div className="modal-row"><label>Date</label><span>{new Date(receipt.createdAt).toLocaleString()}</span></div>
            <div className="modal-row">
              <label>Status</label>
              <span style={{ color: receipt.status === 'pending' ? '#d97706' : '#38a169' }}>
                {receipt.status === 'pending' ? '⏳ Processing' : '✓ Success'}
              </span>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setReceipt(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
