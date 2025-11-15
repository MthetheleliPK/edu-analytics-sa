import React, { useState, useEffect } from 'react';
import { schoolService } from '../services/api';
import { Save, School, Calendar, Users } from 'lucide-react';

const SchoolSettings = () => {
  const [school, setSchool] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    try {
      const response = await schoolService.getProfile();
      setSchool(response.data.school);
      setSettings(response.data.school.settings || {});
    } catch (error) {
      console.error('Error fetching school data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await schoolService.updateSettings(settings);
      setMessage('Settings updated successfully!');
    } catch (error) {
      setMessage('Error updating settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleTermChange = (term, field, value) => {
    setSettings(prev => ({
      ...prev,
      terms: {
        ...prev.terms,
        [term]: {
          ...prev.terms?.[term],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading school settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">School Settings</h1>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* School Information */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <School className="h-5 w-5 mr-2" />
            School Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <input
                type="text"
                value={school?.name || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EMIS Number
              </label>
              <input
                type="text"
                value={school?.emisNumber || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province
              </label>
              <input
                type="text"
                value={school?.province || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <input
                type="text"
                value={school?.district || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Academic Calendar */}
        <form onSubmit={handleSaveSettings}>
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Academic Calendar
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="number"
                value={settings.academicYear || new Date().getFullYear()}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  academicYear: parseInt(e.target.value)
                }))}
                className="w-32 border border-gray-300 rounded-md px-3 py-2"
                min="2020"
                max="2030"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(term => (
                <div key={term} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Term {term}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={settings.terms?.[`term${term}`]?.start?.split('T')[0] || ''}
                        onChange={(e) => handleTermChange(`term${term}`, 'start', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={settings.terms?.[`term${term}`]?.end?.split('T')[0] || ''}
                        onChange={(e) => handleTermChange(`term${term}`, 'end', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* School Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          School Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{school?.statistics?.students || 0}</div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{school?.statistics?.teachers || 0}</div>
            <div className="text-sm text-gray-600">Teachers</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{school?.statistics?.classes || 0}</div>
            <div className="text-sm text-gray-600">Classes</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{settings.academicYear || new Date().getFullYear()}</div>
            <div className="text-sm text-gray-600">Academic Year</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSettings;