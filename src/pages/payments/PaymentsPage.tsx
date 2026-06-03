import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard, Wallet, PlusCircle, ArrowUpRight, ArrowLeftRight,
  X, ChevronRight, TrendingUp, ArrowDownLeft, Clock,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useWallet, formatCurrency } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { users } from '../../data/users';
import type { BadgeVariant } from '../../components/ui/Badge';
import type { WalletTransaction } from '../../context/WalletContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const QUICK_AMOUNTS = [500, 1000, 5000, 10000];

const TYPE_META: Record<
  WalletTransaction['type'],
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  deposit:      { label: 'Deposit',      bg: 'bg-success-50',   text: 'text-success-700',  icon: <ArrowDownLeft  size={13} /> },
  withdrawal:   { label: 'Withdrawal',   bg: 'bg-red-50',       text: 'text-red-700',      icon: <ArrowUpRight   size={13} /> },
  transfer:     { label: 'Transfer',     bg: 'bg-gray-100',     text: 'text-gray-700',     icon: <ArrowLeftRight size={13} /> },
  investment:   { label: 'Investment',   bg: 'bg-primary-100',  text: 'text-primary-800',  icon: <TrendingUp     size={13} /> },
  deal_funding: { label: 'Deal Funding', bg: 'bg-primary-100',  text: 'text-primary-800',  icon: <TrendingUp     size={13} /> },
};

const STATUS_VARIANT: Record<WalletTransaction['status'], BadgeVariant> = {
  completed: 'success',
  pending:   'warning',
  failed:    'error',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isIncoming(txn: WalletTransaction, userId: string): boolean {
  return txn.receiverId === userId || (txn.type === 'deposit' && !txn.senderId);
}

// ── Shared modal shell ────────────────────────────────────────────────────────

const ModalShell: React.FC<{
  title: string;
  subtitle: string;
  iconBg: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, iconBg, icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      {/* Body */}
      <div className="overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

// ── Deposit Modal ─────────────────────────────────────────────────────────────

const DepositModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { walletBalance, deposit } = useWallet();
  const [amount, setAmount] = useState('');

  const parsed = parseFloat(amount) || 0;

  const handleSubmit = useCallback(() => {
    if (parsed <= 0) { toast.error('Please enter a valid amount.'); return; }
    deposit(parsed);
    toast.success(`${formatCurrency(parsed)} deposited successfully! 💰`);
    onClose();
  }, [parsed, deposit, onClose]);

  return (
    <ModalShell
      title="Deposit Funds"
      subtitle="Add money to your Business Nexus wallet"
      iconBg="bg-success-50"
      icon={<PlusCircle size={18} className="text-success-700" />}
      onClose={onClose}
    >
      <div className="px-6 py-5 space-y-5">
        {/* Current balance */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Current Balance</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(walletBalance)}</span>
        </div>

        {/* Quick amounts */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Quick Select</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  amount === String(q)
                    ? 'bg-success-500 text-white border-success-500 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-success-400 hover:text-success-700'
                }`}
              >
                {q >= 1000 ? `$${q / 1000}K` : `$${q}`}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount input */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount</p>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-success-500/20 focus:border-success-400 transition-colors"
            />
          </div>
          {parsed > 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              New balance after deposit: <span className="font-bold text-success-700">{formatCurrency(walletBalance + parsed)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={parsed <= 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-success-500 hover:bg-success-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
        >
          <PlusCircle size={15} />
          Deposit Funds
        </button>
      </div>
    </ModalShell>
  );
};

// ── Withdraw Modal ────────────────────────────────────────────────────────────

const WithdrawModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { walletBalance, withdraw } = useWallet();
  const [amount, setAmount] = useState('');

  const parsed       = parseFloat(amount) || 0;
  const afterBalance = walletBalance - parsed;
  const isInsufficient = parsed > walletBalance;

  const handleSubmit = useCallback(() => {
    if (parsed <= 0) { toast.error('Please enter a valid amount.'); return; }
    const ok = withdraw(parsed);
    if (!ok) {
      toast.error(`Insufficient balance. You only have ${formatCurrency(walletBalance)}.`);
      return;
    }
    toast.success(`${formatCurrency(parsed)} withdrawn successfully!`);
    onClose();
  }, [parsed, walletBalance, withdraw, onClose]);

  return (
    <ModalShell
      title="Withdraw Funds"
      subtitle="Transfer money out of your wallet"
      iconBg="bg-red-50"
      icon={<ArrowUpRight size={18} className="text-red-600" />}
      onClose={onClose}
    >
      <div className="px-6 py-5 space-y-5">
        {/* Current balance */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Available Balance</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(walletBalance)}</span>
        </div>

        {/* Quick amounts */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Quick Select</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                disabled={q > walletBalance}
                className={`py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  amount === String(q)
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600'
                }`}
              >
                {q >= 1000 ? `$${q / 1000}K` : `$${q}`}
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount</p>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className={`w-full pl-8 pr-4 py-3 border rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-colors ${
                isInsufficient
                  ? 'border-red-400 bg-red-50 focus:ring-red-500/20'
                  : 'border-gray-200 focus:ring-red-500/20 focus:border-red-400'
              }`}
            />
          </div>
          {parsed > 0 && (
            <p className={`text-xs mt-1.5 ${isInsufficient ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              {isInsufficient
                ? `Insufficient balance — you need ${formatCurrency(parsed - walletBalance)} more.`
                : `Balance after withdrawal: ${formatCurrency(afterBalance)}`}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={parsed <= 0 || isInsufficient}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
        >
          <ArrowUpRight size={15} />
          Withdraw
        </button>
      </div>
    </ModalShell>
  );
};

// ── Transfer Modal ────────────────────────────────────────────────────────────

const TransferModal: React.FC<{ currentUserId: string; onClose: () => void }> = ({
  currentUserId,
  onClose,
}) => {
  const { walletBalance, transfer } = useWallet();
  const otherUsers = users.filter(u => u.id !== currentUserId);

  const [toId,   setToId]   = useState(otherUsers[0]?.id   ?? '');
  const [toName, setToName] = useState(otherUsers[0]?.name ?? '');
  const [amount, setAmount] = useState('');

  const parsed       = parseFloat(amount) || 0;
  const afterBalance = walletBalance - parsed;
  const isInsufficient = parsed > walletBalance;

  const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = otherUsers.find(u => u.id === e.target.value);
    setToId(e.target.value);
    setToName(found?.name ?? '');
  };

  const handleSubmit = useCallback(() => {
    if (!toId)         { toast.error('Please select a recipient.');     return; }
    if (parsed <= 0)   { toast.error('Please enter a valid amount.');   return; }
    const ok = transfer(toId, toName, parsed);
    if (!ok) {
      toast.error(`Insufficient balance. You only have ${formatCurrency(walletBalance)}.`);
      return;
    }
    toast.success(`${formatCurrency(parsed)} sent to ${toName}! ↗`);
    onClose();
  }, [toId, toName, parsed, walletBalance, transfer, onClose]);

  return (
    <ModalShell
      title="Transfer Funds"
      subtitle="Send money to another Business Nexus member"
      iconBg="bg-primary-50"
      icon={<ArrowLeftRight size={18} className="text-primary-600" />}
      onClose={onClose}
    >
      <div className="px-6 py-5 space-y-5">
        {/* Current balance */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Available Balance</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(walletBalance)}</span>
        </div>

        {/* Recipient */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Send To</p>
          <select
            value={toId}
            onChange={handleRecipientChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors appearance-none cursor-pointer"
          >
            {otherUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role === 'investor' ? 'Investor' : 'Entrepreneur'}
              </option>
            ))}
          </select>
        </div>

        {/* Quick amounts */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Quick Select</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                disabled={q > walletBalance}
                className={`py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  amount === String(q)
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:text-primary-600'
                }`}
              >
                {q >= 1000 ? `$${q / 1000}K` : `$${q}`}
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount</p>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className={`w-full pl-8 pr-4 py-3 border rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-colors ${
                isInsufficient
                  ? 'border-red-400 bg-red-50 focus:ring-red-500/20'
                  : 'border-gray-200 focus:ring-primary-500/20 focus:border-primary-400'
              }`}
            />
          </div>
          {parsed > 0 && (
            <p className={`text-xs mt-1.5 ${isInsufficient ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              {isInsufficient
                ? `Insufficient balance — you need ${formatCurrency(parsed - walletBalance)} more.`
                : `Balance after transfer: ${formatCurrency(afterBalance)}`}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={parsed <= 0 || isInsufficient || !toId}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeftRight size={15} />
          Send Transfer
        </button>
      </div>
    </ModalShell>
  );
};

// ── PaymentsPage ──────────────────────────────────────────────────────────────

export const PaymentsPage: React.FC = () => {
  const { user }                              = useAuth();
  const { walletBalance, userTransactions }   = useWallet();
  const [activeModal, setActiveModal]         = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);

  if (!user) return null;

  const isInvestor     = user.role === 'investor';
  const completedCount = userTransactions.filter(t => t.status === 'completed').length;
  const pendingCount   = userTransactions.filter(t => t.status === 'pending').length;

  // ── Action cards config ────────────────────────────────────────────────────

  const ACTIONS = [
    {
      key:     'deposit' as const,
      label:   'Deposit',
      desc:    'Add funds to your wallet',
      iconBg:  'bg-success-50',
      icon:    <PlusCircle    size={20} className="text-success-700" />,
      border:  'hover:border-success-500 hover:shadow-success-100/60',
      textHov: 'group-hover:text-success-700',
    },
    {
      key:     'withdraw' as const,
      label:   'Withdraw',
      desc:    'Move funds to your bank',
      iconBg:  'bg-red-50',
      icon:    <ArrowUpRight  size={20} className="text-red-600" />,
      border:  'hover:border-red-400 hover:shadow-red-100/60',
      textHov: 'group-hover:text-red-600',
    },
    {
      key:     'transfer' as const,
      label:   'Transfer',
      desc:    'Send to another member',
      iconBg:  'bg-primary-50',
      icon:    <ArrowLeftRight size={20} className="text-primary-600" />,
      border:  'hover:border-primary-400 hover:shadow-primary-100/60',
      textHov: 'group-hover:text-primary-600',
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg shrink-0">
          <CreditCard className="text-primary-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments &amp; Wallet</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isInvestor
              ? 'Manage your investment capital and track all financial activity.'
              : 'Track your funding, transfers, and wallet balance.'}
          </p>
        </div>
      </div>

      {/* Balance hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-800 text-white shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-14 -right-20 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Balance */}
          <div className="flex items-center gap-5 flex-1">
            <div className="p-3.5 bg-white/10 rounded-2xl shrink-0">
              <Wallet size={26} className="text-white" />
            </div>
            <div>
              <p className="text-slate-300 text-sm font-medium tracking-wide">Available Balance</p>
              <h2 className="text-4xl font-black text-white mt-0.5 tracking-tight">
                {formatCurrency(walletBalance)}
              </h2>
              <p className="text-slate-400 text-xs mt-1.5">
                {isInvestor ? 'Ready to deploy capital' : 'Total received investments'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0">
            <div className="text-center">
              <p className="text-slate-400 text-xs font-medium mb-1">Completed</p>
              <p className="text-3xl font-black text-white">{completedCount}</p>
              <p className="text-slate-500 text-xs mt-0.5">transactions</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <p className="text-slate-400 text-xs font-medium mb-1">Pending</p>
              <p className="text-3xl font-black text-amber-300">{pendingCount}</p>
              <p className="text-slate-500 text-xs mt-0.5">transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTIONS.map(action => (
          <button
            key={action.key}
            onClick={() => setActiveModal(action.key)}
            className={`group flex items-center gap-4 w-full px-5 py-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-all text-left ${action.border}`}
          >
            <div className={`p-3 ${action.iconBg} rounded-xl shrink-0`}>
              {action.icon}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold text-gray-900 transition-colors ${action.textHov}`}>
                {action.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
            </div>
            <ChevronRight size={16} className={`text-gray-300 transition-colors ${action.textHov} shrink-0`} />
          </button>
        ))}
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-gray-900">Transaction History</h2>
            <Badge variant="primary" size="sm" rounded>{userTransactions.length}</Badge>
          </div>
        </div>

        {userTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-3">
              <Clock size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No transactions yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Use the action cards above to deposit, withdraw, or transfer funds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">From → To</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {userTransactions.map(txn => {
                  const meta    = TYPE_META[txn.type] ?? TYPE_META.transfer;
                  const credit  = isIncoming(txn, user.id);
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500">{formatDate(txn.date)}</span>
                      </td>

                      {/* Type badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>

                      {/* From → To */}
                      <td className="px-6 py-4 min-w-0">
                        <p className="text-sm text-gray-700 truncate max-w-[200px]">
                          <span className="font-medium">{txn.sender}</span>
                          <span className="text-gray-400 mx-1.5">→</span>
                          <span className="font-medium">{txn.receiver}</span>
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span
                          className={`text-sm font-bold ${
                            credit ? 'text-success-700' : 'text-red-600'
                          }`}
                        >
                          {credit ? '+' : '−'}{formatCurrency(txn.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <Badge variant={STATUS_VARIANT[txn.status]} size="sm" rounded>
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'deposit'  && <DepositModal  onClose={() => setActiveModal(null)} />}
      {activeModal === 'withdraw' && <WithdrawModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'transfer' && (
        <TransferModal currentUserId={user.id} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
};
