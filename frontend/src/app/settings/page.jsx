'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useRouter } from 'next/navigation';
import colors from '../../lib/colors';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user }                                         = useAuth();
  const { settings, modules, updateSettings, toggleModule } = useSettings();
  const router                                           = useRouter();
  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  useEffect(() => { if (!user) return; }, [user]);
  useEffect(() => { if (settings) setForm({ ...settings }); }, [settings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Settings saved!');
    } catch { toast.error('Could not save settings'); }
    finally { setSaving(false); }
  };

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const MODULE_MAP = {
    financial:  ['income_tracker','expense_tracker','profit_loss','balance_sheet','cashflow','savings_tracker','loan_manager','tax_manager','budget_planner'],
    projects:   ['project_register','project_notes','project_photos','project_timeline','job_quotes','thankyou_card'],
    inventory:  ['stock_tracker','seasonal_toggle','assets_register'],
    people:     ['client_directory','debtors_report','supplier_directory','creditors_report','staff_tracker'],
    banking:    ['cash_ledger','mpesa_ledger','bank_ledger'],
    reports:    ['graph_income_expense','graph_top_clients','graph_projects','pie_expenses','pie_income','ai_health_report'],
    documents:  ['invoice_generator','receipt_generator','pdf_export'],
  };

  if (!form) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <p style={{ color: colors.primary }}>Loading settings...</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', backgroundColor: colors.background }}>

      {/* Nav */}
      <nav style={{ background: colors.navGradient, padding:'0 2rem', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 20px rgba(29,78,216,0.3)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ color:'white', textDecoration:'none', fontWeight:'900', fontSize:'1.3rem' }}>⚡ Jackot</a>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <a href="/dashboard" style={{ color:'rgba(255,255,255,0.8)', textDecoration:'none', fontSize:'0.9rem', padding:'0.4rem 0.75rem', borderRadius:'0.4rem', border:'1px solid rgba(255,255,255,0.3)' }}>← Dashboard</a>
          <button onClick={saveSettings} disabled={saving} style={{ backgroundColor: saving ? colors.light : 'white', color: saving ? 'white' : colors.primary, border:'none', padding:'0.5rem 1.25rem', borderRadius:'0.5rem', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </nav>

      <div style={{ padding:'2rem', maxWidth:'850px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color: colors.dark, marginBottom:'1.5rem' }}>⚙️ Settings</h1>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
          {['business','theme','modules'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding:         '0.55rem 1.25rem',
              borderRadius:    '0.5rem',
              border:          'none',
              cursor:          'pointer',
              fontWeight:      '600',
              fontSize:        '0.9rem',
              textTransform:   'capitalize',
              backgroundColor: activeTab === tab ? colors.primary : 'white',
              color:           activeTab === tab ? 'white' : colors.dark,
              boxShadow:       '0 1px 4px rgba(0,0,0,0.08)',
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ backgroundColor:'white', borderRadius:'1rem', padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Business Tab */}
          {activeTab === 'business' && (
            <div>
              <h2 style={{ fontWeight:'700', marginBottom:'1.25rem', color: colors.dark }}>Business Details</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <F label="Business Name"        value={form.business_name||''}    onChange={v=>update('business_name',v)} />
                <F label="Your Name"            value={form.greeting_name||''}    onChange={v=>update('greeting_name',v)} />
                <F label="Phone"                value={form.business_phone||''}   onChange={v=>update('business_phone',v)} />
                <F label="Email"                value={form.business_email||''}   onChange={v=>update('business_email',v)} />
                <F label="Currency Code"        value={form.currency||'KES'}      onChange={v=>update('currency',v)} placeholder="e.g. KES, USD, UGX" />
                <F label="Currency Symbol"      value={form.currency_symbol||'KSh'} onChange={v=>update('currency_symbol',v)} placeholder="e.g. KSh, $, USh" />
                <F label="Tax Rate"             value={form.tax_rate||0.16}       onChange={v=>update('tax_rate',v)} type="number" placeholder="0.16 = 16%" />
                <F label="Tax Label"            value={form.tax_label||'VAT'}     onChange={v=>update('tax_label',v)} />
                <F label="Invoice Prefix"       value={form.invoice_prefix||'INV'} onChange={v=>update('invoice_prefix',v)} />
                <F label="Invoice Footer Notes" value={form.invoice_notes||''}   onChange={v=>update('invoice_notes',v)} />
              </div>
              <F label="Business Address" value={form.business_address||''} onChange={v=>update('business_address',v)} />
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div>
              <h2 style={{ fontWeight:'700', marginBottom:'0.5rem', color: colors.dark }}>Theme & Colors</h2>
              <p style={{ color: colors.muted, fontSize:'0.9rem', marginBottom:'1.25rem' }}>Pick colors for your Jackot dashboard. Changes save immediately.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <ColorPicker label="Primary Color"    value={form.theme_primary||colors.primary}       onChange={v=>update('theme_primary',v)} />
                <ColorPicker label="Accent Color"     value={form.theme_accent||colors.accent}         onChange={v=>update('theme_accent',v)} />
                <ColorPicker label="Background Color" value={form.theme_background||colors.background} onChange={v=>update('theme_background',v)} />
                <ColorPicker label="Invoice Color"    value={form.invoice_color||colors.primary}       onChange={v=>update('invoice_color',v)} />
              </div>
              <div style={{ marginTop:'1rem', padding:'1rem', backgroundColor: colors.primaryLight, borderRadius:'0.65rem' }}>
                <p style={{ fontSize:'0.85rem', color: colors.primary, fontWeight:'500' }}>💡 After saving, log out and back in to see your new colors applied everywhere.</p>
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div>
              <h2 style={{ fontWeight:'700', marginBottom:'0.5rem', color: colors.dark }}>Module Settings</h2>
              <p style={{ color: colors.muted, fontSize:'0.9rem', marginBottom:'1.5rem' }}>Turn features on or off. Changes apply immediately.</p>
              {Object.entries(MODULE_MAP).map(([cat, keys]) => (
                <div key={cat} style={{ marginBottom:'1.5rem' }}>
                  <h3 style={{ fontWeight:'700', color: colors.medium, textTransform:'capitalize', marginBottom:'0.75rem', fontSize:'0.9rem', borderBottom:`1px solid ${colors.divider}`, paddingBottom:'0.4rem' }}>{cat}</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                    {keys.map(key => (
                      <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.65rem 0.85rem', backgroundColor: colors.background, borderRadius:'0.5rem' }}>
                        <span style={{ fontSize:'0.88rem', color: colors.dark, textTransform:'capitalize' }}>{key.replace(/_/g,' ')}</span>
                        <button
                          onClick={() => toggleModule(key, !modules[key])}
                          style={{
                            width:'44px', height:'24px', borderRadius:'999px', border:'none', cursor:'pointer',
                            backgroundColor: modules[key] ? colors.primary : colors.border,
                            position:'relative', transition:'background 0.2s',
                          }}
                        >
                          <span style={{
                            position:'absolute', top:'3px',
                            left: modules[key] ? '22px' : '3px',
                            width:'18px', height:'18px', borderRadius:'50%',
                            backgroundColor:'white', transition:'left 0.2s',
                          }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div style={{ marginBottom:'0.5rem' }}>
      <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'0.65rem 0.9rem', border:`1.5px solid ${colors.border}`, borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem', boxSizing:'border-box' }} />
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:'0.5rem' }}>
      <label style={{ display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' }}>{label}</label>
      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
        <input type="color" value={value} onChange={e=>onChange(e.target.value)}
          style={{ width:'48px', height:'40px', border:`1.5px solid ${colors.border}`, borderRadius:'0.5rem', cursor:'pointer', padding:'2px' }} />
        <input type="text" value={value} onChange={e=>onChange(e.target.value)}
          style={{ flex:1, padding:'0.65rem 0.9rem', border:`1.5px solid ${colors.border}`, borderRadius:'0.6rem', outline:'none', fontSize:'0.95rem' }} />
      </div>
    </div>
  );
}