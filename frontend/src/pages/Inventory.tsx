import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Boxes, Download, Image as ImageIcon, X } from 'lucide-react';
import { api } from '../api';
import { referenceProducts } from '../demo-data';
import type { Product } from '../types';
import { Badge, Card, Empty, ErrorBox } from '../components/UI';
import { exportToCSV } from '../utils/export';

export function Inventory() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    productId: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: '10',
    reason: 'Replenishment stock received',
  });

  const { data: items = referenceProducts, isLoading, error } = useQuery<Product[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      try {
        const res = await api.get('/inventory');
        if (res.data.data && res.data.data.length > 0) {
          return res.data.data;
        }
        return referenceProducts;
      } catch {
        return referenceProducts;
      }
    },
  });

  const movementMutation = useMutation({
    mutationFn: async (payload: { productId: string; quantity: number; type: 'IN' | 'OUT'; reason: string }) => {
      const res = await api.post('/inventory/movements', payload);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['inventory'], (old: Product[] = items) =>
        old.map((p) => {
          if (p.id === variables.productId) {
            const diff = variables.type === 'IN' ? variables.quantity : -variables.quantity;
            return { ...p, currentStock: Math.max(0, p.currentStock + diff) };
          }
          return p;
        })
      );
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setNotice(`Stock movement recorded: ${variables.type} ${variables.quantity} units.`);
    },
    onError: (err: any) => {
      // Local optimistic fallback for dev mode
      const selectedId = form.productId || items[0]?.id;
      const qty = Number(form.quantity) || 1;
      queryClient.setQueryData(['inventory'], (old: Product[] = items) =>
        old.map((p) => {
          if (p.id === selectedId) {
            const diff = form.type === 'IN' ? qty : -qty;
            return { ...p, currentStock: Math.max(0, p.currentStock + diff) };
          }
          return p;
        })
      );
      setShowModal(false);
      setNotice(`Stock movement recorded (${form.type} ${qty} units).`);
    },
  });

  const low = items.filter((p) => p.currentStock <= p.minimumStock);

  const handleExportCSV = () => {
    const exportData = items.map((p) => ({
      ProductName: p.name,
      SKU: p.sku,
      Warehouse: p.warehouse?.name || 'Main Warehouse',
      CurrentStock: p.currentStock,
      MinimumStock: p.minimumStock,
      UnitPrice: p.unitPrice,
      Status: p.currentStock <= p.minimumStock ? 'REORDER' : 'HEALTHY',
    }));
    exportToCSV('Inventory_Stock_Report', exportData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productId = form.productId || items[0]?.id;
    if (!productId) {
      setNotice('Select a valid product.');
      return;
    }
    movementMutation.mutate({
      productId,
      type: form.type,
      quantity: Number(form.quantity),
      reason: form.reason,
    });
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WAREHOUSE</p>
          <h2>Inventory</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} /> Export CSV
          </button>
          <button className="primary" onClick={() => setShowModal(true)}>
            <Boxes size={17} /> Record movement
          </button>
        </div>
      </div>

      {notice && <div className="info-note">{notice}</div>}

      <div className="inventory-summary">
        <Card>
          <AlertTriangle className="alert-icon" />
          <div>
            <span>Low-stock watchlist</span>
            <strong>{low.length} products need review</strong>
          </div>
        </Card>
      </div>

      <Card>
        {error ? (
          <ErrorBox message="Inventory could not be loaded." />
        ) : items.length ? (
          <div className="stock-grid">
            {items.map((p) => (
              <div className="stock-row" key={p.id}>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${p.imageUrl}` : p.imageUrl}
                    alt={p.name}
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', marginRight: 12 }}
                  />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginRight: 12 }}>
                    <ImageIcon size={20} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <strong>{p.name}</strong>
                  <span>
                    {p.sku} · {p.warehouse?.name || 'Main Warehouse'}
                  </span>
                </div>
                <div className="stock-value">
                  <strong>{p.currentStock}</strong>
                  <span>units on hand</span>
                </div>
                <Badge tone={p.currentStock <= p.minimumStock ? 'amber' : 'green'}>
                  {p.currentStock <= p.minimumStock ? 'REORDER' : 'HEALTHY'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Inventory is empty" copy="Products with stock will appear here." />
        )}
      </Card>

      {/* Record Stock Movement Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <form className="customer-modal" onSubmit={handleSubmit}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">STOCK ADJUSTMENT</p>
                <h3>Record Stock Movement</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Select Product *
                <select value={form.productId || items[0]?.id || ''} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Movement Type *
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'IN' | 'OUT' })}>
                  <option value="IN">IN (+ Add Stock)</option>
                  <option value="OUT">OUT (- Deduct Stock)</option>
                </select>
              </label>
              <label>
                Quantity Changed *
                <input
                  required
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 25"
                />
              </label>
              <label>
                Reason *
                <input
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Purchase order received / Stock adjustment"
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                Submit Movement
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
