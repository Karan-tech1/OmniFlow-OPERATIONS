import type { Customer, Product } from './types';

const key = 'nexus_demo_customers';
const iso = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
export const referenceCustomers: Customer[] = [
  {id:'c1',name:'Chennai Bulk Mart',businessName:'Chennai Bulk Mart',mobile:'9445566778',type:'WHOLESALE',status:'INACTIVE'},
  {id:'c2',name:'Kolkata Wholesale',businessName:'Kolkata Wholesale Agency',mobile:'9333444555',type:'WHOLESALE',status:'LEAD'},
  {id:'c3',name:'Ramesh Gupta',businessName:'Gupta General Store',mobile:'8765432109',type:'RETAIL',status:'LEAD',nextFollowUpAt:iso(-1)},
  {id:'c4',name:'Northern Supplies',businessName:'Northern Supplies Ltd',mobile:'9871234567',type:'WHOLESALE',status:'LEAD',nextFollowUpAt:iso(3)},
  {id:'c5',name:'Sundar Enterprises',businessName:'Sundar Enterprises Pvt Ltd',mobile:'9123456789',type:'DISTRIBUTOR',status:'ACTIVE',nextFollowUpAt:iso(3)},
  {id:'c6',name:'Patel Distribution',businessName:'Patel Distribution Network',mobile:'9988776655',type:'DISTRIBUTOR',status:'ACTIVE',nextFollowUpAt:iso(1)},
  {id:'c7',name:'Vikram Traders',businessName:'Vikram Trading Co.',mobile:'9876543210',type:'WHOLESALE',status:'ACTIVE',nextFollowUpAt:iso(1)},
  {id:'c8',name:'Meena Retail Hub',businessName:'Meena Retail Hub',mobile:'7654321098',type:'RETAIL',status:'ACTIVE',nextFollowUpAt:iso(7)}
];
export const referenceProducts: Product[] = [
  {id:'p1',name:'Stapler Heavy Duty',sku:'STAT-001',currentStock:0,minimumStock:20,unitPrice:499,category:{name:'Office supplies'},warehouse:{name:'Central warehouse'}},
  {id:'p2',name:'Wireless Optical Mouse',sku:'ELEC-002',currentStock:8,minimumStock:15,unitPrice:899,category:{name:'Electronics'},warehouse:{name:'Central warehouse'}},
  {id:'p3',name:'A4 Copy Paper',sku:'PAPR-100',currentStock:120,minimumStock:40,unitPrice:340,category:{name:'Office supplies'},warehouse:{name:'Central warehouse'}},
  {id:'p4',name:'Thermal Paper Roll',sku:'TPR-80',currentStock:75,minimumStock:30,unitPrice:85,category:{name:'Office supplies'},warehouse:{name:'Central warehouse'}}
];
export const loadDemoCustomers = () => { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as Customer[] : referenceCustomers; };
export const saveDemoCustomers = (items: Customer[]) => localStorage.setItem(key, JSON.stringify(items));
export const demoDashboard = () => ({ metrics:{customers:loadDemoCustomers().length,products:referenceProducts.length,lowStock:referenceProducts.filter(p=>p.currentStock<=p.minimumStock).length,draft:1,confirmed:1,followUps:loadDemoCustomers().filter(c=>c.nextFollowUpAt && new Date(c.nextFollowUpAt).toDateString()===new Date().toDateString()).length},recentChallans:[{id:'ch1',challanNumber:'CHAL-20260809-0001',status:'CONFIRMED',customer:{name:'Sundar Enterprises'}},{id:'ch2',challanNumber:'CHAL-20260810-0001',status:'DRAFT',customer:{name:'Vikram Traders'}}],movements:[{id:'m1',type:'OUT',quantityChanged:6,reason:'Confirmed challan',product:{name:'Wireless Optical Mouse'}},{id:'m2',type:'IN',quantityChanged:50,reason:'Purchase order received',product:{name:'A4 Copy Paper'}}] });
