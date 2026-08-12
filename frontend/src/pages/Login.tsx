import { useState } from 'react';
import { ArrowRight, LockKeyhole, UserPlus, Shield, ShoppingBag, Boxes, Receipt, Zap, PackageCheck, CreditCard, Users } from 'lucide-react';
import { api } from '../api';
import type { Role, User } from '../types';
import { OmniFlowLogo } from '../components/OmniFlowLogo';

export function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Demo@12345');
  const [role, setRole] = useState<Role>('ADMIN');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const demoAccounts = [
    { label: 'Admin', email: 'admin@example.com', role: 'ADMIN' as Role, icon: Shield, color: '#10b981' },
    { label: 'Sales', email: 'sales@example.com', role: 'SALES' as Role, icon: ShoppingBag, color: '#3b82f6' },
    { label: 'Warehouse', email: 'warehouse@example.com', role: 'WAREHOUSE' as Role, icon: Boxes, color: '#f59e0b' },
    { label: 'Accounts', email: 'accounts@example.com', role: 'ACCOUNTS' as Role, icon: Receipt, color: '#8b5cf6' },
  ];

  const handleSelectDemo = (demo: typeof demoAccounts[0]) => {
    setMode('login');
    setEmail(demo.email);
    setPassword('Demo@12345');
    setRole(demo.role);
    setError('');
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'login') {
        const r = await api.post('/auth/login', { email, password });
        localStorage.setItem('omniflow_token', r.data.data.token);
        onLogin(r.data.data.user);
      } else {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setBusy(false);
          return;
        }
        const r = await api.post('/auth/register', { name, email, password, role });
        localStorage.setItem('omniflow_token', r.data.data.token);
        onLogin(r.data.data.user);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Action failed. Check your details and try again.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
  };

  return (
    <div className="login">
      <div className="login-panel">
        <div className="login-brand">
          <OmniFlowLogo size={34} /> OmniFlow
        </div>
        <p className="eyebrow">OPERATIONS PORTAL</p>
        <h1>{mode === 'login' ? 'Keep every operation in motion.' : 'Create a new staff account.'}</h1>
        <p className="muted">
          {mode === 'login'
            ? 'One workspace for customers, stock and sales fulfilment.'
            : 'Register a new employee or role account to access the workspace.'}
        </p>

        {/* Quick Demo Role Selector */}
        <div style={{ margin: '18px 0 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>
            QUICK LOGIN ROLES:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              const isSelected = email.toLowerCase() === acc.email.toLowerCase();
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${acc.color}` : '1px solid #e2e8f0',
                    background: isSelected ? '#f8fafc' : '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={acc.color} />
                  <span>{acc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Full Name *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="John Doe"
                required
              />
            </label>
          )}

          <label>
            Work email *
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="user@company.com"
              required
            />
          </label>

          <label>
            Password *
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Minimum 8 characters"
              required
            />
          </label>

          {mode === 'register' && (
            <label>
              Operational Role *
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="ADMIN">Administrator</option>
                <option value="SALES">Sales Representative</option>
                <option value="WAREHOUSE">Warehouse Manager</option>
                <option value="ACCOUNTS">Accounts / Finance</option>
              </select>
            </label>
          )}

          {error && <div className="error">{error}</div>}

          <button className="primary full" disabled={busy}>
            {busy ? (
              mode === 'login' ? 'Signing in…' : 'Creating account…'
            ) : mode === 'login' ? (
              <>
                Sign in <ArrowRight size={18} />
              </>
            ) : (
              <>
                Create account <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                style={{ background: 'none', border: 'none', color: '#0f766e', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Register a new account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={toggleMode}
                style={{ background: 'none', border: 'none', color: '#0f766e', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Sign in here
              </button>
            </p>
          )}
        </div>

        {mode === 'login' && (
          <div className="demo">
            <LockKeyhole size={16} /> Password for prefilled roles is <strong>Demo@12345</strong>
          </div>
        )}
      </div>

      <div className="login-art">
        <div className="art-copy">
          <span>01 — OMNIFLOW ENTERPRISE</span>
          <h2>Clarity at every stage of fulfillment.</h2>
          <p>
            Streamline multi-warehouse inventory tracking, customer CRM leads, automated sales challans, and real-time payment ledgers in one seamless workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
