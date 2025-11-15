import React, { useState, useEffect } from 'react';
import { principalService } from '../../services/api';
import { 
  School, 
  Users, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';

const PrincipalDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrincipalData();
  }, []);

  const fetchPrincipalData = async () => {
    try {
      const response = await principalService.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching principal data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading principal dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, Principal {dashboardData?.principal?.lastName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {dashboardData?.school?.name} - Principal Dashboard
        </p>
      </div>

      {/* School Overview Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData?.statistics?.totalStudents || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Teaching Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData?.statistics?.totalTeachers || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white">
              <School size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">School Average</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData?.statistics?.schoolAverage?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <Award size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData?.statistics?.attendanceRate?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Performance</h3>
          <div className="space-y-4">
            {/* Add performance metrics here */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
          <div className="space-y-3">
            {/* Add recent updates here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;