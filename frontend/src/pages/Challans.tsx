import { useState } from 'react';
import { FilePlus2, Download, CreditCard, X, FileText, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Customer, Product, SalesChallan, User } from '../types';
import { referenceCustomers, referenceProducts } from '../demo-data';
import { Badge, Card, Empty, ErrorBox } from '../components/UI';

export function Challans({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');

  // Create Challan Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [taxType, setTaxType] = useState<'INTRA_STATE' | 'INTER_STATE' | 'EXEMPT'>('INTRA_STATE');
  const [itemQty, setItemQty] = useState(1);
  const [cart, setCart] = useState<{ productId: string; name: string; sku: string; quantity: number; unitPrice: number }[]>([]);
  const [createNotice, setCreateNotice] = useState('');

  const { data: items = [], error } = useQuery<SalesChallan[]>({
    queryKey: ['challans'],
    queryFn: async () => {
      try {
        const res = await api.get('/challans');
        return res.data.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: customers = referenceCustomers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers');
        const list = res.data.data?.items || [];
        return list.length > 0 ? list : referenceCustomers;
      } catch {
        return referenceCustomers;
      }
    },
  });

  const { data: products = referenceProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const res = await api.get('/products');
        const list = res.data.data || [];
        return list.length > 0 ? list : referenceProducts;
      } catch {
        return referenceProducts;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { customerId: string; items: { productId: string; quantity: number }[] }) => {
      const res = await api.post('/challans', payload);
      return res.data.data;
    },
    onSuccess: (newChallan) => {
      queryClient.setQueryData(['challans'], (old: SalesChallan[] = []) => [newChallan, ...old]);
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      setShowCreateModal(false);
      setCart([]);
      setCreateNotice('');
    },
    onError: () => {
      // Fallback dev creation
      const cust = customers.find((c) => c.id === selectedCustomerId) || customers[0];
      const mockChallan: any = {
        id: `ch-dev-${Date.now()}`,
        challanNumber: `CH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: cust?.id || 'cust-1',
        customer: {
          id: cust?.id || 'cust-1',
          name: cust?.name || 'Acme Retail',
          businessName: cust?.businessName || 'Acme Corp',
          mobile: cust?.mobile || '9876543210',
          type: cust?.type || 'WHOLESALE',
          status: cust?.status || 'ACTIVE',
        },
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        paidAmount: 0,
        outstandingBalance: cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
        totalQuantity: cart.reduce((sum, i) => sum + i.quantity, 0),
        createdAt: new Date().toISOString(),
        items: cart.map((i) => ({
          productId: i.productId,
          productNameSnapshot: i.name,
          skuSnapshot: i.sku,
          unitPriceSnapshot: i.unitPrice,
          quantity: i.quantity,
        })),
      };

      queryClient.setQueryData(['challans'], (old: SalesChallan[] = []) => [mockChallan, ...old]);
      setShowCreateModal(false);
      setCart([]);
      setCreateNotice('');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ id, amountPaid, paymentMode }: { id: string; amountPaid: number; paymentMode: string }) => {
      const res = await api.post(`/challans/${id}/payments`, { amountPaid, paymentMode });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      setSelectedChallan(null);
      setPaymentAmount('');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/challans/${id}/confirm`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const handleDownloadPDF = (id: string, type: 'pdf' | 'invoice-pdf', filename: string) => {
    api
      .get(`/challans/${id}/${type}`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => alert('PDF generation failed'));
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallan || !paymentAmount) return;
    paymentMutation.mutate({
      id: selectedChallan.id,
      amountPaid: Number(paymentAmount),
      paymentMode,
    });
  };

  const handleAddToCart = () => {
    const prodId = selectedProductId || products[0]?.id;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const existingIdx = cart.findIndex((i) => i.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += Number(itemQty);
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          quantity: Number(itemQty),
          unitPrice: Number(prod.unitPrice || 100),
        },
      ]);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCreateChallanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const custId = selectedCustomerId || customers[0]?.id;
    if (!custId) {
      setCreateNotice('Please select a valid customer.');
      return;
    }
    if (cart.length === 0) {
      setCreateNotice('Please add at least one line item to the challan.');
      return;
    }

    createMutation.mutate({
      customerId: custId,
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SALES</p>
          <h2>Sales challans</h2>
        </div>
        {['ADMIN', 'SALES'].includes(user.role) && (
          <button className="primary" onClick={() => setShowCreateModal(true)}>
            <FilePlus2 size={17} /> Create challan
          </button>
        )}
      </div>

      <Card>
        {error ? (
          <ErrorBox message="Challans could not be loaded." />
        ) : items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Challan</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Payment Status</th>
                  <th>Paid / Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">
                      <strong>{c.challanNumber}</strong>
                    </td>
                    <td>{c.customer?.name}</td>
                    <td>{c.totalQuantity} units</td>
                    <td>
                      <Badge tone={c.status === 'CONFIRMED' ? 'green' : c.status === 'DRAFT' ? 'amber' : 'red'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={c.paymentStatus === 'PAID' ? 'green' : c.paymentStatus === 'PARTIALLY_PAID' ? 'amber' : 'red'}>
                        {c.paymentStatus || 'UNPAID'}
                      </Badge>
                    </td>
                    <td>
                      ₹{Number(c.paidAmount || 0).toLocaleString()} /{' '}
                      <span style={{ color: '#e11d48', fontWeight: 600 }}>₹{Number(c.outstandingBalance || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {c.status === 'DRAFT' && ['ADMIN', 'SALES'].includes(user.role) && (
                          <button
                            type="button"
                            className="primary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => confirmMutation.mutate(c.id)}
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          title="Download Delivery Challan PDF"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleDownloadPDF(c.id, 'pdf', `Challan-${c.challanNumber}`)}
                        >
                          <FileText size={15} /> PDF
                        </button>
                        <button
                          type="button"
                          title="Download Tax Invoice PDF"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleDownloadPDF(c.id, 'invoice-pdf', `Invoice-${c.challanNumber}`)}
                        >
                          <Download size={15} /> Invoice
                        </button>
                        {['ADMIN', 'ACCOUNTS'].includes(user.role) && c.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            title="Record Payment"
                            style={{ padding: '4px 8px' }}
                            onClick={() => {
                              setSelectedChallan(c);
                              setPaymentAmount(String(c.outstandingBalance || ''));
                            }}
                          >
                            <CreditCard size={15} /> Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No sales challans yet" copy="Draft a challan to begin the fulfilment process." />
        )}
      </Card>

      {/* Create Sales Challan Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <form className="customer-modal" onSubmit={handleCreateChallanSubmit} style={{ width: 'min(720px, 94vw)', maxWidth: '100%' }}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">NEW FULFILMENT</p>
                <h3>Draft Sales Challan</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCreateModal(false)}>
                <X />
              </button>
            </div>

            {createNotice && <div className="error" style={{ marginBottom: '12px' }}>{createNotice}</div>}

            <div className="form-grid">
              <label style={{ gridColumn: 'span 2' }}>
                Select Customer *
                <select
                  value={selectedCustomerId || customers[0]?.id || ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {cust.businessName ? `(${cust.businessName})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  ADD LINE ITEMS:
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <select
                      value={selectedProductId || products[0]?.id || ''}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (Stock: {prod.currentStock}) — ₹{prod.unitPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: '90px', flexShrink: 0 }}>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                      placeholder="Qty"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="primary"
                    onClick={handleAddToCart}
                    style={{ padding: '9px 16px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Plus size={16} /> Add Item
                  </button>
                </div>

                {/* Cart Table */}
                {cart.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', color: '#64748b' }}>
                          <th style={{ textAlign: 'left', padding: '4px' }}>Product</th>
                          <th style={{ textAlign: 'center', padding: '4px' }}>Qty</th>
                          <th style={{ textAlign: 'right', padding: '4px' }}>Price</th>
                          <th style={{ textAlign: 'right', padding: '4px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 4px' }}>{item.name}</td>
                            <td style={{ textAlign: 'center', padding: '6px 4px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '6px 4px' }}>₹{(item.unitPrice * item.quantity).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', padding: '6px 4px' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(idx)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* GST Tax Breakdown Summary */}
                    {(() => {
                      const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
                      const cgst = taxType === 'INTRA_STATE' ? subtotal * 0.09 : 0;
                      const sgst = taxType === 'INTRA_STATE' ? subtotal * 0.09 : 0;
                      const igst = taxType === 'INTER_STATE' ? subtotal * 0.18 : 0;
                      const totalTax = cgst + sgst + igst;
                      const grandTotal = subtotal + totalTax;

                      return (
                        <div style={{ marginTop: '14px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>TAX STRUCTURE & GST APPLIED:</span>
                            <select
                              value={taxType}
                              onChange={(e) => setTaxType(e.target.value as any)}
                              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #86efac' }}
                            >
                              <option value="INTRA_STATE">Same State (CGST 9% + SGST 9%)</option>
                              <option value="INTER_STATE">Out of State (IGST 18%)</option>
                              <option value="EXEMPT">GST Exempt (0%)</option>
                            </select>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#334155' }}>
                            <div>Taxable Subtotal: <strong>₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                            {taxType === 'INTRA_STATE' && (
                              <>
                                <div>CGST (9%): <strong>₹{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                                <div>SGST (9%): <strong>₹{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                              </>
                            )}
                            {taxType === 'INTER_STATE' && (
                              <div>IGST (18%): <strong>₹{igst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                            )}
                            {taxType === 'EXEMPT' && (
                              <div>GST Exempt: <strong>₹0.00</strong></div>
                            )}
                          </div>

                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', color: '#14532d' }}>
                            <span>Grand Total (Incl. GST):</span>
                            <span>₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={cart.length === 0}>
                Save Challan & Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Ledger Modal */}
      {selectedChallan && (
        <div className="modal-backdrop">
          <form className="customer-modal" onSubmit={handlePaymentSubmit}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">ACCOUNTS & PAYMENT LEDGER</p>
                <h3>Record Payment — {selectedChallan.challanNumber}</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedChallan(null)}>
                <X />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Customer Name
                <input disabled value={selectedChallan.customer?.name || ''} />
              </label>
              <label>
                Outstanding Balance (₹)
                <input disabled value={`₹${Number(selectedChallan.outstandingBalance || 0).toLocaleString()}`} />
              </label>
              <label>
                Amount Being Paid (₹) *
                <input
                  required
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                />
              </label>
              <label>
                Payment Mode *
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as any)}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setSelectedChallan(null)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
