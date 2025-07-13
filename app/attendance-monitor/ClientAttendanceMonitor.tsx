"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Types for real data
interface StudentData {
  studentId: string;
  rollNo: string;
  name: string;
  email?: string;
  division: number;
  batch: string;
  semester: number;
  department: string;
  counselor?: string;
  attendancePercentage: number;
  status: 'Critical' | 'Warning' | 'Good' | 'Excellent';
  sessionsAttended: number;
  totalSessions: number;
  recentAttendance?: any[];
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  is_present: boolean;
  Date: string;
  subject_code?: string;
  subject_name?: string;
  department_name?: string;
  student_first_name?: string;
  student_last_name?: string;
}

interface FilterOptions {
  departments: Array<{id: string, name: string, abbreviation_depart: string}>;
  subjects: Array<{id: string, code: string, name: string, departments: {name: string}}>;
  faculty: Array<{id: string, name: string, email: string}>;
  divisions: number[];
  batches: string[];
  semesters: number[];
  studentIdRanges: Record<string, string>;
}

interface AttendanceData {
  students: StudentData[];
  attendanceRecords: AttendanceRecord[];
  summary: {
    totalStudents: number;
    excellentCount: number;
    goodCount: number;
    warningCount: number;
    criticalCount: number;
    averageAttendance: number;
  };
}

