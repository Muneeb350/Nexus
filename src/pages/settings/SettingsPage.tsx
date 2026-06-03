import React, { useState } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';

// ── Password strength ─────────────────────────────────────────────────────────

type StrengthLevel = 'weak' | 'medium' | 'strong';

function computeStrength(pw: string): { level: StrengthLevel; pct: number } {
  if (!pw) return { level: 'weak', pct: 0 };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const pct   = Math.round((score / 5) * 100);
  const level: StrengthLevel = score <= 2 ? 'weak' : score <= 3 ? 'medium' : 'strong';
  return { level, pct };
}

const STRENGTH_META: Record<StrengthLevel, { label: string; bar: string; text: string }> = {
  weak:   { label: 'Weak',   bar: 'bg-red-500',      text: 'text-red-600'      },
  medium: { label: 'Medium', bar: 'bg-amber-400',     text: 'text-amber-600'    },
  strong: { label: 'Strong', bar: 'bg-success-500',   text: 'text-success-700'  },
};

// ── PasswordField — custom eye-toggle (shared Input endAdornment is pointer-events-none) ──

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
};

// ── SettingsPage ──────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  if (!user) return null;

  const { level, pct } = computeStrength(newPw);
  const meta            = STRENGTH_META[level];

  const criteria = [
    { label: '8+ characters',        met: newPw.length >= 8       },
    { label: 'Uppercase letter',      met: /[A-Z]/.test(newPw)    },
    { label: 'Number',                met: /[0-9]/.test(newPw)    },
    { label: 'Symbol (!@#$…)',        met: /[^A-Za-z0-9]/.test(newPw) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
                <User size={18} className="mr-3" />
                Profile
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Lock size={18} className="mr-3" />
                Security
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Bell size={18} className="mr-3" />
                Notifications
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Globe size={18} className="mr-3" />
                Language
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Palette size={18} className="mr-3" />
                Appearance
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <CreditCard size={18} className="mr-3" />
                Billing
              </button>
            </nav>
          </CardBody>
        </Card>

        {/* Main settings content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
                <div>
                  <Button variant="outline" size="sm">Change Photo</Button>
                  <p className="mt-2 text-sm text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name"  defaultValue={user.name}  />
                <Input label="Email"      type="email" defaultValue={user.email} />
                <Input label="Role"       value={user.role} disabled />
                <Input label="Location"   defaultValue="San Francisco, CA" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={4}
                  defaultValue={user.bio}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardBody>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* 2FA toggle */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    <Badge variant="error" className="mt-1">Not Enabled</Badge>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              {/* Change Password */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <PasswordField
                    label="Current Password"
                    value={currentPw}
                    onChange={setCurrentPw}
                  />

                  <PasswordField
                    label="New Password"
                    value={newPw}
                    onChange={setNewPw}
                  />

                  {/* Strength meter */}
                  {newPw.length > 0 && (
                    <div className="space-y-2">
                      {/* Bar */}
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Label */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${meta.text}`}>
                          Password Strength: {meta.label}
                        </span>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </div>

                      {/* Criteria checklist */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {criteria.map(c => (
                          <div key={c.label} className="flex items-center gap-1.5">
                            {c.met
                              ? <CheckCircle2 size={13} className="text-success-500 shrink-0" />
                              : <XCircle      size={13} className="text-gray-300 shrink-0" />
                            }
                            <span className={`text-xs ${c.met ? 'text-success-700 font-medium' : 'text-gray-400'}`}>
                              {c.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPw}
                    onChange={setConfirmPw}
                  />

                  {/* Mismatch hint */}
                  {confirmPw.length > 0 && confirmPw !== newPw && (
                    <p className="text-xs text-red-600 font-medium">Passwords do not match.</p>
                  )}

                  <div className="flex justify-end">
                    <Button>Update Password</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
