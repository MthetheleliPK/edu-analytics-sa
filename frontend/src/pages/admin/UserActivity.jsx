import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import {
  Users,
  Activity,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  Download,
  Calendar
} from 'lucide-react';

const UserActivity = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchUserActivity();
  }, [timeRange]);

  const fetchUserActivity = async () => {
    try {
      setLoading(true);
      const [logsResponse, usersResponse] = await Promise.all([
        adminService.getAuditLogs({ 
          page: 1, 
          limit: 50,
          startDate: getStartDate(timeRange)
        }),
        adminService.getUsers({ page: 1, limit: 1000 })
      ]);

      setActivityLogs(logsResponse.data?.logs || []);
      
      // Calculate user statistics
      const users = usersResponse.data?.users || [];
      const activeUsers = users.filter(user => user.isActive).length;
      const recentLogins = activityLogs.filter(log => 
        log.action === 'LOGIN' && 
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      setUserStats({
        totalUsers: users.length,
        activeUsers,
        recentLogins,
        inactiveUsers: users.length - activeUsers
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case '24h': return new Date(now.setDate(now.getDate() - 1));
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      default: return new Date(now.setDate(now.getDate() - 7));
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE') || action.includes('SUCCESS')) return 'text-green-600 bg-green-100';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'text-blue-600 bg-blue-100';
    if (action.includes('DELETE') || action.includes('ERROR')) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading user activity data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Activity Analytics</h1>
          <p className="text-gray-600 mt-2">Monitor user engagement and system usage patterns</p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={18} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* User Statistics */}
      {userStats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <Users size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.activeUsers}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white">
                <UserCheck size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Logins</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.recentLogins}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.inactiveUsers}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <UserX size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent User Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {activityLogs.slice(0, 20).map((log) => (
              <div key={log._id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                  <Activity size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {log.userId?.firstName} {log.userId?.lastName}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {new Date(log.timestamp).toLocaleString()}
                    {log.schoolId?.name && (
                      <>
                        <span className="mx-2">•</span>
                        {log.schoolId.name}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;