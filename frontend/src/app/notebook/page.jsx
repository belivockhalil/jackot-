'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const NOTE_TYPES = ['general','project','idea','reminder','meeting','todo'];
const TYPE_COLORS = { general:colors.primary, project:colors.success, idea:colors.warning, reminder:colors.danger, meeting:colors.purple, todo:colors.teal||'#0891B2' };
const TYPE_ICONS  = { general:'📝', project:'🔨', idea:'💡', reminder:'🔔', meeting:'👥', todo:'✅' };

export default function NotebookPage() {
  const { user } = useAuth();
  const [notes,    setNotes]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [form, setForm] = useState({ type:'general', content:'', tags:'', project_id:'' });

  useEffect(() => { if (user) { load(); loadProjects(); } }, [user]);

  const load = async () => {
    try {
      const res = await api.get(`/notebook?userId=${user.userId}`);
      setNotes(res.data.notes || []);
    } catch { toast.error('Failed to load notes'); }
    finally { setLoading(false); }
  };

  const loadProjects = async () => {
    try {
      const res = await api.get(`/projects?userId=${user.userId}`);
      setProjects(res.data.projects || []);
    } catch {}
  };

  const save = async () => {
    if (!form.content.trim()) return toast.error('Content required');
    try {
      const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
      if (editing) {
        await api.put(`/notebook/${editing}`, { ...form, tags, userId: user.userId });
        toast.success('Note updated');
      } else {
        await api.post('/notebook', { ...form, tags, userId: user.userId });
        toast.success('Note saved');
      }
      setShowForm(false); setEditing(null);
      setForm({ type:'general', content:'', tags:'', project_id:'' });
      load();
    } catch { toast.error('Failed to save note'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this note?')) return;
    await api.delete(`/notebook/${id}`);
    toast.success('Deleted'); load();
  };

  const edit = (n) => {
    setForm({ type:n.type||'general', content:n.content||'', tags:(n.tags||[]).join(', '), project_id:n.project_id||'' });
    setEditing(n.id); setShowForm(true);
  };

  const filtered = notes.filter(n => {
    const matchType   = filter === 'all' || n.type === filter;
    const matchSearch = !search || n.content.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const inp = { width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.82rem', fontWeight:'600', color:colors.medium, marginBottom:'0.3rem', display:'block' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><p>Loading...</p></div>;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ padding:'2rem', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>📓 Notebook</h1>
            <p style={{ color:colors.muted }}>Notes, ideas, reminders and todos</p>
          </div>
          <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ type:'general', content:'', tags:'', project_id:'' }); }}
            style={{ background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:'700', cursor:'pointer' }}>
            + New Note
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <input type="text" placeholder="🔍 Search notes..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ flex:1, minWidth:'200px', padding:'0.65rem 1rem', borderRadius:'0.65rem', border:`1px solid ${colors.border}`, fontSize:'0.9rem', outline:'none' }} />
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {['all',...NOTE_TYPES].map(t => (
              <button key={t} onClick={()=>setFilter(t)} style={{
                padding:'0.5rem 0.9rem', borderRadius:'999px', border:'none', cursor:'pointer',
                fontWeight:'600', fontSize:'0.82rem', textTransform:'capitalize',
                backgroundColor: filter===t ? colors.primary : 'white',
                color:           filter===t ? 'white' : colors.muted,
                boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
              }}>{TYPE_ICONS[t]||'📋'} {t}</button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {filtered.length === 0 ? (
          <div style={{ background:'white', borderRadius:'1rem', padding:'3rem', textAlign:'center', color:colors.muted }}>
            <p style={{ fontSize:'2rem' }}>📓</p>
            <p style={{ fontWeight:'600' }}>{search||filter!=='all' ? 'No notes match your filter' : 'No notes yet — create your first note!'}</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
            {filtered.map(n => {
              const typeColor = TYPE_COLORS[n.type] || colors.primary;
              return (
                <div key={n.id} style={{ background:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${typeColor}`, position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                    <span style={{ backgroundColor:typeColor+'20', color:typeColor, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.78rem', fontWeight:'700', textTransform:'capitalize' }}>
                      {TYPE_ICONS[n.type]} {n.type}
                    </span>
                    <span style={{ fontSize:'0.75rem', color:colors.muted }}>{new Date(n.date).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p style={{ color:colors.dark, fontSize:'0.9rem', lineHeight:'1.6', marginBottom:'0.75rem', whiteSpace:'pre-wrap' }}>{n.content}</p>
                  {n.projects?.name && <p style={{ fontSize:'0.78rem', color:colors.success, marginBottom:'0.5rem' }}>🔨 {n.projects.name}</p>}
                  {n.tags?.length > 0 && (
                    <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap', marginBottom:'0.75rem' }}>
                      {n.tags.map((t,i) => <span key={i} style={{ backgroundColor:colors.background, color:colors.muted, padding:'0.15rem 0.5rem', borderRadius:'999px', fontSize:'0.75rem' }}>#{t}</span>)}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={()=>edit(n)} style={{ background:colors.primaryLight, color:colors.primary, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Edit</button>
                    <button onClick={()=>del(n.id)} style={{ background:colors.danger+'20', color:colors.danger, border:'none', padding:'0.3rem 0.6rem', borderRadius:'0.4rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600' }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', width:'520px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark }}>{editing?'Edit Note':'New Note'}</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:colors.muted }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Type</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={inp}>
                    {NOTE_TYPES.map(t=><option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Content</label>
                  <textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} style={{ ...inp, height:'150px', resize:'vertical' }} placeholder="Write your note here..." />
                </div>
                <div>
                  <label style={lbl}>Link to Project (optional)</label>
                  <select value={form.project_id} onChange={e=>setForm(p=>({...p,project_id:e.target.value}))} style={inp}>
                    <option value="">— No project —</option>
                    {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Tags (comma separated)</label>
                  <input type="text" placeholder="e.g. urgent, client, follow-up" value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} style={inp} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
                <button onClick={save} style={{ flex:1, background:colors.primaryGradient, color:'white', border:'none', padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>{editing?'Update':'Save Note'}</button>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, background:colors.background, color:colors.dark, border:`1px solid ${colors.border}`, padding:'0.75rem', borderRadius:'0.65rem', fontWeight:'700', cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}