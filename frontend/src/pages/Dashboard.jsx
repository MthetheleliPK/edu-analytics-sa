import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../services/api';
import { Users, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overviewResponse, atRiskResponse] = await Promise.all([
        analyticsService.getSchoolOverview(),
        analyticsService.getAtRiskStudents({ threshold: 50 })
      ]);

      setOverview(overviewResponse.data);
      setAtRiskStudents(atRiskResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Students',
      value: overview?.totalStudents || 0,
      icon: Users,
      color: 'blue',
      link: '/students'
    },
    {
      title: 'Total Assessments',
      value: overview?.totalAssessments || 0,
      icon: BookOpen,
      color: 'green',
      link: '/marks'
    },
    {
      title: 'At Risk Students',
      value: atRiskStudents.length,
      icon: AlertTriangle,
      color: 'red',
      link: '/analytics'
    },
    {
      title: 'Overall Average',
      value: `${overview?.overallAverage?.toFixed(1) || '0'}%`,
      icon: TrendingUp,
      color: 'purple',
      link: '/analytics'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At Risk Students */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">At Risk Students</h3>
          <div className="space-y-3">
            {atRiskStudents.slice(0, 5).map((student) => (
              <div key={student._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {student.student.firstName} {student.student.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Grade {student.student.grade} • Average: {student.averagePercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {student.weakSubjects.length} weak subjects
                  </p>
                </div>
              </div>
            ))}
            {atRiskStudents.length === 0 && (
              <p className="text-gray-500 text-center py-4">No at-risk students identified</p>
            )}
          </div>
          {atRiskStudents.length > 5 && (
            <Link
              to="/analytics"
              className="block mt-4 text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all at-risk students
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/students"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <span>Manage Students</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              to="/marks"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                <span>Enter Marks</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-gray-400 mr-3" />
                <span>View Analytics</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;