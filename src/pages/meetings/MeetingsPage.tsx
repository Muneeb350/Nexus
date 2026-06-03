import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';
import { CalendarDays, Clock, Plus, X, Check, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useMeetings,
  toDateKey,
  formatTimeTo12Hour,
  formatTimeSlot,
} from '../../context/MeetingsContext';
import type { MeetingRequest } from '../../context/MeetingsContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarValue = Date | [Date | null, Date | null] | null;

// ─── MeetingRequestCard ───────────────────────────────────────────────────────

interface RequestCardProps {
  request: MeetingRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

const MeetingRequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onDecline,
}) => {
  const isPending = request.status === 'pending';

  const formattedDate = new Date(`${request.date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const statusBadge: Record<MeetingRequest['status'], React.ReactNode> = {
    pending: <Badge variant="warning" size="sm" rounded>Pending</Badge>,
    accepted: <Badge variant="success" size="sm" rounded>Accepted</Badge>,
    declined: <Badge variant="error" size="sm" rounded>Declined</Badge>,
  };

  return (
    <div className={`px-6 py-4 transition-opacity ${!isPending ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <Avatar src={request.senderAvatarUrl} alt={request.senderName} size="md" />

        <div className="flex-1 min-w-0">
          {/* Name / role / status row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">
                  {request.senderName}
                </span>
                <Badge
                  variant={request.senderRole === 'investor' ? 'primary' : 'secondary'}
                  size="sm"
                  rounded
                >
                  {request.senderRole === 'investor' ? 'Investor' : 'Entrepreneur'}
                </Badge>
                {statusBadge[request.status]}
              </div>

              {/* Date + time */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarDays size={11} />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {formatTimeSlot(request.timeSlot)}
                </span>
              </div>
            </div>

            {/* Action buttons — only when pending */}
            {isPending && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="xs"
                  variant="success"
                  leftIcon={<Check size={12} />}
                  onClick={() => onAccept(request.id)}
                >
                  Accept
                </Button>
                <Button
                  size="xs"
                  variant="error"
                  leftIcon={<X size={12} />}
                  onClick={() => onDecline(request.id)}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>

          {/* Message preview */}
          <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2 italic">
            "{request.message}"
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── MeetingsPage ─────────────────────────────────────────────────────────────

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const { slots, requests, acceptRequest, declineRequest, addSlot, removeSlot } = useMeetings();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Add-slot form
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [slotError, setSlotError] = useState('');

  // ── Derived values ────────────────────────────────────────────────────────

  const selectedDateKey = toDateKey(selectedDate);

  const slotsForDate = slots.filter(
    s => s.date === selectedDateKey && s.userId === user?.id
  );

  const confirmedForDate = requests.filter(
    r => r.date === selectedDateKey && r.status === 'accepted'
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const formattedSelected = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDateChange = (value: CalendarValue) => {
    if (value instanceof Date) setSelectedDate(value);
  };

  const validateSlot = (): string => {
    if (!newSlotStart || !newSlotEnd) return 'Both start and end times are required.';
    if (newSlotStart >= newSlotEnd) return 'End time must be after start time.';
    const overlaps = slotsForDate.some(
      s => !(newSlotEnd <= s.startTime || newSlotStart >= s.endTime)
    );
    if (overlaps) return 'This range overlaps with an existing slot.';
    return '';
  };

  const handleAddSlot = () => {
    const err = validateSlot();
    if (err) { setSlotError(err); return; }

    addSlot({
      id: `s${Date.now()}`,
      userId: user!.id,
      date: selectedDateKey,
      startTime: newSlotStart,
      endTime: newSlotEnd,
    });
    setNewSlotStart('');
    setNewSlotEnd('');
    setSlotError('');
    setShowSlotForm(false);
    toast.success('Availability slot added!');
  };

  const handleRemoveSlot = (id: string) => {
    removeSlot(id);
    toast.success('Slot removed.');
  };

  const cancelSlotForm = () => {
    setShowSlotForm(false);
    setNewSlotStart('');
    setNewSlotEnd('');
    setSlotError('');
  };

  const handleAccept = (id: string) => {
    acceptRequest(id);
    toast.success('Meeting request accepted!');
  };

  const handleDecline = (id: string) => {
    declineRequest(id);
    toast('Meeting request declined.', {
      icon: '⚠️',
      style: { border: '1px solid #F59E0B', color: '#B45309' },
    });
  };

  // ── Calendar tile dot indicators ──────────────────────────────────────────

  const tileContent = ({ date, view }: { date: Date; view: string }): React.ReactNode => {
    if (view !== 'month') return null;
    const key = toDateKey(date);
    const hasSlot = slots.some(s => s.date === key && s.userId === user?.id);
    const hasPendingReq = requests.some(r => r.date === key && r.status === 'pending');
    const hasConfirmed = requests.some(r => r.date === key && r.status === 'accepted');
    if (!hasSlot && !hasPendingReq && !hasConfirmed) return null;
    return (
      <div className="flex justify-center gap-0.5 mt-0.5">
        {hasSlot && <span className="inline-block h-1 w-1 rounded-full bg-primary-500" />}
        {hasPendingReq && <span className="inline-block h-1 w-1 rounded-full bg-accent-500" />}
        {hasConfirmed && <span className="inline-block h-1 w-1 rounded-full bg-success-500" />}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Page Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg shrink-0">
          <CalendarDays className="text-primary-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.role === 'entrepreneur'
              ? 'Set your availability and manage incoming meeting requests from investors.'
              : 'Set your availability and manage incoming meeting requests from entrepreneurs.'}
          </p>
        </div>
      </div>

      {/* ── Top Grid: Calendar + Date Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Calendar Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Select a Date</h2>

          <div className="nexus-calendar flex justify-center">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileContent={tileContent}
              locale="en-US"
              minDetail="month"
              next2Label={null}
              prev2Label={null}
            />
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-primary-500" />
              Availability slot
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-accent-500" />
              Pending request
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-success-500" />
              Confirmed meeting
            </span>
          </div>
        </div>

        {/* Date Panel */}
        <div className="flex flex-col gap-4">

          {/* Selected Date */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Selected Date
            </p>
            <div className="flex items-start gap-2">
              <CalendarDays className="text-primary-500 mt-0.5 shrink-0" size={15} />
              <p className="text-sm font-semibold text-primary-700 leading-snug">
                {formattedSelected}
              </p>
            </div>
            {slotsForDate.length > 0 && (
              <div className="mt-3">
                <Badge variant="primary" size="sm" rounded>
                  {slotsForDate.length} slot{slotsForDate.length > 1 ? 's' : ''} set
                </Badge>
              </div>
            )}
          </div>

          {/* Availability Slots */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">My Availability</h3>
              {!showSlotForm && (
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<Plus size={12} />}
                  onClick={() => setShowSlotForm(true)}
                >
                  Add Slot
                </Button>
              )}
            </div>

            {/* Inline add-slot form */}
            {showSlotForm && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Start
                    </label>
                    <input
                      type="time"
                      value={newSlotStart}
                      onChange={e => {
                        setNewSlotStart(e.target.value);
                        setSlotError('');
                      }}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      End
                    </label>
                    <input
                      type="time"
                      value={newSlotEnd}
                      onChange={e => {
                        setNewSlotEnd(e.target.value);
                        setSlotError('');
                      }}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {slotError && (
                  <p className="text-xs text-error-500 font-medium">{slotError}</p>
                )}

                <div className="flex gap-2">
                  <Button size="xs" onClick={handleAddSlot}>
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" onClick={cancelSlotForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Slot list for selected date */}
            {slotsForDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clock className="text-gray-300 mb-2" size={22} />
                <p className="text-xs text-gray-400 font-medium">No slots for this date</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Use "Add Slot" to mark your availability.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {slotsForDate
                  .slice()
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between px-3 py-2 bg-primary-50 rounded-lg border border-primary-100"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-primary-500" />
                        <span className="text-xs font-semibold text-primary-700">
                          {formatTimeTo12Hour(slot.startTime)} – {formatTimeTo12Hour(slot.endTime)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="text-gray-400 hover:text-error-500 transition-colors p-0.5 rounded"
                        aria-label="Remove slot"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Confirmed Meetings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Confirmed Meetings</h3>
              {confirmedForDate.length > 0 && (
                <Badge variant="success" size="sm" rounded>
                  {confirmedForDate.length} confirmed
                </Badge>
              )}
            </div>

            {confirmedForDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <Check className="text-gray-200 mb-1.5" size={20} />
                <p className="text-xs text-gray-400">No confirmed meetings for this date.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {confirmedForDate.map(req => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 p-3 bg-success-50 rounded-lg"
                  >
                    <div className="mt-0.5 shrink-0">
                      <Check size={14} className="text-success-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900">
                          {req.senderName}
                        </span>
                        <Badge
                          variant={req.senderRole === 'investor' ? 'primary' : 'secondary'}
                          size="sm"
                          rounded
                        >
                          {req.senderRole === 'investor' ? 'Investor' : 'Entrepreneur'}
                        </Badge>
                      </div>
                      <span className="flex items-center gap-1 mt-1 text-xs font-medium text-success-700">
                        <Clock size={11} />
                        {formatTimeSlot(req.timeSlot)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Incoming Meeting Requests Panel ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-800">
              Incoming Meeting Requests
            </h2>
            {pendingCount > 0 && (
              <Badge variant="accent" size="sm" rounded>
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {requests.length} total request{requests.length !== 1 ? 's' : ''}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="p-3 bg-gray-50 rounded-full mb-3">
              <Users className="text-gray-300" size={28} />
            </div>
            <p className="text-sm text-gray-500 font-medium">No meeting requests yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Requests from{' '}
              {user?.role === 'entrepreneur' ? 'investors' : 'entrepreneurs'} will appear
              here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map(request => (
              <MeetingRequestCard
                key={request.id}
                request={request}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
