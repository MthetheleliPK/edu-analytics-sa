import AnalyticsOverview from './pages/admin/AnalyticsOverview';
import SchoolPerformance from './pages/admin/SchoolPerformance';
import UserActivity from './pages/admin/UserActivity';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import PrincipalDashboard from './pages/principal/PrincipalDashboard';
import HODDashboard from './pages/hod/HODDashboard';
import Students from './pages/Students';
import Layout from './components/Layout';
import Unauthorized from './pages/Unauthorized';
import './App.css';


// Protected route that requires authentication
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Role-based protected route
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Dashboard router that redirects to role-specific dashboard
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'teacher':
      return <Navigate to="/teacher/dashboard" replace />;
    case 'principal':
      return <Navigate to="/principal/dashboard" replace />;
    case 'hod':
      return <Navigate to="/hod/dashboard" replace />;
    case 'parent':
      return <Navigate to="/parent/dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Dashboard Router - Redirects to role-specific dashboard */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } />
            
            {/* Role-Specific Dashboard Routes with Layout */}
            <Route path="/admin/dashboard" element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            <Route path="/teacher/dashboard" element={
              <RoleProtectedRoute allowedRoles={['teacher', 'hod']}>
                <Layout>
                  <TeacherDashboard />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            <Route path="/principal/dashboard" element={
              <RoleProtectedRoute allowedRoles={['principal', 'admin']}>
                <Layout>
                  <PrincipalDashboard />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            <Route path="/hod/dashboard" element={
              <RoleProtectedRoute allowedRoles={['hod', 'admin']}>
                <Layout>
                  <HODDashboard />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            <Route path="/parent/dashboard" element={
              <RoleProtectedRoute allowedRoles={['parent']}>
                <Layout>
                  <ParentDashboard />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            {/* Admin Management Routes */}
            <Route path="/admin/management/schools" element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
                    <p className="text-gray-600">Manage all schools in the system</p>
                  </div>
                </Layout>
              </RoleProtectedRoute>
            } />
            
            <Route path="/admin/management/users" element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                    <p className="text-gray-600">Manage system users</p>
                  </div>
                </Layout>
              </RoleProtectedRoute>
            } />
            
            <Route path="/admin/system/health" element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
                    <p className="text-gray-600">Monitor system performance</p>
                  </div>
                </Layout>
              </RoleProtectedRoute>
            } />
            
            {/* Fallback Dashboard (for unknown roles) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Other Protected Routes */}
            <Route path="/students" element={
              <RoleProtectedRoute allowedRoles={['admin', 'teacher', 'principal', 'hod']}>
                <Layout>
                  <Students />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;