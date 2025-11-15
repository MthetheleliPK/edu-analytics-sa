import React, { useState, useEffect } from 'react';
import { adminService, analyticsService } from '../../services/api';
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
  Cpu
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAdminData();
  }, [timeRange]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse, healthResponse] = await Promise.all([
        adminService.getStats({ timeRange }),
        adminService.getRecentActivity(),
        adminService.getSystemHealth()
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
      setSystemHealth(healthResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change, trend }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp size={14} className={`mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
                {change} from last period
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  const HealthIndicator = ({ status, label, value }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
        case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'error': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
            {status === 'healthy' && <CheckCircle size={20} />}
            {status === 'warning' && <AlertTriangle size={20} />}
            {status === 'error' && <Shield size={20} />}
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{label}</div>
            <div className="text-sm text-gray-500">{value}</div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading admin dashboard...</div>
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
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers?.toLocaleString() || '0',
      icon: Users,
      color: 'green',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Total Students',
      value: stats?.totalStudents?.toLocaleString() || '0',
      icon: Users,
      color: 'purple',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Storage Used',
      value: `${((stats?.storageUsed || 0) / 1024 / 1024).toFixed(1)} GB`,
      icon: Database,
      color: 'orange',
      change: '23%',
      trend: 'up'
    }
  ];

  const systemHealthItems = [
    {
      label: 'API Response Time',
      value: `${systemHealth?.apiResponseTime || 0}ms`,
      status: (systemHealth?.apiResponseTime || 0) < 100 ? 'healthy' : 
              (systemHealth?.apiResponseTime || 0) < 300 ? 'warning' : 'error'
    },
    {
      label: 'Database Status',
      value: 'MongoDB Cluster',
      status: systemHealth?.databaseStatus === 'healthy' ? 'healthy' : 'error'
    },
    {
      label: 'Active Sessions',
      value: `${systemHealth?.activeSessions || 0} users`,
      status: 'healthy'
    },
    {
      label: 'Storage Usage',
      value: `${systemHealth?.storageUsage || 0}% used`,
      status: (systemHealth?.storageUsage || 0) < 80 ? 'healthy' : 
              (systemHealth?.storageUsage || 0) < 90 ? 'warning' : 'error'
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Download size={18} className="mr-2" />
              Export Data
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <Settings size={18} className="mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

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
              <Cpu className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {systemHealthItems.map((item, index) => (
                <HealthIndicator key={index} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity & Schools Management */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.slice(0, 6).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-100 text-green-600' :
                      activity.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        By {activity.user} • <Clock size={12} className="inline mr-1" />
                        {activity.date}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.type === 'success' ? 'bg-green-100 text-green-800' :
                      activity.type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schools Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Schools Management</h3>
              <span className="text-sm text-gray-500">
                {stats?.recentSchools?.length || 0} schools
              </span>
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
                    {stats?.recentSchools?.map((school) => (
                      <tr key={school._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{school.name}</div>
                          <div className="text-sm text-gray-500">{school.emisNumber}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">{school.province}</td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">{school.studentCount}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            school.subscription?.plan === 'premium'
                              ? 'bg-purple-100 text-purple-800'
                              : school.subscription?.plan === 'basic'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {school.subscription?.plan || 'trial'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors">
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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