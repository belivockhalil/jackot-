'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import colors from '../../lib/colors';
import NavBar from '../../components/NavBar';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = [
  { value: 'mpesa',       label: 'Mpesa',             color: '#10B981', bg: '#ECFDF5', text: 'M-PESA'    },
  { value: 'airtel',      label: 'Airtel Money',       color: '#EF4444', bg: '#FEF2F2', text: 'AIRTEL'    },
  { value: 'kcb',         label: 'KCB Bank',           color: '#1D4ED8', bg: '#EFF6FF', text: 'KCB'       },
  { value: 'equity',      label: 'Equity Bank',        color: '#DC2626', bg: '#FEF2F2', text: 'EQUITY'    },
  { value: 'ncba',        label: 'NCBA Bank',          color: '#1E3A8A', bg: '#EFF6FF', text: 'NCBA'      },
  { value: 'cooperative', label: 'Co-op Bank',         color: '#15803D', bg: '#F0FDF4', text: 'CO-OP'     },
  { value: 'absa',        label: 'Absa Bank',          color: '#DC2626', bg: '#FEF2F2', text: 'ABSA'      },
  { value: 'stanchart',   label: 'Standard Chartered', color: '#1D4ED8', bg: '#EFF6FF', text: 'StanChart' },
  { value: 'dtb',         label: 'DTB Bank',           color: '#7C3AED', bg: '#F5F3FF', text: 'DTB'       },
  { value: 'family',      label: 'Family Bank',        color: '#0369A1', bg: '#F0F9FF', text: 'FAMILY'    },
  { value: 'paypal',      label: 'PayPal',             color: '#003087', bg: '#EFF6FF', text: 'PayPal'    },
  { value: 'payoneer',    label: 'Payoneer',           color: '#FF4800', bg: '#FFF7ED', text: 'Payoneer'  },
  { value: 'wise',        label: 'Wise',               color: '#163300', bg: '#F0FDF4', text: 'Wise'      },
  { value: 'cash',        label: 'Cash',               color: '#F59E0B', bg: '#FFFBEB', text: 'CASH'      },
  { value: 'other',       label: 'Other',              color: '#64748B', bg: '#F8FAFC', text: 'OTHER'     },
];

const COLORS = ['#10B981','#1D4ED8','#F59E0B','#EF4444','#8B5CF6','#0EA5E9','#F97316','#14B8A6','#64748B'];

