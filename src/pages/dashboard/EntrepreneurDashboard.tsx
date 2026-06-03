import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, CalendarDays, Clock, Wallet, CreditCard, ChevronRight, ShieldAlert, Compass } from 'lucide-react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step, EventData } from 'react-joyride';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { useMeetings, toDateKey, formatTimeSlot } from '../../context/MeetingsContext';
import { useWallet, formatCurrency } from '../../context/WalletContext';
import { CollaborationRequest } from '../../types';
import { getRequestsForEntrepreneur } from '../../data/collaborationRequests';
import { investors } from '../../data/users';

// ── Tour configuration ────────────────────────────────────────────────────────

const TOUR_STEPS: Step[] = [
  {
    target: '#dashboard-welcome',
    title: 'Welcome to Nexus 👋',
    content: 'This is your entrepreneur command center. Track investor requests, manage meetings, and grow your startup — all in one place.',
    placement: 'bottom',
  },
  {
    target: '#wallet-card',
    title: 'Your Wallet',
    content: 'Monitor received investments and your available balance here. Click "View Payments" to deposit funds or review your full transaction history.',
    placement: 'bottom',
  },
  {
    target: '#collab-requests',
    title: 'Collaboration Requests',
    content: 'When investors are interested in your startup, their requests appear here. Accept to connect, or decline to keep your pipeline clean.',
    placement: 'top',
  },
  {
    target: '#sidebar-meetings',
    title: 'Meetings & Calendar',
    content: 'Schedule one-on-one sessions with investors. Confirm or propose new time slots and keep track of your upcoming calls.',
    placement: 'right',
  },
  {
    target: '#sidebar-documents',
    title: 'Document Chamber',
    content: 'Share pitch decks, business plans, and financials securely with investors. Your document hub for deal-making.',
    placement: 'right',
  },
];

