"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, Save, Loader2 } from "lucide-react";
import { DummyLecture } from "@/services/dummyTypes";
import { toast } from "sonner";

interface Student {
  id: string;
  student_id: string;
  name: string;
  photo: string;
  counselorName: string;
  present: boolean;
  division?: number;
  batch?: string;
  semester?: number;
  department?: string;
}

const MarkAttendance = ({ lecture }: { lecture: any }) => {
  const router = useRouter();
  const [attendanceData, setAttendanceData] = useState<Student[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch students data based on lecture type
  useEffect(() => {
    const fetchStudents = async () => {
      if (!lecture) return;
      
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        
        // Extract lecture details (you may need to adjust these based on your lecture object structure)

        const sem = lecture.sem || lecture.semester || '1';
        const department = lecture.department || lecture.Department;
        // If both department and sem are available, use them for the query
        if (department && sem) {
          params.append('department', department);
          params.append('sem', sem.toString());
        } else {
          // fallback to division/batch/sem logic if department/sem not available
          const division = lecture.division || '1';
          const batch = lecture.batch;
          const type = lecture.type; // 'lecture' or 'lab'
          params.append('division', division.toString());
          params.append('sem', sem.toString());
          if (type === 'lab' && batch) {
            params.append('batch', batch);
            params.append('type', 'lab');
          } else {
            params.append('type', 'lecture');
          }
        }

        const response = await fetch(`/api/students?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        setAttendanceData(data.students);
        console.log('Fetched students:', data.students[0]);
        
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [lecture]);

  // Calculate if all students are selected
  const allSelected = attendanceData.length > 0 && attendanceData.every(student => student.present);
  const someSelected = attendanceData.some(student => student.present);
  
  const toggleAttendance = (studentId: string) => {
    setAttendanceData(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      // If all are selected, unselect all
      setAttendanceData(prev => 
        prev.map(student => ({ ...student, present: false }))
      );
    } else {
      // If not all are selected, select all
      setAttendanceData(prev => 
        prev.map(student => ({ ...student, present: true }))
      );
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log("Lecture data structure:", lecture);
      
      // Get UUIDs of present students (using the id field which contains UUIDs)
      const presentStudentUUIDs = attendanceData
        .filter(student => student.present)
        .map(student => student.id); // This is the UUID from student_data table

      console.log("Present student UUIDs:", presentStudentUUIDs);

      // Prepare attendance records for API call
      const currentDate = new Date().toISOString(); // Full ISO string for timestamp
      
      const attendanceRecords = presentStudentUUIDs.map(studentUUID => ({
        lecture: lecture.id || lecture._id, // Use the timetable ID as the lecture reference
        is_present: true,
        Date: currentDate,
        student_id: studentUUID, // Send the UUID as the student_id for the foreign key
        faculty_id: lecture.faculty || 'unknown' // Use the actual faculty ID from timetable
      }));

      console.log("Attendance records to send:", attendanceRecords);

      // Call the API route
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendanceRecords }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save attendance');
      }

      const result = await response.json();
      toast.success(`Attendance saved successfully for ${presentStudentUUIDs.length} students`);
      console.log("Attendance saved for students:", presentStudentUUIDs);
      console.log("API response:", result);
      // Redirect to attendance selection page
      router.push("/attendance-selection");

    } catch (error) {
      console.error("Error saving attendance:", error);
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      toast.error(`Failed to save attendance: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading students...</span>
        </div>
      ) : (
        <>
          {/* Select All Controls */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className={`
                px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm
                flex items-center gap-2 hover:shadow-md
                ${allSelected 
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                  : someSelected 
                    ? 'bg-blue-50 border-blue-600 text-blue-600 hover:bg-blue-100'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <div
                className={`
                  w-4 h-4 border-2 rounded flex items-center justify-center
                  ${allSelected 
                    ? 'bg-white border-white' 
                    : someSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-400'
                  }
                `}
              >
                {allSelected && <Check size={12} className="text-blue-600" />}
                {someSelected && !allSelected && <Check size={12} className="text-white" />}
              </div>
              {allSelected ? 'Unselect All' : 'Select All'}
              <span className="text-xs opacity-75">
                ({attendanceData.filter(s => s.present).length}/{attendanceData.length})
              </span>
            </button>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">{attendanceData.filter(s => s.present).length}</span> students selected for attendance
            </div>
          </div>

          <div className="min-w-full border rounded-lg overflow-hidden bg-white">
            <div className="grid grid-cols-5 gap-1 text-white border-b border-blue-800">
              <div className="py-3 px-4 bg-primary-blue font-medium text-center">Sr. No.</div>
              <div className="py-3 px-4 bg-primary-blue font-medium text-center">Photo</div>
              <div className="py-3 px-4 bg-primary-blue font-medium text-center">Student_ID</div>
              <div className="py-3 px-4 bg-primary-blue font-medium text-center">Student_Name</div>
              <div className="py-3 px-4 bg-primary-blue font-medium text-center">Counselor Name</div>
            </div>
            {/* Student Rows */}
            {attendanceData.map((student, index) => (
              <div
                key={student.id}
                className="grid grid-cols-5 border-b hover:bg-gray-50"
              >
                <div className="p-3 text-center flex justify-center items-center">
                  <div className="w-16 h-10 border rounded-md flex font-semibold items-center text-sm justify-center">
                    {index + 1}
                  </div>
                </div>
                <div className="p-3 flex justify-center items-center">
                  <div className="w-16 h-16 border rounded-md overflow-hidden flex items-center justify-center">
                    <Image
                      src={student.photo}
                      alt={`${student.name}'s photo`}
                      width={64}
                      height={64}
                      onError={(e) => {
                        // Fallback to a user placeholder if image fails to load
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/64?text=User";
                      }}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="p-3 flex justify-center items-center">
                  <button
                    onClick={() => toggleAttendance(student.id)}
                    className={`
                      w-32 h-10 border-2 rounded-md flex items-center justify-start px-2 gap-2 
                      transition-all duration-200 cursor-pointer hover:shadow-sm
                      ${student.present 
                        ? "bg-blue-50 border-blue-600" 
                        : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                      }
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 border-2 rounded flex items-center justify-center
                        ${student.present
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-400"
                        }
                      `}
                    >
                      {student.present && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {student.student_id}
                    </span>
                  </button>
                </div>
                <div className="p-3 flex justify-center items-center">
                  <div className="w-32 h-10 border rounded-md text-xs font-semibold flex  items-center justify-start">
                    {student.name}
                  </div>
                </div>
                <div className="p-3 flex justify-center items-center">
                  <div className="w-32 h-10 border rounded-md font-semibold text-xs flex items-center justify-center">
                    {student.counselorName.split(' ')[0]} {student.counselorName.split(' ')[2]}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center mt-6">
            {attendanceData.filter(s => s.present).length === 0 && (
              <div className="text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-md text-sm font-medium">
                ⚠️ No students selected for attendance
              </div>
            )}
            
            <div className="ml-auto">
              <Button
                onClick={handleSave}
                disabled={isSaving || attendanceData.filter(s => s.present).length === 0}
                className="bg-blue-600 hover:bg-blue-700 font-semibold text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Save size={16} />
                {isSaving 
                  ? "Saving..." 
                  : `Save Attendance (${attendanceData.filter(s => s.present).length} selected)`
                }
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MarkAttendance;
