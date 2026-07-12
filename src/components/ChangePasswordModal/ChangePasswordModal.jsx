import React, { useState } from 'react';
import { KeyRound, X, Check, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../../services/authService';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleShow = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setMsg({ text: 'Mật khẩu xác nhận không khớp.', isError: true });
      return;
    }
    if (form.next.length < 6) {
      setMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', isError: true });
      return;
    }

    setSaving(true);
    setMsg({ text: '', isError: false });

    try {
      await changePassword(form.current, form.next);
      setMsg({ text: 'Đổi mật khẩu thành công!', isError: false });
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      console.error(err);
      setMsg({ text: err.message || 'Có lỗi xảy ra khi đổi mật khẩu.', isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out',
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: '20px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: '#0D3E26',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Đổi mật khẩu tài khoản</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {msg.text && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '16px',
              background: msg.isError ? '#FEF2F2' : '#F0FDF4',
              color: msg.isError ? '#991B1B' : '#166534',
              border: msg.isError ? '1px solid #FCA5A5' : '1px solid #86EFAC',
            }}>
              {!msg.isError && <Check size={16} />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Current Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Mật khẩu hiện tại
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass.current ? 'text' : 'password'}
                required
                value={form.current}
                onChange={e => setForm({ ...form, current: e.target.value })}
                placeholder="Nhập mật khẩu hiện tại"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#1E293B',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => toggleShow('current')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Mật khẩu mới (tối thiểu 6 ký tự)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass.next ? 'text' : 'password'}
                required
                value={form.next}
                onChange={e => setForm({ ...form, next: e.target.value })}
                placeholder="Nhập mật khẩu mới"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#1E293B',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => toggleShow('next')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPass.next ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Xác nhận mật khẩu mới
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass.confirm ? 'text' : 'password'}
                required
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                placeholder="Xác nhận lại mật khẩu mới"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#1E293B',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => toggleShow('confirm')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#0D3E26',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { if(!saving) e.currentTarget.style.background = '#092C1B'; }}
              onMouseLeave={e => { if(!saving) e.currentTarget.style.background = '#0D3E26'; }}
            >
              {saving ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
