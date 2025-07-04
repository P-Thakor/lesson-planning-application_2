import { NextRequest, NextResponse } from 'next/server';
import { getAllAttendance, getAttendanceByStudentId } from '@/app/actions/AttendanceApi';
import { getAllStudents, getStudentsByDepartment } from '@/app/actions/studentsApi';

// Department mapping: Full name to abbreviation
const DEPARTMENT_MAPPING: Record<string, string> = {
  'Computer Engineering': 'DCE',
  'Computer Science and Engineering': 'DCSE',
  'Information Technology': 'DIT',
  'Artificial Intelligence and Machine Learning': 'AI-ML',
  'Civil Engineering': 'CE',
  'Mechanical Engineering': 'ME',
  'Electrical Engineering': 'EE',
  'Electronics and Communication Engineering': 'ECE',
  // Add more mappings as needed
};

// Function to get department abbreviation from full name
function getDepartmentAbbreviation(departmentName: string): string {
  return DEPARTMENT_MAPPING[departmentName] || departmentName;
}

// Function to get department full name from abbreviation
function getDepartmentFullName(abbreviation: string): string {
  const reverseMapping = Object.fromEntries(
    Object.entries(DEPARTMENT_MAPPING).map(([key, value]) => [value, key])
  );
  return reverseMapping[abbreviation] || abbreviation;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const subject = searchParams.get('subject');
    const teacher = searchParams.get('teacher');
    const counselor = searchParams.get('counselor');
    const idRange = searchParams.get('idRange');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // If requesting specific student attendance
    if (studentId) {
      const attendanceRecords = await getAttendanceByStudentId(studentId);
      return NextResponse.json({ success: true, data: attendanceRecords });
    }

    // Get all attendance records with student and subject details
    let attendanceRecords = await getAllAttendance();

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      attendanceRecords = attendanceRecords.filter((record: any) => {
        if (!record.Date) return true;
        
        const recordDate = new Date(record.Date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate && recordDate < fromDate) return false;
        if (toDate && recordDate > toDate) return false;
        
        return true;
      });
    }

    // Filter by specific date if provided
    if (date) {
      attendanceRecords = attendanceRecords.filter((record: any) => {
        if (!record.Date) return false;
        const recordDate = new Date(record.Date).toLocaleDateString('en-GB');
        return recordDate === date;
      });
    }

    // Filter by subject if provided
    if (subject && subject !== 'All Subjects') {
      attendanceRecords = attendanceRecords.filter((record: any) => 
        record.subject_code === subject || record.subject_name?.includes(subject)
      );
    }

    // Get students data
    let students;
    if (department && department !== 'All Departments') {
      // Convert full department name to abbreviation for database query
      const departmentAbbr = getDepartmentAbbreviation(department);
      students = await getStudentsByDepartment(departmentAbbr);
    } else {
      students = await getAllStudents();
    }

    // Filter students by counselor if provided
    if (counselor && counselor !== 'All Counselors') {
      students = students.filter((student: any) => 
        student.Counsellor === counselor || student.counselor === counselor
      );
    }

    // Filter students by ID range if provided
    if (idRange && idRange !== 'All Students') {
      // Extract the range logic if needed, for now just filter by pattern
      students = students.filter((student: any) => {
        const studentId = student.student_id || student.Student_ID;
        // Simple pattern matching - can be enhanced based on actual ID range format
        return studentId?.includes(idRange.split(' ')[0]);
      });
    }

    // Process the data to calculate attendance statistics
    const processedData = students.map((student: any) => {
      const studentAttendance = attendanceRecords.filter(
        (record: any) => record.student_id === student.student_id
      );

      const totalSessions = studentAttendance.length;
      const sessionsAttended = studentAttendance.filter(
        (record: any) => record.is_present
      ).length;

      const attendancePercentage = totalSessions > 0 
        ? Math.round((sessionsAttended / totalSessions) * 100)
        : 0;

      // Determine status based on percentage
      let status: 'Critical' | 'Warning' | 'Good' | 'Excellent';
      if (attendancePercentage >= 85) status = 'Excellent';
      else if (attendancePercentage >= 75) status = 'Good';
      else if (attendancePercentage >= 65) status = 'Warning';
      else status = 'Critical';

      return {
        studentId: student.student_id,
        rollNo: student.Roll_No,
        name: student.Student_Name || 'Unknown Student',
        email: student.Guardian_Email || student.email,
        division: student.Division,
        batch: student.Batch,
        semester: student.Sem,
        department: getDepartmentFullName(student.Department || ''),
        counselor: student.Counsellor,
        attendancePercentage,
        status,
        sessionsAttended,
        totalSessions,
        recentAttendance: studentAttendance.slice(-10) // Last 10 records
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        students: processedData,
        attendanceRecords: attendanceRecords,
        summary: {
          totalStudents: processedData.length,
          excellentCount: processedData.filter(s => s.status === 'Excellent').length,
          goodCount: processedData.filter(s => s.status === 'Good').length,
          warningCount: processedData.filter(s => s.status === 'Warning').length,
          criticalCount: processedData.filter(s => s.status === 'Critical').length,
          averageAttendance: processedData.length > 0 
            ? Math.round(processedData.reduce((sum, s) => sum + s.attendancePercentage, 0) / processedData.length)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching attendance monitor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance data' },
      { status: 500 }
    );
  }
}
