import { NextRequest, NextResponse } from 'next/server';
import { 
  getStudentsByDivisionAndSem, 
  getStudentsByDivisionBatchAndSem, 
  getStudentsByDepartmentAndSem 
} from '@/app/actions/studentsApi';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division');
    const sem = searchParams.get('sem');
    const batch = searchParams.get('batch');
    const type = searchParams.get('type'); // 'lecture' or 'lab'
    // Accept departmentId as the query param for department UUID, but also support legacy 'department' param as either UUID or name
    let department = searchParams.get('department');
    let departmentName: string | undefined = undefined;
    // if (!departmentId && departmentParam) {
    //   if (/^[0-9a-fA-F-]{36}$/.test(departmentParam)) {
    //     departmentId = departmentParam;
    //   } else {
    //     departmentName = departmentParam;
    //   }
    // }


    let students;
    // If departmentId and sem are provided, use getStudentsByDepartmentAndSem
    if (department && sem) {
      // Fetch department name from departments table
      const supabase = await createClient();
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('abbreviation_depart')
        .eq('id', department)
        .single();
      if (deptError || !deptData) {
        return NextResponse.json(
          { error: 'Invalid department ID' },
          { status: 400 }
        );
      }
      console.log('Department Data:', deptData);
      
      students = await getStudentsByDepartmentAndSem(`D${deptData.abbreviation_depart}`, parseInt(sem));
    } else if (departmentName && sem) {
      // If department name is provided directly, use it
      students = await getStudentsByDepartmentAndSem(departmentName, parseInt(sem));
    } else if (division && sem) {
      const divisionNum = parseInt(division);
      const semNum = parseInt(sem);
      if (isNaN(divisionNum) || isNaN(semNum)) {
        return NextResponse.json(
          { error: 'Division and semester must be valid numbers' },
          { status: 400 }
        );
      }
      // For labs, fetch by division, batch, and semester
      if (type === 'lab' && batch) {
        students = await getStudentsByDivisionBatchAndSem(divisionNum, batch, semNum);
      } else {
        students = await getStudentsByDivisionAndSem(divisionNum, semNum);
      }
    } else {
      students = [];
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
