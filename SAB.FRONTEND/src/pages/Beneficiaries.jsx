import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { Sidebar } from '../components/Sidebar';
import '../styles/dashboard.css';

export const Beneficiaries = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/beneficiaries').then((data) => {
      if (Array.isArray(data)) setBeneficiaries(data);
      setLoading(false);
    });
  }, []);

  const handleRemove = async (accountNumber) => {
    await api.delete(`/auth/beneficiaries/${accountNumber}`);
    setBeneficiaries((prev) => prev.filter((b) => b.accountNumber !== accountNumber));
    toast('Beneficiary removed', 'success');
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <p className="page-title">Beneficiaries</p>

        <div className="section-card">
          <div className="section-header">
            <h3>Saved Recipients</h3>
            <button
              onClick={() => navigate('/transfer')}
              style={{ background: '#111', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
            >
              + New Transfer
            </button>
          </div>

          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="tx-item">
                <div className="tx-left">
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f0f0f0' }} />
                  <div>
                    <div style={{ width: 130, height: 12, borderRadius: 6, background: '#f0f0f0', marginBottom: 6 }} />
                    <div style={{ width: 90, height: 10, borderRadius: 6, background: '#f5f5f5' }} />
                  </div>
                </div>
              </div>
            ))
          ) : beneficiaries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No saved beneficiaries yet</p>
              <p style={{ fontSize: 12, color: '#bbb', marginTop: 6 }}>Save recipients after a transfer to find them here</p>
            </div>
          ) : (
            beneficiaries.map((b) => (
              <div key={b.accountNumber} className="tx-item">
                <div className="tx-left">
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {b.fullName[0]}
                  </div>
                  <div>
                    <p className="tx-name">{b.fullName}</p>
                    <p className="tx-date">{b.accountNumber}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigate('/transfer', { state: { accountNumber: b.accountNumber, fullName: b.fullName } })}
                    style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}
                  >
                    Send
                  </button>
                  <button
                    onClick={() => handleRemove(b.accountNumber)}
                    style={{ background: '#fff0f0', color: '#e53e3e', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid #fecaca' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
