import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Lock, Mail, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, roleName: string) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setEmail(demoEmail);
      setPassword('password123');
      await quickLogin(demoEmail, 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(`Failed demo login as ${roleName}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Layers size={28} className="text-indigo-400" />
          </div>
          <h2 className="auth-title">Welcome back to TaskFlow</h2>
          <p className="auth-subtitle">Sign in to manage projects, tasks, and team permissions</p>
        </div>

        {errorMsg && <div className="auth-error-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="emailInput">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="emailInput"
                type="email"
                className="form-control"
                placeholder="name@taskflow.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="passwordInput">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="passwordInput"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="demo-accounts-divider">
          <span>QUICK DEMO ACCESSIBILITY</span>
        </div>

        <div className="demo-roles-grid">
          <button
            type="button"
            className="demo-role-btn role-admin-btn"
            onClick={() => handleDemoLogin('admin@taskflow.dev', 'Admin')}
            disabled={isSubmitting}
          >
            <Shield size={16} />
            <span>Login as Admin</span>
          </button>

          <button
            type="button"
            className="demo-role-btn role-manager-btn"
            onClick={() => handleDemoLogin('manager@taskflow.dev', 'Manager')}
            disabled={isSubmitting}
          >
            <Shield size={16} />
            <span>Login as Manager</span>
          </button>

          <button
            type="button"
            className="demo-role-btn role-member-btn"
            onClick={() => handleDemoLogin('member@taskflow.dev', 'Member')}
            disabled={isSubmitting}
          >
            <Shield size={16} />
            <span>Login as Member</span>
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
