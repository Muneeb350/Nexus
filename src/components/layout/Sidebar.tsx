import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import {
  Home, Building2, CircleDollarSign, Users, MessageCircle,
  Bell, FileText, Settings, HelpCircle, CalendarDays, Video,
  FolderOpen, CreditCard, X, LogOut,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  id?: string;
  onClose: () => void;
}

// ── SidebarItem ───────────────────────────────────────────────────────────────

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, text, id, onClose }) => (
  <NavLink
    id={id}
    to={to}
    onClick={onClose}
    className={({ isActive }) =>
      `flex items-center py-2.5 px-4 rounded-md transition-colors duration-200 ${
        isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <span className="mr-3 shrink-0">{icon}</span>
    <span className="text-sm font-medium">{text}</span>
  </NavLink>
);

// ── Section label ─────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
    {label}
  </h3>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const entrepreneurItems: Omit<SidebarItemProps, 'onClose'>[] = [
    { to: '/dashboard/entrepreneur',          icon: <Home size={20} />,             text: 'Dashboard'         },
    { to: '/profile/entrepreneur/' + user.id, icon: <Building2 size={20} />,        text: 'My Startup'        },
    { to: '/investors',                        icon: <CircleDollarSign size={20} />, text: 'Find Investors'    },
    { to: '/messages',                         icon: <MessageCircle size={20} />,    text: 'Messages'          },
    { to: '/notifications',                    icon: <Bell size={20} />,             text: 'Notifications'     },
    { to: '/meetings',                         icon: <CalendarDays size={20} />,     text: 'Meetings',          id: 'sidebar-meetings'  },
    { to: '/video-call',                       icon: <Video size={20} />,            text: 'Video Call'        },
    { to: '/document-chamber',                 icon: <FolderOpen size={20} />,       text: 'Document Chamber',  id: 'sidebar-documents' },
    { to: '/documents',                        icon: <FileText size={20} />,         text: 'Documents'         },
    { to: '/payments',                         icon: <CreditCard size={20} />,       text: 'Payments & Wallet' },
  ];

  const investorItems: Omit<SidebarItemProps, 'onClose'>[] = [
    { to: '/dashboard/investor',              icon: <Home size={20} />,             text: 'Dashboard'         },
    { to: '/profile/investor/' + user.id,     icon: <CircleDollarSign size={20} />, text: 'My Portfolio'      },
    { to: '/entrepreneurs',                   icon: <Users size={20} />,            text: 'Find Startups'     },
    { to: '/messages',                        icon: <MessageCircle size={20} />,    text: 'Messages'          },
    { to: '/notifications',                   icon: <Bell size={20} />,             text: 'Notifications'     },
    { to: '/meetings',                        icon: <CalendarDays size={20} />,     text: 'Meetings',          id: 'sidebar-meetings'  },
    { to: '/video-call',                      icon: <Video size={20} />,            text: 'Video Call'        },
    { to: '/document-chamber',                icon: <FolderOpen size={20} />,       text: 'Document Chamber',  id: 'sidebar-documents' },
    { to: '/deals',                           icon: <FileText size={20} />,         text: 'Deals'             },
    { to: '/payments',                        icon: <CreditCard size={20} />,       text: 'Payments & Wallet' },
  ];

  const sidebarItems = user.role === 'entrepreneur' ? entrepreneurItems : investorItems;

  const commonItems: Omit<SidebarItemProps, 'onClose'>[] = [
    { to: '/settings', icon: <Settings size={20} />,   text: 'Settings'       },
    { to: '/help',     icon: <HelpCircle size={20} />, text: 'Help & Support'  },
  ];

  return (
    <aside
      className={[
        // ── Shared base ──────────────────────────────────────────────────────
        'flex flex-col bg-white border-r border-gray-200 w-64',
        // ── Mobile: fixed overlay that slides in/out ─────────────────────────
        'fixed top-0 left-0 h-full z-50',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // ── Desktop override: back in normal document flow ───────────────────
        'lg:relative lg:translate-x-0 lg:top-auto lg:left-auto lg:h-auto lg:z-auto',
      ].join(' ')}
    >

      {/* ── Mobile drawer header (close button) ──────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <span className="text-sm font-semibold text-gray-800">Navigation</span>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Mobile user profile card ──────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          size="sm"
          status={user.isOnline ? 'online' : 'offline'}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>
      </div>

      {/* ── Scrollable nav items ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4">

        <div className="px-3 space-y-0.5">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.to} {...item} onClose={onClose} />
          ))}
        </div>

        <div className="mt-6 px-3">
          <SectionLabel label="Settings" />
          <div className="space-y-0.5">
            {commonItems.map((item) => (
              <SidebarItem key={item.to} {...item} onClose={onClose} />
            ))}
          </div>
        </div>

      </div>

      {/* ── Mobile logout ─────────────────────────────────────────────────── */}
      <div className="lg:hidden shrink-0 px-3 py-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
        >
          <LogOut size={20} className="mr-3 shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>

      {/* ── Support card (always visible) ─────────────────────────────────── */}
      <div className="shrink-0 p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Need assistance?</p>
          <h4 className="text-sm font-medium text-gray-900 mt-0.5">Contact Support</h4>
          <a
            href="mailto:support@businessnexus.com"
            className="mt-1.5 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            support@businessnexus.com
          </a>
        </div>
      </div>

    </aside>
  );
};
