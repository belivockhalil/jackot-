'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const router       = useRouter();
  const [entries,   setEntries]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form, setForm] = useState({
    date:'', amount:'', type:'general', collectionPoint:'cash',
    referenceCode:'', supplierId:'', projectId:'', notes:''
  });

  const sym = settings?.currency_symbol || 'KSh';

  useEffect(() => { if (!user) return; loadAll(); }, [user]);

  const loadAll = async () => {
    try {
      const [e, s, p] = await Promise.all([
        api.get(`/expenses?userId=${user.userId}`),
        api.get(`/suppliers?userId=${user.userId}`),
        api.get(`/projects?userId=${user.userId}`),
      ]);
      setEntries(e.data.entries);
      setSuppliers(s.data.suppliers);
      setProjects(p.data.projects);
    } catch { toast.error('Could not load expenses'); }
    finally { setLoading(false); }
  };

  const recordExpense = async () => {
    if (!form.amount || !form.date) { toast.error('Date and amount are required'); return; }
    try {
      await api.post('/expenses', {
        ...form,
        userId:     user.userId,
        amount:     Number(form.amount),
        supplierId: form.supplierId || null,
        projectId:  form.projectId  || null,
      });
      toast.success(`Expense of ${sym} ${Number(form.amount).toLocaleString()} recorded!`);
      setForm({ date:'', amount:'', type:'general', collectionPoint:'cash', referenceCode:'', supplierId:'', projectId:'', notes:'' });
      setShowForm(false);
      loadAll();
    } catch { toast.error('Could not record expense'); }
  };

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted');
      loadAll();
    } catch { toast.error('Could not delete'); }
  };

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  // Group by type for summary
  const byType = entries.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + Number(e.amount);
    return acc;
  }, {});

  return (
    <div style={{ minHeight:'100vh', backgroundColor: colors.background }}>
      <NavBar />

      <div style={{ padding:'2rem', maxWidth:'1000px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color: colors.dark }}>💸 Expenses</h1>
            <p style={{ color: colors.danger, fontWeight:'800', fontSize:'1.2rem' }}>
              Total: {sym} {total.toLocaleString()}
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={btn(colors.dangerGradient)}>+ Record Expense</button>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          <SummaryCard label="Total Recorded" value={`${sym} ${total.toLocaleString()}`}                              color={colors.danger}  icon="💸" />
          <SummaryCard label="General"         value={`${sym} ${(byType.general||0).toLocaleString()}`}              color={colors.warning} icon="🧾" />
          <SummaryCard label="Direct (Project)"value={`${sym} ${(byType.direct||0).toLocaleString()}`}               color={colors.primary} icon="🔨" />
          <SummaryCard label="No. of Entries"  value={entries.length}                                                 color={colors.purple}  icon="📋" />
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ backgroundColor:'white', padding:'1.5rem', borderRadius:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:'1.5rem', borderTop:`4px solid ${colors.danger}` }}>
            <h3 style={{ fontWeight:'700', marginBottom:'1rem', color: colors.dark }}>Record Expense</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <F label="Date *"            value={form.date}          onChange={v=>setForm(p=>({...p,date:v}))} type="date" />
              <F label={`Amount (${sym}) *`} value={form.amount}      onChange={v=>setForm(p=>({...p,amount:v}))} type="number" />
              <F label="Reference Code"    value={form.referenceCode} onChange={v=>setForm(p=>({...p,referenceCode:v}))} placeholder="Receipt / ref number" />
              <div>
                <label style={lbl}>Expense Type</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={sel}>
                  <option value="general">General</option>
                  <option value="direct">Direct (Project)</option>
                  <option value="personal">Personal</option>
                  <option value="salary">Salary</option>
                  <option value="utility">Utility</option>
                  <option value="transport">Transport</option>
                  <option value="materials">Materials</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Payment Method</label>
                <select value={form.collectionPoint} onChange={e=>setForm(p=>({...p,collectionPoint:e.target.value}))} style={sel}>
                  <option value="cash">Cash</option>
                  <option value="mpesa">Mpesa</option>
                  <option value="kcb">KCB Bank</option>
                  <option value="ncba">NCBA Bank</option>
                  <option value="equity">Equity Bank</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Supplier (optional)</label>
                <select value={form.supplierId} onChange={e=>setForm(p=>({...p,supplierId:e.target.value}))} style={sel}>
                  <option value="">-- None --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Project (optional)</label>
                <select value={form.projectId} onChange={e=>setForm(p=>({...p,projectId:e.target.value}))} style={sel}>
                  <option value="">-- None --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <F label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} />
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
              <button onClick={recordExpense}            style={btn(colors.dangerGradient)}>Save Expense</button>
              <button onClick={() => setShowForm(false)} style={btn(colors.grayGradient)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ backgroundColor:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background: colors.dangerGradient }}>
                {['Date','Amount','Type','Payment','Supplier','Project','Notes',''].map(h => (
                  <th key={h} style={{ padding:'0.85rem 1rem', textAlign:'left', color:'white', fontWeight:'600', fontSize:'0.85rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding:'3rem', textAlign:'center', color: colors.light }}>Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'3rem', textAlign:'center', color: colors.light }}>No expenses recorded yet.</td></tr>
              ) : entries.map((e, i) => (
                <tr key={e.id} style={{ backgroundColor:i%2===0?'white':'#F8FAFC', borderBottom:`1px solid ${colors.divider}` }}>
                  <td style={td}>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td style={td}><span style={{ color: colors.danger, fontWeight:'800' }}>{sym} {Number(e.amount).toLocaleString()}</span></td>
                  <td style={td}>
                    <span style={{ backgroundColor: colors.warning+'20', color: colors.warning, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:'600', textTransform:'capitalize' }}>
                      {e.type}
                    </span>
                  </td>
                  <td style={td}>{e.collection_point||'—'}</td>
                  <td style={td}>{e.suppliers?.name||'—'}</td>
                  <td style={td}>{e.projects?.name||'—'}</td>
                  <td style={td}>{e.notes||'—'}</td>
                  <td style={td}><button onClick={() => deleteEntry(e.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem', opacity:0.4 }}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderTop:`4px solid ${color}` }}>
      <span style={{ fontSize:'1.4rem' }}>{icon}</span>
      <p style={{ color:'#64748B', fontSize:'0.82rem', marginTop:'0.5rem', marginBottom:'0.25rem' }}>{label}</p>
      <p style={{ color:'#1E293B', fontSize:'1.2rem', fontWeight:'800' }}>{value}</p>
    </div>
  );
}

const lbl = { display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' };
const sel = { width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid #E2E8F0', borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem' };
const td  = { padding:'0.85rem 1rem', fontSize:'0.9rem', color:'#374151' };
const btn = bg => ({ background:bg, color:'white', border:'none', padding:'0.65rem 1.3rem', borderRadius:'0.6rem', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' });
function F({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div style={{ marginBottom:'0.5rem' }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid #E2E8F0', borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem', boxSizing:'border-box' }} />
    </div>
  );
}