import { Boxes, CalendarClock, ClipboardList, LayoutDashboard, LogOut, Menu, Package, Users, X, Sun, Moon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { OmniFlowLogo } from './OmniFlowLogo';

const nav = [
  ['/', LayoutDashboard, 'Overview', ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']],
  ['/customers', Users, 'Customers', ['ADMIN', 'SALES', 'ACCOUNTS']],
  ['/follow-ups', CalendarClock, 'Follow-ups', ['ADMIN', 'SALES']],
  ['/products', Package, 'Products', ['ADMIN', 'WAREHOUSE']],
  ['/inventory', Boxes, 'Inventory', ['ADMIN', 'WAREHOUSE']],
  ['/challans', ClipboardList, 'Sales challans', ['ADMIN', 'SALES', 'ACCOUNTS']],
] as const;

export function Shell({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('omniflow_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omniflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <div className="shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <OmniFlowLogo size={32} />
          <div>
            OmniFlow <small>OPERATIONS</small>
          </div>
          <button className="mobile-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <div className="workspace">WORKSPACE</div>
        <nav>
          {nav
            .filter(([, , , roles]) => (roles as readonly string[]).includes(user.role))
            .map(([to, Icon, label]) => (
              <NavLink key={to} end={to === '/'} to={to} onClick={() => setOpen(false)}>
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="role-chip">{user.role}</div>
          <button onClick={onLogout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      <main>
        <header>
          <button className="menu-button" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <p className="eyebrow">OPERATIONS CENTER</p>
            <h1>Good to see you, {user.name.split(' ')[0]}.</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #dce3dc)',
                background: theme === 'dark' ? '#1c3028' : '#fff',
                color: theme === 'dark' ? '#f8fafc' : '#1e293b',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {theme === 'light' ? <Moon size={16} color="#475569" /> : <Sun size={16} color="#f59e0b" />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            <div className="profile">
              <div>{user.name.split(' ').map((v) => v[0]).join('').slice(0, 2)}</div>
              <span>
                {user.name}
                <small>{user.role.toLowerCase()}</small>
              </span>
            </div>
          </div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
