import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, CircleDollarSign, Building2, LogIn, AlertCircle,
  Eye, EyeOff, Shield, Info, ArrowLeft, CheckCircle2, Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';
import { users } from '../../data/users';

// ── LoginPage ─────────────────────────────────────────────────────────────────

export const LoginPage: React.FC = () => {
  // ── Step & credentials ──────────────────────────────────────────────────────
  const [step, setStep]                 = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [role, setRole]                 = useState<UserRole>('entrepreneur');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [credLoading, setCredLoading]   = useState(false);

  // ── OTP ─────────────────────────────────────────────────────────────────────
  const [otp, setOtp]               = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError]     = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const { login } = useAuth();
  const navigate  = useNavigate();

  // Auto-focus first OTP box after step transition animation completes
  useEffect(() => {
    if (step === 'otp') {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ── Credential submit ────────────────────────────────────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCredLoading(true);

    // Simulate network check delay
    await new Promise(r => setTimeout(r, 900));

    const found = users.find(u => u.email === email && u.role === role);
    if (!found) {
      setError('No account found with these credentials. Check your email and selected role.');
      setCredLoading(false);
      return;
    }

    setCredLoading(false);
    setStep('otp');
    toast('A verification code has been sent to your registered email.', {
      icon: '📧',
      duration: 4000,
    });
  };

  // ── OTP submit ───────────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length < 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (code !== '123456') {
      setOtpError('Incorrect code. Please check the code and try again.');
      toast.error('Invalid verification code.');
      setOtp(Array(6).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 60);
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    try {
      await login(email, password, role);
      toast.success('🔐 Identity verified — access granted!');
      navigate(role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
    } catch (err) {
      setOtpError((err as Error).message);
      setOtpLoading(false);
    }
  };

  // ── OTP input handlers ───────────────────────────────────────────────────────
  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[i] = value.slice(-1);
    setOtp(next);
    setOtpError('');
    if (value && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    setOtpError('');
    setTimeout(() => otpRefs.current[Math.min(pasted.length, 5)]?.focus(), 0);
  };

  const handleBack = () => {
    setStep('credentials');
    setOtp(Array(6).fill(''));
    setOtpError('');
  };

  const fillDemoCredentials = (userRole: UserRole) => {
    setEmail(userRole === 'entrepreneur' ? 'sarah@techwave.io' : 'michael@vcinnovate.com');
    setPassword('password123');
    setRole(userRole);
    if (step === 'otp') handleBack();
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* Page header — changes icon + title on OTP step */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {step === 'credentials' ? (
            <div className="w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
              <svg
                width="32" height="32" viewBox="0 0 24 24"
                fill="none" xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <path
                  d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-primary-50 border-2 border-primary-200 rounded-2xl flex items-center justify-center animate-fade-in">
              <Shield size={30} className="text-primary-600" />
            </div>
          )}
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'credentials' ? 'Sign in to Business Nexus' : 'Two-Factor Authentication'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'credentials'
            ? 'Connect with investors and entrepreneurs'
            : 'Verify your identity to access your account'}
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

          {/* key forces remount so animate-fade-in re-fires on step change */}
          <div key={step} className="animate-fade-in">

            {/* ── STEP 1: Credentials ─────────────────────────────────────────── */}
            {step === 'credentials' && (
              <>
                {error && (
                  <div className="mb-5 flex items-start gap-2.5 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-lg">
                    <AlertCircle size={17} className="shrink-0 mt-0.5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
                  {/* Role selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { r: 'entrepreneur' as const, Icon: Building2,       label: 'Entrepreneur' },
                          { r: 'investor'     as const, Icon: CircleDollarSign, label: 'Investor'     },
                        ] as const
                      ).map(({ r, Icon, label }) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${
                            role === r
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon size={18} className="mr-2" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    fullWidth
                    startAdornment={<User size={18} />}
                  />

                  {/* Password with show / hide toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 focus:ring-2 focus:ring-opacity-50 sm:text-sm pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">Remember me</span>
                    </label>
                    <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={credLoading}
                    leftIcon={<LogIn size={18} />}
                  >
                    Continue to Verification
                  </Button>
                </form>

                {/* Demo accounts */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => fillDemoCredentials('entrepreneur')} leftIcon={<Building2 size={16} />}>
                      Entrepreneur
                    </Button>
                    <Button variant="outline" onClick={() => fillDemoCredentials('investor')} leftIcon={<CircleDollarSign size={16} />}>
                      Investor
                    </Button>
                  </div>
                </div>

                {/* Sign-up link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                      Sign up
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ── STEP 2: OTP ─────────────────────────────────────────────────── */}
            {step === 'otp' && (
              <div className="space-y-6">
                {/* Email confirmation */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 border border-primary-100 rounded-2xl mb-3">
                    <Smartphone size={24} className="text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Code sent to{' '}
                    <span className="font-semibold text-gray-900">{email}</span>
                  </p>
                </div>

                {/* Demo hint */}
                <div className="flex items-start gap-3 px-4 py-3.5 bg-primary-50 rounded-xl border border-primary-100">
                  <Info size={15} className="text-primary-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-primary-700 leading-relaxed">
                    <span className="font-bold">Demo mode:</span> Enter{' '}
                    <code className="font-mono font-extrabold text-primary-900 bg-primary-100 px-1.5 py-0.5 rounded-md tracking-widest">
                      123456
                    </code>{' '}
                    to proceed through 2FA.
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  {/* 6-digit input boxes */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">
                      Enter 6-digit code
                    </p>

                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          onPaste={handleOtpPaste}
                          className={`w-11 h-14 text-center text-2xl font-extrabold rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400/30 ${
                            otpError
                              ? 'border-error-500 bg-error-50 text-error-700 focus:border-error-500'
                              : digit
                                ? 'border-primary-500 bg-primary-50 text-primary-900'
                                : 'border-gray-200 text-gray-900 focus:border-primary-400 focus:bg-primary-50/30'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Inline OTP error */}
                    {otpError && (
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-error-700">
                        <AlertCircle size={14} />
                        <span>{otpError}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={otpLoading}
                    leftIcon={<CheckCircle2 size={18} />}
                    disabled={otp.join('').length < 6 || otpLoading}
                  >
                    Verify &amp; Sign In
                  </Button>
                </form>

                {/* Navigation */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to sign in
                  </button>

                  <p className="text-xs text-gray-400">
                    Didn't receive a code?{' '}
                    <button
                      type="button"
                      onClick={() => toast('New code sent!', { icon: '📧' })}
                      className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      Resend code
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