export default function ClientAttendanceMonitor() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric' 
    });
  });
  
  // Filter states
  const [selectedIdRange, setSelectedIdRange] = useState("All Students");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedTeacher, setSelectedTeacher] = useState("All Teachers");
  const [selectedCounselor, setSelectedCounselor] = useState("All Counselors");
  
  // Data states
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/attendance-monitor/filters');
      if (!response.ok) throw new Error('Failed to fetch filter options');
      
      const result = await response.json();
      setFilterOptions(result.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to load filter options');
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const params = new URLSearchParams();
      
      if (selectedDepartment !== "All Departments") {
        params.append('department', selectedDepartment);
      }
      if (selectedSubject !== "All Subjects") {
        params.append('subject', selectedSubject);
      }
      if (selectedTeacher !== "All Teachers") {
        params.append('teacher', selectedTeacher);
      }
      if (selectedCounselor !== "All Counselors") {
        params.append('counselor', selectedCounselor);
      }
      if (selectedIdRange !== "All Students") {
        params.append('idRange', selectedIdRange);
      }
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      const response = await fetch(`/api/attendance-monitor?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attendance data');
      
      const result = await response.json();
      setAttendanceData(result.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Failed to load attendance data');
      toast.error('Failed to load attendance data');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFilterOptions(),
        fetchAttendanceData()
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);


  // Reset subject filter when department changes, and refetch data
  useEffect(() => {
    if (!filterOptions) return;
    if (selectedDepartment !== "All Departments") {
      // Only keep subject if it matches the selected department
      const validSubjects = filterOptions.subjects.filter(
        (subject) => subject.departments.name === selectedDepartment
      );
      if (
        selectedSubject !== "All Subjects" &&
        !validSubjects.some((s) => s.code === selectedSubject)
      ) {
        setSelectedSubject("All Subjects");
      }
    }
    if (!loading) {
      fetchAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartment]);

  // Refetch data when other filters change
  useEffect(() => {
    if (!loading && filterOptions) {
      fetchAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedTeacher, selectedCounselor, selectedIdRange, selectedDate]);

  // Refresh data manually
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };
  
  // Computed data from live API
  const filteredData = attendanceData?.students || [];
  const attendanceMetrics = attendanceData?.summary || {
    totalStudents: 0,
    excellentCount: 0,
    goodCount: 0,
    warningCount: 0,
    criticalCount: 0,
    averageAttendance: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "text-red-500";
      case "Warning":
        return "text-orange-500";
      case "Good":
        return "text-blue-500";
      case "Excellent":
        return "text-green-500";
      default:
        return "text-green-500";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-red-500";
      case "Warning":
        return "bg-orange-500";
      case "Good":
        return "bg-blue-500";
      case "Excellent":
        return "bg-green-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <div className="p-6">      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-blue-800">
          Attendance Monitor
        </h1>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : error ? 'Error loading data' : 'Live data'}
          </div>
        </div>
      </div>
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">        {/* Left Panel - Filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">
                Filters for Attendance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">              {/* Day-wise Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Day-wise</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-3 pr-10"
                    placeholder="DD/MM/YYYY"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* ID-wise Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">ID-wise</label>
                <Select value={selectedIdRange} onValueChange={setSelectedIdRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Students">All Students</SelectItem>
                    {filterOptions?.studentIdRanges && Object.entries(filterOptions.studentIdRanges).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{key}: {value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Wise */}
              <div>
                <label className="block text-sm font-medium mb-2">Department Wise</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Departments">All Departments</SelectItem>
                    {filterOptions?.departments && filterOptions.departments.length > 0 ? 
                      filterOptions.departments.map((department) => (
                        <SelectItem key={department.id} value={department.name}>
                          {department.name}
                        </SelectItem>
                      )) : 
                      <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Wise */}
              <div>
                <label className="block text-sm font-medium mb-2">Subject Wise</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Subjects">All Subjects</SelectItem>
                    {filterOptions?.subjects
                      .filter(subject =>
                        selectedDepartment === "All Departments" ||
                        subject.departments.name === selectedDepartment
                      )
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.code}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Teacher Wise */}
              <div>
                <label className="block text-sm font-medium mb-2">Subject Teacher Wise</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Teachers">All Teachers</SelectItem>
                    {filterOptions?.faculty.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Counselor Wise */}
              <div>
                <label className="block text-sm font-medium mb-2">Counselor Wise</label>
                <Select value={selectedCounselor} onValueChange={setSelectedCounselor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select counselor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Counselors">All Counselors</SelectItem>
                    {filterOptions?.faculty.map((counselor) => (
                      <SelectItem key={`counselor-${counselor.id}`} value={counselor.name}>
                        {counselor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Attendance Metrics and Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">
                Attendance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sessions Info */}
                <div className="space-y-4">                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Total Students:</span>
                    <span className="font-semibold">{attendanceMetrics.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Average attendance:</span>
                    <span className="font-semibold text-blue-600">
                      {Math.round(attendanceMetrics.averageAttendance)}%
                    </span>
                  </div>
                </div>                {/* Overall Statistics */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm mb-3">Overall Attendance:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>&gt;85%</span>
                      </div>
                      <span className="font-semibold">{attendanceMetrics.excellentCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>75-85%</span>
                      </div>
                      <span className="font-semibold">{attendanceMetrics.goodCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>&lt;75%</span>
                      </div>
                      <span className="font-semibold">{attendanceMetrics.warningCount + attendanceMetrics.criticalCount}</span>
                    </div>
                  </div>
                </div>              </div>
            </CardContent>
          </Card>{/* Student Attendance Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-blue-800">
                  Student Attendance Data
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredData.length}</span> of{" "}
                  <span className="font-semibold">{attendanceMetrics.totalStudents}</span> students
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Student ID</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Attendance % Alert Status</th>
                    </tr>
                  </thead>                  <tbody>
                    {filteredData.map((student, index) => (
                      <tr key={student.studentId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{student.rollNo || student.studentId}</td>
                        <td className="p-3">{student.department}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusDot(student.status)}`}></div>
                            <span className={`font-semibold ${getStatusColor(student.status)}`}>
                              {student.attendancePercentage}%
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              student.status === 'Critical' ? 'bg-red-100 text-red-700' :
                              student.status === 'Warning' ? 'bg-orange-100 text-orange-700' :
                              student.status === 'Good' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {student.status}
                            </span>
                            <span className="text-gray-500 text-xs ml-2">
                              ({student.sessionsAttended}/{student.totalSessions})
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredData.length === 0 && !loading && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-500">
                          {error ? error : 'No student data available with the selected filters'}
                        </td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading attendance data...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
