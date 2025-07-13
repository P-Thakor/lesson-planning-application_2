import { DummyLecture } from "@/services/dummyTypes";
import { Edit, Eye } from "lucide-react";
import Image from "next/image";

interface SubjectCardProps {
  lecture: any; // Changed from DummyLecture to any to handle timetable data
  setLecture: (lecture: any) => void;
  setShowList: (show: boolean) => void;
  setFillAttendance?: (fill: boolean) => void;
}

const SubjectCard = ({ lecture, setLecture, setShowList, setFillAttendance }: SubjectCardProps) => {
  // Helper function to safely get values with fallbacks
  const getSubjectName = () => lecture.subject_name || lecture.name || 'Unknown Subject';
  const getSubjectCode = () => lecture.subject_code || lecture.code || 'N/A';
  const getSemester = () => lecture.sem || 'N/A';  const getDate = () => {
    if (lecture.date) return lecture.date;
    // If no date, try to format today's date or use a placeholder
    return new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };
  
  const formatTime = (timeString: string) => {
    if (!timeString || timeString === 'N/A') return 'N/A';
    
    // Handle different time formats
    try {
      // If it's already in HH:MM format, convert to 12-hour format
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const min = minutes || '00';
        
        if (hour === 0) return `12:${min} AM`;
        if (hour < 12) return `${hour}:${min} AM`;
        if (hour === 12) return `12:${min} PM`;
        return `${hour - 12}:${min} PM`;
      }
      
      // If it's a timestamp, parse it
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      }
      
      return timeString; // Return as-is if can't format
    } catch (error) {
      return timeString; // Return as-is if error
    }
  };
  
  // Convert UTC+0 time string (e.g., '03:40:00+00') to IST and format as HH:MM AM/PM
  const convertToIST = (timeString: string) => {
    if (!timeString) return 'N/A';
    // Match HH:MM:SS
    const match = timeString.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return timeString;
    let hours = parseInt(match[1]);
    let minutes = parseInt(match[2]);
    // Add 5 hours 30 minutes for IST
    let totalMinutes = hours * 60 + minutes + 330;
    let istHours = Math.floor(totalMinutes / 60) % 24;
    let istMinutes = totalMinutes % 60;
    // Format to 12-hour
    const ampm = istHours >= 12 ? 'PM' : 'AM';
    let displayHour = istHours % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour.toString().padStart(2, '0')}:${istMinutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getFromTime = () => convertToIST(lecture.from || lecture.fromTime || '');
  const getToTime = () => convertToIST(lecture.to || lecture.toTime || 'N/A');
  const getStatus = () => lecture.status || 'Pending';

  return (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-[20px] border-2 w-[340px] h-[239px]">
      <div className="flex flex-row gap-2 justify-between">
        <div>
            <h2 className="text-xl text-primary-blue font-bold">{getSubjectName()}</h2>
        </div>
        <div className="w-[74px] h-[29px] bg-primary-blue font-semibold text-xs text-white rounded-full flex items-center justify-center">
            <p>Sem {getSemester()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex h-[29px] border-2 rounded-full w-[82px] justify-center items-center">
          <p className="text-xs font-semibold">{getSubjectCode()}</p>
        </div>
        <div className={`flex h-[29px] rounded-full w-[82px] justify-center items-center ${getStatus() === "Submitted" ? "bg-[#1aa1643f] text-[#1AA164]" : "bg-[#a11a1a42] text-[#a11a1a]"}`}>
          <p className="text-xs font-semibold">{getStatus()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col h-[68px] w-[68px] border-2 rounded-lg">
          <div className="flex justify-center items-center border-b-2 h-1/2 w-full gap-0.5">
            <Image src="/calendar.png" alt="calendar image" height={14} width={14} className="" />
            <p className="text-xs font-semibold">Date</p>
          </div>
          <div className="flex justify-center items-center h-1/2 w-full">
            <p className="text-xs font-semibold">{getDate()}</p>
          </div>
        </div>
        <div className="flex flex-col h-[68px] w-[138px] border-2 rounded-lg">
          <div className="flex justify-center items-center border-b-2 h-1/2 w-full gap-0.5">
            <Image src="/clock.png" alt="clock image" height={14} width={14} className="" />
            <p className="text-xs font-semibold">Time</p>
          </div>
          <div className="flex justify-center items-center h-1/2 w-full">
            <p className="text-xs font-semibold">{getFromTime()} to {getToTime()}</p>
          </div>
        </div>
      </div>      <div className="flex gap-2">
        <div className="flex border-2 rounded-lg h-10 w-36 justify-center items-center gap-1.5 cursor-pointer">
          <Eye className="h-5 w-5" />
          <p className="text-xs font-semibold">View Attendance</p>
        </div>
        <button 
          className="flex border-2 rounded-lg h-10 w-36 justify-center items-center gap-1.5 cursor-pointer hover:bg-gray-50"
          onClick={() => { 
            setLecture(lecture); 
            setShowList(false); 
            if (setFillAttendance) {
              setFillAttendance(true);
            }
          }}
        >
          <Edit className="h-3.5 w-3.5" />
          <p className="text-xs font-semibold">Fill Attendance</p>
        </button>
      </div>
    </div>
  )
}

export default SubjectCard

// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Edit, Eye, Upload, FileText, ChevronRight } from "lucide-react"
// import Link from "next/link"
// import { checkLessonPlanCompletion } from "@/app/dashboard/actions/checkLessonPlanCompletion"

// interface SubjectCardProps {
//   subject: any
//   lessonPlan?: any
// }

// export default function SubjectCard({ subject, lessonPlan }: SubjectCardProps) {
//   const [status, setStatus] = useState<"in_progress" | "submitted">("in_progress")
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     const checkStatus = async () => {
//       setIsLoading(true)
//       const result = await checkLessonPlanCompletion(subject.id)
//       if (result.success) {
//         setStatus(result.status as "in_progress" | "submitted")
//       }
//       setIsLoading(false)
//     }

//     checkStatus()
//   }, [subject.id])

//   const getStatusBadge = () => {
//     if (isLoading) {
//       return <Badge variant="secondary">Checking...</Badge>
//     }

//     if (status === "submitted") {
//       return <Badge className="bg-green-100 text-green-800">Submitted</Badge>
//     } else {
//       return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
//     }
//   }

//   return (
//     <Card className="w-full">
//       <CardHeader className="pb-3">
//         <div className="flex justify-between items-start">
//           <div>
//             <CardTitle className="text-lg font-bold text-gray-900 mb-2">{subject.name}</CardTitle>
//             <div className="flex items-center gap-2 mb-2">
//               <Badge variant="outline" className="bg-blue-50 text-blue-700">
//                 Sem {subject.semester}
//               </Badge>
//               {getStatusBadge()}
//             </div>
//             <p className="text-sm text-gray-600">{subject.code}</p>
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {/* Action Buttons */}
//         <div className="grid grid-cols-2 gap-3">
//           <Button asChild className="bg-[#1A5CA1] hover:bg-[#154A80] text-white">
//             <Link href={`/dashboard/lesson-plans/${subject.id}/edit`}>
//               <Edit className="h-4 w-4 mr-2" />
//               Edit LP
//             </Link>
//           </Button>

//           <Button variant="outline" asChild>
//             <Link href={`/dashboard/lesson-plans/${subject.id}`}>
//               <Eye className="h-4 w-4 mr-2" />
//               View LP
//             </Link>
//           </Button>
//         </div>

//         <div className="grid grid-cols-2 gap-3">
//           <Button variant="outline" size="sm">
//             <Upload className="h-4 w-4 mr-2" />
//             Upload Syllabus
//           </Button>

//           <Button variant="outline" size="sm">
//             <FileText className="h-4 w-4 mr-2" />
//             View Syllabus
//           </Button>
//         </div>

//         {/* Expandable Sections */}
//         <div className="space-y-2 pt-2 border-t">
//           <Button
//             variant="ghost"
//             className="w-full justify-between text-left p-2 h-auto"
//             onClick={() => {
//               // Handle expand/collapse for Actual Unit Details
//             }}
//           >
//             <span className="text-sm font-medium">Actual Unit Details</span>
//             <ChevronRight className="h-4 w-4" />
//           </Button>

//           <Button
//             variant="ghost"
//             className="w-full justify-between text-left p-2 h-auto"
//             onClick={() => {
//               // Handle expand/collapse for Actual CIE Details
//             }}
//           >
//             <span className="text-sm font-medium">Actual CIE Details</span>
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }
