import React, { useState, useEffect } from 'react';
import { hodService } from '../../services/api';
import { 
  BookOpen, 
  Users, 
  TrendingUp,
  BarChart3
} from 'lucide-react';

const HODDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHODData();
  }, []);

  const fetchHODData = async () => {
    try {
      const response = await hodService.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching HOD data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading department dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Department Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          {dashboardData?.department} • {dashboardData?.school?.name}
        </p>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Department Teachers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData?.statistics?.teachers || 0}
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
              <p className="text-sm font-medium text-gray-600">Subject Average</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData?.statistics?.departmentAverage?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assessments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData?.statistics?.assessments || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <BookOpen size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Trend</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                +{dashboardData?.statistics?.improvement || 0}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h3>
        <div className="text-gray-600">
          Manage your department's curriculum, teachers, and student performance.
        </div>
      </div>
    </div>
  );
};

export default HODDashboard;