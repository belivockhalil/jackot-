'use client';
import { useEffect, useState } from 'react';
import { useAuth }             from '../../context/AuthContext';
import { useSettings }         from '../../context/SettingsContext';
import { useRouter }           from 'next/navigation';
import api                     from '../../lib/api';
import colors                  from '../../lib/colors';
import NavBar                  from '../../components/NavBar';

export default function Dashboard() {
  const { user, logout }              = useAuth();
  const { settings, isEnabled, loading: settingsLoading } = useSettings();
  const router                        = useRouter();
  const [summary, setSummary]         = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) return;
    loadSummary();
  }, [user]);

  const loadSummary = async () => {
    try {
      const res = await api.get(`/reports/summary?userId=${user.userId}`);
      setSummary(res.data.summary);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fmt = (n) => {
    const sym = settings?.currency_symbol || 'KSh';
    return `${sym} ${Number(n || 0).toLocaleString()}`;
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading || settingsLoading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background: colors.background }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⚡</div>
        <p style={{ color: colors.primary, fontWeight:'600' }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  const profit    = summary?.grossProfit || 0;
  const profitPos = profit >= 0;

  return (
<div className="page-content" style={{ backgroundColor: colors.background }}>
      <NavBar />

      {/* ── Hero Banner ── */}
      <div style={{ background: colors.heroGradient, padding:'2.5rem 2rem', color:'white' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <p style={{ opacity:0.75, fontSize:'0.9rem', marginBottom:'0.25rem' }}>{today}</p>
            <h2 style={{ fontSize:'2rem', fontWeight:'800', marginBottom:'0.25rem' }}>
              {getGreeting()}, {settings?.greeting_name || 'there'}! 👋
            </h2>
            <p style={{ opacity:0.85, fontSize:'1rem' }}>
              {settings?.business_name || 'My Business'} — here's your financial overview
            </p>
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter:  'blur(10px)',
            borderRadius:    '1rem',
            padding:         '1rem 1.5rem',
            textAlign:       'right',
          }}>
            <p style={{ opacity:0.8, fontSize:'0.8rem', marginBottom:'0.2rem' }}>Gross Profit</p>
            <p style={{ fontSize:'1.75rem', fontWeight:'900', color: profitPos ? '#4ADE80' : '#FCA5A5' }}>
              {fmt(profit)}
            </p>
            <p style={{ fontSize:'0.8rem', opacity:0.75 }}>{profitPos ? '↑ Profitable' : '↓ Loss'}</p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ padding:'2rem', maxWidth:'1200px', margin:'0 auto' }}>

        {/* Snippet Cards — only show if module is enabled */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {isEnabled('income_tracker') && (
            <Card label="Total Income"   value={fmt(summary?.totalIncome)}   color={colors.success} icon="💰" trend="recorded" />
          )}
          {isEnabled('expense_tracker') && (
            <Card label="Total Expenses" value={fmt(summary?.totalExpenses)} color={colors.danger}  icon="💸" trend="recorded" />
          )}
          {isEnabled('debtors_report') && (
            <Card label="They Owe Me"    value={fmt(summary?.totalDebtors)}  color={colors.warning} icon="📥" trend="outstanding" />
          )}
          {isEnabled('creditors_report') && (
            <Card label="I Owe"          value={fmt(summary?.totalCreditors)}color={colors.purple}  icon="📤" trend="to pay" />
          )}
        </div>

        {/* Quick Actions — only show if module is enabled */}
        <div style={{ marginBottom:'2rem' }}>
          <h3 style={{ fontSize:'0.8rem', fontWeight:'700', color: colors.medium, marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Quick Actions
          </h3>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            {isEnabled('income_tracker')   && <QBtn label="💰 Record Income"  href="/income"   bg={colors.successGradient} />}
            {isEnabled('expense_tracker')  && <QBtn label="💸 Record Expense" href="/expenses" bg={colors.dangerGradient} />}
            {isEnabled('project_register') && <QBtn label="🔨 New Project"    href="/projects" bg={colors.primaryGradient} />}
            {isEnabled('client_directory') && <QBtn label="👤 Add Client"     href="/clients"  bg={colors.purpleGradient} />}
          </div>
        </div>

        {/* Navigation Grid — only show if module is enabled */}
        <h3 style={{ fontSize:'0.8rem', fontWeight:'700', color: colors.medium, marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          All Sections
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.75rem' }}>
          {isEnabled('client_directory')     && <NavCard icon="👤" label="Clients"   href="/clients"   color={colors.accent} />}
          {isEnabled('supplier_directory')   && <NavCard icon="🏭" label="Suppliers" href="/suppliers" color={colors.purple} />}
          {isEnabled('project_register')     && <NavCard icon="🔨" label="Projects"  href="/projects"  color={colors.primary} />}
          {isEnabled('income_tracker')       && <NavCard icon="💰" label="Income"    href="/income"    color={colors.success} />}
          {isEnabled('expense_tracker')      && <NavCard icon="💸" label="Expenses"  href="/expenses"  color={colors.danger} />}
          {isEnabled('cash_ledger')          && <NavCard icon="🏦" label="Banking"   href="/banking"   color={colors.warning} />}
          {isEnabled('graph_income_expense') && <NavCard icon="📊" label="Reports"   href="/reports"   color={colors.teal} />}
          <NavCard icon="⚙️" label="Settings" href="/settings" color={colors.muted} />
        </div>

      </div>
    </div>
  );
}

function Card({ label, value, color, icon, trend }) {
  return (
    <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${color}` }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
        <span style={{ fontSize:'1.5rem' }}>{icon}</span>
        <span style={{ fontSize:'0.75rem', color, backgroundColor: color+'20', padding:'0.2rem 0.5rem', borderRadius:'999px', fontWeight:'600' }}>{trend}</span>
      </div>
      <p style={{ color:'#64748B', fontSize:'0.82rem', marginBottom:'0.3rem', fontWeight:'500' }}>{label}</p>
      <p style={{ color:'#1E293B', fontSize:'1.35rem', fontWeight:'800' }}>{value}</p>
    </div>
  );
}

function QBtn({ label, href, bg }) {
  return (
    <a href={href}
      style={{ background:bg, color:'white', padding:'0.7rem 1.4rem', borderRadius:'0.65rem', textDecoration:'none', fontWeight:'700', fontSize:'0.92rem', boxShadow:'0 4px 12px rgba(0,0,0,0.12)', display:'inline-block' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >{label}</a>
  );
}

function NavCard({ icon, label, href, color }) {
  return (
    <a href={href}
      style={{ backgroundColor:'white', borderRadius:'0.85rem', padding:'1.25rem', textDecoration:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', border:'1.5px solid transparent' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <span style={{ fontSize:'1.75rem' }}>{icon}</span>
      <span style={{ color:'#374151', fontWeight:'600', fontSize:'0.88rem' }}>{label}</span>
    </a>
  );
}