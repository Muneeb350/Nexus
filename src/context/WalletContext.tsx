import React, {
  createContext, useContext, useState, useEffect,
  useRef, useMemo, useCallback,
} from 'react';
import { useAuth } from './AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  amount: number;
  sender: string;
  senderId?: string;
  receiver: string;
  receiverId?: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'deposit' | 'withdrawal' | 'transfer' | 'investment' | 'deal_funding';
  date: string; // ISO string
}

interface WalletContextValue {
  walletBalance: number;
  userBalances: Record<string, number>;
  transactions: WalletTransaction[];
  userTransactions: WalletTransaction[]; // pre-filtered for the logged-in user
  deposit: (amount: number) => void;
  withdraw: (amount: number) => boolean;
  transfer: (toUserId: string, toUserName: string, amount: number) => boolean;
  fundDeal: (entrepreneurId: string, entrepreneurName: string, amount: number) => boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Seed data ─────────────────────────────────────────────────────────────────

function buildSeedTransactions(
  role: string,
  userName: string,
  userId: string,
): WalletTransaction[] {
  if (role === 'investor') {
    return [
      {
        id: `${userId}_s1`,
        amount: 25000,
        sender: 'Wire Transfer',
        receiver: userName,
        receiverId: userId,
        status: 'completed',
        type: 'deposit',
        date: '2026-05-01T10:00:00Z',
      },
      {
        id: `${userId}_s2`,
        amount: 5000,
        sender: userName,
        senderId: userId,
        receiver: 'NovaTech Startup',
        status: 'pending',
        type: 'investment',
        date: '2026-05-28T14:30:00Z',
      },
      {
        id: `${userId}_s3`,
        amount: 2500,
        sender: userName,
        senderId: userId,
        receiver: 'GreenLeaf Inc.',
        status: 'completed',
        type: 'investment',
        date: '2026-05-15T09:00:00Z',
      },
    ];
  }
  // entrepreneur
  return [
    {
      id: `${userId}_s1`,
      amount: 5000,
      sender: 'Michael Rodriguez',
      senderId: 'i1',
      receiver: userName,
      receiverId: userId,
      status: 'pending',
      type: 'investment',
      date: '2026-05-28T14:30:00Z',
    },
    {
      id: `${userId}_s2`,
      amount: 2500,
      sender: 'Jennifer Lee',
      senderId: 'i2',
      receiver: userName,
      receiverId: userId,
      status: 'completed',
      type: 'investment',
      date: '2026-05-15T09:00:00Z',
    },
  ];
}

// ── Context ───────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
  const [transactions, setTransactions]  = useState<WalletTransaction[]>([]);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Seed once per unique user login (preserves balances funded by other users)
  useEffect(() => {
    if (!user || prevUserIdRef.current === user.id) return;
    prevUserIdRef.current = user.id;

    // Don't overwrite a balance that was already set (e.g. funded by an investor)
    setUserBalances(prev =>
      prev[user.id] !== undefined
        ? prev
        : { ...prev, [user.id]: user.role === 'investor' ? 25000 : 0 },
    );

    // Append seed transactions only if none exist for this user yet
    setTransactions(prev => {
      const alreadySeeded = prev.some(
        t => t.receiverId === user.id || t.senderId === user.id,
      );
      if (alreadySeeded) return prev;
      return [...buildSeedTransactions(user.role, user.name, user.id), ...prev];
    });
  }, [user]);

  // Derived: logged-in user's current balance
  const walletBalance = useMemo(
    () => (user ? (userBalances[user.id] ?? 0) : 0),
    [userBalances, user],
  );

  // Derived: transactions relevant to the logged-in user
  const userTransactions = useMemo(() => {
    if (!user) return [];
    return transactions.filter(
      t => t.receiverId === user.id || t.senderId === user.id,
    );
  }, [transactions, user]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const deposit = useCallback((amount: number) => {
    if (!user) return;
    setUserBalances(prev => ({ ...prev, [user.id]: (prev[user.id] ?? 0) + amount }));
    setTransactions(prev => [
      {
        id: `txn_${Date.now()}`,
        amount,
        sender: 'External Transfer',
        receiver: user.name,
        receiverId: user.id,
        status: 'completed',
        type: 'deposit',
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [user]);

  const withdraw = useCallback((amount: number): boolean => {
    if (!user) return false;
    const balance = userBalances[user.id] ?? 0;
    if (amount > balance) return false;
    setUserBalances(prev => ({ ...prev, [user.id]: balance - amount }));
    setTransactions(prev => [
      {
        id: `txn_${Date.now()}`,
        amount,
        sender: user.name,
        senderId: user.id,
        receiver: 'External Account',
        status: 'completed',
        type: 'withdrawal',
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
    return true;
  }, [user, userBalances]);

  const transfer = useCallback(
    (toUserId: string, toUserName: string, amount: number): boolean => {
      if (!user) return false;
      const balance = userBalances[user.id] ?? 0;
      if (amount > balance) return false;
      setUserBalances(prev => ({
        ...prev,
        [user.id]: balance - amount,
        [toUserId]: (prev[toUserId] ?? 0) + amount,
      }));
      setTransactions(prev => [
        {
          id: `txn_${Date.now()}`,
          amount,
          sender: user.name,
          senderId: user.id,
          receiver: toUserName,
          receiverId: toUserId,
          status: 'completed',
          type: 'transfer',
          date: new Date().toISOString(),
        },
        ...prev,
      ]);
      return true;
    },
    [user, userBalances],
  );

  const fundDeal = useCallback(
    (entrepreneurId: string, entrepreneurName: string, amount: number): boolean => {
      if (!user) return false;
      const balance = userBalances[user.id] ?? 0;
      if (amount > balance) return false;
      setUserBalances(prev => ({
        ...prev,
        [user.id]: balance - amount,
        [entrepreneurId]: (prev[entrepreneurId] ?? 0) + amount,
      }));
      setTransactions(prev => [
        {
          id: `txn_${Date.now()}`,
          amount,
          sender: user.name,
          senderId: user.id,
          receiver: entrepreneurName,
          receiverId: entrepreneurId,
          status: 'completed',
          type: 'deal_funding',
          date: new Date().toISOString(),
        },
        ...prev,
      ]);
      return true;
    },
    [user, userBalances],
  );

  return (
    <WalletContext.Provider
      value={{ walletBalance, userBalances, transactions, userTransactions, deposit, withdraw, transfer, fundDeal }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
