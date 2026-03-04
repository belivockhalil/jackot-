'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const CATEGORIES = ['Equipment','Vehicle','Furniture','Electronics','Property','Tools','Other'];

export default function AssetsPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [assets,   setAssets]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form, setForm] = useState({ name:'', category:'Equipment', purchase_date:'', purchase_price:'', current_value:'', depreciation_rate:'', notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/assets?userId=${user.userId}`);
      setAssets(res.data.assets || []);
    } catch { toast.error('Failed to load assets'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.name) return toast.error('Asset name required');
    try {
      if (editing) {
        await api.put(`/assets/${editing}`, { ...form, userId: user.userId });
        toast.success('Asset updated');
      } else {
        await api.post('/assets', { ...form, userId: user.userId });
        toast.success('Asset added');
      }
      setShowForm(false); setEditing(null);
      setForm({ name:'', category:'Equipment', purchase_date:'', purchase_price:'', current_value:'', depreciation_rate:'', notes:'' });
      load();
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this asset?')) return;
    await api.delete(`/assets/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (a) => {
    setForm({ name:a.name||'', category:a.category||'Equipment', purchase_date:a.purchase_date||'', purchase_price:a.purchase_price||'', current_value:a.current_value||'', depreciation_rate:a.depreciation_rate||'', notes:a.notes||'' });
    setEditing(a.id); setShowForm(true);
  };

  const totalPurchase = assets.reduce((s,a)=>s+Number(a.purchase_price||0),0);
  const totalCurrent  = assets.reduce((s,a)=>s+Number(a.current_value||0),0);
  const totalDepr     = totalPurchase - totalCurrent;

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ padding:'2rem', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>🏗️ Assets Register</h1>
            <p style={{ color:colors.muted }}>Track business assets and their value</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ name:'', category:'Equipment', purchase_date:'', purchase_price:'', current_value:'', depreciation_rate:'', notes:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Asset
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Assets',    value:assets.length,     color:colors.primary, icon:'🏗️' },
            { label:'Purchase Value',  value:fmt(totalPurchase), color:colors.blue,   icon:'💰' },
            { label:'Current Value',   value:fmt(totalCurrent),  color:colors.success,icon:'📈' },
            { label:'Depreciation',    value:fmt(totalDepr),     color:colors.danger, icon:'📉' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.4rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.82rem', margin:'0.5rem 0 0.25rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.2rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
          {assets.length === 0 ? (
            <div style={{ gridColumn:'1/-1', background:'white', borderRadius:'1rem', padding:'3rem', textAlign:'center', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>🏗️</p>
              <p style={{ fontWeight:'600' }}>No assets recorded yet</p>
            </div>
          ) : assets.map(a => {
            const depr = Number(a.purchase_price||0) - Number(a.current_value||0);
            const pct  = Number(a.purchase_price||0) > 0 ? ((Number(a.current_value||0)/Number(a.purchase_price||0))*100).toFixed(0) : 0;
            return (
              <div key={a.id} style={{ background:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderLeft:`4px solid ${colors.primary}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                  <div>
                    <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.25rem' }}>{a.name}</h3>
                    <span style={{ backgroundColor:colors.primaryLight, color:colors.primary, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.78rem', fontWeight:'600' }}>{a.category}</span>
                  </div>
                  <div style={{ display:'flex', gap:'0.4rem' }}>
                    <button onClick={()=>edit(a)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Edit</button>
                    <button onClick={()=>del(a.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Del</button>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.75rem' }}>
                  <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Purchase Price</p><p style={{ fontWeight:'700', color:colors.dark }}>{fmt(a.purchase_price)}</p></div>
                  <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Current Value</p><p style={{ fontWeight:'700', color:colors.success }}>{fmt(a.current_value)}</p></div>
                  <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Depreciation</p><p style={{ fontWeight:'700', color:colors.danger }}>{fmt(depr)}</p></div>
                  <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Value Retained</p><p style={{ fontWeight:'700', color:colors.primary }}>{pct}%</p></div>
                </div>
                {a.purchase_date && <p style={{ fontSize:'0.8rem', color:colors.muted }}>📅 Purchased: {new Date(a.purchase_date).toLocaleDateString('en-GB')}</p>}
                {a.notes && <p style={{ fontSize:'0.8rem', color:colors.muted, marginTop:'0.25rem' }}>📝 {a.notes}</p>}
              </div>
            );
          })}
        </div>

        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'520px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Asset':'Add Asset'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Asset Name</label>
                  <input type="text" placeholder="e.g. Toyota Hilux, MacBook Pro" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inp}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={e=>setForm(p=>({...p,purchase_date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Purchase Price</label>
                  <input type="number" placeholder="e.g. 120000" value={form.purchase_price} onChange={e=>setForm(p=>({...p,purchase_price:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Current Value</label>
                  <input type="number" placeholder="e.g. 100000" value={form.current_value} onChange={e=>setForm(p=>({...p,current_value:e.target.value}))} style={inp} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Depreciation Rate % per year</label>
                  <input type="number" placeholder="e.g. 10" value={form.depreciation_rate} onChange={e=>setForm(p=>({...p,depreciation_rate:e.target.value}))} style={inp} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'80px', resize:'vertical' }} placeholder="Additional notes..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update':'Add Asset'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}