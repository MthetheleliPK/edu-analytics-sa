import React, { useState, useEffect } from 'react';
import { gradesService, assessmentService, studentService } from '../services/api';

const MarksEntry = () => {
  const [grades, setGrades] = useState({});
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [assessments, setAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    subject: '',
    assessmentType: 'Test',
    maxMarks: 100,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAssessments();
      fetchStudents();
    }
  }, [selectedClass, selectedTerm]);

  const fetchGrades = async () => {
    try {
      const response = await gradesService.getGrades();
      setGrades(response.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await assessmentService.getAssessments({
        classId: selectedClass,
        term: selectedTerm
      });
      setAssessments(response.data);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentService.getAll({
        class: selectedClass
      });
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    try {
      await assessmentService.createAssessment({
        ...newAssessment,
        classId: selectedClass,
        term: selectedTerm
      });
      setNewAssessment({
        title: '',
        subject: '',
        assessmentType: 'Test',
        maxMarks: 100,
        date: new Date().toISOString().split('T')[0]
      });
      fetchAssessments();
    } catch (error) {
      console.error('Error creating assessment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marks Entry</h1>
        
        {/* Grade and Class Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClass('');
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Grade</option>
              {Object.entries(grades).map(([grade, data]) => (
                <option key={grade} value={grade}>
                  {data.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedGrade}
            >
              <option value="">Select Class</option>
              {grades[selectedGrade]?.classes.map((classObj) => (
                <option key={classObj._id} value={classObj._id}>
                  {classObj.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
              <option value={4}>Term 4</option>
            </select>
          </div>
        </div>

        {/* Create Assessment Form */}
        {selectedClass && (
          <form onSubmit={handleCreateAssessment} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Assessment Title"
                value={newAssessment.title}
                onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <select
                value={newAssessment.subject}
                onChange={(e) => setNewAssessment({...newAssessment, subject: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Physical Science">Physical Science</option>
                <option value="Life Sciences">Life Sciences</option>
                <option value="Geography">Geography</option>
                <option value="History">History</option>
                <option value="Accounting">Accounting</option>
              </select>

              <select
                value={newAssessment.assessmentType}
                onChange={(e) => setNewAssessment({...newAssessment, assessmentType: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Test">Test</option>
                <option value="Exam">Exam</option>
                <option value="Assignment">Assignment</option>
                <option value="Practical">Practical</option>
                <option value="Project">Project</option>
              </select>

              <input
                type="number"
                placeholder="Max Marks"
                value={newAssessment.maxMarks}
                onChange={(e) => setNewAssessment({...newAssessment, maxMarks: parseInt(e.target.value)})}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />

              <button
                type="submit"
                className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Assessments List */}
        {assessments.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assessments</h3>
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">{assessment.title}</h4>
                    <span className="text-sm text-gray-600">
                      {assessment.subject} • {assessment.assessmentType} • {assessment.maxMarks} marks
                    </span>
                  </div>
                  {/* Marks entry table would go here */}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;