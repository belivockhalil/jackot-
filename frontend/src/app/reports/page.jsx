'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CHART_TYPES = [
  { value:'bar',   label:'📊 Bar'   },
  { value:'line',  label:'📈 Line'  },
  { value:'area',  label:'🏔️ Area'  },
  { value:'radar', label:'🕸️ Radar' },
];

export default function ReportsPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const [monthly,    setMonthly]    = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [debtors,    setDebtors]    = useState([]);
  const [creditors,  setCreditors]  = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [chartType,  setChartType]  = useState('bar');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat,    setExportFormat]    = useState('excel');
  const [exportOptions, setExportOptions] = useState({
    summary:true, monthly:true, debtors:true,
    creditors:true, topClients:true, income:true, expenses:true,
  });
  const chartRef = useRef(null);
  const pieRef   = useRef(null);

  const sym = settings?.currency_symbol || 'KSh';
  const biz = settings?.business_name   || 'My Business';
  const fmt = (n) => `${sym} ${Number(n||0).toLocaleString()}`;
  const num = (n) => Number(n||0);
  const btn = bg => ({ background:bg, color:'white', border:'none', padding:'0.65rem 1.3rem', borderRadius:'0.6rem', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' });
  const td  = { padding:'0.85rem 1rem', fontSize:'0.9rem', color:'#374151' };

  useEffect(() => { if (!user) return; loadAll(); }, [user]);

  const loadAll = async () => {
    try {
      const [m,s,d,c,t] = await Promise.all([
        api.get(`/reports/monthly?userId=${user.userId}`),
        api.get(`/reports/summary?userId=${user.userId}`),
        api.get(`/reports/debtors?userId=${user.userId}`),
        api.get(`/reports/creditors?userId=${user.userId}`),
        api.get(`/reports/top-clients?userId=${user.userId}`),
      ]);
      setMonthly((m.data.monthly||[]).map((x,i)=>({...x,name:MONTHS[i]})));
      setSummary(s.data.summary);
      setDebtors(d.data.debtors    ||[]);
      setCreditors(c.data.creditors||[]);
      setTopClients(t.data.clients ||[]);
    } catch { toast.error('Could not load reports'); }
    finally { setLoading(false); }
  };

  const toggleExport = (key) => setExportOptions(p=>({...p,[key]:!p[key]}));

  // ── EXCEL EXPORT ──────────────────────────────────
  const exportToExcel = async () => {
  toast('Building Excel file...', { icon: '⏳' });
  try {
    const params = new URLSearchParams({ userId: user.userId });
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/excel/export?${params}`);    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Export failed');
    }
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${settings?.business_name || 'Export'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Excel downloaded!');
  } catch (err) {
    console.error(err);
    toast.error(err.message || 'Export failed — check backend is running');
  }
};

  const runExport = async () => {
    setShowExportModal(false);
    if (exportFormat==='excel') await exportToExcel();
    else await downloadReport();
  };

  const pieData = [
    { name:'Income',   value:num(summary?.totalIncome),   color:colors.success },
    { name:'Expenses', value:num(summary?.totalExpenses), color:colors.danger  },
    { name:'They Owe', value:num(summary?.totalDebtors),  color:colors.warning },
    { name:'I Owe',    value:num(summary?.totalCreditors),color:colors.purple  },
  ];

  const renderMainChart = () => {
    const common = { data:monthly, margin:{top:5,right:20,left:0,bottom:5} };
    const grid   = <CartesianGrid strokeDasharray="3 3" stroke={colors.divider} />;
    const xAxis  = <XAxis dataKey="name" fontSize={11} />;
    const yAxis  = <YAxis fontSize={11} tickFormatter={v=>`${sym}${(v/1000).toFixed(0)}k`} />;
    const tip    = <Tooltip formatter={v=>fmt(v)} />;
    const legend = <Legend />;
    if (chartType==='bar') return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart {...common}>{grid}{xAxis}{yAxis}{tip}{legend}
          <Bar dataKey="income"   name="Income"   fill={colors.success} radius={[4,4,0,0]} />
          <Bar dataKey="expenses" name="Expenses" fill={colors.danger}  radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    );
    if (chartType==='line') return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart {...common}>{grid}{xAxis}{yAxis}{tip}{legend}
          <Line type="monotone" dataKey="income"   name="Income"   stroke={colors.success} strokeWidth={2} dot={{r:4}} />
          <Line type="monotone" dataKey="expenses" name="Expenses" stroke={colors.danger}  strokeWidth={2} dot={{r:4}} />
        </LineChart>
      </ResponsiveContainer>
    );
    if (chartType==='area') return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart {...common}>{grid}{xAxis}{yAxis}{tip}{legend}
          <defs>
            <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colors.success} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colors.success} stopOpacity={0}  />
            </linearGradient>
            <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colors.danger} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colors.danger} stopOpacity={0}  />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="income"   name="Income"   stroke={colors.success} fill="url(#incG)" strokeWidth={2}/>
          <Area type="monotone" dataKey="expenses" name="Expenses" stroke={colors.danger}  fill="url(#expG)" strokeWidth={2}/>
        </AreaChart>
      </ResponsiveContainer>
    );
    if (chartType==='radar') return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={monthly}>
          <PolarGrid/><PolarAngleAxis dataKey="name" fontSize={11}/>
          <PolarRadiusAxis fontSize={9} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
          <Radar name="Income"   dataKey="income"   stroke={colors.success} fill={colors.success} fillOpacity={0.3}/>
          <Radar name="Expenses" dataKey="expenses" stroke={colors.danger}  fill={colors.danger}  fillOpacity={0.3}/>
          <Legend/><Tooltip formatter={v=>fmt(v)}/>
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const ChartTypeButtons = () => (
    <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
      {CHART_TYPES.map(ct => (
        <button key={ct.value} onClick={()=>setChartType(ct.value)} style={{
          padding:'0.4rem 0.9rem', borderRadius:'0.5rem', border:'none', cursor:'pointer',
          fontWeight:'600', fontSize:'0.82rem',
          backgroundColor: chartType===ct.value?colors.primary:colors.background,
          color:           chartType===ct.value?'white':colors.muted,
        }}>{ct.label}</button>
      ))}
    </div>
  );

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:colors.background }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📊</div>
        <p style={{ color:colors.primary, fontWeight:'600' }}>Loading reports...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', backgroundColor:colors.background }}>
      <NavBar />
      <div style={{ padding:'2rem', maxWidth:'1100px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color:colors.dark }}>📊 Reports</h1>
            <p style={{ color:colors.muted }}>Financial overview for {biz}</p>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ backgroundColor:'white', padding:'0.75rem 1.25rem', borderRadius:'0.75rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ color:colors.muted, fontSize:'0.8rem' }}>Year</p>
              <p style={{ color:colors.dark, fontWeight:'800', fontSize:'1.1rem' }}>{new Date().getFullYear()}</p>
            </div>
            <button onClick={()=>{ setExportFormat('excel'); setShowExportModal(true); }} style={btn(colors.successGradient)}>📊 Export Excel</button>
            <button onClick={()=>{ setExportFormat('pdf');   setShowExportModal(true); }} style={btn(colors.primaryGradient)}>⬇ Download PDF</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          <SCard label="Total Income"   value={fmt(summary?.totalIncome)}   color={colors.success} icon="💰"/>
          <SCard label="Total Expenses" value={fmt(summary?.totalExpenses)} color={colors.danger}  icon="💸"/>
          <SCard label="Gross Profit"   value={fmt(summary?.grossProfit)}   color={num(summary?.grossProfit)>=0?colors.success:colors.danger} icon="📈"/>
          <SCard label="They Owe Me"    value={fmt(summary?.totalDebtors)}  color={colors.warning} icon="📥"/>
          <SCard label="I Owe"          value={fmt(summary?.totalCreditors)}color={colors.purple}  icon="📤"/>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {['overview','monthly','debtors','creditors','top clients'].map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{
              padding:'0.5rem 1.1rem', borderRadius:'999px', border:'none', cursor:'pointer',
              fontWeight:'600', fontSize:'0.85rem', textTransform:'capitalize',
              backgroundColor: activeTab===tab?colors.primary:'white',
              color:           activeTab===tab?'white':colors.muted,
              boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
            }}>{tab}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab==='overview' && (
          <div>
            <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.75rem' }}>
                <h2 style={{ fontWeight:'700', color:colors.dark }}>Income vs Expenses — {new Date().getFullYear()}</h2>
                <ChartTypeButtons />
              </div>
              <div ref={chartRef}>{renderMainChart()}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
              <div ref={pieRef} style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontWeight:'700', marginBottom:'1rem', color:colors.dark }}>Financial Breakdown</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip formatter={v=>fmt(v)}/><Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontWeight:'700', marginBottom:'1rem', color:colors.dark }}>Key Metrics</h2>
                {[
                  { label:'Profit Margin', value:num(summary?.totalIncome)>0?`${((num(summary.grossProfit)/num(summary.totalIncome))*100).toFixed(1)}%`:'0%', color:colors.success },
                  { label:'Expense Ratio', value:num(summary?.totalIncome)>0?`${((num(summary.totalExpenses)/num(summary.totalIncome))*100).toFixed(1)}%`:'0%', color:colors.danger },
                  { label:'Outstanding',   value:fmt(summary?.totalDebtors),   color:colors.warning },
                  { label:'Payable',       value:fmt(summary?.totalCreditors), color:colors.purple  },
                  { label:'Net Position',  value:fmt(num(summary?.totalDebtors)-num(summary?.totalCreditors)), color:colors.primary },
                ].map((m,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.65rem 0', borderBottom:`1px solid ${colors.divider}` }}>
                    <span style={{ color:colors.muted, fontSize:'0.9rem' }}>{m.label}</span>
                    <span style={{ color:m.color, fontWeight:'800', fontSize:'1rem' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY */}
        {activeTab==='monthly' && (
          <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.75rem' }}>
              <h2 style={{ fontWeight:'700', color:colors.dark }}>Monthly Breakdown — {new Date().getFullYear()}</h2>
              <ChartTypeButtons />
            </div>
            {renderMainChart()}
            <div style={{ marginTop:'1.5rem', overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ backgroundColor:colors.background }}>
                  {['Month','Income','Expenses','Profit','Margin'].map(h=>(
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {monthly.map((m,i)=>{
                    const profit=num(m.income)-num(m.expenses);
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                        <td style={td}><b>{m.name}</b></td>
                        <td style={td}><span style={{ color:colors.success, fontWeight:'600' }}>{fmt(m.income||0)}</span></td>
                        <td style={td}><span style={{ color:colors.danger,  fontWeight:'600' }}>{fmt(m.expenses||0)}</span></td>
                        <td style={td}><span style={{ color:profit>=0?colors.success:colors.danger, fontWeight:'700' }}>{fmt(profit)}</span></td>
                        <td style={td}><span style={{ color:profit>=0?colors.success:colors.danger }}>{m.income>0?`${((profit/m.income)*100).toFixed(1)}%`:'0%'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEBTORS */}
        {activeTab==='debtors' && (
          <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h2 style={{ fontWeight:'700', color:colors.dark }}>📥 Debtors — Who Owes Me</h2>
              <span style={{ backgroundColor:colors.warning+'20', color:colors.warning, padding:'0.3rem 0.75rem', borderRadius:'999px', fontWeight:'700', fontSize:'0.85rem' }}>
                Total: {fmt(debtors.reduce((s,d)=>s+num(d.balance||(d.total_billed-d.total_paid)),0))}
              </span>
            </div>
            {debtors.length===0?(
              <div style={{ textAlign:'center', padding:'3rem', color:colors.light }}>
                <p style={{ fontSize:'2rem' }}>🎉</p><p style={{ fontWeight:'600' }}>No outstanding debtors!</p>
              </div>
            ):(
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={debtors.slice(0,8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.divider}/>
                    <XAxis type="number" tickFormatter={v=>`${sym}${(v/1000).toFixed(0)}k`} fontSize={10}/>
                    <YAxis type="category" dataKey="name" fontSize={10} width={100}/>
                    <Tooltip formatter={v=>fmt(v)}/>
                    <Bar dataKey="balance" name="Balance Owed" fill={colors.warning} radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
                <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'1rem' }}>
                  <thead><tr style={{ backgroundColor:colors.background }}>
                    {['Client','Phone','Billed','Paid','Balance'].map(h=>(
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{debtors.map((d,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                      <td style={td}><b>{d.name}</b></td>
                      <td style={td}>{d.phone||'—'}</td>
                      <td style={td}>{fmt(d.billed||d.total_billed)}</td>
                      <td style={td}>{fmt(d.paid||d.total_paid)}</td>
                      <td style={td}><span style={{ color:colors.danger, fontWeight:'800', backgroundColor:colors.danger+'15', padding:'0.2rem 0.6rem', borderRadius:'999px' }}>{fmt(d.balance||(d.total_billed-d.total_paid))}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* CREDITORS */}
        {activeTab==='creditors' && (
          <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h2 style={{ fontWeight:'700', color:colors.dark }}>📤 Creditors — Who I Owe</h2>
              <span style={{ backgroundColor:colors.purple+'20', color:colors.purple, padding:'0.3rem 0.75rem', borderRadius:'999px', fontWeight:'700', fontSize:'0.85rem' }}>
                Total: {fmt(creditors.reduce((s,c)=>s+num(c.balance||(c.total_owed-c.total_paid)),0))}
              </span>
            </div>
            {creditors.length===0?(
              <div style={{ textAlign:'center', padding:'3rem', color:colors.light }}>
                <p style={{ fontSize:'2rem' }}>🎉</p><p style={{ fontWeight:'600' }}>No outstanding creditors!</p>
              </div>
            ):(
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={creditors.slice(0,8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.divider}/>
                    <XAxis type="number" tickFormatter={v=>`${sym}${(v/1000).toFixed(0)}k`} fontSize={10}/>
                    <YAxis type="category" dataKey="name" fontSize={10} width={100}/>
                    <Tooltip formatter={v=>fmt(v)}/>
                    <Bar dataKey="balance" name="Balance Owed" fill={colors.purple} radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
                <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'1rem' }}>
                  <thead><tr style={{ backgroundColor:colors.background }}>
                    {['Supplier','Phone','Owed','Paid','Balance'].map(h=>(
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{creditors.map((c,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                      <td style={td}><b>{c.name}</b></td>
                      <td style={td}>{c.phone||'—'}</td>
                      <td style={td}>{fmt(c.owed||c.total_owed)}</td>
                      <td style={td}>{fmt(c.paid||c.total_paid)}</td>
                      <td style={td}><span style={{ color:colors.purple, fontWeight:'800', backgroundColor:colors.purple+'15', padding:'0.2rem 0.6rem', borderRadius:'999px' }}>{fmt(c.balance||(c.total_owed-c.total_paid))}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* TOP CLIENTS */}
        {activeTab==='top clients' && (
          <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontWeight:'700', marginBottom:'1rem', color:colors.dark }}>🏆 Top Clients by Revenue</h2>
            {topClients.length===0?(
              <div style={{ textAlign:'center', padding:'3rem', color:colors.light }}>
                <p style={{ fontSize:'2rem' }}>👤</p><p style={{ fontWeight:'600' }}>No client data yet.</p>
              </div>
            ):(
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.divider}/>
                    <XAxis type="number" tickFormatter={v=>`${sym}${(v/1000).toFixed(0)}k`} fontSize={10}/>
                    <YAxis type="category" dataKey="name" fontSize={10} width={120}/>
                    <Tooltip formatter={v=>fmt(v)}/><Legend/>
                    <Bar dataKey="total_billed" name="Billed" fill={colors.primary} radius={[0,4,4,0]}/>
                    <Bar dataKey="total_paid"   name="Paid"   fill={colors.success} radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
                <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'1.5rem' }}>
                  <thead><tr style={{ backgroundColor:colors.background }}>
                    {['#','Client','Phone','Billed','Paid','Balance'].map(h=>(
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color:colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{topClients.map((c,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor:i%2===0?'white':'#FAFAFA' }}>
                      <td style={td}><span style={{ backgroundColor:colors.primaryLight, color:colors.primary, fontWeight:'800', padding:'0.2rem 0.5rem', borderRadius:'50%', fontSize:'0.8rem' }}>{i+1}</span></td>
                      <td style={td}><b>{c.name}</b></td>
                      <td style={td}>{c.phone||'—'}</td>
                      <td style={td}><span style={{ color:colors.primary, fontWeight:'700' }}>{fmt(c.total_billed)}</span></td>
                      <td style={td}><span style={{ color:colors.success, fontWeight:'700' }}>{fmt(c.total_paid)}</span></td>
                      <td style={td}><span style={{ color:(c.total_billed-c.total_paid)>0?colors.danger:colors.success, fontWeight:'700' }}>{fmt(c.total_billed-c.total_paid)}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* EXPORT MODAL */}
        {showExportModal && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'2rem', width:'480px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
                <h2 style={{ fontWeight:'800', color:colors.dark, fontSize:'1.2rem' }}>
                  {exportFormat==='excel'?'📊 Export to Excel':'⬇ Download PDF Report'}
                </h2>
                <button onClick={()=>setShowExportModal(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:colors.muted }}>✕</button>
              </div>
              <p style={{ color:colors.muted, fontSize:'0.9rem', marginBottom:'1.25rem' }}>Select what to include:</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem', marginBottom:'1.25rem' }}>
                {[
                  { key:'summary',    label:'📋 Summary'    },
                  { key:'monthly',    label:'📅 Monthly'    },
                  { key:'debtors',    label:'📥 Debtors'    },
                  { key:'creditors',  label:'📤 Creditors'  },
                  { key:'topClients', label:'🏆 Top Clients' },
                  { key:'income',     label:'💰 Income'     },
                  { key:'expenses',   label:'💸 Expenses'   },
                ].map(opt=>(
                  <div key={opt.key} onClick={()=>toggleExport(opt.key)} style={{
                    display:'flex', alignItems:'center', gap:'0.65rem',
                    padding:'0.75rem 1rem', borderRadius:'0.65rem', cursor:'pointer',
                    border:`2px solid ${exportOptions[opt.key]?colors.primary:colors.border}`,
                    backgroundColor: exportOptions[opt.key]?colors.primaryLight:'white',
                  }}>
                    <div style={{ width:'20px', height:'20px', borderRadius:'4px', flexShrink:0, backgroundColor:exportOptions[opt.key]?colors.primary:'white', border:`2px solid ${exportOptions[opt.key]?colors.primary:colors.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {exportOptions[opt.key]&&<span style={{ color:'white', fontSize:'0.75rem', fontWeight:'900' }}>✓</span>}
                    </div>
                    <span style={{ fontWeight:'600', fontSize:'0.88rem', color:exportOptions[opt.key]?colors.primary:colors.dark }}>{opt.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem' }}>
                <button onClick={()=>setExportOptions({summary:true,monthly:true,debtors:true,creditors:true,topClients:true,income:true,expenses:true})}
                  style={{ flex:1, padding:'0.5rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, background:'white', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem', color:colors.dark }}>
                  ✓ Select All
                </button>
                <button onClick={()=>setExportOptions({summary:false,monthly:false,debtors:false,creditors:false,topClients:false,income:false,expenses:false})}
                  style={{ flex:1, padding:'0.5rem', borderRadius:'0.5rem', border:`1px solid ${colors.border}`, background:'white', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem', color:colors.muted }}>
                  ✕ Clear All
                </button>
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={runExport} style={{ flex:1, ...btn(exportFormat==='excel'?colors.successGradient:colors.primaryGradient), textAlign:'center' }}>
                  {exportFormat==='excel'?'📊 Export Excel':'⬇ Download PDF'}
                </button>
                <button onClick={()=>setShowExportModal(false)} style={{ flex:1, ...btn(colors.grayGradient), textAlign:'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function SCard({ label, value, color, icon }) {
  return (
    <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${color}` }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
    >
      <span style={{ fontSize:'1.4rem' }}>{icon}</span>
      <p style={{ color:'#64748B', fontSize:'0.82rem', marginTop:'0.5rem', marginBottom:'0.25rem', fontWeight:'500' }}>{label}</p>
      <p style={{ color:'#1E293B', fontSize:'1.2rem', fontWeight:'800' }}>{value}</p>
    </div>
  );
}