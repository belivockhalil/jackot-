'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CATEGORIES = ['Materials','Salary','Transport','Utilities','Marketing','Rent','Equipment','General','Other'];

export default function BudgetPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [budgets,  setBudgets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const now = new Date();
  const [selMonth, setSelMonth] = useState(MONTHS[now.getMonth()]);
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [form, setForm] = useState({ category:'Materials', budgeted_amount:'', month: MONTHS[now.getMonth()], year: now.getFullYear(), notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) load(); }, [user, selMonth, selYear]);

  const load = async () => {
    try {
      const res = await api.get(`/budget?userId=${user.userId}&month=${selMonth}&year=${selYear}`);
      setBudgets(res.data.budgets || []);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.budgeted_amount) return toast.error('Amount required');
    try {
      if (editing) {
        await api.put(`/budget/${editing}`, { ...form, userId: user.userId });
        toast.success('Budget updated');
      } else {
        await api.post('/budget', { ...form, userId: user.userId });
        toast.success('Budget added');
      }
      setShowForm(false); setEditing(null);
      setForm({ category:'Materials', budgeted_amount:'', month:selMonth, year:selYear, notes:'' });
      load();
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await api.delete(`/budget/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (b) => {
    setForm({ category:b.category, budgeted_amount:b.budgeted_amount, spent_amount:b.spent_amount||0, month:b.month, year:b.year, notes:b.notes||'' });
    setEditing(b.id); setShowForm(true);
  };

  const totalBudgeted = budgets.reduce((s,b)=>s+Number(b.budgeted_amount||0),0);
  const totalSpent    = budgets.reduce((s,b)=>s+Number(b.spent_amount||0),0);
  const totalLeft     = totalBudgeted - totalSpent;

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ flex:1, padding:'2rem', maxWidth:'1000px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>💰 Budget Planner</h1>
            <p style={{ color:colors.muted }}>Set and track monthly spending budgets</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ category:'Materials', budgeted_amount:'', month:selMonth, year:selYear, notes:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Budget
          </button>
        </div>

        {/* Month Selector */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', alignItems:'center', flexWrap:'wrap' }}>
          <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{ ...inp, width:'auto', minWidth:'140px' }}>
            {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{ ...inp, width:'auto', minWidth:'90px' }}>
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Budgeted', value:fmt(totalBudgeted), color:colors.primary, icon:'📊' },
            { label:'Total Spent',    value:fmt(totalSpent),    color:colors.danger,  icon:'💸' },
            { label:'Remaining',      value:fmt(totalLeft),     color: totalLeft>=0 ? colors.success : colors.danger, icon:'💵' },
            { label:'Categories',     value:budgets.length,     color:colors.purple,  icon:'📂' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.4rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.82rem', margin:'0.5rem 0 0.25rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.2rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Budget Bars */}
        {budgets.length === 0 ? (
          <div style={{ background:'white', borderRadius:'1rem', padding:'3rem', textAlign:'center', color:colors.muted }}>
            <p style={{ fontSize:'2rem' }}>💰</p>
            <p style={{ fontWeight:'600' }}>No budgets set for {selMonth} {selYear}</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {budgets.map(b => {
              const pct      = Number(b.budgeted_amount) > 0 ? Math.min(100,(Number(b.spent_amount||0)/Number(b.budgeted_amount))*100) : 0;
              const barColor = pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.success;
              return (
                <div key={b.id} style={{ background:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <h3 style={{ fontWeight:'700', color:colors.dark }}>{b.category}</h3>
                      <span style={{ fontSize:'0.82rem', color:barColor, fontWeight:'700' }}>{pct.toFixed(0)}% used</span>
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button onClick={()=>edit(b)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Edit</button>
                      <button onClick={()=>del(b.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>Del</button>
                    </div>
                  </div>
                  <div style={{ backgroundColor:colors.background, borderRadius:'999px', height:'12px', marginBottom:'0.75rem', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', backgroundColor:barColor, borderRadius:'999px', transition:'width 0.5s ease' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                    <span style={{ color:colors.danger }}>Spent: {fmt(b.spent_amount)}</span>
                    <span style={{ color:colors.muted }}>Budget: {fmt(b.budgeted_amount)}</span>
                    <span style={{ color:colors.success, fontWeight:'700' }}>Left: {fmt(Number(b.budgeted_amount)-Number(b.spent_amount||0))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'440px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Budget':'Add Budget'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inp}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Budgeted Amount</label>
                  <input type="number" placeholder="e.g. 20000" value={form.budgeted_amount} onChange={e=>setForm(p=>({...p,budgeted_amount:e.target.value}))} style={inp} />
                </div>
                {editing && (
                  <div>
                    <label style={lbl}>Amount Spent So Far</label>
                    <input type="number" placeholder="e.g. 12000" value={form.spent_amount||''} onChange={e=>setForm(p=>({...p,spent_amount:e.target.value}))} style={inp} />
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div>
                    <label style={lbl}>Month</label>
                    <select value={form.month} onChange={e=>setForm(p=>({...p,month:e.target.value}))} style={inp}>
                      {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Year</label>
                    <select value={form.year} onChange={e=>setForm(p=>({...p,year:Number(e.target.value)}))} style={inp}>
                      {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <input type="text" placeholder="Optional notes" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={inp} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update':'Add Budget'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}