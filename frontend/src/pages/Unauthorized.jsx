import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <Link 
              to="/" 
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors"
            >
              Sign in with a different account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;