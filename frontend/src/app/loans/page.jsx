'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

export default function LoansPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm,setShowForm]= useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type:'borrowed', lender:'', principal:'', interest_rate:'', start_date:'', end_date:'', total_repaid:'', notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/loans?userId=${user.userId}`);
      setLoans(res.data.loans || []);
    } catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.lender || !form.principal) return toast.error('Lender and principal required');
    try {
      if (editing) {
        await api.put(`/loans/${editing}`, { ...form, userId: user.userId });
        toast.success('Loan updated');
      } else {
        await api.post('/loans', { ...form, userId: user.userId });
        toast.success('Loan added');
      }
      setShowForm(false); setEditing(null);
      setForm({ type:'borrowed', lender:'', principal:'', interest_rate:'', start_date:'', end_date:'', total_repaid:'', notes:'' });
      load();
    } catch { toast.error('Failed to save loan'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this loan?')) return;
    await api.delete(`/loans/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (l) => {
    setForm({ type:l.type||'borrowed', lender:l.lender||'', principal:l.principal||'', interest_rate:l.interest_rate||'', start_date:l.start_date||'', end_date:l.end_date||'', total_repaid:l.total_repaid||'', notes:l.notes||'' });
    setEditing(l.id); setShowForm(true);
  };

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  const totalBorrowed = loans.filter(l=>l.type==='borrowed').reduce((s,l)=>s+Number(l.principal||0),0);
  const totalRepaid   = loans.reduce((s,l)=>s+Number(l.total_repaid||0),0);
  const totalLent     = loans.filter(l=>l.type==='lent').reduce((s,l)=>s+Number(l.principal||0),0);
  const outstanding   = loans.reduce((s,l)=>s+Number(l.principal||0)-Number(l.total_repaid||0),0);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ padding:'2rem', maxWidth:'1100px', margin:'0 auto' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>🏛️ Loan Manager</h1>
            <p style={{ color:colors.muted }}>Track borrowed and lent money</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ type:'borrowed', lender:'', principal:'', interest_rate:'', start_date:'', end_date:'', total_repaid:'', notes:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer', fontSize:'0.95rem' }}>
            + Add Loan
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Borrowed', value:fmt(totalBorrowed), color:colors.danger,  icon:'📥' },
            { label:'Total Lent',     value:fmt(totalLent),     color:colors.primary, icon:'📤' },
            { label:'Total Repaid',   value:fmt(totalRepaid),   color:colors.success, icon:'✅' },
            { label:'Outstanding',    value:fmt(outstanding),   color:colors.warning, icon:'⏳' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.4rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.82rem', margin:'0.5rem 0 0.25rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.2rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Loans Table */}
        <div style={{ background:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid ${colors.divider}` }}>
            <h2 style={{ fontWeight:'700', color:colors.dark }}>All Loans</h2>
          </div>
          {loans.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>🏛️</p>
              <p style={{ fontWeight:'600' }}>No loans recorded yet</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:colors.background }}>
                    {['Type','Lender/Borrower','Principal','Repaid','Balance','Rate','End Date',''].map(h => (
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l,i) => {
                    const balance = Number(l.principal||0) - Number(l.total_repaid||0);
                    return (
                      <tr key={l.id} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                        <td style={{ padding:'0.85rem 1rem' }}>
                          <span style={{ backgroundColor: l.type==='borrowed'?colors.danger+'20':colors.success+'20', color: l.type==='borrowed'?colors.danger:colors.success, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:'700' }}>
                            {l.type==='borrowed'?'📥 Borrowed':'📤 Lent'}
                          </span>
                        </td>
                        <td style={{ padding:'0.85rem 1rem', fontWeight:'600', color:colors.dark }}>{l.lender}</td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.primary, fontWeight:'700' }}>{fmt(l.principal)}</td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.success }}>{fmt(l.total_repaid)}</td>
                        <td style={{ padding:'0.85rem 1rem' }}>
                          <span style={{ color: balance>0?colors.danger:colors.success, fontWeight:'800', backgroundColor: (balance>0?colors.danger:colors.success)+'15', padding:'0.2rem 0.6rem', borderRadius:'999px' }}>
                            {fmt(balance)}
                          </span>
                        </td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{l.interest_rate ? `${l.interest_rate}%` : '—'}</td>
                        <td style={{ padding:'0.85rem 1rem', color:colors.muted }}>{l.end_date || '—'}</td>
                        <td style={{ padding:'0.85rem 1rem' }}>
                          <div style={{ display:'flex', gap:'0.5rem' }}>
                            <button onClick={()=>edit(l)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.75rem', borderRadius:'0.4rem', cursor:'pointer', fontWeight:'600', fontSize:'0.82rem' }}>Edit</button>
                            <button onClick={()=>del(l.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.75rem', borderRadius:'0.4rem', cursor:'pointer', fontWeight:'600', fontSize:'0.82rem' }}>Delete</button>
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

        {/* Form Modal */}
        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'520px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Loan':'Add Loan'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Type</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={inp}>
                    <option value="borrowed">📥 Borrowed (I owe)</option>
                    <option value="lent">📤 Lent (They owe me)</option>
                  </select>
                </div>
                {[
                  { key:'lender', label: form.type==='borrowed'?'Lender Name':'Borrower Name', placeholder:'e.g. John Doe / KCB Bank' },
                  { key:'principal', label:'Principal Amount', placeholder:'e.g. 50000', type:'number' },
                  { key:'interest_rate', label:'Interest Rate %', placeholder:'e.g. 12', type:'number' },
                  { key:'total_repaid', label:'Amount Repaid So Far', placeholder:'e.g. 10000', type:'number' },
                  { key:'start_date', label:'Start Date', type:'date' },
                  { key:'end_date', label:'Due Date', type:'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input type={f.type||'text'} placeholder={f.placeholder||''} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inp} />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'80px', resize:'vertical' }} placeholder="Additional notes..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer', fontSize:'0.95rem' }}>
                  {editing ? 'Update Loan' : 'Add Loan'}
                </button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer', fontSize:'0.95rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}