'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const { login }    = useAuth();
  const [email,      setEmail]    = useState('');
  const [password,   setPassword] = useState('');
  const [showPass,   setShowPass] = useState(false);
  const [loading,    setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Please enter your email and password'); return; }
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      background:      'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0EA5E9 100%)',
    }}>

      {/* Left Side — Branding */}
      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '4rem',
        color:          'white',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚡</div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '1rem' }}>Jackot</h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.85, maxWidth: '360px', lineHeight: 1.6 }}>
          Your business, your way. Manage projects, track income, monitor your growth — all in one place.
        </p>
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['📊 Real-time financial reports', '🔨 Project & client management', '📱 Works on phone and desktop', '⚙️  Fully customizable per business'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.9 }}>
              <span style={{ fontSize: '1rem' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div style={{
        width:           '480px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '2rem',
        backgroundColor: 'rgba(255,255,255,0.07)',
        backdropFilter:  'blur(20px)',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding:         '2.5rem',
          borderRadius:    '1.25rem',
          boxShadow:       '0 24px 64px rgba(0,0,0,0.2)',
          width:           '100%',
          maxWidth:        '400px',
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem' }}>Welcome back</h2>
          <p style={{ color: '#94A3B8', marginBottom: '2rem', fontSize: '0.95rem' }}>Sign in to your Jackot account</p>

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inp}
            />
          </div>

          {/* Password with show/hide */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ ...inp, paddingRight: '3rem' }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#94A3B8' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem',
              background:    loading ? '#93C5FD' : 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
              color:         'white', border: 'none', borderRadius: '0.65rem',
              fontSize:      '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow:     '0 4px 16px rgba(29,78,216,0.3)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748B', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#1D4ED8', fontWeight: '700' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', marginBottom: '0.4rem', color: '#374151', fontWeight: '600', fontSize: '0.9rem' };
const inp = { width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #E2E8F0', borderRadius: '0.6rem', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };