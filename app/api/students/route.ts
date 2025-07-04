import { NextRequest, NextResponse } from 'next/server';
import { 
  getStudentsByDivisionAndSem, 
  getStudentsByDivisionBatchAndSem 
} from '@/app/actions/studentsApi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division');
    const sem = searchParams.get('sem');
    const batch = searchParams.get('batch');
    const type = searchParams.get('type'); // 'lecture' or 'lab'

    if (!division || !sem) {
      return NextResponse.json(
        { error: 'Division and semester are required' },
        { status: 400 }
      );
    }

    const divisionNum = parseInt(division);
    const semNum = parseInt(sem);

    if (isNaN(divisionNum) || isNaN(semNum)) {
      return NextResponse.json(
        { error: 'Division and semester must be valid numbers' },
        { status: 400 }
      );
    }

    let students;

    // For labs, fetch by division, batch, and semester
    if (type === 'lab' && batch) {
      students = await getStudentsByDivisionBatchAndSem(divisionNum, batch, semNum);
    } 
    // For lectures, fetch by division and semester only
    else {
      students = await getStudentsByDivisionAndSem(divisionNum, semNum);
    }

    // Transform the data to match the expected format for the component
    const transformedStudents = students.map((student, index) => ({
      id: student.student_id,
      student_id: student.Roll_No || student.student_id,
      name: student.Student_Name || 'Unknown',
      photo: '/student1.png', // Default photo, you can enhance this based on your requirements
      counselorName: student.Counsellor || 'Not Assigned',
      present: true, // Default to present
      division: student.Division,
      batch: student.Batch,
      semester: student.Sem,
      department: student.Department
    }));

    return NextResponse.json({ students: transformedStudents });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
