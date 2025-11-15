import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  Eye, 
  EyeOff, 
  Shield,
  GraduationCap,
  CheckCircle,
  User,
  School,
  Users
} from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const getDashboardRoute = (userRole) => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'principal':
        return '/principal/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'hod': // Head of Department
        return '/hod/dashboard';
      case 'parent':
        return '/parent/dashboard';
      default:
        return '/dashboard';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = await login(formData.email, formData.password);
      const dashboardRoute = getDashboardRoute(userData.role);
      navigate(dashboardRoute);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const RoleInfo = () => (
    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
        <Users className="h-4 w-4 mr-2" />
        Platform Access Levels
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-blue-700 font-medium">Admin:</span>
          <span className="text-blue-600">Full system access</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-700 font-medium">Principal:</span>
          <span className="text-green-600">School management</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-purple-700 font-medium">Teacher:</span>
          <span className="text-purple-600">Class & assessment management</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-orange-700 font-medium">Parent:</span>
          <span className="text-orange-600">Student progress tracking</span>
        </div>
      </div>
    </div>
  );

  const DemoCredentials = () => (
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <h3 className="text-sm font-medium text-green-900 mb-3 flex items-center">
        <School className="h-4 w-4 mr-2" />
        Demo Credentials
      </h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2 bg-white rounded border">
          <div>
            <span className="font-medium text-blue-600">Admin</span>
            <div className="text-green-700">admin@springfieldhigh.edu.za</div>
          </div>
          <div className="text-green-600 font-mono">password123</div>
        </div>
        <div className="flex items-center justify-between p-2 bg-white rounded border">
          <div>
            <span className="font-medium text-purple-600">Teacher</span>
            <div className="text-green-700">john.smith@springfieldhigh.edu.za</div>
          </div>
          <div className="text-green-600 font-mono">teacher123</div>
        </div>
        <div className="text-green-600 text-xs text-center mt-2">
          Use these credentials to explore different user experiences
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-pulse"></div>
                <GraduationCap className="h-12 w-12 text-white relative z-10" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              EduAnalytics SA
            </h1>
            <p className="text-blue-100 text-sm">
              South African Education Analytics Platform
            </p>
          </div>

          {/* Form Section */}
          <div className="px-6 py-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Sign in to access your personalized dashboard
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 animate-shake">
                  <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-red-700 text-sm">
                    <div className="font-medium">Authentication Error</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 pr-12"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In to Your Dashboard'
                )}
              </button>
            </form>

            {/* Role Information */}
            <RoleInfo />

            {/* Demo Credentials - Uncomment for development/demo */}
            <DemoCredentials />

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  Register your school
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              © 2024 EduAnalytics SA. Empowering South African education.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;