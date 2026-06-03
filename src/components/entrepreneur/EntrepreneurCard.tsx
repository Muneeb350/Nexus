import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, TrendingUp, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Entrepreneur } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useWallet, formatCurrency } from '../../context/WalletContext';

// ── Fund Deal Modal ───────────────────────────────────────────────────────────

const FUND_PRESETS = [1000, 5000, 10000, 25000];

const FundDealModal: React.FC<{
  entrepreneur: Entrepreneur;
  onClose: () => void;
}> = ({ entrepreneur, onClose }) => {
  const { walletBalance, fundDeal } = useWallet();
  const [selected, setSelected]     = useState<number | null>(null);
  const [custom, setCustom]         = useState('');

  const amount       = selected ?? (parseFloat(custom) || 0);
  const afterBalance = walletBalance - amount;
  const isInsufficient = amount > walletBalance;
  const isValid      = amount > 0 && !isInsufficient;

  const handleSelectPreset = (p: number) => {
    setSelected(p);
    setCustom('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustom(e.target.value);
    setSelected(null);
  };

  const handleFund = useCallback(() => {
    if (amount <= 0) {
      toast.error('Please select or enter an investment amount.');
      return;
    }
    const ok = fundDeal(entrepreneur.id, entrepreneur.name, amount);
    if (!ok) {
      toast.error(`Insufficient balance — you need ${formatCurrency(amount - walletBalance)} more.`);
      return;
    }
    toast.success(`${formatCurrency(amount)} funded to ${entrepreneur.name}! 🚀`);
    onClose();
  }, [amount, walletBalance, fundDeal, entrepreneur, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 rounded-xl">
              <TrendingUp size={18} className="text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Fund This Deal</h3>
              <p className="text-xs text-gray-500 mt-0.5">{entrepreneur.startupName}</p>
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
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Entrepreneur info */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-white rounded-xl border border-primary-100">
            <Avatar src={entrepreneur.avatarUrl} alt={entrepreneur.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{entrepreneur.name}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{entrepreneur.industry} · Team of {entrepreneur.teamSize}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="primary" size="sm">{entrepreneur.industry}</Badge>
                <span className="text-xs text-gray-400">Needs {entrepreneur.fundingNeeded}</span>
              </div>
            </div>
          </div>

          {/* Investor balance */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-gray-500 font-medium">Your Available Balance</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(walletBalance)}</span>
          </div>

          {/* Preset amounts */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Select Investment Amount
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {FUND_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => handleSelectPreset(p)}
                  disabled={p > walletBalance}
                  className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    selected === p
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:text-primary-600'
                  }`}
                >
                  {formatCurrency(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Custom Amount
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
              <input
                type="number"
                min="1"
                value={custom}
                onChange={handleCustomChange}
                placeholder="Enter custom amount"
                className={`w-full pl-8 pr-4 py-3 border rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:ring-2 transition-colors ${
                  isInsufficient && !selected
                    ? 'border-red-400 bg-red-50 focus:ring-red-500/20'
                    : 'border-gray-200 focus:ring-primary-500/20 focus:border-primary-400'
                }`}
              />
            </div>
          </div>

          {/* Balance preview */}
          {amount > 0 && (
            <div className={`rounded-xl border p-4 space-y-2 ${
              isInsufficient
                ? 'bg-red-50 border-red-200'
                : 'bg-success-50 border-success-500'
            }`}>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Current balance</span>
                <span className="font-semibold text-gray-800">{formatCurrency(walletBalance)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Investment amount</span>
                <span className="font-semibold text-primary-700">−{formatCurrency(amount)}</span>
              </div>
              <div className="border-t border-gray-200/60 pt-2 flex justify-between text-xs">
                <span className="font-semibold text-gray-600">Balance after funding</span>
                <span className={`font-black text-sm ${isInsufficient ? 'text-red-600' : 'text-success-700'}`}>
                  {formatCurrency(afterBalance)}
                </span>
              </div>
              {isInsufficient && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  ⚠ Insufficient balance for this investment.
                </p>
              )}
            </div>
          )}
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
            onClick={handleFund}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
          >
            <TrendingUp size={15} />
            Fund This Deal
          </button>
        </div>
      </div>
    </div>
  );
};

// ── EntrepreneurCard ──────────────────────────────────────────────────────────

interface EntrepreneurCardProps {
  entrepreneur: Entrepreneur;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true,
}) => {
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const [showFundModal, setShowFundModal] = useState(false);

  const isInvestorUser = user?.role === 'investor';

  const handleViewProfile = () => {
    navigate(`/profile/entrepreneur/${entrepreneur.id}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${entrepreneur.id}`);
  };

  const handleFundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFundModal(true);
  };

  return (
    <>
      <Card
        hoverable
        className="transition-all duration-300 h-full"
        onClick={handleViewProfile}
      >
        <CardBody className="flex flex-col">
          <div className="flex items-start">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="lg"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mr-4"
            />

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{entrepreneur.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{entrepreneur.startupName}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="primary" size="sm">{entrepreneur.industry}</Badge>
                <Badge variant="gray" size="sm">{entrepreneur.location}</Badge>
                <Badge variant="accent" size="sm">Founded {entrepreneur.foundedYear}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Pitch Summary</h4>
            <p className="text-sm text-gray-600 line-clamp-3">{entrepreneur.pitchSummary}</p>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-500">Funding Need</span>
              <p className="text-sm font-medium text-gray-900">{entrepreneur.fundingNeeded}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Team Size</span>
              <p className="text-sm font-medium text-gray-900">{entrepreneur.teamSize} people</p>
            </div>
          </div>
        </CardBody>

        {showActions && (
          <CardFooter className="bg-gray-50 space-y-2">
            {/* Fund Deal — investors only */}
            {isInvestorUser && (
              <button
                onClick={handleFundClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
              >
                <TrendingUp size={15} />
                Fund This Deal
              </button>
            )}

            {/* Standard actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<MessageCircle size={16} />}
                onClick={handleMessage}
              >
                Message
              </Button>

              <Button
                variant="primary"
                size="sm"
                rightIcon={<ExternalLink size={16} />}
                onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}
              >
                View Profile
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Fund deal modal — rendered outside Card to avoid overflow-hidden clipping issues */}
      {showFundModal && (
        <FundDealModal
          entrepreneur={entrepreneur}
          onClose={() => setShowFundModal(false)}
        />
      )}
    </>
  );
};
