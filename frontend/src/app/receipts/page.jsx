'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['Mpesa','Cash','KCB','NCBA','Equity','Cooperative','PayPal','Payoneer','Wise','Cheque','Bank Transfer','Other'];

export default function ReceiptsPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [receipts, setReceipts] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewing,  setViewing]  = useState(null);
  const printRef = useRef();
  const [form, setForm] = useState({ client_id:'', receipt_number:'', date: new Date().toISOString().split('T')[0], amount:'', payment_method:'Mpesa', description:'', notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;
  const biz = settings?.business_name || 'My Business';
  const phone = settings?.business_phone || '';

  useEffect(() => { if (user) { load(); loadClients(); } }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/receipts?userId=${user.userId}`);
      setReceipts(res.data.receipts || []);
    } catch { toast.error('Failed to load receipts'); }
    finally { setLoading(false); }
  };

  const loadClients = async () => {
    try {
      const res = await api.get(`/clients?userId=${user.userId}`);
      setClients(res.data.clients || []);
    } catch {}
  };

  const save = async () => {
    if (!form.client_id || !form.amount) return toast.error('Client and amount required');
    try {
      const res = await api.post('/receipts', { ...form, userId: user.userId });
      toast.success('Receipt created');
      setShowForm(false);
      setForm({ client_id:'', receipt_number:'', date: new Date().toISOString().split('T')[0], amount:'', payment_method:'Mpesa', description:'', notes:'' });
      load();
      setViewing(res.data.receipt);
    } catch { toast.error('Failed to create receipt'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this receipt?')) return;
    await api.delete(`/receipts/${id}`);
    toast.success('Deleted'); load();
  };

  const printReceipt = () => {
    const content = printRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:Arial,sans-serif;padding:20px;max-width:400px;margin:0 auto}h2{text-align:center}hr{border:1px dashed #ccc}.row{display:flex;justify-content:space-between;margin:8px 0}.total{font-size:1.2rem;font-weight:bold;border-top:2px solid #000;padding-top:10px}</style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  };

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ flex:1, padding:'2rem', maxWidth:'1100px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>🧾 Receipt Generator</h1>
            <p style={{ color:colors.muted }}>Create and print payment receipts for clients</p>
          </div>
          <button onClick={()=>setShowForm(true)} style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + New Receipt
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Receipts', value:receipts.length, color:colors.primary, icon:'🧾' },
            { label:'Total Amount',   value:fmt(receipts.reduce((s,r)=>s+Number(r.amount||0),0)), color:colors.success, icon:'💰' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.4rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.82rem', margin:'0.5rem 0 0.25rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.2rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid ${colors.divider}` }}>
            <h2 style={{ fontWeight:'700', color:colors.dark }}>All Receipts</h2>
          </div>
          {receipts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>🧾</p>
              <p style={{ fontWeight:'600' }}>No receipts yet</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:colors.background }}>
                    {['Receipt #','Client','Date','Amount','Method','Description',''].map(h => (
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r,i) => (
                    <tr key={r.id} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.primary }}>{r.receipt_number || `R-${String(i+1).padStart(3,'0')}`}</td>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'600', color:colors.dark }}>{r.clients?.name||'—'}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.success }}>{fmt(r.amount)}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{r.payment_method}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{r.description||'—'}</td>
                      <td style={{ padding:'0.85rem 1rem' }}>
                        <div style={{ display:'flex', gap:'0.4rem' }}>
                          <button onClick={()=>setViewing(r)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>View</button>
                          <button onClick={()=>del(r.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View/Print Receipt Modal */}
        {viewing && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'420px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>Receipt</h2>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button onClick={printReceipt} style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.4rem 0.9rem', borderRadius:'0.4rem', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem' }}>🖨️ Print</button>
                  <button onClick={()=>setViewing(null)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
                </div>
              </div>
              <div ref={printRef} style={{ border:`1px dashed ${colors.border}`, borderRadius:'0.75rem', padding:'1.5rem' }}>
                <h2 style={{ textAlign:'center', fontWeight:'800', marginBottom:'0.25rem' }}>{biz}</h2>
                {phone && <p style={{ textAlign:'center', color:colors.muted, fontSize:'0.85rem', marginBottom:'1rem' }}>{phone}</p>}
                <hr style={{ borderColor:colors.divider, marginBottom:'1rem' }} />
                <p style={{ textAlign:'center', fontWeight:'700', fontSize:'1.1rem', marginBottom:'1rem' }}>PAYMENT RECEIPT</p>
                {[
                  { label:'Receipt #', value: viewing.receipt_number || '—' },
                  { label:'Date',      value: viewing.date ? new Date(viewing.date).toLocaleDateString('en-GB') : '—' },
                  { label:'Client',    value: viewing.clients?.name || '—' },
                  { label:'Method',    value: viewing.payment_method },
                  { label:'Description', value: viewing.description || '—' },
                ].map((row,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem', fontSize:'0.9rem' }}>
                    <span style={{ color:colors.muted }}>{row.label}</span>
                    <span style={{ fontWeight:'600' }}>{row.value}</span>
                  </div>
                ))}
                <hr style={{ borderColor:colors.border, margin:'1rem 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1.2rem', fontWeight:'800' }}>
                  <span>TOTAL PAID</span>
                  <span style={{ color:colors.success }}>{fmt(viewing.amount)}</span>
                </div>
                {viewing.notes && <p style={{ marginTop:'1rem', fontSize:'0.82rem', color:colors.muted }}>Note: {viewing.notes}</p>}
                <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.8rem', color:colors.muted }}>Thank you for your business!</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Form Modal */}
        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'480px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>New Receipt</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Client</label>
                  <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} style={inp}>
                    <option value="">— Select Client —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Receipt Number</label>
                  <input type="text" placeholder="e.g. R-001" value={form.receipt_number} onChange={e=>setForm(p=>({...p,receipt_number:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Amount</label>
                  <input type="number" placeholder="e.g. 25000" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Payment Method</label>
                  <select value={form.payment_method} onChange={e=>setForm(p=>({...p,payment_method:e.target.value}))} style={inp}>
                    {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Description</label>
                  <input type="text" placeholder="e.g. Payment for bedroom set" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={inp} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'70px', resize:'vertical' }} placeholder="Additional notes..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Create Receipt</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}