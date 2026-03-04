'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [profLoad, setProfLoad] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', email:'', location:'', notes:'' });

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/clients?userId=${user.userId}`);
      setClients(res.data.clients || []);
    } catch { toast.error('Could not load clients'); }
    finally { setLoading(false); }
  };

  const openProfile = async (c) => {
    setSelected(c);
    setProfLoad(true);
    try {
      const [incRes, projRes, quoteRes, invRes] = await Promise.all([
        api.get(`/income?userId=${user.userId}`),
        api.get(`/projects?userId=${user.userId}`),
        api.get(`/quotes?userId=${user.userId}`).catch(()=>({ data:{ quotes:[] } })),
        api.get(`/invoices?userId=${user.userId}`).catch(()=>({ data:{ invoices:[] } })),
      ]);
      const income   = (incRes.data.income   || incRes.data.entries || []).filter(e => e.client_id === c.id || e.clients?.id === c.id || e.clients?.name === c.name);
      const projects = (projRes.data.projects || []).filter(p => p.client_id === c.id || p.client_name === c.name);
      const quotes   = (quoteRes.data.quotes  || []).filter(q => q.client_id === c.id);
      const invoices = (invRes.data.invoices  || []).filter(i => i.client_id === c.id);
      setProfile({ income, projects, quotes, invoices });
    } catch (e) { console.error(e); }
    finally { setProfLoad(false); }
  };

  const save = async () => {
    if (!form.name) return toast.error('Name is required');
    try {
      if (editing) {
        await api.put(`/clients/${editing}`, { ...form, userId: user.userId });
        toast.success('Client updated');
      } else {
        await api.post('/clients', { ...form, userId: user.userId });
        toast.success(`${form.name} added!`);
      }
      setForm({ name:'', phone:'', email:'', location:'', notes:'' });
      setShowForm(false); setEditing(null); load();
    } catch { toast.error('Could not save client'); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    await api.delete(`/clients/${id}`);
    toast.success('Deleted'); load();
    if (selected?.id === id) setSelected(null);
  };

  const edit = (c) => {
    setForm({ name:c.name||'', phone:c.phone||'', email:c.email||'', location:c.location||'', notes:c.notes||'' });
    setEditing(c.id); setShowForm(true);
  };

  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()));
  const fmt = n => `KSh ${Number(n||0).toLocaleString()}`;
  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ flex:1, padding:'2rem', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>👤 Clients</h1>
            <p style={{ color:colors.muted }}>{clients.length} total clients</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ name:'', phone:'', email:'', location:'', notes:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + Add Client
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Total Clients', value:clients.length, color:colors.primary, icon:'👤' },
            { label:'Total Billed',  value:fmt(clients.reduce((s,c)=>s+Number(c.total_billed||0),0)), color:colors.blue||colors.primary, icon:'📄' },
            { label:'Total Paid',    value:fmt(clients.reduce((s,c)=>s+Number(c.total_paid||0),0)),   color:colors.success, icon:'✅' },
            { label:'Outstanding',   value:fmt(clients.reduce((s,c)=>s+Math.max(0,Number(c.total_billed||0)-Number(c.total_paid||0)),0)), color:colors.danger, icon:'⏳' },
          ].map((c,i) => (
            <div key={i} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${c.color}` }}>
              <span style={{ fontSize:'1.3rem' }}>{c.icon}</span>
              <p style={{ color:colors.muted, fontSize:'0.8rem', margin:'0.4rem 0 0.2rem', fontWeight:'500' }}>{c.label}</p>
              <p style={{ color:colors.dark, fontSize:'1.1rem', fontWeight:'800' }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap:'1.5rem' }}>

          {/* Clients List */}
          <div>
            <div style={{ marginBottom:'1rem' }}>
              <input type="text" placeholder="🔍 Search clients..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ ...inp, width:'100%' }} />
            </div>
            <div style={{ background:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ padding:'3rem', textAlign:'center', color:colors.muted }}>
                  <p style={{ fontSize:'2rem' }}>👤</p>
                  <p style={{ fontWeight:'600' }}>No clients found</p>
                </div>
              ) : filtered.map((c,i) => {
                const bal = Number(c.total_billed||0) - Number(c.total_paid||0);
                const isSelected = selected?.id === c.id;
                return (
                  <div key={c.id} onClick={()=>openProfile(c)}
                    style={{ padding:'1rem 1.25rem', borderBottom:`1px solid ${colors.divider}`, cursor:'pointer', backgroundColor: isSelected ? colors.primaryLight : i%2===0?'white':'#FAFAFA', borderLeft: isSelected ? `4px solid ${colors.primary}` : '4px solid transparent', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <p style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.2rem' }}>{c.name}</p>
                        <p style={{ fontSize:'0.82rem', color:colors.muted }}>{c.phone||''} {c.location ? `• ${c.location}` : ''}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span style={{ fontWeight:'800', fontSize:'0.9rem', color: bal>0?colors.danger:colors.success, backgroundColor:(bal>0?colors.danger:colors.success)+'15', padding:'0.2rem 0.6rem', borderRadius:'999px' }}>
                          {bal>0 ? `Owes ${fmt(bal)}` : '✅ Cleared'}
                        </span>
                        <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.5rem', justifyContent:'flex-end' }}>
                          <button onClick={e=>{ e.stopPropagation(); edit(c); }} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.2rem 0.5rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.75rem', fontWeight:'600' }}>Edit</button>
                          <button onClick={e=>{ e.stopPropagation(); del(c.id,c.name); }} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.2rem 0.5rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.75rem', fontWeight:'600' }}>Del</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Profile Panel */}
          {selected && (
            <div style={{ background:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden', height:'fit-content' }}>
              {/* Profile Header */}
              <div style={{ background:colors.primaryGradient, padding:'1.5rem', color:'white', position:'relative' }}>
                <button onClick={()=>{ setSelected(null); setProfile(null); }} style={{ position:'absolute', top:'1rem', right:'1rem', background:'rgba(255,255,255,0.2)', border:'none', color:'white', width:'28px', height:'28px', borderRadius:'50%', cursor:'pointer', fontWeight:'700', fontSize:'1rem' }}>✕</button>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', marginBottom:'0.75rem' }}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ fontWeight:'800', fontSize:'1.3rem', marginBottom:'0.25rem' }}>{selected.name}</h2>
                <p style={{ opacity:0.85, fontSize:'0.9rem' }}>{selected.location || 'No location'}</p>
              </div>

              {/* Contact Info */}
              <div style={{ padding:'1.25rem', borderBottom:`1px solid ${colors.divider}` }}>
                <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.75rem', fontSize:'0.95rem' }}>📋 Contact Details</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  {[
                    { label:'Phone',    value:selected.phone    || '—' },
                    { label:'Email',    value:selected.email    || '—' },
                    { label:'Location', value:selected.location || '—' },
                    { label:'Notes',    value:selected.notes    || '—' },
                  ].map((row,i) => (
                    <div key={i}>
                      <p style={{ fontSize:'0.75rem', color:colors.muted, marginBottom:'0.1rem' }}>{row.label}</p>
                      <p style={{ fontWeight:'600', color:colors.dark, fontSize:'0.88rem', wordBreak:'break-all' }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ padding:'1.25rem', borderBottom:`1px solid ${colors.divider}` }}>
                <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.75rem', fontSize:'0.95rem' }}>💰 Financial Summary</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
                  {[
                    { label:'Total Billed', value:fmt(selected.total_billed), color:colors.primary },
                    { label:'Total Paid',   value:fmt(selected.total_paid),   color:colors.success },
                    { label:'Balance',      value:fmt(Number(selected.total_billed||0)-Number(selected.total_paid||0)), color:Number(selected.total_billed||0)-Number(selected.total_paid||0)>0?colors.danger:colors.success },
                  ].map((row,i) => (
                    <div key={i} style={{ background:colors.background, borderRadius:'0.65rem', padding:'0.75rem', textAlign:'center' }}>
                      <p style={{ fontSize:'0.72rem', color:colors.muted, marginBottom:'0.25rem' }}>{row.label}</p>
                      <p style={{ fontWeight:'800', color:row.color, fontSize:'0.9rem' }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {profLoad ? (
                <div style={{ padding:'2rem', textAlign:'center', color:colors.muted }}>Loading activity...</div>
              ) : profile && (
                <>
                  {/* Projects */}
                  <div style={{ padding:'1.25rem', borderBottom:`1px solid ${colors.divider}` }}>
                    <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.75rem', fontSize:'0.95rem' }}>🔨 Projects ({profile.projects.length})</h3>
                    {profile.projects.length === 0 ? <p style={{ color:colors.muted, fontSize:'0.85rem' }}>No projects yet</p> : profile.projects.map(p => (
                      <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:`1px solid ${colors.divider}` }}>
                        <div>
                          <p style={{ fontWeight:'600', color:colors.dark, fontSize:'0.88rem' }}>{p.name}</p>
                          <span style={{ fontSize:'0.75rem', color: p.status==='completed'?colors.success:colors.warning, fontWeight:'600', textTransform:'capitalize' }}>{p.status}</span>
                        </div>
                        <p style={{ fontWeight:'700', color:colors.primary, fontSize:'0.88rem' }}>{fmt(p.contract_amount)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Income */}
                  <div style={{ padding:'1.25rem', borderBottom:`1px solid ${colors.divider}` }}>
                    <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.75rem', fontSize:'0.95rem' }}>💵 Payments Received ({profile.income.length})</h3>
                    {profile.income.length === 0 ? <p style={{ color:colors.muted, fontSize:'0.85rem' }}>No payments recorded</p> : profile.income.slice(0,5).map(e => (
                      <div key={e.id} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:`1px solid ${colors.divider}` }}>
                        <div>
                          <p style={{ fontSize:'0.85rem', color:colors.dark }}>{e.notes || e.collection_point || 'Payment'}</p>
                          <p style={{ fontSize:'0.75rem', color:colors.muted }}>{e.date ? new Date(e.date).toLocaleDateString('en-GB') : ''}</p>
                        </div>
                        <p style={{ fontWeight:'700', color:colors.success, fontSize:'0.88rem' }}>{fmt(e.amount)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quotes */}
                  {profile.quotes.length > 0 && (
                    <div style={{ padding:'1.25rem', borderBottom:`1px solid ${colors.divider}` }}>
                      <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.75rem', fontSize:'0.95rem' }}>📋 Quotes ({profile.quotes.length})</h3>
                      {profile.quotes.map(q => (
                        <div key={q.id} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:`1px solid ${colors.divider}` }}>
                          <div>
                            <p style={{ fontWeight:'600', color:colors.dark, fontSize:'0.88rem' }}>{q.quote_number || 'Quote'}</p>
                            <span style={{ fontSize:'0.75rem', color:colors.muted, textTransform:'capitalize' }}>{q.status}</span>
                          </div>
                          <p style={{ fontWeight:'700', color:colors.primary, fontSize:'0.88rem' }}>{fmt(q.total_amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Invoices */}
                  {profile.invoices.length > 0 && (
                    <div style={{ padding:'1.25rem' }}>
                      <h3 style={{ fontWeight:'700', color:colors.dark, marginBottom:'0.75rem', fontSize:'0.95rem' }}>🧾 Invoices ({profile.invoices.length})</h3>
                      {profile.invoices.map(inv => (
                        <div key={inv.id} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:`1px solid ${colors.divider}` }}>
                          <div>
                            <p style={{ fontWeight:'600', color:colors.dark, fontSize:'0.88rem' }}>{inv.invoice_number || 'Invoice'}</p>
                            <span style={{ fontSize:'0.75rem', color:colors.muted, textTransform:'capitalize' }}>{inv.status}</span>
                          </div>
                          <p style={{ fontWeight:'700', color:colors.primary, fontSize:'0.88rem' }}>{fmt(inv.total_amount || inv.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'480px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing ? 'Edit Client' : 'New Client'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                {[
                  { key:'name',     label:'Full Name *',  placeholder:'e.g. John Kamau',       col:'1/-1' },
                  { key:'phone',    label:'Phone',        placeholder:'e.g. 0712345678'                   },
                  { key:'email',    label:'Email',        placeholder:'e.g. john@gmail.com'               },
                  { key:'location', label:'Location',     placeholder:'e.g. Nairobi'                      },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn:f.col||'auto' }}>
                    <label style={lbl}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inp} />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, height:'80px', resize:'vertical' }} placeholder="Additional notes..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update Client':'Save Client'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}