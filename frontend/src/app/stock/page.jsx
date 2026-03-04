'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

export default function StockPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [stock,    setStock]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMove, setShowMove] = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [form, setForm] = useState({ name:'', category:'', quantity:'', unit:'pcs', buying_price:'', selling_price:'', low_stock_alert:'5', notes:'' });
  const [moveForm, setMoveForm] = useState({ type:'in', quantity:'', date: new Date().toISOString().split('T')[0], notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/stock?userId=${user.userId}`);
      setStock(res.data.stock || []);
    } catch { toast.error('Failed to load stock'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.name) return toast.error('Item name required');
    try {
      if (editing) {
        await api.put(`/stock/${editing}`, { ...form, userId: user.userId });
        toast.success('Item updated');
      } else {
        await api.post('/stock', { ...form, userId: user.userId });
        toast.success('Item added');
      }
      setShowForm(false); setEditing(null);
      setForm({ name:'', category:'', quantity:'', unit:'pcs', buying_price:'', selling_price:'', low_stock_alert:'5', notes:'' });
      load();
    } catch { toast.error('Failed to save'); }
  };

  const recordMove = async () => {
    if (!moveForm.quantity) return toast.error('Quantity required');
    try {
      await api.post(`/stock/${showMove.id}/move`, { ...moveForm, userId: user.userId });
      toast.success(moveForm.type === 'in' ? 'Stock added' : 'Stock removed');
      setShowMove(null);
      setMoveForm({ type:'in', quantity:'', date: new Date().toISOString().split('T')[0], notes:'' });
      load();
    } catch { toast.error('Failed to record movement'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`/stock/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (s) => {
    setForm({ name:s.name||'', category:s.category||'', quantity:s.quantity||'', unit:s.unit||'pcs', buying_price:s.buying_price||'', selling_price:s.selling_price||'', low_stock_alert:s.low_stock_alert||'5', notes:s.notes||'' });
    setEditing(s.id); setShowForm(true);
  };

  const filtered  = stock.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock  = stock.filter(s => Number(s.quantity) <= Number(s.low_stock_alert));
  const totalValue= stock.reduce((s,i)=>s+Number(i.quantity||0)*Number(i.buying_price||0),0);

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ flex:1, padding:'2rem', maxWidth:'1100px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>📦 Stock Tracker</h1>
            <p style={{ color:colors.muted }}>Manage inventory and track stock levels</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ name:'', category:'', quantity:'', unit:'pcs', buying_price:'', selling_price:'', low_stock_alert:'5', notes:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Item
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Items',   value:stock.length,      color:colors.primary, icon:'📦' },
            { label:'Low Stock',     value:lowStock.length,   color:colors.danger,  icon:'⚠️' },
            { label:'Stock Value',   value:fmt(totalValue),   color:colors.success, icon:'💰' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.4rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.82rem', margin:'0.5rem 0 0.25rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.2rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        {lowStock.length > 0 && (
          <div style={{ background:colors.danger+'10', border:`1px solid ${colors.danger}30`, borderRadius:'0.75rem', padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ fontSize:'1.3rem' }}>⚠️</span>
            <p style={{ color:colors.danger, fontWeight:'600', fontSize:'0.9rem' }}>
              Low stock alert: {lowStock.map(s=>s.name).join(', ')}
            </p>
          </div>
        )}

        <div style={{ marginBottom:'1rem' }}>
          <input type="text" placeholder="🔍 Search items..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ padding:'0.65rem 1rem', borderRadius:'0.65rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', width:'280px' }} />
        </div>

        <div style={{ background:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>📦</p>
              <p style={{ fontWeight:'600' }}>No items found</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:colors.background }}>
                    {['Item','Category','Qty','Unit','Buy Price','Sell Price','Stock Value',''].map(h => (
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s,i) => {
                    const isLow = Number(s.quantity) <= Number(s.low_stock_alert);
                    return (
                      <tr key={s.id} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                        <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.dark }}>
                          {isLow && <span style={{ color:colors.danger, marginRight:'0.4rem' }}>⚠️</span>}
                          {s.name}
                        </td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{s.category||'—'}</td>
                        <td style={{ padding:'0.85rem 1rem' }}>
                          <span style={{ fontWeight:'800', color: isLow ? colors.danger : colors.success }}>{s.quantity}</span>
                          {isLow && <span style={{ fontSize:'0.75rem', color:colors.danger, marginLeft:'0.3rem' }}>LOW</span>}
                        </td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{s.unit}</td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{fmt(s.buying_price)}</td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.success, fontWeight:'600' }}>{fmt(s.selling_price)}</td>
                        <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color:colors.primary }}>{fmt(Number(s.quantity)*Number(s.buying_price))}</td>
                        <td style={{ padding:'0.85rem 1rem' }}>
                          <div style={{ display:'flex', gap:'0.4rem' }}>
                            <button onClick={()=>setShowMove(s)} style={{ background:colors.success+'20', color:colors.success, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Move</button>
                            <button onClick={()=>edit(s)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Edit</button>
                            <button onClick={()=>del(s.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Move Stock Modal */}
        {showMove && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'400px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>Stock Movement — {showMove.name}</h2>
                <button onClick={()=>setShowMove(null)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <p style={{ color:colors.muted, marginBottom:'1rem', fontSize:'0.9rem' }}>Current stock: <strong>{showMove.quantity} {showMove.unit}</strong></p>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Movement Type</label>
                  <select value={moveForm.type} onChange={e=>setMoveForm(p=>({...p,type:e.target.value}))} style={inp}>
                    <option value="in">📥 Stock In (Add)</option>
                    <option value="out">📤 Stock Out (Remove)</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Quantity</label>
                  <input type="number" placeholder="e.g. 10" value={moveForm.quantity} onChange={e=>setMoveForm(p=>({...p,quantity:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Date</label>
                  <input type="date" value={moveForm.date} onChange={e=>setMoveForm(p=>({...p,date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <input type="text" placeholder="e.g. Restocked from supplier" value={moveForm.notes} onChange={e=>setMoveForm(p=>({...p,notes:e.target.value}))} style={inp} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={recordMove} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Record Movement</button>
                <button onClick={()=>setShowMove(null)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'520px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Item':'Add Stock Item'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Item Name</label>
                  <input type="text" placeholder="e.g. Pine Timber 2x4" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <input type="text" placeholder="e.g. Timber, Paint" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Unit</label>
                  <input type="text" placeholder="e.g. pcs, kg, litres" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Opening Quantity</label>
                  <input type="number" placeholder="e.g. 50" value={form.quantity} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Low Stock Alert</label>
                  <input type="number" placeholder="e.g. 5" value={form.low_stock_alert} onChange={e=>setForm(p=>({...p,low_stock_alert:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Buying Price</label>
                  <input type="number" placeholder="e.g. 500" value={form.buying_price} onChange={e=>setForm(p=>({...p,buying_price:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Selling Price</label>
                  <input type="number" placeholder="e.g. 800" value={form.selling_price} onChange={e=>setForm(p=>({...p,selling_price:e.target.value}))} style={inp} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'70px', resize:'vertical' }} placeholder="Additional notes..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update':'Add Item'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}