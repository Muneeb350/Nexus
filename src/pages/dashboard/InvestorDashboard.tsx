import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, PieChart, Filter, Search, PlusCircle, CalendarDays, Clock, Wallet, CreditCard, ChevronRight, ShieldAlert, Compass } from 'lucide-react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step, EventData } from 'react-joyride';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { useMeetings, toDateKey, formatTimeSlot } from '../../context/MeetingsContext';
import { useWallet, formatCurrency } from '../../context/WalletContext';
import { entrepreneurs } from '../../data/users';
import { getRequestsFromInvestor } from '../../data/collaborationRequests';

// ── Tour configuration ────────────────────────────────────────────────────────

const TOUR_STEPS: Step[] = [
  {
    target: '#dashboard-welcome',
    title: 'Welcome to Nexus 👋',
    content: 'This is your investor dashboard. Discover high-potential startups, manage your capital, and stay on top of your portfolio.',
    placement: 'bottom',
  },
  {
    target: '#wallet-card',
    title: 'Investment Wallet',
    content: 'Your available capital lives here. Deposit funds, transfer to entrepreneurs, and track every transaction in real time.',
    placement: 'bottom',
  },
  {
    target: '#startup-grid',
    title: 'Featured Startups',
    content: 'Browse curated entrepreneur profiles. Use the search and industry filters, then click "Fund This Deal" to invest directly from your wallet.',
    placement: 'top',
  },
  {
    target: '#sidebar-meetings',
    title: 'Meetings & Calendar',
    content: 'Request and manage one-on-one meetings with entrepreneurs. Confirm time slots and build relationships that matter.',
    placement: 'right',
  },
  {
    target: '#sidebar-documents',
    title: 'Document Chamber',
    content: 'Access pitch decks, financial statements, and due diligence documents shared by the startups you\'re evaluating.',
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

// ── InvestorDashboard ─────────────────────────────────────────────────────────

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requests: meetingRequests } = useMeetings();
  const { walletBalance, userTransactions } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('nexus_i_tour_done');
    if (!hasSeen) {
      const timer = setTimeout(() => setRunTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTourEvent = ({ status }: EventData) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem('nexus_i_tour_done', '1');
    }
  };

  const startTour = () => {
    setRunTour(false);
    requestAnimationFrame(() => setRunTour(true));
  };

  if (!user) return null;

  if (user.role !== 'investor') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="max-w-md w-full mx-auto text-center px-6 py-10 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
            <ShieldAlert size={26} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-5">
            This dashboard is only available to <span className="font-semibold text-amber-700">Investor</span> accounts.
            Your account is registered as <span className="font-semibold capitalize">{user.role}</span>.
          </p>
          <button
            onClick={() => navigate('/dashboard/entrepreneur')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Go to Entrepreneur Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get collaboration requests sent by this investor
  const sentRequests = getRequestsFromInvestor(user.id);

  // Filter entrepreneurs based on search and industry filters
  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    const matchesSearch = searchQuery === '' ||
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.pitchSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry = selectedIndustries.length === 0 ||
      selectedIndustries.includes(entrepreneur.industry);

    return matchesSearch && matchesIndustry;
  });

  const industries = Array.from(new Set(entrepreneurs.map(e => e.industry)));

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
            <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
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

            <Link to="/entrepreneurs">
              <Button leftIcon={<PlusCircle size={18} />}>
                View All Startups
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
                <p className="text-slate-400 text-xs mt-1">Available to invest</p>
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

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <Input
              placeholder="Search startups, industries, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              startAdornment={<Search size={18} />}
            />
          </div>

          <div className="w-full md:w-1/3">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={18} className="text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700 shrink-0">Filter:</span>
              <div className="flex flex-wrap gap-1.5">
                {industries.map(industry => (
                  <Badge
                    key={industry}
                    variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                    className="cursor-pointer select-none"
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary-50 border border-primary-100">
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-full mr-4 shrink-0">
                  <Users size={20} className="text-primary-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700">Total Startups</p>
                  <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-secondary-50 border border-secondary-100">
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="p-3 bg-secondary-100 rounded-full mr-4 shrink-0">
                  <PieChart size={20} className="text-secondary-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-700">Industries</p>
                  <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-accent-50 border border-accent-100">
            <CardBody className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="p-3 bg-accent-100 rounded-full mr-4 shrink-0">
                  <Users size={20} className="text-accent-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-accent-700">Your Connections</p>
                  <h3 className="text-xl font-semibold text-accent-900">
                    {sentRequests.filter(req => req.status === 'accepted').length}
                  </h3>
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

        {/* Entrepreneurs grid */}
        <Card id="startup-grid">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
          </CardHeader>

          <CardBody>
            {filteredEntrepreneurs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntrepreneurs.map(entrepreneur => (
                  <EntrepreneurCard
                    key={entrepreneur.id}
                    entrepreneur={entrepreneur}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No startups match your filters</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustries([]);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};
