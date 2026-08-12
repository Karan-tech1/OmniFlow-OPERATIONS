import { Download, Plus, Search, X, LayoutGrid, Table, ArrowRight, Phone, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { loadDemoCustomers, saveDemoCustomers } from '../demo-data';
import type { Customer, User } from '../types';
import { Badge, Card, Empty } from '../components/UI';
import { exportToCSV } from '../utils/export';

const initial = {
  name: '',
  businessName: '',
  mobile: '',
  email: '',
  address: '',
  type: 'RETAIL',
  status: 'LEAD',
  nextFollowUpAt: '',
  notes: '',
};

export function Customers({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initial);
  const [notice, setNotice] = useState('');

  const { data: items = [] } = useQuery<Customer[]>({
    queryKey: ['customers', search, status, type],
    queryFn: async () => {
      try {
        const res = await api.get('/customers', { params: { search, status, type } });
        const list = res.data.data.items;
        return Array.isArray(list) && list.length > 0 ? list : loadDemoCustomers();
      } catch {
        return loadDemoCustomers();
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newCustomer: any) => {
      const res = await api.post('/customers', newCustomer);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowForm(false);
      setForm(initial);
      setNotice('Customer created successfully');
    },
    onError: () => {
      const customer: Customer = {
        ...form,
        id: `local-${Date.now()}`,
        nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : undefined,
      };
      const next = [customer, ...items];
      saveDemoCustomers(next);
      queryClient.setQueryData(['customers', search, status, type], next);
      setShowForm(false);
      setForm(initial);
      setNotice(`${customer.name} added to workspace.`);
    },
  });

  const handleStageChange = async (customer: Customer, newStatus: string) => {
    try {
      await api.put(`/customers/${customer.id}`, { ...customer, status: newStatus });
    } catch {}
    const updated = items.map((c) => (c.id === customer.id ? { ...c, status: newStatus as any } : c));
    saveDemoCustomers(updated);
    queryClient.setQueryData(['customers', search, status, type], updated);
    setNotice(`${customer.name} moved to ${newStatus}`);
  };

  const filtered = useMemo(
    () =>
      items.filter(
        (c) =>
          `${c.name} ${c.businessName} ${c.mobile}`.toLowerCase().includes(search.toLowerCase()) &&
          (!status || c.status === status) &&
          (!type || c.type === type)
      ),
    [items, search, status, type]
  );

  const handleExportCSV = () => {
    const exportData = filtered.map((c) => ({
      Name: c.name,
      BusinessName: c.businessName,
      Mobile: c.mobile,
      Email: c.email || '',
      Type: c.type,
      Status: c.status,
      Address: c.address || '',
      NextFollowUp: c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toLocaleDateString() : '',
    }));
    exportToCSV('Customers_List', exportData);
  };

  const update = (field: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.businessName || !/^\d{10}$/.test(form.mobile)) {
      setNotice('Enter customer name, business name, and a valid 10-digit mobile number.');
      return;
    }
    const payload = {
      ...form,
      nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : null,
    };
    createMutation.mutate(payload);
  };

  const kanbanColumns = [
    { id: 'LEAD', title: 'New Leads', color: '#f59e0b', tone: 'amber' as const },
    { id: 'ACTIVE', title: 'Active Accounts', color: '#10b981', tone: 'green' as const },
    { id: 'INACTIVE', title: 'Dormant Accounts', color: '#64748b', tone: 'neutral' as const },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CRM PIPELINE</p>
          <h2>Customers & Leads</h2>
          <p className="page-copy">Manage B2B customer relationships, deal stages, and follow-up reminders.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', border: '1px solid #dce3dc', borderRadius: '8px', overflow: 'hidden', padding: '2px', background: '#fff' }}>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'kanban' ? '#10b981' : 'transparent',
                color: viewMode === 'kanban' ? '#fff' : '#64748b',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LayoutGrid size={15} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'table' ? '#10b981' : 'transparent',
                color: viewMode === 'table' ? '#fff' : '#64748b',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Table size={15} /> Table
            </button>
          </div>

          <button type="button" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} /> Export CSV
          </button>
          {['ADMIN', 'SALES'].includes(user.role) && (
            <button className="primary" onClick={() => setShowForm(true)}>
              <Plus size={17} /> Add customer
            </button>
          )}
        </div>
      </div>

      {notice && <div className="info-note" style={{ padding: '10px 14px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>{notice}</div>}

      <Card>
        <div className="toolbar">
          <label className="search">
            <Search size={18} />
            <input placeholder="Search name, business or mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
          <span className="result-count">{filtered.length} customers</span>
        </div>

        {viewMode === 'kanban' ? (
          <div className="kanban-board" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {kanbanColumns.map((col) => {
              const colCustomers = filtered.filter((c) => c.status === col.id);
              return (
                <div key={col.id} className="kanban-col">
                  <div className="kanban-col-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                      <span>{col.title}</span>
                    </div>
                    <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      {colCustomers.length}
                    </span>
                  </div>

                  {colCustomers.length > 0 ? (
                    colCustomers.map((c) => (
                      <div key={c.id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <strong style={{ fontSize: '14px' }}>{c.name}</strong>
                          <Badge tone="blue">{c.type}</Badge>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{c.businessName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                          <Phone size={13} color="#94a3b8" />
                          <span className="mono">{c.mobile}</span>
                        </div>
                        {c.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                            <MapPin size={12} color="#94a3b8" />
                            <span>{c.address}</span>
                          </div>
                        )}

                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eff1ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: c.nextFollowUpAt && new Date(c.nextFollowUpAt) < new Date() ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                            {c.nextFollowUpAt ? `📅 ${new Date(c.nextFollowUpAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : 'No follow-up'}
                          </span>

                          {col.id === 'LEAD' && (
                            <button
                              type="button"
                              onClick={() => handleStageChange(c, 'ACTIVE')}
                              style={{ padding: '4px 8px', borderRadius: '6px', background: '#e1f4e8', color: '#166534', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              Make Active <ArrowRight size={12} />
                            </button>
                          )}
                          {col.id === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleStageChange(c, 'INACTIVE')}
                              style={{ padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            >
                              Mark Inactive
                            </button>
                          )}
                          {col.id === 'INACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleStageChange(c, 'ACTIVE')}
                              style={{ padding: '4px 8px', borderRadius: '6px', background: '#e1f4e8', color: '#166534', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>No customers in {col.title}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      <small className="cell-subtitle">{c.businessName}</small>
                    </td>
                    <td className="mono">{c.mobile}</td>
                    <td>
                      <Badge tone="blue">{c.type}</Badge>
                    </td>
                    <td>
                      <Badge tone={c.status === 'ACTIVE' ? 'green' : c.status === 'LEAD' ? 'amber' : 'neutral'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className={c.nextFollowUpAt && new Date(c.nextFollowUpAt) < new Date() ? 'overdue' : ''}>
                      {c.nextFollowUpAt
                        ? new Date(c.nextFollowUpAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No customers found" copy="Adjust your filters or add a customer." />
        )}
      </Card>

      {showForm && (
        <div className="customer-modal-backdrop">
          <div className="customer-modal">
            <div className="customer-modal-header">
              <div>
                <p className="eyebrow">NEW CUSTOMER</p>
                <h3>Add a Customer</h3>
              </div>
              <button onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={submit} className="customer-modal-body">
              <div className="form-grid">
                <label>
                  Full name
                  <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
                </label>
                <label>
                  Business name
                  <input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} required />
                </label>
                <label>
                  Mobile number
                  <input value={form.mobile} onChange={(e) => update('mobile', e.target.value)} required placeholder="10 digits" />
                </label>
                <label>
                  Email address
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                </label>
                <label>
                  Customer type
                  <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </label>
                <label>
                  Status
                  <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
                <label>
                  Next follow-up date
                  <input type="date" value={form.nextFollowUpAt} onChange={(e) => update('nextFollowUpAt', e.target.value)} />
                </label>
                <label className="full-width">
                  Address
                  <input value={form.address} onChange={(e) => update('address', e.target.value)} />
                </label>
                <label className="full-width">
                  Notes
                  <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving…' : 'Save customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
