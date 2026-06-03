import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { entrepreneurs, investors } from '../data/users';
import type { UserRole } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  id: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24-hour)
  endTime: string;    // HH:MM (24-hour)
  userId: string;
}

export interface MeetingRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatarUrl: string;
  receiverId: string;
  date: string;       // YYYY-MM-DD
  timeSlot: string;   // display string, e.g. "10:00 – 10:30"
  message: string;
  status: 'pending' | 'accepted' | 'declined';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatTimeTo12Hour(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
}

export function formatTimeSlot(slot: string): string {
  return slot.split('–').map(t => formatTimeTo12Hour(t.trim())).join(' – ');
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

function buildInitialSlots(userId: string): AvailabilitySlot[] {
  return [
    { id: 's1', userId, date: offsetDate(0), startTime: '09:00', endTime: '09:30' },
    { id: 's2', userId, date: offsetDate(1), startTime: '14:00', endTime: '14:30' },
    { id: 's3', userId, date: offsetDate(2), startTime: '15:00', endTime: '15:30' },
  ];
}

function buildInitialRequests(userId: string, role: UserRole): MeetingRequest[] {
  const pool = role === 'entrepreneur' ? investors : entrepreneurs;

  const base: MeetingRequest[] = [
    {
      id: 'mr1',
      senderId: pool[0].id,
      senderName: pool[0].name,
      senderRole: pool[0].role,
      senderAvatarUrl: pool[0].avatarUrl,
      receiverId: userId,
      date: offsetDate(0),
      timeSlot: '10:00 – 10:30',
      message:
        "Hi! I'd love to discuss a potential collaboration regarding your latest venture. Are you available for a quick call today?",
      status: 'pending',
    },
    {
      id: 'mr2',
      senderId: pool[1].id,
      senderName: pool[1].name,
      senderRole: pool[1].role,
      senderAvatarUrl: pool[1].avatarUrl,
      receiverId: userId,
      date: offsetDate(2),
      timeSlot: '15:00 – 15:30',
      message:
        'I reviewed your profile and believe there is strong alignment with my portfolio thesis. Can we schedule a 30-minute intro call?',
      status: 'pending',
    },
  ];

  if (pool[2]) {
    base.push({
      id: 'mr3',
      senderId: pool[2].id,
      senderName: pool[2].name,
      senderRole: pool[2].role,
      senderAvatarUrl: pool[2].avatarUrl,
      receiverId: userId,
      date: offsetDate(1),
      timeSlot: '11:00 – 11:30',
      message:
        "Following up on our messages — let's find a time that works for both of us to connect.",
      status: 'pending',
    });
  }

  return base;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface MeetingsContextValue {
  slots: AvailabilitySlot[];
  requests: MeetingRequest[];
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  addSlot: (slot: AvailabilitySlot) => void;
  removeSlot: (id: string) => void;
}

const MeetingsContext = createContext<MeetingsContextValue | null>(null);

export const MeetingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [requests, setRequests] = useState<MeetingRequest[]>([]);

  // Seed once per unique user.id — handles async auth restore from localStorage
  const prevUserIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!user || prevUserIdRef.current === user.id) return;
    prevUserIdRef.current = user.id;
    setSlots(buildInitialSlots(user.id));
    setRequests(buildInitialRequests(user.id, user.role));
  }, [user]);

  const acceptRequest = (id: string) =>
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'accepted' as const } : r)
    );

  const declineRequest = (id: string) =>
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'declined' as const } : r)
    );

  const addSlot = (slot: AvailabilitySlot) =>
    setSlots(prev => [...prev, slot]);

  const removeSlot = (id: string) =>
    setSlots(prev => prev.filter(s => s.id !== id));

  return (
    <MeetingsContext.Provider
      value={{ slots, requests, acceptRequest, declineRequest, addSlot, removeSlot }}
    >
      {children}
    </MeetingsContext.Provider>
  );
};

export function useMeetings(): MeetingsContextValue {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error('useMeetings must be used within MeetingsProvider');
  return ctx;
}
