import React, { useState, useEffect } from 'react';
import { teacherService } from '../../services/api';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  TrendingUp,
  Calendar,
  FileText,
  MessageCircle,
  Settings,
  Download,
  Eye,
  Plus,
  Clock,
  Award
} from 'lucide-react';

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchTeacherDashboard();
  }, [selectedPeriod]);

  const fetchTeacherDashboard = async () => {
    try {
      const response = await teacherService.getDashboard({ period: selectedPeriod });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching teacher dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600', 
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUp size={14} className="mr-1" />
                {trend}
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

  const QuickAction = ({ icon: Icon, title, description, color, onClick }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
    };

    return (
      <button
        onClick={onClick}
        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${colorClasses[color]}`}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-white">
            <Icon size={20} />
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold">{title}</div>
            <div className="text-sm opacity-75">{description}</div>
          </div>
          <div className="text-gray-400">
            <TrendingUp size={16} />
          </div>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading teacher dashboard...</div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'My Classes',
      value: dashboardData?.statistics.classes || 0,
      icon: Users,
      color: 'blue',
      subtitle: 'Active classes'
    },
    {
      title: 'Total Students',
      value: dashboardData?.statistics.students || 0,
      icon: Users,
      color: 'green',
      subtitle: 'Across all classes',
      trend: '+5 this term'
    },
    {
      title: 'Marks Entered',
      value: dashboardData?.statistics.totalMarks?.toLocaleString() || '0',
      icon: BookOpen,
      color: 'purple',
      subtitle: 'This academic year'
    },
    {
      title: 'Class Average',
      value: `${dashboardData?.statistics.averagePercentage?.toFixed(1) || '0'}%`,
      icon: Award,
      color: 'orange',
      subtitle: 'Overall performance'
    }
  ];

  const quickActions = [
    {
      icon: BookOpen,
      title: 'Enter Marks',
      description: 'Add assessment results',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'Performance insights',
      color: 'green'
    },
    {
      icon: Users,
      title: 'My Classes',
      description: 'Manage students',
      color: 'purple'
    },
    {
      icon: FileText,
      title: 'Create Report',
      description: 'Generate progress reports',
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {dashboardData?.teacher.firstName}!
            </h1>
            <p className="text-gray-600 mt-2">
              {dashboardData?.teacher.subjects?.join(', ')} Teacher • {dashboardData?.school?.name}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="current">Current Term</option>
              <option value="last">Last Term</option>
              <option value="year">Academic Year</option>
            </select>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Plus size={18} className="mr-2" />
              New Assessment
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assessments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                View All
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.recentAssessments?.map((assessment) => (
                  <div key={assessment._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {assessment.title}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                          <span>{assessment.classId?.name}</span>
                          <span>•</span>
                          <span>{assessment.subject}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Calendar size={12} className="mr-1" />
                            {new Date(assessment.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {assessment.assessmentType}
                        </div>
                        <div className="text-sm text-gray-500">
                          Max: {assessment.maxMarks}
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!dashboardData?.recentAssessments || dashboardData.recentAssessments.length === 0) && (
                  <div className="text-center py-12">
                    <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-500 mb-4">No recent assessments</div>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Create Your First Assessment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <QuickAction key={index} {...action} />
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {dashboardData?.upcomingDeadlines?.slice(0, 3).map((deadline, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{deadline.title}</div>
                    <div className="text-xs text-gray-500">
                      Due {new Date(deadline.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.upcomingDeadlines || dashboardData.upcomingDeadlines.length === 0) && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;