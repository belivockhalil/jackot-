'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', businessName: '', greetingName: '' });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.businessName || !form.greetingName) {
      toast.error('Please fill in all fields'); return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    try {
      setLoading(true);
      await signup(form.email, form.password, form.businessName, form.greetingName);
      toast.success(`Welcome to Jackot, ${form.greetingName}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:  '100vh',
      display:    'flex',
      background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0EA5E9 100%)',
    }}>

      {/* Left Side — Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', color: 'white' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚡</div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '1rem' }}>Jackot</h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.85, maxWidth: '360px', lineHeight: 1.6 }}>
          Join thousands of businesses managing their money, projects, and growth with Jackot.
        </p>
        <div style={{ marginTop: '2.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem' }}>
          <p style={{ fontWeight: '700', marginBottom: '0.75rem' }}>What you get — 100% free:</p>
          {['Unlimited projects and clients', 'Income & expense tracking', 'Professional invoices', 'Financial reports & graphs', 'Mobile app access'].map(f => (
            <div key={f} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', opacity: 0.9, fontSize: '0.95rem' }}>
              <span>✅</span><span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side — Signup Form */}
      <div style={{ width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.25rem', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem' }}>Create your account</h2>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Free forever. No credit card needed.</p>

          <F label="Your Name"      value={form.greetingName}  onChange={v => update('greetingName', v)}  placeholder="e.g. Richard" />
          <F label="Business Name"  value={form.businessName}  onChange={v => update('businessName', v)}  placeholder="e.g. Richard Furnitures" />
          <F label="Email Address"  value={form.email}         onChange={v => update('email', v)}          type="email" placeholder="you@example.com" />

          {/* Password with show/hide */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="Min 6 characters"
                style={{ ...inp, paddingRight: '3rem' }}
              />
              <button onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password with show/hide */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={lbl}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                placeholder="Repeat your password"
                style={{
                  ...inp,
                  paddingRight: '3rem',
                  borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#EF4444' : '#E2E8F0',
                }}
              />
              <button onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>⚠️ Passwords do not match</p>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length >= 6 && (
              <p style={{ color: '#10B981', fontSize: '0.8rem', marginTop: '0.3rem' }}>✅ Passwords match</p>
            )}
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem',
              background:  loading ? '#93C5FD' : 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
              color:       'white', border: 'none', borderRadius: '0.65rem',
              fontSize:    '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow:   '0 4px 16px rgba(29,78,216,0.3)',
            }}
          >
            {loading ? 'Creating account...' : 'Create Free Account →'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748B', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#1D4ED8', fontWeight: '700' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const lbl    = { display: 'block', marginBottom: '0.4rem', color: '#374151', fontWeight: '600', fontSize: '0.9rem' };
const inp    = { width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #E2E8F0', borderRadius: '0.6rem', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };
const eyeBtn = { position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#94A3B8' };
function F({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  );
}