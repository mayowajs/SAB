import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/card.css';

export const Card = () => {
  const { user } = useAuth();
  const [flipped, setFlipped] = useState(false);

  // Derive card number from account number for display
  const acc = user.accountNumber;
  const cardNumber = `${acc.slice(0,4)} ${acc.slice(4,8)} ${acc.slice(8,10)}** ****`;
  const cvv = acc.slice(0, 3);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <p className="page-title">My Card</p>
        <p className="card-hint">Click the card to flip it</p>

        <div className={`card-wrap ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
          <div className="card-inner">
            {/* Front */}
            <div className="card-front">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-chip">💳</span>
                <span className="card-bank">SAB ➤➤</span>
              </div>
              <p className="card-number">{cardNumber}</p>
              <div className="card-bottom">
                <div>
                  <p className="card-expiry">Expires<span>12/28</span></p>
                </div>
                <p className="card-name">{user.fullName}</p>
              </div>
            </div>

            {/* Back */}
            <div className="card-back">
              <div className="card-back-strip" />
              <div className="card-cvv-wrap">
                <p className="card-cvv-label">CVV</p>
                <p className="card-cvv">{cvv}</p>
              </div>
              <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                Silver Age Bank — Authorized use only
              </p>
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className="card-details-grid">
          <div className="card-detail-item">
            <label>Card Type</label>
            <p>Virtual Debit</p>
          </div>
          <div className="card-detail-item">
            <label>Status</label>
            <p style={{ color: '#38a169' }}>● Active</p>
          </div>
          <div className="card-detail-item">
            <label>Account Number</label>
            <p>{user.accountNumber}</p>
          </div>
          <div className="card-detail-item">
            <label>Card Holder</label>
            <p>{user.fullName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
