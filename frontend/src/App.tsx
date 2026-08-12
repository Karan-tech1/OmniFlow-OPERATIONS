import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api';
import type { User } from './types';
import { Login } from './pages/Login';
import { Shell } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Challans } from './pages/Challans';
import { FollowUps } from './pages/FollowUps';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('omniflow_token') || localStorage.getItem('nexus_token');
    if (!token) return setLoading(false);
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.data))
      .catch(() => {
        const cached = localStorage.getItem('omniflow_user') || localStorage.getItem('nexus_user');
        if (cached) setUser(JSON.parse(cached));
        else {
          localStorage.removeItem('omniflow_token');
          localStorage.removeItem('nexus_token');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-loader">Loading OmniFlow…</div>;

  if (!user)
    return (
      <Login
        onLogin={(u) => {
          localStorage.setItem('omniflow_user', JSON.stringify(u));
          setUser(u);
        }}
      />
    );

  return (
    <Shell
      user={user}
      onLogout={() => {
        localStorage.removeItem('omniflow_token');
        localStorage.removeItem('omniflow_user');
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        setUser(null);
      }}
    >
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers user={user} />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="products" element={<Products user={user} />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="challans" element={<Challans user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
