// components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { 
  Users, 
  School, 
  BarChart3, 
  Activity, 
  Shield,
  Download,
  Upload,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Cpu,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Server,
  Network,
  HardDrive,
  Calendar,
  BookOpen,
  UserCheck,
  AlertCircle,
  TrendingDown,
  Zap,
  BarChart
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, [timeRange]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from API endpoints
      const [statsResponse, healthResponse, schoolsResponse, activityResponse] = await Promise.all([
        adminService.getStats({ timeRange }),
        adminService.getHealth(),
        adminService.getSchools({ page: 1, limit: 10 }),
        adminService.getAuditLogs({ page: 1, limit: 10 })
      ]);

      setStats(statsResponse.data);
      setSystemHealth(healthResponse.data);
      setSchools(schoolsResponse.data?.schools || []);
      setRecentActivity(activityResponse.data?.logs || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load dashboard data. Please try again.');
      // Set empty states instead of mock data
      setStats({
        totalSchools: 0,
        activeSchools: 0,
        totalStudents: 0,
        totalUsers: 0,
        storageUsed: 0,
        recentSchools: []
      });
      setSystemHealth({
        database: { status: 'error', responseTime: 'N/A' },
        memory: { used: 0, total: 0, rss: 0 },
        uptime: 0,
        activeSessions: 0,
        timestamp: new Date().toISOString()
      });
      setSchools([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const handleExportData = async (type) => {
    try {
      const response = await adminService.export({ format: 'csv', dataType: type });
      
      // Create download link for CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await adminService.createBackup({
        type: 'full',
        description: `Manual backup created from dashboard`
      });
      alert('Backup created successfully!');
      // Refresh activity logs to show the backup action
      fetchAdminData();
    } catch (error) {
      console.error('Backup error:', error);
      alert('Error creating backup. Please try again.');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change, trend, subtitle, onClick }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
      <div 
        className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer ${
          onClick ? 'hover:scale-[1.02]' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {change && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                {change} from last period
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  const HealthIndicator = ({ status, label, value, icon: Icon }) => {
    const getStatusConfig = (status) => {
      switch (status) {
        case 'healthy': return {
          bg: 'bg-green-50',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: CheckCircle
        };
        case 'warning': return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: AlertTriangle
        };
        case 'error': return {
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: AlertCircle
        };
        default: return {
          bg: 'bg-gray-50',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: Server
        };
      }
    };

    const config = getStatusConfig(status);
    const StatusIcon = config.icon;

    return (
      <div className={`flex items-center justify-between p-4 rounded-lg border ${config.bg} ${config.border}`}>
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg ${config.bg} ${config.text}`}>
            <StatusIcon size={20} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{label}</div>
            <div className="text-sm text-gray-500">{value}</div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </div>
      </div>
    );
  };

  const getSubscriptionBadge = (subscription) => {
    if (!subscription) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Subscription
        </span>
      );
    }

    const isActive = new Date(subscription.endDate) > new Date();
    const plans = {
      premium: { color: 'bg-purple-100 text-purple-800', label: 'Premium' },
      basic: { color: 'bg-blue-100 text-blue-800', label: 'Basic' },
      trial: { color: 'bg-gray-100 text-gray-800', label: 'Trial' }
    };
    
    const config = plans[subscription.plan] || plans.trial;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${
        !isActive ? 'line-through opacity-70' : ''
      }`}>
        {config.label} {!isActive && '(Expired)'}
      </span>
    );
  };

  const formatStorage = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / 1024 / 1024;
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading admin dashboard...</div>
          <div className="text-sm text-gray-500 mt-2">Fetching system data</div>
        </div>
      </div>
    );
  }

  const adminCards = [
    {
      title: 'Total Schools',
      value: stats?.totalSchools?.toLocaleString() || '0',
      icon: School,
      color: 'blue',
      subtitle: `${stats?.activeSchools || 0} active`
    },
    {
      title: 'Active Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      icon: UserCheck,
      color: 'green',
      subtitle: 'Across all schools'
    },
    {
      title: 'Total Students',
      value: stats?.totalStudents?.toLocaleString() || '0',
      icon: Users,
      color: 'purple',
      subtitle: 'Enrolled in system'
    },
    {
      title: 'Storage Used',
      value: formatStorage(stats?.storageUsed),
      icon: Database,
      color: 'orange',
      subtitle: 'System data storage'
    }
  ];

  const systemHealthItems = [
    {
      label: 'Database Status',
      value: systemHealth?.database?.responseTime || 'Checking...',
      status: systemHealth?.database?.status === 'healthy' ? 'healthy' : 'error',
      icon: Database
    },
    {
      label: 'Memory Usage',
      value: `${systemHealth?.memory?.used || 0}MB / ${systemHealth?.memory?.total || 0}MB`,
      status: ((systemHealth?.memory?.used / systemHealth?.memory?.total) * 100) < 80 ? 'healthy' : 'warning',
      icon: HardDrive
    },
    {
      label: 'System Uptime',
      value: systemHealth?.uptime ? 
        `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m` : 'Unknown',
      status: 'healthy',
      icon: Clock
    },
    {
      label: 'Active Sessions',
      value: `${systemHealth?.activeSessions || 0} users`,
      status: 'healthy',
      icon: Users
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <div className="flex space-x-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={handleCreateBackup}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Database size={18} className="mr-2" />
              Backup
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              <div className="flex items-center space-x-2">
                <Zap size={20} className="text-green-500" />
                <span className="text-sm text-gray-500">Live</span>
              </div>
            </div>
            <div className="space-y-4">
              {systemHealthItems.map((item, index) => (
                <HealthIndicator key={index} {...item} />
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                Last updated: {systemHealth?.timestamp ? 
                  new Date(systemHealth.timestamp).toLocaleTimeString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Schools Management */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button 
                onClick={() => window.location.href = '/admin/system/audit'}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                View All
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.slice(0, 6).map((activity, index) => (
                  <div key={activity._id || index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className={`p-2 rounded-full ${
                      activity.action?.includes('SUCCESS') || activity.action?.includes('CREATE') 
                        ? 'bg-green-100 text-green-600' 
                        : activity.action?.includes('ERROR') || activity.action?.includes('FAIL')
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {activity.action || 'System Activity'}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        By {activity.userId?.firstName || 'System'} • 
                        <Clock size={12} className="inline mr-1 ml-2" />
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.action?.includes('SUCCESS') || activity.action?.includes('CREATE')
                        ? 'bg-green-100 text-green-800'
                        : activity.action?.includes('ERROR') || activity.action?.includes('FAIL')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.action?.split('_')[0] || 'Info'}
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schools Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Schools Management</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {schools.length} schools in system
                </p>
              </div>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button 
                  onClick={() => window.location.href = '/admin/management/schools'}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Manage Schools
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">School</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Province</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Students</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schools.map((school) => (
                      <tr key={school._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {school.name}
                          </div>
                          <div className="text-sm text-gray-500">{school.emisNumber}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">{school.province}</td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{school.studentCount || 0}</div>
                          <div className="text-xs text-gray-500">{school.userCount || 0} users</div>
                        </td>
                        <td className="py-4 px-4">
                          {getSubscriptionBadge(school.subscription)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => window.location.href = `/admin/schools/${school._id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center"
                            >
                              <Eye size={14} className="mr-1" />
                              View
                            </button>
                            <button 
                              onClick={() => window.location.href = `/admin/management/schools/${school._id}`}
                              className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors flex items-center"
                            >
                              <Edit size={14} className="mr-1" />
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {schools.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500">
                          <School size={32} className="mx-auto mb-2 opacity-50" />
                          <p>No schools found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;