import React, { useState, useRef } from 'react';
import { LogIn, BookOpen, GraduationCap, Shield, Eye, EyeOff, User, Lock, FileText, Award, Mail, Phone, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import nxBackground from '../assets/NX .png';

const BUBTNX = () => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const iframeRef = useRef(null);
  const formRef = useRef(null);
  const annexUrl = 'https://annex.bubt.edu.bd/';
  const studentPortalUrl = 'https://annex.bubt.edu.bd/ONSIS_SEITO/';

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Fetch user data from backend
      const token = await getToken();
      const { data } = await api.post(
        '/api/annex/fetch-data',
        {
          username: formData.username,
          password: formData.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        // Check if we got meaningful data
        const hasData = data.data && (
          data.data.name !== 'N/A' || 
          data.data.department !== 'N/A' || 
          data.data.program !== ''
        );
        
        if (hasData) {
          setStudentData(data.data);
          setIsLoggedIn(true);
          toast.success('Successfully logged in and fetched your data!');
        } else {
          // Data fetched but parsing failed - show iframe option
          toast.error('Could not parse student data. Opening portal in iframe...');
          setIsLoggedIn(true);
          setStudentData({
            studentId: formData.username,
            name: 'N/A',
            department: 'N/A',
            semester: 'N/A',
            batch: 'N/A',
            program: 'N/A',
            email: 'N/A',
            phone: 'N/A',
            cgpa: 'N/A',
            courses: [],
          });
        }
      } else {
        toast.error(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      
      // If authentication fails, offer to open in iframe
      if (error.response?.status === 401) {
        toast.error(errorMessage);
        // Optionally, you could set a flag to show iframe option here
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudentData(null);
    setFormData({ username: '', password: '' });
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image Cover */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${nxBackground})`,
        }}
      >
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          {/* Login Form Card - Glassmorphic Design */}
          {!isLoggedIn ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative">
              {/* Neumorphic shadow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 to-transparent opacity-50 pointer-events-none"></div>
              
              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">BUBT NX</h1>
                  <p className="text-gray-600 text-sm">Access your academic portal</p>
                </div>

                <form ref={formRef} onSubmit={handleLogin} className="space-y-5">
                  {/* Email/Username Field */}
                  <div className="relative">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className="w-full pl-4 pr-12 py-4 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all placeholder:text-gray-400 text-gray-700 shadow-inner"
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="w-full pl-4 pr-12 py-4 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all placeholder:text-gray-400 text-gray-700 shadow-inner"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Login Button - Purple Gradient */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar</span>
                        <LogIn className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl">
              {/* Show iframe if data parsing failed, otherwise show parsed data */}
              {studentData && studentData.name === 'N/A' && studentData.department === 'N/A' ? (
                <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Note:</strong> Data parsing failed. Please log in directly in the portal below.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                  <iframe
                    ref={iframeRef}
                    src={studentPortalUrl}
                    className="w-full h-[calc(100vh-200px)] min-h-[600px] border-0"
                    title="BUBT Annex Portal"
                    allow="fullscreen"
                  />
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                  {/* Student Data Display */}
                  {studentData && (
                    <div className="mb-6 space-y-6">
                      {/* Student Information Card */}
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <GraduationCap className="w-6 h-6 text-indigo-600" />
                          Student Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-semibold text-gray-900">{studentData.name}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Student ID</p>
                              <p className="font-semibold text-gray-900">{studentData.studentId}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Department</p>
                              <p className="font-semibold text-gray-900">{studentData.department}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Semester / Batch</p>
                              <p className="font-semibold text-gray-900">
                                {studentData.semester !== 'N/A' ? studentData.semester : 'N/A'} 
                                {studentData.intake && studentData.section && ` • Intake ${studentData.intake} - Section ${studentData.section}`}
                                {studentData.batch && studentData.batch !== 'N/A' && ` • Batch ${studentData.batch}`}
                              </p>
                            </div>
                          </div>
                          {studentData.program && studentData.program !== 'N/A' && (
                            <div className="flex items-start gap-3">
                              <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Program</p>
                                <p className="font-semibold text-gray-900">{studentData.program}</p>
                              </div>
                            </div>
                          )}
                          {studentData.email !== 'N/A' && (
                            <div className="flex items-start gap-3">
                              <Mail className="w-5 h-5 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold text-gray-900">{studentData.email}</p>
                              </div>
                            </div>
                          )}
                          {studentData.phone !== 'N/A' && (
                            <div className="flex items-start gap-3">
                              <Phone className="w-5 h-5 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-semibold text-gray-900">{studentData.phone}</p>
                              </div>
                            </div>
                          )}
                          {studentData.cgpa !== 'N/A' && (
                            <div className="flex items-start gap-3">
                              <Award className="w-5 h-5 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">CGPA</p>
                                <p className="font-semibold text-gray-900">{studentData.cgpa}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Courses and Grades */}
                      {studentData.courses && studentData.courses.length > 0 && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            Courses & Grades
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Course Code</th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Course Name</th>
                                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Grade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {studentData.courses.map((course, index) => (
                                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{course.code}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{course.name}</td>
                                    <td className="py-3 px-4 text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        course.grade && course.grade !== 'N/A' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {course.grade}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Portal Access */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Access Full Portal</h3>
                            <p className="text-sm text-gray-600">View detailed information in the Annex portal</p>
                          </div>
                          <button
                            onClick={() => window.open(studentPortalUrl, '_blank', 'noopener,noreferrer')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Portal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Logout Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleLogout}
                      className="px-6 py-3 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4 rotate-180" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BUBTNX;

