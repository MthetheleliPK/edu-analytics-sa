// components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  School,
  BarChart3,
  Settings,
  LogOut,
  UserCog,
  Shield,
  Database,
  FileText,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap,
  ClipboardList,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    analytics: true,
    management: true,
    system: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getNavItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/admin/dashboard',
        roles: ['admin', 'teacher', 'principal', 'hod', 'parent']
      }
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          children: [
            {
              label: 'System Overview',
              icon: TrendingUp,
              path: '/admin/analytics/overview'
            },
            {
              label: 'School Performance',
              icon: School,
              path: '/admin/analytics/schools'
            },
            {
              label: 'User Activity',
              icon: Users,
              path: '/admin/analytics/activity'
            }
          ]
        },
        {
          id: 'management',
          label: 'Management',
          icon: Users,
          children: [
            {
              label: 'Schools',
              icon: School,
              path: '/admin/management/schools'
            },
            {
              label: 'Users',
              icon: Users,
              path: '/admin/management/users'
            },
            {
              label: 'Classes',
              icon: GraduationCap,
              path: '/admin/management/classes'
            },
            {
              label: 'Students',
              icon: Users,
              path: '/admin/management/students'
            }
          ]
        },
        {
          id: 'system',
          label: 'System',
          icon: Settings,
          children: [
            {
              label: 'System Health',
              icon: Shield,
              path: '/admin/system/health'
            },
            {
              label: 'Backup & Restore',
              icon: Database,
              path: '/admin/system/backup'
            },
            {
              label: 'Audit Logs',
              icon: FileText,
              path: '/admin/system/audit'
            },
            {
              label: 'System Settings',
              icon: Settings,
              path: '/admin/system/settings'
            }
          ]
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: FileText,
          path: '/admin/reports'
        }
      ];
    }

    // ... other role-based navigation (unchanged)
    return baseItems;
  };

  const navItems = getNavItems();

  const renderNavItem = (item) => {
    if (item.children) {
      return (
        <div key={item.id} className="mb-2">
          <button
            onClick={() => toggleSection(item.id)}
            className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <item.icon size={20} className="mr-3 text-gray-500" />
              <span className="font-medium">{item.label}</span>
            </div>
            {expandedSections[item.id] ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-400" />
            )}
          </button>
          {expandedSections[item.id] && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child, index) => (
                <Link
                  key={index}
                  to={child.path}
                  className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive(child.path)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={onClose}
                >
                  <child.icon size={16} className="mr-3" />
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path}
        className={`flex items-center px-4 py-3 rounded-lg transition-colors mb-1 ${
          isActive(item.path)
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-semibold'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={onClose}
      >
        <item.icon size={20} className="mr-3" />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">EduAnalytics</h1>
              <p className="text-xs text-gray-500 capitalize">{user?.role} Panel</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user?.schoolId?.name && (
                <p className="text-xs text-gray-400 mt-1">{user.schoolId.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map(renderNavItem)}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={16} className="mr-3" />
              Notifications
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle size={16} className="mr-3" />
              Help & Support
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} className="mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;