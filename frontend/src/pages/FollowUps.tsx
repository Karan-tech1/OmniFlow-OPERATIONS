import { AlertTriangle, CalendarClock, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { loadDemoCustomers, saveDemoCustomers } from '../demo-data';
import { Badge, Card, Empty } from '../components/UI';
import type { Customer } from '../types';

function FollowupTable({
  items,
  onSchedule,
}: {
  items: Customer[];
  onSchedule?: (c: Customer) => void;
}) {
  if (!items.length) return <Empty title="No follow-ups in this group" copy="Schedule one from a customer record or click Schedule Follow-up above." />;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Business</th>
            <th>Mobile</th>
            <th>Type</th>
            <th>Follow-up date</th>
            <th>Action / Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>
                <strong>{c.name}</strong>
              </td>
              <td>{c.businessName}</td>
              <td className="mono">{c.mobile}</td>
              <td>
                <Badge tone="blue">{c.type}</Badge>
              </td>
              <td>
                {c.nextFollowUpAt
                  ? new Date(c.nextFollowUpAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span>{c.notes || 'Routine sales outreach & requirement check'}</span>
                  {onSchedule && (
                    <button
                      type="button"
                      onClick={() => onSchedule(c)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FollowUps() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState('');

  const { data: serverCustomers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers');
        const list = res.data.data.items;
        return Array.isArray(list) && list.length > 0 ? list : loadDemoCustomers();
      } catch {
        return loadDemoCustomers();
      }
    },
  });

  // Combine server customers and fallback follow-ups
  const customers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list = [...serverCustomers];
    if (list.length > 0 && !list.some((c) => c.nextFollowUpAt)) {
      if (list[0]) list[0] = { ...list[0], nextFollowUpAt: new Date(today.getTime() - 86400000).toISOString() }; // Overdue
      if (list[1]) list[1] = { ...list[1], nextFollowUpAt: today.toISOString() }; // Today
      if (list[2]) list[2] = { ...list[2], nextFollowUpAt: new Date(today.getTime() + 2 * 86400000).toISOString() }; // Upcoming
      if (list[3]) list[3] = { ...list[3], nextFollowUpAt: new Date(today.getTime() + 4 * 86400000).toISOString() }; // Upcoming
    }
    return list;
  }, [serverCustomers]);

  const { overdue, today, upcoming } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now.getTime() + 86400000);
    const next7 = new Date(now.getTime() + 7 * 86400000);

    return {
      overdue: customers.filter((c) => c.nextFollowUpAt && new Date(c.nextFollowUpAt) < now),
      today: customers.filter((c) => c.nextFollowUpAt && new Date(c.nextFollowUpAt) >= now && new Date(c.nextFollowUpAt) < tomorrow),
      upcoming: customers.filter((c) => c.nextFollowUpAt && new Date(c.nextFollowUpAt) >= tomorrow && new Date(c.nextFollowUpAt) <= next7),
    };
  }, [customers]);

  const scheduleMutation = useMutation({
    mutationFn: async ({ target, date, noteStr }: { target: Customer; date: string; noteStr: string }) => {
      const payload = {
        ...target,
        nextFollowUpAt: new Date(date).toISOString(),
        notes: noteStr,
      };
      try {
        await api.put(`/customers/${target.id}`, payload);
      } catch {}
      return payload;
    },
    onSuccess: (updatedPayload) => {
      const updatedList = customers.map((c) => (c.id === updatedPayload.id ? { ...c, ...updatedPayload } : c));
      saveDemoCustomers(updatedList);
      queryClient.setQueryData(['customers'], updatedList);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
      setFollowUpDate('');
      setNotes('');
      setNotice(`Follow-up scheduled for ${updatedPayload.name} on ${new Date(updatedPayload.nextFollowUpAt).toLocaleDateString()}`);
    },
  });

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !followUpDate) return;
    scheduleMutation.mutate({ target: selectedCustomer, date: followUpDate, noteStr: notes });
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CRM SCHEDULE</p>
          <h2>Follow-ups</h2>
          <p className="page-copy">Prioritize overdue conversations and scheduled customer outreach.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="followup-counters" style={{ display: 'flex', gap: '6px' }}>
            <Badge tone="red">{overdue.length} OVERDUE</Badge>
            <Badge tone="amber">{today.length} TODAY</Badge>
            <Badge tone="blue">{upcoming.length} UPCOMING</Badge>
          </div>
          {customers.length > 0 && (
            <button
              className="primary"
              onClick={() => {
                const target = customers[0];
                setSelectedCustomer(target);
                setFollowUpDate(new Date().toISOString().split('T')[0]);
                setNotes(target?.notes || '');
              }}
            >
              <Plus size={17} /> Schedule Follow-up
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div style={{ padding: '10px 14px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
          {notice}
        </div>
      )}

      <Card className="followup-card overdue-card" style={{ marginBottom: '20px' }}>
        <div className="section-title">
          <div>
            <h3>
              <AlertTriangle size={17} color="#dc2626" /> Overdue follow-ups
            </h3>
            <p>These customer conversations require immediate attention.</p>
          </div>
        </div>
        <FollowupTable
          items={overdue}
          onSchedule={(c) => {
            setSelectedCustomer(c);
            setFollowUpDate(c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setNotes(c.notes || '');
          }}
        />
      </Card>

      <Card className="followup-card" style={{ marginBottom: '20px' }}>
        <div className="section-title">
          <div>
            <h3>
              <CalendarClock size={17} color="#d97706" /> Today's follow-ups
            </h3>
            <p>Scheduled for outreach today.</p>
          </div>
        </div>
        <FollowupTable
          items={today}
          onSchedule={(c) => {
            setSelectedCustomer(c);
            setFollowUpDate(c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setNotes(c.notes || '');
          }}
        />
      </Card>

      <Card className="followup-card">
        <div className="section-title">
          <div>
            <h3>
              <CalendarClock size={17} color="#2563eb" /> Upcoming - next 7 days
            </h3>
            <p>Plan your next customer touch points.</p>
          </div>
        </div>
        <FollowupTable
          items={upcoming}
          onSchedule={(c) => {
            setSelectedCustomer(c);
            setFollowUpDate(c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setNotes(c.notes || '');
          }}
        />
      </Card>

      {selectedCustomer && (
        <div className="customer-modal-backdrop">
          <div className="customer-modal" style={{ width: '480px' }}>
            <div className="customer-modal-header">
              <div>
                <p className="eyebrow">CRM SCHEDULER</p>
                <h3>Schedule Follow-up</h3>
              </div>
              <button onClick={() => setSelectedCustomer(null)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveSchedule} className="customer-modal-body">
              <div style={{ display: 'grid', gap: '14px' }}>
                <label>
                  Select Customer
                  <select
                    value={selectedCustomer.id}
                    onChange={(e) => {
                      const found = customers.find((c) => c.id === e.target.value);
                      if (found) {
                        setSelectedCustomer(found);
                        setNotes(found.notes || '');
                      }
                    }}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.businessName}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Follow-up Date
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Conversation Notes / Agenda
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="E.g., Call client regarding monthly stationery requirement and quote approval."
                  />
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" onClick={() => setSelectedCustomer(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={scheduleMutation.isPending}>
                  {scheduleMutation.isPending ? 'Saving…' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
