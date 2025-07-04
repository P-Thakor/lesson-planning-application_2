import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get all departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, abbreviation_depart')
      .order('name');

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      throw deptError;
    }

    // Get all subjects with department info
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select(`
        id, 
        code, 
        name, 
        semester,
        departments(name, abbreviation_depart)
      `)
      .order('name');

    if (subjectError) {
      console.error('Error fetching subjects:', subjectError);
      throw subjectError;
    }

    // Get all faculty with their role info
    const { data: faculty, error: facultyError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        user_role(
          role_name,
          departments(name, abbreviation_depart)
        )
      `)
      .order('name');

    if (facultyError) {
      console.error('Error fetching faculty:', facultyError);
      throw facultyError;
    }

    // Get unique divisions and batches from student data
    const { data: studentStats, error: statsError } = await supabase
      .from('student_data')
      .select('Division, Batch, Sem, Department')
      .not('Division', 'is', null)
      .not('Batch', 'is', null);

    if (statsError) {
      console.error('Error fetching student stats:', statsError);
      throw statsError;
    }

    // Process unique values
    const uniqueDivisions = [...new Set(studentStats?.map(s => s.Division).filter(Boolean))].sort();
    const uniqueBatches = [...new Set(studentStats?.map(s => s.Batch).filter(Boolean))].sort();
    const uniqueSemesters = [...new Set(studentStats?.map(s => s.Sem).filter(Boolean))].sort();

    // Generate student ID ranges based on actual data
    const { data: studentRanges, error: rangeError } = await supabase
      .from('student_data')
      .select('Roll_No, Department')
      .not('Roll_No', 'is', null)
      .order('Roll_No');

    if (rangeError) {
      console.error('Error fetching student ranges:', rangeError);
      throw rangeError;
    }

    // Group by department and create ranges
    const departmentRanges: Record<string, string> = {};
    if (studentRanges) {
      const groupedByDept = studentRanges.reduce((acc: any, student) => {
        const dept = student.Department || 'Unknown';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(student.Roll_No);
        return acc;
      }, {});

      Object.keys(groupedByDept).forEach(dept => {
        const rollNos = groupedByDept[dept].sort();
        if (rollNos.length > 0) {
          departmentRanges[dept] = `${rollNos[0]} to ${rollNos[rollNos.length - 1]}`;
        }
      });
    }

    // Deduplicate departments by name (keep first occurrence)
    const uniqueDepartments = departments ? departments.filter((dept, index, self) => 
      index === self.findIndex(d => d.name === dept.name)
    ) : [];

    return NextResponse.json({
      success: true,
      data: {
        departments: uniqueDepartments,
        subjects: subjects || [],
        faculty: faculty || [],
        divisions: uniqueDivisions,
        batches: uniqueBatches,
        semesters: uniqueSemesters,
        studentIdRanges: departmentRanges
      }
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
