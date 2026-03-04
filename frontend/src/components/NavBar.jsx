'use client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import colors from '../lib/colors';

export default function NavBar() {
  const { logout }    = useAuth();
  const { isEnabled } = useSettings();
  const current = typeof window !== 'undefined' ? window.location.pathname : '';

  const links = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊', key: null },
    { label: 'Projects',  href: '/projects',  icon: '🔨', key: 'project_register' },
    { label: 'Clients',   href: '/clients',   icon: '👤', key: 'client_directory' },
    { label: 'Suppliers', href: '/suppliers', icon: '🏭', key: 'supplier_directory' },
    { label: 'Income',    href: '/income',    icon: '💰', key: 'income_tracker' },
    { label: 'Expenses',  href: '/expenses',  icon: '💸', key: 'expense_tracker' },
    { label: 'Banking',   href: '/banking',   icon: '🏦', key: 'cash_ledger' },
    { label: 'Reports',   href: '/reports',   icon: '📈', key: 'graph_income_expense' },
    { label: 'Invoices',  href: '/invoices',  icon: '🧾', key: 'invoice_generator' },
    { href:'/loans',    label:'🏛️ Loans',         key:'loan_manager'     },
{ href:'/savings',  label:'💵 Savings',        key:'savings_tracker'  },
{ href:'/assets',   label:'🏗️ Assets',         key:'assets_register'  },
{ href:'/notebook', label:'📓 Notebook',       key:'notebook'         },
{ href:'/goals',    label:'🎯 Goals',           key:'business_goals'   },
{ href:'/quotes',   label:'📋 Job Quotes',     key:'job_quotes'       },
{ href:'/budget',   label:'💰 Budget Planner',  key:'budget_planner'   },
{ href:'/tax',      label:'🧾 Tax Manager',     key:'tax_manager'      },
{ href:'/staff',    label:'👥 Staff Tracker',   key:'staff_tracker'    },
{ href:'/stock',    label:'📦 Stock Tracker',   key:'stock_tracker'    },
{ href:'/receipts', label:'🧾 Receipts',        key:'receipt_generator'},
    { label: 'Settings',  href: '/settings',  icon: '⚙️', key: null },
].filter(link => link.key === null || isEnabled(link.key));

  return (
    <>
      {/* Sidebar */}
      <div style={{
        position:        'fixed',
        top:             0,
        left:            0,
        width:           '220px',
        height:          '100vh',
        background:      colors.navGradient,
        display:         'flex',
        flexDirection:   'column',
        zIndex:          200,
        boxShadow:       '4px 0 20px rgba(29,78,216,0.2)',
      }}>

        {/* Logo */}
        <div style={{ padding:'1.5rem 1.25rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
          <a href="/dashboard" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ fontSize:'1.4rem' }}>⚡</span>
            <span style={{ color:'white', fontWeight:'900', fontSize:'1.3rem', letterSpacing:'-0.5px' }}>Jackot</span>
          </a>
        </div>

        {/* Nav Links */}
        <div style={{ flex:1, padding:'0.75rem 0', overflowY:'auto' }}>
          {links.map(link => {
            const isActive = current === link.href;
            return (
              <a key={link.href} href={link.href} style={{
                display:         'flex',
                alignItems:      'center',
                gap:             '0.75rem',
                padding:         '0.7rem 1.25rem',
                textDecoration:  'none',
                color:           isActive ? 'white' : 'rgba(255,255,255,0.7)',
                fontWeight:      isActive ? '700' : '500',
                fontSize:        '0.9rem',
                backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderLeft:      isActive ? '3px solid white' : '3px solid transparent',
                transition:      'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}}
              >
                <span style={{ fontSize:'1.1rem' }}>{link.icon}</span>
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>

        {/* Logout */}
        <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={logout} style={{
            width:           '100%',
            padding:         '0.65rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color:           'white',
            border:          '1px solid rgba(255,255,255,0.2)',
            borderRadius:    '0.6rem',
            cursor:          'pointer',
            fontWeight:      '600',
            fontSize:        '0.9rem',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             '0.5rem',
          }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Page offset — pushes all page content to the right */}
      <div style={{ marginLeft:'220px' }} />
    </>
  );
}