'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

export default function GoalsPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [goals,    setGoals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form, setForm] = useState({ description:'', target_value:'', current_value:'', target_date:'', unit:'KSh' });

  const sym = settings?.currency_symbol || 'KSh';

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/goals?userId=${user.userId}`);
      setGoals(res.data.goals || []);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.description || !form.target_value) return toast.error('Description and target required');
    try {
      if (editing) {
        await api.put(`/goals/${editing}`, { ...form, userId: user.userId });
        toast.success('Goal updated');
      } else {
        await api.post('/goals', { ...form, userId: user.userId });
        toast.success('Goal added');
      }
      setShowForm(false); setEditing(null);
      setForm({ description:'', target_value:'', current_value:'', target_date:'', unit:sym });
      load();
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await api.delete(`/goals/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (g) => {
    setForm({ description:g.description||'', target_value:g.target_value||'', current_value:g.current_value||'', target_date:g.target_date||'', unit:g.unit||sym });
    setEditing(g.id); setShowForm(true);
  };

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ padding:'2rem', maxWidth:'1000px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>🎯 Business Goals</h1>
            <p style={{ color:colors.muted }}>Set and track your business targets</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ description:'', target_value:'', current_value:'0', target_date:'', unit:sym }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div style={{ background:'white', borderRadius:'1rem', padding:'3rem', textAlign:'center', color:colors.muted }}>
            <p style={{ fontSize:'2rem' }}>🎯</p>
            <p style={{ fontWeight:'600' }}>No goals set yet — add your first business goal!</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
            {goals.map(g => {
              const pct     = Number(g.target_value) > 0 ? Math.min(100, (Number(g.current_value||0)/Number(g.target_value))*100) : 0;
              const barColor = pct >= 100 ? colors.success : pct >= 60 ? colors.warning : colors.primary;
              return (
                <div key={g.id} style={{ background:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                    <h3 style={{ fontWeight:'700', color:colors.dark, flex:1, marginRight:'0.5rem' }}>{g.description}</h3>
                    <div style={{ display:'flex', gap:'0.4rem', flexShrink:0 }}>
                      <button onClick={()=>edit(g)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Edit</button>
                      <button onClick={()=>del(g.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Del</button>
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <span style={{ fontSize:'0.85rem', color:colors.muted }}>Progress</span>
                    <span style={{ fontSize:'0.85rem', fontWeight:'700', color:barColor }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ backgroundColor:colors.background, borderRadius:'999px', height:'10px', marginBottom:'1rem', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', backgroundColor:barColor, borderRadius:'999px', transition:'width 0.5s ease' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                    <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Current</p><p style={{ fontWeight:'700', color:colors.primary }}>{Number(g.current_value||0).toLocaleString()} {g.unit}</p></div>
                    <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Target</p><p style={{ fontWeight:'700', color:colors.dark }}>{Number(g.target_value||0).toLocaleString()} {g.unit}</p></div>
                  </div>
                  {g.target_date && <p style={{ fontSize:'0.78rem', color:colors.muted, marginTop:'0.75rem' }}>📅 Target date: {new Date(g.target_date).toLocaleDateString('en-GB')}</p>}
                  {pct >= 100 && <p style={{ fontSize:'0.85rem', color:colors.success, fontWeight:'700', marginTop:'0.5rem' }}>🎉 Goal achieved!</p>}
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'460px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Goal':'Add Goal'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Goal Description</label>
                  <input type="text" placeholder="e.g. Reach KSh 500,000 monthly revenue" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={inp} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div>
                    <label style={lbl}>Target Value</label>
                    <input type="number" placeholder="e.g. 500000" value={form.target_value} onChange={e=>setForm(p=>({...p,target_value:e.target.value}))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Current Value</label>
                    <input type="number" placeholder="e.g. 270000" value={form.current_value} onChange={e=>setForm(p=>({...p,current_value:e.target.value}))} style={inp} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div>
                    <label style={lbl}>Unit</label>
                    <input type="text" placeholder="e.g. KSh, clients, projects" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Target Date</label>
                    <input type="date" value={form.target_date} onChange={e=>setForm(p=>({...p,target_date:e.target.value}))} style={inp} />
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update':'Add Goal'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}