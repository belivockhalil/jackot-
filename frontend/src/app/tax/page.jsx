'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const TAX_TYPES = ['VAT','PAYE','Income Tax','Withholding Tax','Corporate Tax','Turnover Tax','Other'];
const STATUS_COLORS = { pending: colors.warning, paid: colors.success, overdue: colors.danger };

export default function TaxPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [taxes,    setTaxes]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form, setForm] = useState({ tax_type:'VAT', amount:'', due_date:'', paid_date:'', status:'pending', reference:'', notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/tax?userId=${user.userId}`);
      const data = res.data.taxes || [];
      const today = new Date();
      const updated = data.map(t => ({ ...t, status: t.status !== 'paid' && new Date(t.due_date) < today ? 'overdue' : t.status }));
      setTaxes(updated);
    } catch { toast.error('Failed to load tax entries'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.tax_type || !form.amount) return toast.error('Tax type and amount required');
    try {
      if (editing) {
        await api.put(`/tax/${editing}`, { ...form, userId: user.userId });
        toast.success('Tax entry updated');
      } else {
        await api.post('/tax', { ...form, userId: user.userId });
        toast.success('Tax entry added');
      }
      setShowForm(false); setEditing(null);
      setForm({ tax_type:'VAT', amount:'', due_date:'', paid_date:'', status:'pending', reference:'', notes:'' });
      load();
    } catch { toast.error('Failed to save'); }
  };

  const markPaid = async (t) => {
    await api.put(`/tax/${t.id}`, { ...t, status:'paid', paid_date: new Date().toISOString().split('T')[0], userId: user.userId });
    toast.success('Marked as paid'); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this tax entry?')) return;
    await api.delete(`/tax/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (t) => {
    setForm({ tax_type:t.tax_type||'VAT', amount:t.amount||'', due_date:t.due_date||'', paid_date:t.paid_date||'', status:t.status||'pending', reference:t.reference||'', notes:t.notes||'' });
    setEditing(t.id); setShowForm(true);
  };

  const totalPending = taxes.filter(t=>t.status!=='paid').reduce((s,t)=>s+Number(t.amount||0),0);
  const totalPaid    = taxes.filter(t=>t.status==='paid').reduce((s,t)=>s+Number(t.amount||0),0);
  const overdue      = taxes.filter(t=>t.status==='overdue').length;

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ flex:1, padding:'2rem', maxWidth:'1100px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>🧾 Tax Manager</h1>
            <p style={{ color:colors.muted }}>Track VAT, PAYE and other tax obligations</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ tax_type:'VAT', amount:'', due_date:'', paid_date:'', status:'pending', reference:'', notes:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Tax Entry
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Pending', value:fmt(totalPending), color:colors.warning, icon:'⏳' },
            { label:'Total Paid',    value:fmt(totalPaid),    color:colors.success, icon:'✅' },
            { label:'Overdue',       value:overdue,           color:colors.danger,  icon:'🚨' },
            { label:'Total Entries', value:taxes.length,      color:colors.primary, icon:'🧾' },
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
            <h2 style={{ fontWeight:'700', color:colors.dark }}>Tax Entries</h2>
          </div>
          {taxes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>🧾</p>
              <p style={{ fontWeight:'600' }}>No tax entries yet</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:colors.background }}>
                    {['Tax Type','Amount','Due Date','Paid Date','Reference','Status',''].map(h => (
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taxes.map((t,i) => (
                    <tr key={t.id} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.dark }}>{t.tax_type}</td>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.primary }}>{fmt(t.amount)}</td>
                      <td style={{ padding:'0.85rem 1rem', color: t.status==='overdue'?colors.danger:colors.muted }}>{t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.success }}>{t.paid_date ? new Date(t.paid_date).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{t.reference||'—'}</td>
                      <td style={{ padding:'0.85rem 1rem' }}>
                        <span style={{ backgroundColor:(STATUS_COLORS[t.status]||colors.muted)+'20', color:STATUS_COLORS[t.status]||colors.muted, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:'700', textTransform:'capitalize' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding:'0.85rem 1rem' }}>
                        <div style={{ display:'flex', gap:'0.4rem' }}>
                          {t.status !== 'paid' && <button onClick={()=>markPaid(t)} style={{ background:colors.success+'20', color:colors.success, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>✅ Pay</button>}
                          <button onClick={()=>edit(t)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Edit</button>
                          <button onClick={()=>del(t.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'480px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Tax Entry':'Add Tax Entry'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Tax Type</label>
                  <select value={form.tax_type} onChange={e=>setForm(p=>({...p,tax_type:e.target.value}))} style={inp}>
                    {TAX_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Amount</label>
                  <input type="number" placeholder="e.g. 15000" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Reference</label>
                  <input type="text" placeholder="e.g. KRA-2026-001" value={form.reference} onChange={e=>setForm(p=>({...p,reference:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Paid Date</label>
                  <input type="date" value={form.paid_date} onChange={e=>setForm(p=>({...p,paid_date:e.target.value}))} style={inp} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={inp}>
                    <option value="pending">⏳ Pending</option>
                    <option value="paid">✅ Paid</option>
                    <option value="overdue">🚨 Overdue</option>
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'70px', resize:'vertical' }} placeholder="Additional notes..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update':'Add Entry'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}