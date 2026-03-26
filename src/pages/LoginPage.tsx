import { useState } from 'react';
import { Heart, Lock, Eye, EyeOff, Shield, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) login(password);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '60px',
            background: 'rgba(107,78,255,0.15)',
            border: '2px solid rgba(174,171,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={56} color="#AEABFA" fill="#6B4EFF" />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#AEABFA', marginBottom: '4px' }}>
            Corazonada
          </h1>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
            Seniors 2026
          </p>
          <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Sistema de gestión de pedidos</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="#AEABFA" />
            <span style={{ fontSize: '14px', color: '#D1D5DB', fontWeight: '500' }}>
              Contraseña de acceso
            </span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#111827', borderRadius: '12px',
            border: '1px solid #1F2937', height: '52px',
            marginBottom: '16px',
          }}>
            <Lock size={20} color="#9CA3AF" style={{ marginLeft: '16px', flexShrink: 0 }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: '#fff', fontSize: '16px', padding: '0 12px',
                height: '100%',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', padding: '12px', color: '#9CA3AF' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.1)', padding: '12px',
              borderRadius: '8px', marginBottom: '16px',
            }}>
              <XCircle size={16} color="#EF4444" />
              <span style={{ fontSize: '14px', color: '#EF4444' }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            style={{
              width: '100%', height: '52px', borderRadius: '12px',
              background: password.trim() ? '#6B4EFF' : '#374151',
              color: '#fff', fontSize: '16px', fontWeight: '600',
              cursor: password.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            Entrar
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', marginTop: '32px' }}>
          Generación Duodécimo 2026
        </p>
      </div>
    </div>
  );
}