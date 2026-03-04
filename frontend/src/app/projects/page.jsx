'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import colors from '../../lib/colors';
import toast from 'react-hot-toast';
import NavBar from '../../components/NavBar';

export default function ProjectsPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [projects, setProjects] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter,   setFilter]   = useState('all');
  const [form, setForm] = useState({
    name:'', clientId:'', productType:'', contractAmount:'', estimatedCompletion:'', notes:''
  });

  useEffect(() => { if (!user) return; loadAll(); }, [user]);

  const loadAll = async () => {
    try {
      const [p, c] = await Promise.all([
        api.get(`/projects?userId=${user.userId}`),
        api.get(`/clients?userId=${user.userId}`),
      ]);
      setProjects(p.data.projects);
      setClients(c.data.clients);
    } catch { toast.error('Could not load projects'); }
    finally { setLoading(false); }
  };

  const addProject = async () => {
    if (!form.name) { toast.error('Project name is required'); return; }
    try {
      await api.post('/projects', {
        ...form,
        userId:         user.userId,
        contractAmount: Number(form.contractAmount) || 0,
      });
      toast.success(`Project ${form.name} created!`);
      setForm({ name:'', clientId:'', productType:'', contractAmount:'', estimatedCompletion:'', notes:'' });
      setShowForm(false);
      loadAll();
    } catch { toast.error('Could not create project'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/projects/${id}`, { status });
      toast.success(`Marked as ${status}`);
      loadAll();
    } catch { toast.error('Could not update status'); }
  };

  const statusColor = (s) => s === 'active' ? colors.success : s === 'completed' ? colors.primary : colors.warning;

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <div style={{ minHeight:'100vh', backgroundColor: colors.background }}>

      {/* Nav */}
      <NavBar />

      <div style={{ padding:'2rem', maxWidth:'1100px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color: colors.dark }}>🔨 Projects</h1>
            <p style={{ color: colors.muted }}>
              {projects.filter(p=>p.status==='active').length} active &nbsp;•&nbsp;
              {projects.filter(p=>p.status==='completed').length} completed
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={btn(colors.primaryGradient)}>+ New Project</button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ backgroundColor:'white', padding:'1.5rem', borderRadius:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:'1.5rem', borderTop:`4px solid ${colors.primary}` }}>
            <h3 style={{ fontWeight:'700', marginBottom:'1rem', color: colors.dark }}>New Project</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <F label="Project Name *"    value={form.name}                onChange={v=>setForm(p=>({...p,name:v}))} />
              <F label="Product Type"      value={form.productType}         onChange={v=>setForm(p=>({...p,productType:v}))} placeholder="e.g. Bed, Chair, Desk" />
              <F label="Contract Amount"   value={form.contractAmount}      onChange={v=>setForm(p=>({...p,contractAmount:v}))} type="number" />
              <F label="Est. Completion"   value={form.estimatedCompletion} onChange={v=>setForm(p=>({...p,estimatedCompletion:v}))} type="date" />
            </div>
            <div style={{ marginBottom:'0.75rem' }}>
              <label style={lbl}>Client (optional)</label>
              <select value={form.clientId} onChange={e=>setForm(p=>({...p,clientId:e.target.value}))} style={sel}>
                <option value="">-- Select Client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <F label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} />
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
              <button onClick={addProject}              style={btn(colors.primaryGradient)}>Create Project</button>
              <button onClick={() => setShowForm(false)} style={btn(colors.grayGradient)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
          {['all','active','completed','on-hold'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:         '0.4rem 1rem',
              borderRadius:    '999px',
              border:          'none',
              cursor:          'pointer',
              fontWeight:      '600',
              fontSize:        '0.85rem',
              textTransform:   'capitalize',
              backgroundColor: filter === f ? colors.primary : 'white',
              color:           filter === f ? 'white' : colors.muted,
              boxShadow:       '0 1px 4px rgba(0,0,0,0.08)',
            }}>{f === 'all' ? `All (${projects.length})` : f}</button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <p style={{ color: colors.muted }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', backgroundColor:'white', borderRadius:'1rem', color: colors.light }}>
            <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔨</p>
            <p style={{ fontWeight:'600' }}>No projects yet. Create your first project above.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                backgroundColor: 'white',
                borderRadius:    '1rem',
                padding:         '1.25rem',
                boxShadow:       '0 2px 12px rgba(0,0,0,0.06)',
                borderLeft:      `4px solid ${statusColor(p.status)}`,
              }}>
                {/* Status badge */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                  <h3 style={{ fontWeight:'800', color: colors.dark, fontSize:'1rem' }}>{p.name}</h3>
                  <span style={{
                    backgroundColor: statusColor(p.status) + '20',
                    color:           statusColor(p.status),
                    padding:         '0.2rem 0.65rem',
                    borderRadius:    '999px',
                    fontSize:        '0.75rem',
                    fontWeight:      '700',
                    textTransform:   'capitalize',
                  }}>{p.status}</span>
                </div>

                {p.product_type && <p style={{ color: colors.muted, fontSize:'0.85rem', marginBottom:'0.3rem' }}>📦 {p.product_type}</p>}
                {p.clients      && <p style={{ color: colors.muted, fontSize:'0.85rem', marginBottom:'0.3rem' }}>👤 {p.clients.name}</p>}

                <p style={{ color: colors.primary, fontWeight:'800', fontSize:'1.1rem', margin:'0.75rem 0 0.3rem' }}>
                  KSh {Number(p.contract_amount || 0).toLocaleString()}
                </p>

                {p.estimated_completion && (
                  <p style={{ color: colors.light, fontSize:'0.8rem', marginBottom:'0.75rem' }}>
                    📅 Due: {new Date(p.estimated_completion).toLocaleDateString('en-GB')}
                  </p>
                )}

                {/* Status Actions */}
                <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem', borderTop:`1px solid ${colors.divider}`, paddingTop:'0.75rem' }}>
                  {p.status !== 'active' && (
                    <button onClick={() => updateStatus(p.id,'active')} style={smallBtn(colors.success)}>▶ Active</button>
                  )}
                  {p.status !== 'completed' && (
                    <button onClick={() => updateStatus(p.id,'completed')} style={smallBtn(colors.primary)}>✓ Complete</button>
                  )}
                  {p.status !== 'on-hold' && (
                    <button onClick={() => updateStatus(p.id,'on-hold')} style={smallBtn(colors.warning)}>⏸ Hold</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const lbl      = { display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' };
const sel      = { width:'100%', padding:'0.65rem 0.9rem', border:`1.5px solid #E2E8F0`, borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem' };
const btn      = bg => ({ background:bg, color:'white', border:'none', padding:'0.65rem 1.3rem', borderRadius:'0.6rem', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' });
const smallBtn = bg => ({ backgroundColor:bg, color:'white', border:'none', padding:'0.3rem 0.75rem', borderRadius:'0.4rem', cursor:'pointer', fontWeight:'600', fontSize:'0.78rem' });

function F({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div style={{ marginBottom:'0.5rem' }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid #E2E8F0', borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem', boxSizing:'border-box' }} />
    </div>
  );
}