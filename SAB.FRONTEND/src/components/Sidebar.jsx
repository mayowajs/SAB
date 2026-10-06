import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/transfer', icon: '💸', label: 'Transfer' },
  { to: '/transactions', icon: '📋', label: 'History' },
  { to: '/beneficiaries', icon: '👥', label: 'Saved' },
  { to: '/card', icon: '💳', label: 'Card' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">S</div>
          <div>SAB <span>➤➤</span></div>
        </div>

        {user?.photo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 20 }}>
            <img src={`http://localhost:5000${user.photo}`} alt="profile"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #333' }} />
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName.split(' ')[0]}</p>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">🛡️</span>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="sidebar-logout">
          <button className="nav-item" onClick={handleLogout}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav">
        <div className="bottom-nav-items">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="bn-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="bn-icon">🛡️</span>
              Admin
            </NavLink>
          )}
        </div>
      </div>
    </>
  );
}