export default function BankingPage() {
  const { user }     = useAuth();
  const { settings } = useSettings();
  const router       = useRouter();

  const [accounts,   setAccounts]   = useState([]);
  const [active,     setActive]     = useState(null);
  const [entries,    setEntries]    = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [clients,    setClients]    = useState([]);
  const [summary,    setSummary]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [showNewAcc, setShowNewAcc] = useState(false);

  const [txForm, setTxForm] = useState({
    date:'', description:'', amountIn:'', amountOut:'',
    referenceCode:'', linkedType:'', linkedId:'',
  });
  const [accForm, setAccForm] = useState({
    name:'', type:'mpesa', color:'#10B981',
  });

  const sym = settings?.currency_symbol || 'KSh';

  useEffect(() => { if (!user) return; loadAll(); }, [user]);
  useEffect(() => { if (active && user) loadLedger(active.id); }, [active]);

  const loadAll = async () => {
    try {
      const [acc, sup, cli, sum] = await Promise.all([
        api.get(`/banking/accounts?userId=${user.userId}`),
        api.get(`/suppliers?userId=${user.userId}`),
        api.get(`/clients?userId=${user.userId}`),
        api.get(`/banking?userId=${user.userId}`),
      ]);
      setAccounts(acc.data.accounts);
      setSuppliers(sup.data.suppliers);
      setClients(cli.data.clients);
      setSummary(sum.data.summary || {});
      if (acc.data.accounts.length > 0 && !active) {
  setActive(acc.data.accounts[0]);
}
    } catch { toast.error('Could not load banking'); }
    finally { setLoading(false); }
  };

  const loadLedger = async (accountId) => {
    try {
      const res = await api.get(`/banking/ledger/${accountId}?userId=${user.userId}`);
      setEntries(res.data.entries || []);
    } catch { toast.error('Could not load ledger'); }
  };

  const addAccount = async () => {
    if (!accForm.name) { toast.error('Account name is required'); return; }
    try {
      const selected = ACCOUNT_TYPES.find(t => t.value === accForm.type);
      await api.post('/banking/accounts', {
        ...accForm,
        userId: user.userId,
        color:  selected?.color || accForm.color,
        icon:   selected?.text  || accForm.name,
      });
      toast.success(`${accForm.name} added!`);
      setAccForm({ name:'', type:'mpesa', color:'#10B981' });
      setShowNewAcc(false);
      loadAll();
    } catch { toast.error('Could not add account'); }
  };

  const removeAccount = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return;
    try {
      await api.delete(`/banking/accounts/${id}`);
      toast.success(`${name} removed`);
      setActive(null);
      loadAll();
    } catch { toast.error('Could not remove account'); }
  };

  const recordTransaction = async () => {
    if (!txForm.date || (!txForm.amountIn && !txForm.amountOut)) {
      toast.error('Date and at least one amount is required'); return;
    }
    try {
      await api.post('/banking', {
        ...txForm,
        userId:    user.userId,
        accountId: active.id,
        amountIn:  Number(txForm.amountIn  || 0),
        amountOut: Number(txForm.amountOut || 0),
        linkedId:  txForm.linkedId || null,
      });
      toast.success('Transaction recorded!');
      setTxForm({ date:'', description:'', amountIn:'', amountOut:'', referenceCode:'', linkedType:'', linkedId:'' });
      setShowForm(false);
      loadLedger(active.id);
      loadAll();
    } catch { toast.error('Could not record transaction'); }
  };

  const grandTotal = Object.values(summary).reduce((s, l) => s + l.balance, 0);

  const AccBadge = ({ type, name, size = 'md' }) => {
    const t    = ACCOUNT_TYPES.find(x => x.value === type);
    const w    = size === 'sm' ? '50px' : '70px';
    const h    = size === 'sm' ? '22px' : '30px';
    const fs   = size === 'sm' ? '0.55rem' : '0.7rem';
    const text = t?.text || (name || '').substring(0, 6).toUpperCase();
    const col  = t?.color || colors.primary;
    return (
      <div style={{ width:w, height:h, borderRadius:'6px', backgroundColor:col, display:'flex', alignItems:'center', justifyContent:'center', marginBottom: size === 'sm' ? '0' : '0.5rem' }}>
        <span style={{ color:'white', fontWeight:'900', fontSize: text.length > 6 ? '0.55rem' : fs, letterSpacing:'-0.3px' }}>{text}</span>
      </div>
    );
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor: colors.background }}>
      <NavBar />

      <div style={{ padding:'2rem', maxWidth:'1100px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:'800', color: colors.dark }}>🏦 Banking</h1>
            <p style={{ color: colors.primary, fontWeight:'700', fontSize:'1.1rem' }}>
              Total Balance: {sym} {grandTotal.toLocaleString()}
            </p>
          </div>
          <button onClick={() => setShowNewAcc(!showNewAcc)} style={btn(colors.primaryGradient)}>
            + Add Account
          </button>
        </div>

        {/* Add Account Form */}
        {showNewAcc && (
          <div style={{ backgroundColor:'white', padding:'1.5rem', borderRadius:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:'1.5rem', borderTop:`4px solid ${colors.primary}` }}>
            <h3 style={{ fontWeight:'700', marginBottom:'1rem', color: colors.dark }}>Add Payment Account</h3>

            {/* Account type picker with colored badges */}
            <label style={lbl}>Select Account Type</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))', gap:'0.65rem', marginTop:'0.5rem', marginBottom:'1rem' }}>
              {ACCOUNT_TYPES.map(t => (
                <div key={t.value}
                  onClick={() => setAccForm(p => ({ ...p, type: t.value, color: t.color, name: p.name || t.label }))}
                  style={{
                    border:          accForm.type === t.value ? `2px solid ${t.color}` : `2px solid ${colors.border}`,
                    borderRadius:    '0.75rem',
                    padding:         '0.75rem 0.5rem',
                    cursor:          'pointer',
                    backgroundColor: accForm.type === t.value ? t.bg : 'white',
                    textAlign:       'center',
                  }}>
                  <div style={{ width:'56px', height:'24px', borderRadius:'5px', backgroundColor: t.color, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.4rem' }}>
                    <span style={{ color:'white', fontWeight:'900', fontSize: t.text.length > 6 ? '0.55rem' : '0.65rem' }}>{t.text}</span>
                  </div>
                  <p style={{ fontSize:'0.7rem', fontWeight:'600', color: colors.dark }}>{t.label}</p>
                </div>
              ))}
            </div>

            <F label="Account Name *" value={accForm.name} onChange={v => setAccForm(p=>({...p,name:v}))} placeholder="e.g. My Mpesa, Business KCB" />

            <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.75rem' }}>
              <button onClick={addAccount}               style={btn(colors.primaryGradient)}>Add Account</button>
              <button onClick={() => setShowNewAcc(false)} style={btn(colors.grayGradient)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Account Cards */}
        {loading ? (
          <p style={{ color: colors.muted }}>Loading accounts...</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} onClick={() => setActive(acc)}
                style={{
                  backgroundColor: 'white',
                  borderRadius:    '1rem',
                  padding:         '1.25rem',
                  boxShadow:       '0 2px 12px rgba(0,0,0,0.06)',
                  cursor:          'pointer',
                  border:          active?.id === acc.id ? `2px solid ${ACCOUNT_TYPES.find(t=>t.value===acc.type)?.color || acc.color}` : `2px solid transparent`,
                  borderTop:       `4px solid ${ACCOUNT_TYPES.find(t=>t.value===acc.type)?.color || acc.color}`,
                  position:        'relative',
                }}>
                <AccBadge type={acc.type} name={acc.name} />
                <p style={{ color: colors.muted, fontSize:'0.8rem', marginBottom:'0.2rem', fontWeight:'500' }}>{acc.name}</p>
                <p style={{ color: ACCOUNT_TYPES.find(t=>t.value===acc.type)?.color || acc.color, fontWeight:'800', fontSize:'1.1rem' }}>
                  {sym} {((summary[acc.id]?.balance) || 0).toLocaleString()}
                </p>
                <p style={{ color: colors.light, fontSize:'0.72rem' }}>{acc.type.replace('_',' ')}</p>
                <button onClick={e => { e.stopPropagation(); removeAccount(acc.id, acc.name); }}
                  style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'none', border:'none', cursor:'pointer', opacity:0.3, fontSize:'0.9rem' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Active Ledger */}
        {active && (
          <div style={{ backgroundColor:'white', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid ${colors.divider}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <AccBadge type={active.type} name={active.name} size="sm" />
                <div>
                  <h2 style={{ fontWeight:'800', color: colors.dark, fontSize:'1.1rem' }}>{active.name} Ledger</h2>
                  <p style={{ color: colors.muted, fontSize:'0.85rem' }}>
                    Balance: <span style={{ color: ACCOUNT_TYPES.find(t=>t.value===active.type)?.color || colors.primary, fontWeight:'700' }}>
                      {sym} {((summary[active.id]?.balance) || 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowForm(!showForm)}
                style={{ ...btn(''), backgroundColor: ACCOUNT_TYPES.find(t=>t.value===active.type)?.color || colors.primary }}>
                + Add Transaction
              </button>
            </div>

            {/* Transaction Form */}
            {showForm && (
              <div style={{ padding:'1.25rem 1.5rem', backgroundColor:'#F8FAFC', borderBottom:`1px solid ${colors.divider}` }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <F label="Date *"         value={txForm.date}          onChange={v=>setTxForm(p=>({...p,date:v}))} type="date" />
                  <F label="Description"    value={txForm.description}   onChange={v=>setTxForm(p=>({...p,description:v}))} />
                  <F label="Amount In"      value={txForm.amountIn}      onChange={v=>setTxForm(p=>({...p,amountIn:v}))} type="number" placeholder="Money received" />
                  <F label="Amount Out"     value={txForm.amountOut}     onChange={v=>setTxForm(p=>({...p,amountOut:v}))} type="number" placeholder="Money sent" />
                  <F label="Reference Code" value={txForm.referenceCode} onChange={v=>setTxForm(p=>({...p,referenceCode:v}))} placeholder="Transaction ref" />
                  <div>
                    <label style={lbl}>Link to (optional)</label>
                    <select value={txForm.linkedType} onChange={e=>setTxForm(p=>({...p,linkedType:e.target.value,linkedId:''}))} style={sel}>
                      <option value="">-- None --</option>
                      <option value="client">Client</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                  {txForm.linkedType === 'client' && (
                    <div>
                      <label style={lbl}>Select Client</label>
                      <select value={txForm.linkedId} onChange={e=>setTxForm(p=>({...p,linkedId:e.target.value}))} style={sel}>
                        <option value="">-- Select --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  {txForm.linkedType === 'supplier' && (
                    <div>
                      <label style={lbl}>Select Supplier</label>
                      <select value={txForm.linkedId} onChange={e=>setTxForm(p=>({...p,linkedId:e.target.value}))} style={sel}>
                        <option value="">-- Select --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.75rem' }}>
                  <button onClick={recordTransaction}
                    style={{ ...btn(''), backgroundColor: ACCOUNT_TYPES.find(t=>t.value===active.type)?.color || colors.primary }}>
                    Save Transaction
                  </button>
                  <button onClick={() => setShowForm(false)} style={btn(colors.grayGradient)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Ledger Table */}
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.background }}>
                  {['Date','Description','Money In','Money Out','Balance','Reference'].map(h => (
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', color: colors.medium, fontSize:'0.82rem', fontWeight:'700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:'3rem', textAlign:'center', color: colors.light }}>No transactions yet.</td></tr>
                ) : entries.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom:`1px solid ${colors.divider}`, backgroundColor: i%2===0?'white':'#FAFAFA' }}>
                    <td style={td}>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                    <td style={td}>{e.description||'—'}</td>
                    <td style={td}>{e.amount_in > 0 ? <span style={{ color: colors.success, fontWeight:'700' }}>{sym} {Number(e.amount_in).toLocaleString()}</span> : '—'}</td>
                    <td style={td}>{e.amount_out > 0 ? <span style={{ color: colors.danger, fontWeight:'700' }}>{sym} {Number(e.amount_out).toLocaleString()}</span> : '—'}</td>
                    <td style={td}><b style={{ color: ACCOUNT_TYPES.find(t=>t.value===active.type)?.color || colors.primary }}>{sym} {Number(e.balance).toLocaleString()}</b></td>
                    <td style={td}>{e.reference_code||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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