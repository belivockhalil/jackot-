'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

export default function SavingsPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [entries,  setEntries]  = useState([]);
  const [balance,  setBalance]  = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount:'', direction:'in', notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/savings?userId=${user.userId}`);
      setEntries(res.data.entries || []);
      setBalance(res.data.balance || 0);
    } catch { toast.error('Failed to load savings'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.amount) return toast.error('Amount required');
    try {
      await api.post('/savings', { ...form, userId: user.userId });
      toast.success(form.direction === 'in' ? 'Savings added!' : 'Withdrawal recorded!');
      setShowForm(false);
      setForm({ date: new Date().toISOString().split('T')[0], amount:'', direction:'in', notes:'' });
      load();
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/savings/${id}`);
    toast.success('Deleted'); load();
  };

  const totalIn  = entries.filter(e=>e.direction==='in').reduce((s,e)=>s+Number(e.amount||0),0);
  const totalOut = entries.filter(e=>e.direction==='out').reduce((s,e)=>s+Number(e.amount||0),0);
  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ padding:'2rem', maxWidth:'1000px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>💵 Savings Tracker</h1>
            <p style={{ color:colors.muted }}>Track deposits and withdrawals</p>
          </div>
          <button onClick={()=>setShowForm(true)} style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Entry
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Current Balance', value:fmt(balance),  color:colors.primary, icon:'💰' },
            { label:'Total Saved',     value:fmt(totalIn),  color:colors.success, icon:'📥' },
            { label:'Total Withdrawn', value:fmt(totalOut), color:colors.danger,  icon:'📤' },
            { label:'Entries',         value:entries.length, color:colors.purple, icon:'📋' },
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
            <h2 style={{ fontWeight:'700', color:colors.dark }}>Transaction History</h2>
          </div>
          {entries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>💵</p>
              <p style={{ fontWeight:'600' }}>No savings entries yet</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ backgroundColor:colors.background }}>
                  {['Date','Type','Amount','Balance','Notes',''].map(h => (
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e,i) => (
                  <tr key={e.id} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                    <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding:'0.85rem 1rem' }}>
                      <span style={{ backgroundColor: e.direction==='in'?colors.success+'20':colors.danger+'20', color: e.direction==='in'?colors.success:colors.danger, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:'700' }}>
                        {e.direction==='in'?'📥 Deposit':'📤 Withdrawal'}
                      </span>
                    </td>
                    <td style={{ padding:'0.85rem 1rem', fontWeight:'700', color: e.direction==='in'?colors.success:colors.danger }}>{e.direction==='in'?'+':'-'}{fmt(e.amount)}</td>
                    <td style={{ padding:'0.85rem 1rem', fontWeight:'600', color:colors.primary }}>{fmt(e.balance)}</td>
                    <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{e.notes||'—'}</td>
                    <td style={{ padding:'0.85rem 1rem' }}>
                      <button onClick={()=>del(e.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.75rem', borderRadius:'0.4rem', cursor:'pointer', fontWeight:'600', fontSize:'0.82rem' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'420px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>Add Savings Entry</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Type</label>
                  <select value={form.direction} onChange={e=>setForm(p=>({...p,direction:e.target.value}))} style={inp}>
                    <option value="in">📥 Deposit (Add to savings)</option>
                    <option value="out">📤 Withdrawal (Take from savings)</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Amount</label>
                  <input type="number" placeholder="e.g. 5000" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <input type="text" placeholder="e.g. Monthly savings" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={inp} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Save</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}