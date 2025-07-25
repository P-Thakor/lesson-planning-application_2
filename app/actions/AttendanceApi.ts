import { createClient } from '@/utils/supabase/server';
import { Attendance } from '@/types/types';

// Create attendance
export async function insertAttendance(
  attendance: Attendance & {
    Date: string;
  }
) {
  const supabase = await createClient();

  // Validate required fields
  if (!attendance.student_id) {
    throw new Error('Student ID is required');
  }

  if (!attendance.lecture) {
    throw new Error('Lecture ID is required');
  }

  // Clean and prepare the record
  const record = {
    lecture: attendance.lecture, // UUID of timetable entry
    student_id: attendance.student_id, // UUID of student
    is_present: attendance.is_present || false,
    Date: attendance.Date,
    // Only include faculty_id if it's a valid UUID (not 'unknown')
    ...(attendance.faculty_id &&
    attendance.faculty_id.trim() !== '' &&
    attendance.faculty_id !== 'unknown'
      ? { faculty_id: attendance.faculty_id }
      : {}),
    // Include Remark if provided
    ...(attendance.Remark && attendance.Remark.trim() !== ''
      ? { Remark: attendance.Remark }
      : {}),
  };

  console.log('Inserting attendance record:', record);

  const { data, error } = await supabase
    .from('attendance')
    .insert([record])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from database');
  }

  return data[0];
}

// Update attendance by id
export async function updateAttendance(
  id: string,
  updates: Partial<Attendance> & { Date?: string }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

// Delete attendance by id
export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

// Get all attendance records
export async function getAllAttendance() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(
      '*, timetable:lecture(subject, faculty, department, from, to, subjects:subject(code, name, departments(name)), faculty_details:faculty(name)), student:student_id(Student_Name, Guardian_Email, Roll_No, Department)'
    );
  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map((item: any) => {
    const { timetable, student, ...rest } = item;
    return {
      ...rest,
      subject_code: timetable?.subjects?.code,
      subject_name: timetable?.subjects?.name,
      faculty_name: timetable?.faculty_details?.name,
      department_name: timetable?.subjects?.departments?.name,
      from: timetable?.from,
      to: timetable?.to,
      student_first_name: student?.Student_Name?.split(' ')[0] || '',
      student_last_name: student?.Student_Name?.split(' ').slice(1).join(' ') || '',
      student_email: student?.Guardian_Email,
      student_roll_no: student?.Roll_No,
      student_department: student?.Department,
    };
  });
}

// Get attendance by id
export async function getAttendanceById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(
      '*, timetable:lecture(subject, faculty, department, from, to, subjects:subject(code, name, departments(name)), faculty_details:faculty(name)), student:student_id(Student_Name, Guardian_Email, Roll_No, Department)'
    )
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle to avoid error if not found
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  const { timetable, student, ...rest } = data;
  return {
    ...rest,
    subject_code: timetable?.subjects?.code,
    subject_name: timetable?.subjects?.name,
    faculty_name: timetable?.faculty_details?.name,
    department_name: timetable?.subjects?.departments?.name,
    from: timetable?.from,
    to: timetable?.to,
    student_first_name: student?.Student_Name?.split(' ')[0] || '',
    student_last_name: student?.Student_Name?.split(' ').slice(1).join(' ') || '',
    student_email: student?.Guardian_Email,
    student_roll_no: student?.Roll_No,
    student_department: student?.Department,
  };
}

// Get attendance by student id
export async function getAttendanceByStudentId(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(
      '*, timetable:lecture(subject, faculty, department, from, to, subjects:subject(code, name, departments(name)), faculty_details:faculty(name))'
    )
    .eq('student_id', studentId);
  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map((item: any) => {
    const { timetable, ...rest } = item;
    return {
      ...rest,
      subject_code: timetable?.subjects?.code,
      subject_name: timetable?.subjects?.name,
      faculty_name: timetable?.faculty_details?.name,
      department_name: timetable?.subjects?.departments?.name,
      from: timetable?.from,
      to: timetable?.to,
    };
  });
}

// Bulk insert attendance for present and absent students for a single lecture
export async function insertBulkAttendanceByStatus(
  lecture: string,
  presentIds: string[],
  absentIds: string[],
  Date: string,
  faculty_id?: string,
  lectureRemark?: string // What topics/content was covered in this lecture
) {
  const supabase = await createClient();

  // Guard clause: if both arrays are empty, return error
  if (
    (!presentIds || presentIds.filter(Boolean).length === 0) &&
    (!absentIds || absentIds.filter(Boolean).length === 0)
  ) {
    throw new Error('No present or absent student IDs provided');
  }
  // Prepare attendance records for present students
  const presentRecords = presentIds.filter(Boolean).map((student_id) => ({
    lecture,
    student_id,
    is_present: true,
    Date,
    ...(faculty_id && faculty_id.trim() !== '' ? { faculty_id } : {}),
    ...(lectureRemark && lectureRemark.trim() !== ''
      ? { Remark: lectureRemark }
      : {}),
  }));
  // Prepare attendance records for absent students
  const absentRecords = absentIds.filter(Boolean).map((student_id) => ({
    lecture,
    student_id,
    is_present: false,
    Date,
    ...(faculty_id && faculty_id.trim() !== '' ? { faculty_id } : {}),
    ...(lectureRemark && lectureRemark.trim() !== ''
      ? { Remark: lectureRemark }
      : {}),
  }));
  // Combine all records
  const records = [...presentRecords, ...absentRecords];
  const { data, error } = await supabase
    .from('attendance')
    .insert(records)
    .select();
  if (error) throw error;
  return data;
}

// Get all presentees and absentees for a lecture
export async function getAttendanceStatusByLecture(lectureId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(
      'is_present, student:student_id(first_name, last_name, email), timetable:lecture(subjects:subject(name, code), faculty_details:faculty(name))'
    )
    .eq('lecture', lectureId);

  if (error) throw error;
  if (!data || data.length === 0) return { presentees: [], absentees: [] };

  const presentees = data
    .filter((item: any) => item.is_present)
    .map((item: any) => ({
      student_first_name: item.student?.[0]?.first_name,
      student_last_name: item.student?.[0]?.last_name,
      student_email: item.student?.[0]?.email,
      subject_name: item.timetable?.[0]?.subjects?.[0]?.name,
      subject_code: item.timetable?.[0]?.subjects?.[0]?.code,
      faculty_name: item.timetable?.[0]?.faculty_details?.[0]?.name,
    }));

  const absentees = data
    .filter((item: any) => !item.is_present)
    .map((item: any) => ({
      student_first_name: item.student?.[0]?.first_name,
      student_last_name: item.student?.[0]?.last_name,
      student_email: item.student?.[0]?.email,
      subject_name: item.timetable?.[0]?.subjects?.[0]?.name,
      subject_code: item.timetable?.[0]?.subjects?.[0]?.code,
      faculty_name: item.timetable?.[0]?.faculty_details?.[0]?.name,
    }));

  return { presentees, absentees };
}
