
import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents } from '@/app/actions/studentsApi';
import { getAllTimetables } from '@/app/actions/timtableApi';

export async function GET(request: NextRequest) {
  try {

    // Use getAllStudents to get student data
    const students = await getAllStudents();
    // Use getAllTimetables to get timetable/subject data
    const timetables = await getAllTimetables();

    // Departments from students
    const departments = students
      .map(s => ({
        id: s.Department,
        name: s.Department,
        abbreviation_depart: s.Department // If you have abbreviation, map it here
      }))
      .filter((dept, idx, arr) => dept.name && arr.findIndex(d => d.name === dept.name) === idx)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Subjects from timetables
    const subjects = timetables
      .map(t => ({
        id: t.subject,
        code: t.subject_code,
        name: t.subject_name,
        departments: { name: t.department },
        semester: t.sem
      }))
      .filter((subj, idx, arr) => subj.code && arr.findIndex(s => s.code === subj.code) === idx)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Faculty from timetables
    const faculty = timetables
      .map(t => ({
        id: t.faculty,
        name: t.faculty_name,
        email: t.faculty_email || ''
      }))
      .filter((f, idx, arr) => f.id && arr.findIndex(ff => ff.id === f.id) === idx)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Divisions, Batches, Semesters from students
    const uniqueDivisions = [...new Set(students.map(s => s.Division).filter(Boolean))].sort();
    const uniqueBatches = [...new Set(students.map(s => s.Batch).filter(Boolean))].sort();
    const uniqueSemesters = [...new Set(students.map(s => s.Sem).filter(Boolean))].sort();

    // Student ID ranges by department
    const departmentRanges: Record<string, string> = {};
    const groupedByDept = students.reduce((acc: any, student) => {
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

    return NextResponse.json({
      success: true,
      data: {
        departments,
        subjects,
        faculty,
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
