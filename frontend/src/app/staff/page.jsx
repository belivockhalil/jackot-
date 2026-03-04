'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function StaffPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPay,  setShowPay]  = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [form, setForm] = useState({ name:'', role:'', phone:'', email:'', salary:'', start_date:'', notes:'' });
  const [payForm, setPayForm] = useState({ amount:'', payment_date: new Date().toISOString().split('T')[0], month: MONTHS[new Date().getMonth()], notes:'' });

  const sym = settings?.currency_symbol || 'KSh';
  const fmt = n => `${sym} ${Number(n||0).toLocaleString()}`;

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/staff?userId=${user.userId}`);
      setStaff(res.data.staff || []);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.name || !form.role) return toast.error('Name and role required');
    try {
      if (editing) {
        await api.put(`/staff/${editing}`, { ...form, userId: user.userId });
        toast.success('Staff updated');
      } else {
        await api.post('/staff', { ...form, userId: user.userId });
        toast.success('Staff added');
      }
      setShowForm(false); setEditing(null);
      setForm({ name:'', role:'', phone:'', email:'', salary:'', start_date:'', notes:'' });
      load();
    } catch { toast.error('Failed to save'); }
  };

  const recordPay = async () => {
    if (!payForm.amount) return toast.error('Amount required');
    try {
      await api.post(`/staff/${showPay.id}/pay`, { ...payForm, userId: user.userId });
      toast.success('Payment recorded');
      setShowPay(null);
      setPayForm({ amount:'', payment_date: new Date().toISOString().split('T')[0], month: MONTHS[new Date().getMonth()], notes:'' });
      load();
    } catch { toast.error('Failed to record payment'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this staff member?')) return;
    await api.delete(`/staff/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (s) => {
    setForm({ name:s.name||'', role:s.role||'', phone:s.phone||'', email:s.email||'', salary:s.salary||'', start_date:s.start_date||'', notes:s.notes||'' });
    setEditing(s.id); setShowForm(true);
  };

  const totalSalaries = staff.reduce((s,m)=>s+Number(m.salary||0),0);
  const totalPaid     = staff.reduce((s,m)=>s+(m.staff_payments||[]).reduce((a,p)=>a+Number(p.amount||0),0),0);

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ flex:1, padding:'2rem', maxWidth:'1100px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>👥 Staff Tracker</h1>
            <p style={{ color:colors.muted }}>Manage employees and salary payments</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ name:'', role:'', phone:'', email:'', salary:'', start_date:'', notes:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Staff
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Staff',    value:staff.filter(s=>s.status==='active').length, color:colors.primary, icon:'👥' },
            { label:'Monthly Payroll',value:fmt(totalSalaries), color:colors.danger,  icon:'💸' },
            { label:'Total Paid',     value:fmt(totalPaid),     color:colors.success, icon:'✅' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.4rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.82rem', margin:'0.5rem 0 0.25rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.2rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
          {staff.length === 0 ? (
            <div style={{ gridColumn:'1/-1', background:'white', borderRadius:'1rem', padding:'3rem', textAlign:'center', color:colors.muted }}>
              <p style={{ fontSize:'2rem' }}>👥</p>
              <p style={{ fontWeight:'600' }}>No staff added yet</p>
            </div>
          ) : staff.map(s => {
            const totalPaidToMember = (s.staff_payments||[]).reduce((a,p)=>a+Number(p.amount||0),0);
            return (
              <div key={s.id} style={{ background:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderLeft:`4px solid ${s.status==='active'?colors.success:colors.muted}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                  <div>
                    <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.25rem' }}>{s.name}</h3>
                    <span style={{ backgroundColor:colors.primaryLight, color:colors.primary, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.78rem', fontWeight:'600' }}>{s.role}</span>
                  </div>
                  <div style={{ display:'flex', gap:'0.4rem', flexDirection:'column', alignItems:'flex-end' }}>
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      <button onClick={()=>edit(s)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Edit</button>
                      <button onClick={()=>del(s.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Del</button>
                    </div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1rem' }}>
                  <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Monthly Salary</p><p style={{ fontWeight:'700', color:colors.dark }}>{fmt(s.salary)}</p></div>
                  <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Total Paid</p><p style={{ fontWeight:'700', color:colors.success }}>{fmt(totalPaidToMember)}</p></div>
                  {s.phone && <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Phone</p><p style={{ fontWeight:'600', fontSize:'0.85rem' }}>{s.phone}</p></div>}
                  {s.start_date && <div><p style={{ fontSize:'0.75rem', color:colors.muted }}>Start Date</p><p style={{ fontWeight:'600', fontSize:'0.85rem' }}>{new Date(s.start_date).toLocaleDateString('en-GB')}</p></div>}
                </div>
                <button onClick={()=>{ setShowPay(s); setPayForm({ amount:s.salary||'', payment_date: new Date().toISOString().split('T')[0], month: MONTHS[new Date().getMonth()], notes:'' }); }}
                  style={{ width:'100%', background:colors.success+'15', color:colors.success, border:`1px solid ${colors.success}40`, padding:'0.6rem', borderRadius:'0.5rem', fontWeight:'700', cursor:'pointer', fontSize:'0.88rem' }}>
                  💵 Record Salary Payment
                </button>
              </div>
            );
          })}
        </div>

        {/* Pay Modal */}
        {showPay && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'420px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>Pay {showPay.name}</h2>
                <button onClick={()=>setShowPay(null)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Amount</label>
                  <input type="number" value={payForm.amount} onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Month</label>
                  <select value={payForm.month} onChange={e=>setPayForm(p=>({...p,month:e.target.value}))} style={inp}>
                    {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Payment Date</label>
                  <input type="date" value={payForm.payment_date} onChange={e=>setPayForm(p=>({...p,payment_date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <input type="text" placeholder="e.g. March salary" value={payForm.notes} onChange={e=>setPayForm(p=>({...p,notes:e.target.value}))} style={inp} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={recordPay} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Record Payment</button>
                <button onClick={()=>setShowPay(null)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'500px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Staff':'Add Staff Member'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                {[
                  { key:'name',       label:'Full Name',    placeholder:'e.g. John Kamau',       col:'1/-1' },
                  { key:'role',       label:'Role / Title', placeholder:'e.g. Carpenter'                    },
                  { key:'phone',      label:'Phone',        placeholder:'e.g. 0712345678'                   },
                  { key:'email',      label:'Email',        placeholder:'e.g. john@gmail.com'               },
                  { key:'salary',     label:'Monthly Salary',placeholder:'e.g. 25000', type:'number'        },
                  { key:'start_date', label:'Start Date',   type:'date'                                     },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.col||'auto' }}>
                    <label style={lbl}>{f.label}</label>
                    <input type={f.type||'text'} placeholder={f.placeholder||''} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inp} />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'70px', resize:'vertical' }} placeholder="Additional notes..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update':'Add Staff'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}