'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const STATUS_COLORS = { draft: colors.muted, sent: colors.primary, accepted: colors.success, rejected: colors.danger, invoiced: colors.purple };

export default function QuotesPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [quotes,   setQuotes]   = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewing,  setViewing]  = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [form, setForm] = useState({ client_id:'', quote_number:'', date: new Date().toISOString().split('T')[0], valid_until:'', status:'draft', notes:'', items:[{ description:'', quantity:1, unit_price:0, total:0 }] });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) { load(); loadClients(); } }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/quotes?userId=${user.userId}`);
      setQuotes(res.data.quotes || []);
    } catch { toast.error('Failed to load quotes'); }
    finally { setLoading(false); }
  };

  const loadClients = async () => {
    try {
      const res = await api.get(`/clients?userId=${user.userId}`);
      setClients(res.data.clients || []);
    } catch {}
  };

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      items[i].total = Number(items[i].quantity || 0) * Number(items[i].unit_price || 0);
    }
    setForm(p => ({ ...p, items }));
  };

  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { description:'', quantity:1, unit_price:0, total:0 }] }));
  const removeItem = i  => setForm(p => ({ ...p, items: p.items.filter((_,idx) => idx !== i) }));
  const total      = form.items.reduce((s, i) => s + Number(i.total || 0), 0);

  const save = async () => {
    if (!form.client_id) return toast.error('Please select a client');
    if (!form.items[0]?.description) return toast.error('Add at least one item');
    try {
      if (editing) {
        await api.put(`/quotes/${editing}`, { ...form, userId: user.userId });
        toast.success('Quote updated');
      } else {
        await api.post('/quotes', { ...form, userId: user.userId });
        toast.success('Quote created');
      }
      setShowForm(false); setEditing(null);
      setForm({ client_id:'', quote_number:'', date: new Date().toISOString().split('T')[0], valid_until:'', status:'draft', notes:'', items:[{ description:'', quantity:1, unit_price:0, total:0 }] });
      load();
    } catch { toast.error('Failed to save quote'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this quote?')) return;
    await api.delete(`/quotes/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (q) => {
    setForm({ client_id: q.client_id||'', quote_number: q.quote_number||'', date: q.date||'', valid_until: q.valid_until||'', status: q.status||'draft', notes: q.notes||'', items: q.quote_items?.length ? q.quote_items : [{ description:'', quantity:1, unit_price:0, total:0 }] });
    setEditing(q.id); setShowForm(true);
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
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>📋 Job Quotes</h1>
            <p style={{ color:colors.muted }}>Create and manage quotes for clients</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + New Quote
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Quotes', value: quotes.length, color:colors.primary, icon:'📋' },
            { label:'Draft',        value: quotes.filter(q=>q.status==='draft').length,    color:colors.muted,    icon:'✏️' },
            { label:'Sent',         value: quotes.filter(q=>q.status==='sent').length,     color:colors.primary,  icon:'📤' },
            { label:'Accepted',     value: quotes.filter(q=>q.status==='accepted').length, color:colors.success,  icon:'✅' },
            { label:'Total Value',  value: fmt(quotes.reduce((s,q)=>s+Number(q.total_amount||0),0)), color:colors.purple, icon:'💰' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.3rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.8rem', margin:'0.4rem 0 0.2rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.1rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Quotes List */}
        <div style={{ background:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid ${colors.divider}` }}>
            <h2 style={{ fontWeight:'700', color:colors.dark }}>All Quotes</h2>
          </div>
          {quotes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>📋</p>
              <p style={{ fontWeight:'600' }}>No quotes yet — create your first quote</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:colors.background }}>
                    {['Quote #','Client','Date','Valid Until','Items','Total','Status',''].map(h => (
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q,i) => (
                    <tr key={q.id} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.primary }}>{q.quote_number || `Q-${String(i+1).padStart(3,'0')}`}</td>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'600', color:colors.dark }}>{q.clients?.name || '—'}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{q.date ? new Date(q.date).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{q.quote_items?.length || 0} items</td>
                      <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.dark }}>{fmt(q.total_amount)}</td>
                      <td style={{ padding:'0.85rem 1rem' }}>
                        <span style={{ backgroundColor:(STATUS_COLORS[q.status]||colors.muted)+'20', color:STATUS_COLORS[q.status]||colors.muted, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:'700', textTransform:'capitalize' }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ padding:'0.85rem 1rem' }}>
                        <div style={{ display:'flex', gap:'0.4rem' }}>
                          <button onClick={()=>setViewing(q)} style={{ background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>View</button>
                          <button onClick={()=>edit(q)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Edit</button>
                          <button onClick={()=>del(q.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Modal */}
        {viewing && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'600px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>Quote Details</h2>
                <button onClick={()=>setViewing(null)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
                <div><p style={{ fontSize:'0.8rem', color:colors.muted }}>Client</p><p style={{ fontWeight:'700' }}>{viewing.clients?.name}</p></div>
                <div><p style={{ fontSize:'0.8rem', color:colors.muted }}>Quote #</p><p style={{ fontWeight:'700' }}>{viewing.quote_number}</p></div>
                <div><p style={{ fontSize:'0.8rem', color:colors.muted }}>Date</p><p style={{ fontWeight:'700' }}>{viewing.date ? new Date(viewing.date).toLocaleDateString('en-GB') : '—'}</p></div>
                <div><p style={{ fontSize:'0.8rem', color:colors.muted }}>Valid Until</p><p style={{ fontWeight:'700' }}>{viewing.valid_until ? new Date(viewing.valid_until).toLocaleDateString('en-GB') : '—'}</p></div>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'1rem' }}>
                <thead>
                  <tr style={{ backgroundColor:colors.background }}>
                    {['Description','Qty','Unit Price','Total'].map(h => <th key={h} style={{ padding:'0.6rem 0.75rem', textAlign:'left', fontSize:'0.82rem', color:colors.medium, fontWeight:'700' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(viewing.quote_items||[]).map((item,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${colors.divider}` }}>
                      <td style={{ padding:'0.6rem 0.75rem' }}>{item.description}</td>
                      <td style={{ padding:'0.6rem 0.75rem' }}>{item.quantity}</td>
                      <td style={{ padding:'0.6rem 0.75rem' }}>{fmt(item.unit_price)}</td>
                      <td style={{ padding:'0.6rem 0.75rem', fontWeight:'700' }}>{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display:'flex', justifyContent:'flex-end', borderTop:`2px solid ${colors.divider}`, paddingTop:'1rem' }}>
                <p style={{ fontSize:'1.2rem', fontWeight:'800', color:colors.dark }}>Total: {fmt(viewing.total_amount)}</p>
              </div>
              {viewing.notes && <p style={{ marginTop:'1rem', color:colors.muted, fontSize:'0.9rem' }}>📝 {viewing.notes}</p>}
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'680px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing ? 'Edit Quote' : 'New Quote'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Client</label>
                  <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} style={inp}>
                    <option value="">— Select Client —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {[
                  { key:'quote_number', label:'Quote Number', placeholder:'e.g. Q-001' },
                  { key:'date',         label:'Date',         type:'date' },
                  { key:'valid_until',  label:'Valid Until',  type:'date' },
                  { key:'status',       label:'Status',       type:'select', options:['draft','sent','accepted','rejected','invoiced'] },
                ].map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inp}>
                        {f.options.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                      </select>
                    ) : (
                      <input type={f.type||'text'} placeholder={f.placeholder||''} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inp} />
                    )}
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div style={{ marginBottom:'1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                  <label style={{ ...lbl, marginBottom:0 }}>Line Items</label>
                  <button onClick={addItem} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.75rem', borderRadius:'0.4rem', cursor:'pointer', fontWeight:'600', fontSize:'0.82rem' }}>+ Add Item</button>
                </div>
                {form.items.map((item,i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 0.6fr 1fr 1fr auto', gap:'0.5rem', marginBottom:'0.5rem', alignItems:'center' }}>
                    <input placeholder="Description" value={item.description} onChange={e=>updateItem(i,'description',e.target.value)} style={{ ...inp, padding:'0.5rem 0.7rem' }} />
                    <input type="number" placeholder="Qty" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} style={{ ...inp, padding:'0.5rem 0.7rem' }} />
                    <input type="number" placeholder="Unit Price" value={item.unit_price} onChange={e=>updateItem(i,'unit_price',e.target.value)} style={{ ...inp, padding:'0.5rem 0.7rem' }} />
                    <div style={{ padding:'0.5rem 0.7rem', background:colors.background, borderRadius:'0.5rem', fontWeight:'700', color:colors.dark, fontSize:'0.9rem' }}>{fmt(item.total)}</div>
                    {form.items.length > 1 && <button onClick={()=>removeItem(i)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', width:'28px', height:'28px', borderRadius:'50%', cursor:'pointer', fontWeight:'700' }}>✕</button>}
                  </div>
                ))}
                <div style={{ textAlign:'right', marginTop:'0.75rem', fontSize:'1.1rem', fontWeight:'800', color:colors.dark }}>
                  Total: {fmt(total)}
                </div>
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <label style={lbl}>Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'70px', resize:'vertical' }} placeholder="Additional notes..." />
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update Quote':'Create Quote'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}