const TOUR_STYLES = {
  tooltip: {
    borderRadius: '16px',
    padding: '0px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
    fontFamily: 'Inter var, sans-serif',
    maxWidth: '360px',
  },
  tooltipContainer: {
    padding: '20px 24px 4px',
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  tooltipContent: {
    fontSize: '13.5px',
    color: '#6B7280',
    lineHeight: '1.6',
    padding: '0',
  },
  tooltipFooter: {
    padding: '12px 24px 20px',
    marginTop: '12px',
    borderTop: '1px solid #F3F4F6',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    padding: '8px 16px',
    color: '#ffffff',
  },
  buttonBack: {
    color: '#2563EB',
    fontSize: '13px',
    fontWeight: '500',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#9CA3AF',
    fontSize: '12px',
    fontWeight: '500',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
};

const TOUR_OPTIONS = {
  primaryColor: '#2563EB',
  skipBeacon: true,
  showProgress: true,
  zIndex: 10000,
  overlayColor: 'rgba(0,0,0,0.5)',
};

const TOUR_LOCALE = {
  back: '← Back',
  close: 'Close',
  last: 'Finish Tour ✓',
  next: 'Next →',
  skip: 'Skip tour',
};

// ── EntrepreneurDashboard ─────────────────────────────────────────────────────

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requests: meetingRequests } = useMeetings();
  const { walletBalance, userTransactions } = useWallet();
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [recommendedInvestors] = useState(investors.slice(0, 3));
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (user) {
      const requests = getRequestsForEntrepreneur(user.id);
      setCollaborationRequests(requests);
    }
  }, [user]);

  useEffect(() => {
    const hasSeen = localStorage.getItem('nexus_e_tour_done');
    if (!hasSeen) {
      const timer = setTimeout(() => setRunTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestStatusUpdate = (requestId: string, status: 'accepted' | 'rejected') => {
    setCollaborationRequests(prev =>
      prev.map(req => req.id === requestId ? { ...req, status } : req)
    );
  };

  const handleTourEvent = ({ status }: EventData) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem('nexus_e_tour_done', '1');
    }
  };

  const startTour = () => {
    setRunTour(false);
    requestAnimationFrame(() => setRunTour(true));
  };

  if (!user) return null;

  if (user.role !== 'entrepreneur') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="max-w-md w-full mx-auto text-center px-6 py-10 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
            <ShieldAlert size={26} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-5">
            This dashboard is only available to <span className="font-semibold text-amber-700">Entrepreneur</span> accounts.
            Your account is registered as <span className="font-semibold capitalize">{user.role}</span>.
          </p>
          <button
            onClick={() => navigate('/dashboard/investor')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Go to Investor Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pendingRequests = collaborationRequests.filter(req => req.status === 'pending');

  const today = toDateKey(new Date());
  const confirmedMeetings = meetingRequests
    .filter(r => r.status === 'accepted' && r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        continuous
        onEvent={handleTourEvent}
        options={TOUR_OPTIONS}
        styles={TOUR_STYLES}
        locale={TOUR_LOCALE}
        scrollToFirstStep
      />

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div id="dashboard-welcome" className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-gray-600">Here's what's happening with your startup today</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={startTour}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
            >
              <Compass size={15} />
              <span className="hidden sm:inline">Take a Tour</span>
              <span className="sm:hidden">Tour</span>
            </button>

            <Link to="/investors">
              <Button leftIcon={<PlusCircle size={18} />}>
                Find Investors
              </Button>
            </Link>
          </div>
        </div>

        {/* Wallet Balance Banner */}
        <div id="wallet-card" className="relative overflow-hidden rounded-2xl bg-slate-800 px-4 md:px-6 py-5 text-white shadow-md">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-24 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl shrink-0">
                <Wallet size={22} className="text-white" />
              </div>
              <div>
                <p className="text-slate-300 text-sm font-medium">Wallet Balance</p>
                <h2 className="text-3xl font-bold text-white mt-0.5">{formatCurrency(walletBalance)}</h2>
                <p className="text-slate-400 text-xs mt-1">Total received investments</p>
              </div>
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <div className="hidden sm:flex items-center gap-5">
                <div className="text-center">
                  <p className="text-slate-400 text-xs">Transactions</p>
                  <p className="text-xl font-bold text-white mt-0.5">{userTransactions.length}</p>
                </div>
                <div className="w-px h-9 bg-white/10" />
                <div className="text-center">
                  <p className="text-slate-400 text-xs">Pending</p>
                  <p className="text-xl font-bold text-amber-300 mt-0.5">
                    {userTransactions.filter(t => t.status === 'pending').length}
                  </p>
                </div>
              </div>

              <Link
                to="/payments"
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <CreditCard size={15} />
                <span className="hidden sm:inline">View Payments</span>
                <span className="sm:hidden">View</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary-50 border border-primary-100">
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-full mr-4 shrink-0">
                  <Bell size={20} className="text-primary-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700">Pending Requests</p>
                  <h3 className="text-xl font-semibold text-primary-900">{pendingRequests.length}</h3>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-secondary-50 border border-secondary-100">
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="p-3 bg-secondary-100 rounded-full mr-4 shrink-0">
                  <Users size={20} className="text-secondary-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                  <h3 className="text-xl font-semibold text-secondary-900">
                    {collaborationRequests.filter(req => req.status === 'accepted').length}
                  </h3>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-accent-50 border border-accent-100">
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="p-3 bg-accent-100 rounded-full mr-4 shrink-0">
                  <Calendar size={20} className="text-accent-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                  <h3 className="text-xl font-semibold text-accent-900">{confirmedMeetings.length}</h3>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-success-50 border border-success-100">
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-4 shrink-0">
                  <TrendingUp size={20} className="text-success-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-success-700">Profile Views</p>
                  <h3 className="text-xl font-semibold text-success-900">24</h3>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Upcoming Confirmed Meetings */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Confirmed Meetings</h2>
              {confirmedMeetings.length > 0 && (
                <Badge variant="success" rounded>{confirmedMeetings.length} confirmed</Badge>
              )}
            </div>
            <Link
              to="/meetings"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View in Meetings →
            </Link>
          </CardHeader>

          <CardBody>
            {confirmedMeetings.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-3">
                  <CalendarDays size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No upcoming meetings scheduled.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Accept a meeting request on the{' '}
                  <Link to="/meetings" className="text-primary-600 hover:underline">
                    Meetings page
                  </Link>{' '}
                  to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedMeetings.map(meeting => {
                  const displayDate = new Date(`${meeting.date}T00:00:00`).toLocaleDateString(
                    'en-US',
                    { weekday: 'short', month: 'short', day: 'numeric' }
                  );
                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-4 p-3 md:p-4 bg-success-50 rounded-lg border border-success-100"
                    >
                      <Avatar src={meeting.senderAvatarUrl} alt={meeting.senderName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {meeting.senderName}
                          </span>
                          <Badge
                            variant={meeting.senderRole === 'investor' ? 'primary' : 'secondary'}
                            size="sm"
                            rounded
                          >
                            {meeting.senderRole === 'investor' ? 'Investor' : 'Entrepreneur'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={11} />
                            {displayDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatTimeSlot(meeting.timeSlot)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collaboration requests */}
          <div className="lg:col-span-2 space-y-4">
            <Card id="collab-requests">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
                <Badge variant="primary">{pendingRequests.length} pending</Badge>
              </CardHeader>

              <CardBody>
                {collaborationRequests.length > 0 ? (
                  <div className="space-y-4">
                    {collaborationRequests.map(request => (
                      <CollaborationRequestCard
                        key={request.id}
                        request={request}
                        onStatusUpdate={handleRequestStatusUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <AlertCircle size={24} className="text-gray-500" />
                    </div>
                    <p className="text-gray-600">No collaboration requests yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      When investors are interested in your startup, their requests will appear here
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Recommended investors */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
                <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  View all
                </Link>
              </CardHeader>

              <CardBody className="space-y-4">
                {recommendedInvestors.map(investor => (
                  <InvestorCard
                    key={investor.id}
                    investor={investor}
                    showActions={false}
                  />
                ))}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
