import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, SERVER_BASE_URL, api } from '../api';
import { Sidebar } from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/settings.css';
import '../styles/auth.css';

export const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user.fullName, email: user.email });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [notifications, setNotifications] = useState({ transfers: true, login: true, promotions: false });
  const [photoLoading, setPhotoLoading] = useState(false);
  const [pin, setPin] = useState({ newPin: '', confirmPin: '' });

  const handlePinSave = async (e) => {
    e.preventDefault();
    if (pin.newPin !== pin.confirmPin) return toast('PINs do not match', 'error');
    if (!/^\d{4}$/.test(pin.newPin)) return toast('PIN must be exactly 4 digits', 'error');
    const res = await api.post('/auth/set-pin', { pin: pin.newPin });
    if (res.message === 'PIN set successfully') {
      toast(user.hasPin ? 'PIN updated successfully!' : 'Transaction PIN set!', 'success');
      setPin({ newPin: '', confirmPin: '' });
      updateUser({ ...user, hasPin: true });
    } else {
      toast(res.message || 'Failed to set PIN', 'error');
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Image must be under 2MB', 'error');
    setPhotoLoading(true);
    const formData = new FormData();
    formData.append('photo', file);
    const token = localStorage.getItem('sab_token');
    const res = await fetch(`${API_BASE_URL}/auth/upload-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((r) => r.json());
    setPhotoLoading(false);
    if (res.photoUrl) {
      updateUser({ ...user, photo: res.photoUrl });
      toast('Photo updated!', 'success');
    } else {
      toast(res.message || 'Upload failed', 'error');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const res = await api.patch(`/auth/profile`, form);
    if (res.user) {
      updateUser({ ...user, fullName: res.user.fullName, email: res.user.email });
      toast('Profile updated successfully', 'success');
    } else {
      toast(res.message || 'Update failed', 'error');
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return toast('Passwords do not match', 'error');
    const res = await api.patch('/auth/password', { current: passwords.current, newPass: passwords.newPass });
    if (res.message === 'Password updated') {
      toast('Password changed successfully', 'success');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } else {
      toast(res.message || 'Failed to change password', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    await api.delete(`/auth/account`);
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <p className="page-title">Settings</p>

        <div className="settings-grid">
          {/* Profile Photo */}
          <div className="settings-section" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              {user.photo ? (
                <img src={`${SERVER_BASE_URL}${user.photo}`} alt="profile"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ebebeb' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
                  {user.fullName[0]}
                </div>
              )}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{user.fullName}</p>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>{user.email}</p>
              <label style={{ cursor: 'pointer', background: '#111', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                {photoLoading ? 'Uploading...' : '📷 Change Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} disabled={photoLoading} />
              </label>
            </div>
          </div>
          {/* Profile */}
          <div className="settings-section">
            <h3>👤 Profile</h3>
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <div className="field">
                  <label>Full Name</label>
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn-primary">Save Changes</button>
            </form>
          </div>

          {/* Change Password */}
          <div className="settings-section">
            <h3>🔒 Change Password</h3>
            <form onSubmit={handlePasswordSave}>
              <div className="form-group">
                <div className="field">
                  <label>Current Password</label>
                  <input type="password" placeholder="••••••••" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
                </div>
                <div className="field">
                  <label>New Password</label>
                  <input type="password" placeholder="••••••••" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <input type="password" placeholder="••••••••" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn-primary">Update Password</button>
            </form>
          </div>

          {/* Transaction PIN */}
          <div className="settings-section">
            <h3>🔐 Transaction PIN</h3>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
              {user.hasPin ? 'PIN is set. You can update it below.' : 'No PIN set yet. Set a 4-digit PIN to authorize transfers.'}
            </p>
            <form onSubmit={handlePinSave}>
              <div className="form-group">
                <div className="field">
                  <label>{user.hasPin ? 'New PIN' : 'Set PIN'}</label>
                  <input type="password" placeholder="••••" maxLength={4} value={pin.newPin}
                    onChange={(e) => setPin({ ...pin, newPin: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Confirm PIN</label>
                  <input type="password" placeholder="••••" maxLength={4} value={pin.confirmPin}
                    onChange={(e) => setPin({ ...pin, confirmPin: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn-primary">{user.hasPin ? 'Update PIN' : 'Set PIN'}</button>
            </form>
          </div>

          {/* Account Info */}
          <div className="settings-section">
            <h3>🏦 Account Info</h3>
            <div className="settings-row">
              <label>Account Number</label>
              <p>{user.accountNumber}</p>
            </div>
            <div className="settings-row">
              <label>Account Type</label>
              <p>Savings</p>
            </div>
            <div className="settings-row">
              <label>Member Since</label>
              <p>{new Date().getFullYear()}</p>
            </div>
            <div className="settings-row">
              <label>Status</label>
              <p style={{ color: '#38a169' }}>Active</p>
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-section">
            <h3>🔔 Notifications</h3>
            {Object.entries(notifications).map(([key, val]) => (
              <div key={key} className="settings-row">
                <label>{key.charAt(0).toUpperCase() + key.slice(1)} alerts</label>
                <button
                  className={`toggle ${val ? 'on' : ''}`}
                  onClick={() => setNotifications({ ...notifications, [key]: !val })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section" style={{ marginTop: 20, borderColor: '#fee2e2' }}>
          <h3 style={{ color: '#e53e3e' }}>⚠️ Danger Zone</h3>
          <div className="settings-row">
            <div>
              <p style={{ fontWeight: 600 }}>Delete Account</p>
              <p style={{ fontSize: 12, color: '#888' }}>Permanently delete your SAB account</p>
            </div>
            <button className="btn-danger" onClick={handleDeleteAccount}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
