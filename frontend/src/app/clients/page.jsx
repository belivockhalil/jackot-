'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import NavBar from '../../components/NavBar';

export default function ClientsPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', email:'', location:'', notes:'' });

  useEffect(() => {
  if (!user) return;
  loadClients();
}, [user]);

  const loadClients = async () => {
    try {
      const res = await api.get(`/clients?userId=${user.userId}`);
      setClients(res.data.clients);
    } catch { toast.error('Could not load clients'); }
    finally { setLoading(false); }
  };

  const addClient = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      await api.post('/clients', { ...form, userId: user.userId });
      toast.success(`${form.name} added!`);
      setForm({ name:'', phone:'', email:'', location:'', notes:'' });
      setShowForm(false); loadClients();
    } catch { toast.error('Could not add client'); }
  };

  const deleteClient = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Deleted'); loadClients();
    } catch { toast.error('Could not delete'); }
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F1F5F9' }}>
      <TopBar />
      <div style={{ padding:'2rem', maxWidth:'1000px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:'#1E293B' }}>👤 Clients</h1>
            <p style={{ color:'#64748B' }}>{clients.length} total clients</p>
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <BackBtn />
            <button onClick={() => setShowForm(!showForm)} style={btn('linear-gradient(135deg,#0EA5E9,#0284C7)')}>+ Add Client</button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ backgroundColor:'white', padding:'1.5rem', borderRadius:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:'1.5rem', borderTop:'4px solid #0EA5E9' }}>
            <h3 style={{ fontWeight:'700', marginBottom:'1rem', color:'#1E293B' }}>New Client</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <F label="Name *"    value={form.name}     onChange={v => setForm(p=>({...p,name:v}))} />
              <F label="Phone"     value={form.phone}    onChange={v => setForm(p=>({...p,phone:v}))} />
              <F label="Email"     value={form.email}    onChange={v => setForm(p=>({...p,email:v}))} />
              <F label="Location"  value={form.location} onChange={v => setForm(p=>({...p,location:v}))} />
            </div>
            <F label="Notes" value={form.notes} onChange={v => setForm(p=>({...p,notes:v}))} />
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
              <button onClick={addClient}              style={btn('linear-gradient(135deg,#0EA5E9,#0284C7)')}>Save Client</button>
              <button onClick={() => setShowForm(false)} style={btn('#94A3B8')}>Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ backgroundColor:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'linear-gradient(135deg,#0EA5E9,#0284C7)' }}>
                {['Name','Phone','Location','Billed','Paid','Balance',''].map(h => (
                  <th key={h} style={{ padding:'0.85rem 1rem', textAlign:'left', color:'white', fontWeight:'600', fontSize:'0.85rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'#94A3B8' }}>Loading...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'#94A3B8' }}>No clients yet. Add your first client above.</td></tr>
              ) : clients.map((c, i) => {
                const bal = Number(c.total_billed||0) - Number(c.total_paid||0);
                return (
                  <tr key={c.id} style={{ backgroundColor:i%2===0?'white':'#F8FAFC', borderBottom:'1px solid #F1F5F9', transition:'background 0.1s' }}>
                    <td style={td}><span style={{ fontWeight:'700', color:'#1E293B' }}>{c.name}</span></td>
                    <td style={td}>{c.phone||'—'}</td>
                    <td style={td}>{c.location||'—'}</td>
                    <td style={td}>KSh {Number(c.total_billed||0).toLocaleString()}</td>
                    <td style={td}>KSh {Number(c.total_paid||0).toLocaleString()}</td>
                    <td style={td}><span style={{ color:bal>0?'#EF4444':'#10B981', fontWeight:'700', backgroundColor:bal>0?'#FEF2F2':'#F0FDF4', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.85rem' }}>KSh {bal.toLocaleString()}</span></td>
                    <td style={td}><button onClick={() => deleteClient(c.id, c.name)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', opacity:0.5 }}>🗑️</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const td  = { padding:'0.85rem 1rem', fontSize:'0.9rem', color:'#374151' };
const btn = bg => ({ background:bg, color:'white', border:'none', padding:'0.65rem 1.3rem', borderRadius:'0.6rem', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' });
const BackBtn = () => <a href="/dashboard" style={{ ...btn('#64748B'), textDecoration:'none', display:'inline-block' }}>← Dashboard</a>;
function TopBar() {
  return (
    <nav style={{ background:'linear-gradient(135deg,#1E3A8A,#1D4ED8)', padding:'0 2rem', height:'64px', display:'flex', alignItems:'center', boxShadow:'0 4px 20px rgba(29,78,216,0.3)' }}>
      <a href="/dashboard" style={{ color:'white', textDecoration:'none', fontWeight:'900', fontSize:'1.3rem' }}>⚡ Jackot</a>
    </nav>
  );
}
function F({ label, value, onChange, type='text' }) {
  return (
    <div style={{ marginBottom:'0.5rem' }}>
      <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid #E2E8F0', borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem', boxSizing:'border-box' }} />
    </div>
  );
}