import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import '../styles/auth.css';

export const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [form, setForm] = useState({ email: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!token) {
        await api.post('/auth/forgot-password', { email: form.email });
        toast('If the account exists, check the backend terminal for its local reset link.', 'success');
        return;
      }

      if (form.newPassword !== form.confirm) return toast('Passwords do not match', 'error');
      if (form.newPassword.length < 8) return toast('Password must be at least 8 characters', 'error');

      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      toast('Password reset! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      toast(err.message || 'Password reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">SAB</div>
          <h1>Silver Age Bank</h1>
          <p>Secure · Reliable · Modern</p>
        </div>

        <h2>{token ? 'Choose a new password' : 'Reset Password'}</h2>
        <p className="subtitle">
          {token ? 'Enter a new password for your account' : 'Enter your email to receive a reset link'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            {!token ? (
              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Please wait...' : token ? 'Update Password' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
