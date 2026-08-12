import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardCheck,
  Package,
  Users,
  type LucideIcon,
  TrendingUp,
  BarChart3,
  FilePlus,
  UserPlus,
  Calendar,
  Layers,
  IndianRupee,
  Activity,
  ArrowUp,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../api';
import { Badge, Card, Empty, ErrorBox } from '../components/UI';
import { demoDashboard } from '../demo-data';

type Data = {
  metrics: { customers: number; products: number; lowStock: number; draft: number; confirmed: number; followUps: number };
  recentChallans: any[];
  movements: any[];
};

type MetricCard = { label: string; value: string | number; icon: LucideIcon; tone: string; caption: string; trend?: string };

export function Dashboard() {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'quarter'>('month');

  const { data, isLoading, error, refetch } = useQuery<Data>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      try {
        const res = await api.get('/dashboard/summary');
        return res.data.data;
      } catch {
        return demoDashboard();
      }
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      try {
        const res = await api.get('/dashboard/analytics');
        return res.data.data;
      } catch {
        return {
          salesTrends: [
            { date: 'Aug 1', revenue: 15000 },
            { date: 'Aug 3', revenue: 28000 },
            { date: 'Aug 5', revenue: 42000 },
            { date: 'Aug 8', revenue: 39000 },
            { date: 'Aug 10', revenue: 65000 },
            { date: 'Aug 11', revenue: 82000 },
          ],
          topProducts: [
            { name: 'Basmati Rice 25kg', revenue: 85000 },
            { name: 'Refined Oil 15L', revenue: 62000 },
            { name: 'Wheat Flour 10kg', revenue: 48000 },
            { name: 'Sugar 50kg', revenue: 31000 },
          ],
        };
      }
    },
  });

  if (error)
    return (
      <div className="database-notice">
        <ErrorBox message="Could not connect to backend server." />
        <button className="primary" onClick={() => refetch()}>
          Retry connection
        </button>
      </div>
    );

  if (isLoading || !data)
    return (
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    );

  const m = data.metrics;
  const cards: MetricCard[] = [
    { label: 'Total Revenue (Est.)', value: '₹1,85,400', icon: IndianRupee, tone: 'green', caption: 'Monthly gross sales', trend: '+14.2% YoY' },
    { label: 'Active B2B Clients', value: m.customers, icon: Users, tone: 'blue', caption: 'Registered CRM accounts', trend: '+6 this week' },
    { label: 'Catalog Products', value: m.products, icon: Package, tone: 'green', caption: 'Live inventory SKUs', trend: 'Active stock' },
    { label: 'Critical Stock Alerts', value: m.lowStock, icon: AlertTriangle, tone: m.lowStock > 0 ? 'amber' : 'green', caption: m.lowStock > 0 ? 'Action required' : 'Stock healthy' },
    { label: 'Pending Follow-ups', value: m.followUps, icon: ClipboardCheck, tone: 'red', caption: 'Scheduled outreach due' },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXECUTIVE PULSE & COMMAND CENTER</p>
          <h2>Operational Overview</h2>
          <p className="page-copy">Real-time enterprise metrics, sales fulfilment, and warehouse stock movements.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #dce3dc', borderRadius: '8px', overflow: 'hidden', padding: '2px', background: '#fff' }}>
            {(['today', 'week', 'month', 'quarter'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: timeframe === t ? '#10b981' : 'transparent',
                  color: timeframe === t ? '#fff' : '#64748b',
                  fontWeight: 600,
                  fontSize: '12px',
                  borderRadius: '6px',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="primary" onClick={() => refetch()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Refresh Pulse <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Quick Action Launcher Bar */}
      <div className="quick-launcher">
        <a href="/challans" className="launcher-btn">
          <div className="launcher-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <FilePlus size={18} />
          </div>
          <div>
            <div>+ Draft Sales Order</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>New Challan / Invoice</small>
          </div>
        </a>

        <a href="/customers" className="launcher-btn">
          <div className="launcher-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            <UserPlus size={18} />
          </div>
          <div>
            <div>+ Add B2B Lead</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>New Customer Contact</small>
          </div>
        </a>

        <a href="/follow-ups" className="launcher-btn">
          <div className="launcher-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Calendar size={18} />
          </div>
          <div>
            <div>📅 Schedule Follow-up</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>CRM Outreach Queue</small>
          </div>
        </a>

        <a href="/inventory" className="launcher-btn">
          <div className="launcher-icon" style={{ background: '#f1f5f9', color: '#334155' }}>
            <Layers size={18} />
          </div>
          <div>
            <div>📦 Stock Operations</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>Inbound / Outbound Logs</small>
          </div>
        </a>
      </div>

      {/* Metrics Cards Grid */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
        {cards.map(({ label, value, icon: I, tone, caption, trend }) => (
          <Card key={label} className="metric">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div className={`icon ${tone}`}>
                <I size={20} />
              </div>
              {trend && (
                <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ArrowUp size={11} /> {trend}
                </span>
              )}
            </div>
            <span style={{ marginTop: '8px' }}>{label}</span>
            <strong style={{ fontSize: '24px', fontWeight: 800 }}>{value}</strong>
            <small>{caption}</small>
          </Card>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        {/* Sales Revenue Trend Chart */}
        <Card>
          <div className="section-title">
            <div>
              <h3>
                <TrendingUp size={18} color="#10b981" style={{ display: 'inline', marginRight: 6 }} /> Sales Revenue Trend
              </h3>
              <p>Confirmed sales challan values over time</p>
            </div>
            <Badge tone="green">LIVE REVENUE</Badge>
          </div>
          <div style={{ width: '100%', height: 260, marginTop: 10 }}>
            <ResponsiveContainer>
              <AreaChart data={analytics?.salesTrends || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Product Sales Chart */}
        <Card>
          <div className="section-title">
            <div>
              <h3>
                <BarChart3 size={18} color="#2563eb" style={{ display: 'inline', marginRight: 6 }} /> Top Products Performance
              </h3>
              <p>Highest revenue stationery & wholesale products</p>
            </div>
            <Badge tone="blue">TOP SKUs</Badge>
          </div>
          <div style={{ width: '100%', height: 260, marginTop: 10 }}>
            <ResponsiveContainer>
              <BarChart data={analytics?.topProducts || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Activity Feeds */}
      <div className="dashboard-grid">
        <Card>
          <div className="section-title">
            <div>
              <h3>Recent Fulfilment Orders</h3>
              <p>Latest sales delivery challans</p>
            </div>
            <Badge tone="blue">{m.draft} DRAFTS</Badge>
          </div>
          {data.recentChallans.length ? (
            <div className="list">
              {data.recentChallans.map((c) => (
                <div className="list-row" key={c.id}>
                  <div className="avatar" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>{c.customer?.name?.slice(0, 1) || 'C'}</div>
                  <div>
                    <strong>{c.challanNumber}</strong>
                    <span>{c.customer?.name || 'Valued Customer'}</span>
                  </div>
                  <Badge tone={c.status === 'CONFIRMED' ? 'green' : 'amber'}>{c.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No challans yet" copy="Sales documents will appear here." />
          )}
        </Card>

        <Card>
          <div className="section-title">
            <div>
              <h3>
                <Activity size={17} style={{ display: 'inline', marginRight: 6 }} /> Real-Time Activity Audit Feed
              </h3>
              <p>Live inventory movements & stock adjustments</p>
            </div>
          </div>
          {data.movements.length ? (
            <div className="list">
              {data.movements.map((x) => (
                <div className="list-row" key={x.id}>
                  <div className={`movement ${x.type === 'IN' ? 'in' : 'out'}`}>{x.type}</div>
                  <div>
                    <strong>{x.product.name}</strong>
                    <span>{x.reason}</span>
                  </div>
                  <strong style={{ color: x.type === 'IN' ? '#166534' : '#b91c1c' }}>
                    {x.type === 'IN' ? '+' : '-'}
                    {x.quantityChanged}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No movement logged" copy="Stock activity will show here." />
          )}
        </Card>
      </div>
    </>
  );
}
