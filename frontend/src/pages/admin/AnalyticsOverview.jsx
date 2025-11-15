import React, { useState, useEffect } from 'react';
import { analyticsService, adminService } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  School,
  BookOpen,
  AlertTriangle,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

const AnalyticsOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [schoolPerformance, setSchoolPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('current');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overviewResponse, schoolsResponse] = await Promise.all([
        analyticsService.getSystemOverview(),
        adminService.getSchools({ page: 1, limit: 10, status: 'active' })
      ]);

      setOverviewData(overviewResponse.data);
      setSchoolPerformance(schoolsResponse.data?.schools || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color, subtitle }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {change && (
              <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp size={14} className={`mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(change)}% from last period
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics Overview</h1>
          <p className="text-gray-600 mt-2">Comprehensive view of system performance and metrics</p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="current">Current Term</option>
            <option value="last">Last Term</option>
            <option value="year">Academic Year</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={18} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="System Average"
          value={`${overviewData?.overallAverage?.toFixed(1) || '0'}%`}
          change={2.5}
          icon={BarChart3}
          color="blue"
          subtitle="Across all schools"
        />
        <StatCard
          title="Active Students"
          value={overviewData?.totalStudents?.toLocaleString() || '0'}
          change={8.2}
          icon={Users}
          color="green"
          subtitle="Currently enrolled"
        />
        <StatCard
          title="Total Assessments"
          value={overviewData?.totalAssessments?.toLocaleString() || '0'}
          change={12.1}
          icon={BookOpen}
          color="purple"
          subtitle="This academic year"
        />
        <StatCard
          title="At-Risk Students"
          value={overviewData?.atRiskStudents?.toLocaleString() || '0'}
          change={-3.2}
          icon={AlertTriangle}
          color="orange"
          subtitle="Below 50% average"
        />
      </div>

      {/* School Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Schools</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {schoolPerformance.slice(0, 5).map((school, index) => (
              <div key={school._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{school.name}</div>
                    <div className="text-sm text-gray-500">{school.province} • {school.studentCount} students</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {school.averagePercentage ? `${school.averagePercentage.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Average</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;