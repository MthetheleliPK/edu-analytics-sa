import React, { useState, useEffect } from 'react';
import { analyticsService, adminService } from '../../services/api';
import {
  School,
  TrendingUp,
  Users,
  BookOpen,
  MapPin,
  Filter,
  Download,
  Search
} from 'lucide-react';

const SchoolPerformance = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');

  useEffect(() => {
    fetchSchoolPerformance();
  }, []);

  const fetchSchoolPerformance = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSchools({ 
        page: 1, 
        limit: 50,
        ...(selectedProvince && { province: selectedProvince })
      });
      
      // For each school, fetch their performance data
      const schoolsWithPerformance = await Promise.all(
        response.data.schools.map(async (school) => {
          try {
            // This would need a dedicated endpoint for school performance
            // For now, we'll use mock data based on school stats
            const performance = {
              averagePercentage: Math.random() * 30 + 50, // 50-80% range
              totalAssessments: school.studentCount * 2,
              improvement: (Math.random() * 10 - 2) // -2% to +8%
            };
            return { ...school, ...performance };
          } catch (error) {
            return school;
          }
        })
      );

      setSchools(schoolsWithPerformance);
    } catch (error) {
      console.error('Error fetching school performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.emisNumber.includes(searchTerm) ||
    school.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const provinces = [...new Set(schools.map(school => school.province))];

  const PerformanceBadge = ({ percentage }) => {
    let color = 'bg-gray-100 text-gray-800';
    if (percentage >= 70) color = 'bg-green-100 text-green-800';
    else if (percentage >= 60) color = 'bg-yellow-100 text-yellow-800';
    else color = 'bg-red-100 text-red-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {percentage.toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading school performance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Performance Analytics</h1>
          <p className="text-gray-600 mt-2">Compare and analyze school performance across the system</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 lg:mt-0">
          <Download size={18} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Provinces</option>
            {provinces.map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
          <button 
            onClick={fetchSchoolPerformance}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter size={16} className="inline mr-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => (
          <div key={school._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{school.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <MapPin size={14} className="mr-1" />
                  {school.district}, {school.province}
                </div>
                <div className="text-xs text-gray-500">EMIS: {school.emisNumber}</div>
              </div>
              <PerformanceBadge percentage={school.averagePercentage} />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={14} className="mr-2" />
                  Students
                </div>
                <span className="font-medium">{school.studentCount || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpen size={14} className="mr-2" />
                  Assessments
                </div>
                <span className="font-medium">{school.totalAssessments || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp size={14} className="mr-2" />
                  Trend
                </div>
                <span className={`font-medium ${school.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {school.improvement >= 0 ? '+' : ''}{school.improvement?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <div className="text-center py-12">
          <School size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default SchoolPerformance;