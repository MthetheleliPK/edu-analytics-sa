import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { parentService } from '../../services/api';
import { 
  BookOpen, 
  User, 
  TrendingUp, 
  AlertTriangle,
  MessageCircle,
  Download,
  Calendar,
  Award,
  BarChart3,
  Clock,
  Eye,
  FileText
} from 'lucide-react';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchParentData();
  }, [selectedPeriod]);

  const fetchParentData = async () => {
    try {
      const response = await parentService.getDashboard({ period: selectedPeriod });
      setDashboardData(response.data);
      if (response.data.parent.students.length > 0 && !selectedStudent) {
        setSelectedStudent(response.data.parent.students[0].studentId);
      }
    } catch (error) {
      console.error('Error fetching parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const PerformanceCard = ({ title, value, change, trend, color }) => {
    const colorClasses = {
      green: 'text-green-600 bg-green-50 border-green-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200'
    };

    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {change && (
            <div className={`flex items-center text-sm px-2 py-1 rounded-full border ${colorClasses[color]}`}>
              <TrendingUp size={14} className={`mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {change}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading parent dashboard...</div>
        </div>
      </div>
    );
  }

  const currentStudent = dashboardData?.parent.students.find(
    s => s.studentId === selectedStudent
  );

  const studentPerformance = dashboardData?.studentPerformance?.find(
    p => p._id === selectedStudent
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {dashboardData?.parent.firstName}!
            </h1>
            <p className="text-gray-600 mt-2">
              {dashboardData?.school.name} - Parent Portal
            </p>
          </div>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-4 lg:mt-0"
          >
            <option value="current">Current Term</option>
            <option value="last">Last Term</option>
            <option value="year">Academic Year</option>
          </select>
        </div>
      </div>

      {/* Student Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Children</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData?.parent.students.map((student) => (
            <button
              key={student.studentId}
              onClick={() => setSelectedStudent(student.studentId)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                selectedStudent === student.studentId
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    Grade {student.grade} • {student.relationship}
                  </div>
                </div>
                {selectedStudent === student.studentId && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {currentStudent && studentPerformance && (
        <>
          {/* Performance Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PerformanceCard
              title="Overall Average"
              value={`${studentPerformance.averagePercentage?.toFixed(1)}%`}
              change={`${studentPerformance.change || 0}%`}
              trend={studentPerformance.change >= 0 ? 'up' : 'down'}
              color={studentPerformance.averagePercentage >= 50 ? 'green' : 'red'}
            />
            <PerformanceCard
              title="Subjects"
              value={studentPerformance.totalSubjects || 0}
              color="blue"
            />
            <PerformanceCard
              title="Assessments"
              value={studentPerformance.totalAssessments || 0}
              color="orange"
            />
            <PerformanceCard
              title="Attendance"
              value={`${studentPerformance.attendance || 0}%`}
              color="green"
            />
          </div>

          {/* Recent Assessments & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Assessments */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Assessments - {currentStudent.firstName}
                  </h3>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                    View All
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData?.recentAssessments
                      .filter(assessment => assessment.studentName === `${currentStudent.firstName} ${currentStudent.lastName}`)
                      .slice(0, 5)
                      .map((assessment, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${
                              assessment.percentage >= 70 ? 'bg-green-50 text-green-600' :
                              assessment.percentage >= 50 ? 'bg-yellow-50 text-yellow-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              <BookOpen size={20} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {assessment.title}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                                <span>{assessment.subject}</span>
                                <span>•</span>
                                <span className="capitalize">{assessment.type}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Calendar size={12} className="mr-1" />
                                  {new Date(assessment.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              assessment.percentage >= 70 ? 'text-green-600' :
                              assessment.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {assessment.percentage}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {assessment.marks}/{assessment.maxMarks}
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {dashboardData?.recentAssessments.filter(a => 
                      a.studentName === `${currentStudent.firstName} ${currentStudent.lastName}`
                    ).length === 0 && (
                      <div className="text-center py-12">
                        <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                        <div className="text-gray-500 mb-2">No assessment results available</div>
                        <div className="text-sm text-gray-400">Results will appear here once assessments are graded</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Performance Insights */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="font-medium">Detailed Report</span>
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-green-600 mr-3" />
                      <span className="font-medium">Contact Teacher</span>
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center">
                      <Download className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="font-medium">Export Results</span>
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
                <div className="space-y-4">
                  {studentPerformance.subjectBreakdown?.slice(0, 3).map((subject, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className={`h-4 w-4 mr-2 ${
                          subject.percentage >= 70 ? 'text-green-500' :
                          subject.percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                        <span className="text-sm font-medium">{subject.subject}</span>
                      </div>
                      <div className={`text-sm font-semibold ${
                        subject.percentage >= 70 ? 'text-green-600' :
                        subject.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {subject.percentage}%
                      </div>
                    </div>
                  ))}
                  
                  {(!studentPerformance.subjectBreakdown || studentPerformance.subjectBreakdown.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No subject data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentDashboard;