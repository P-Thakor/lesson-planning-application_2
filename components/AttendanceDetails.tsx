
const AttendanceDetails = ({ lecture }: { lecture: any }) => {
  // Helper functions to safely get values with fallbacks
  const getDate = () => {
    if (lecture.date) return lecture.date;
    return new Date().toLocaleDateString('en-GB');
  };
    const getDetails = () => lecture.details || lecture.type || 'Regular Lecture';
  const getSubjectCode = () => lecture.subject_code || lecture.code || 'N/A';
  const getSubjectName = () => lecture.subject_name || lecture.name || 'Unknown Subject';
  const getPlannedTopic = () => lecture.plannedTopic || lecture.planned_topic || 'Planning not done';
  
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
  
  const getFromTime = () => formatTime(lecture.from || lecture.fromTime || 'N/A');
  const getToTime = () => formatTime(lecture.to || lecture.toTime || 'N/A');
  const getFacultyName = () => lecture.faculty_name || lecture.facultyName || 'Unknown Faculty';
  const getRoom = () => lecture.Location || lecture.location || 'Lab';

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 w-full">
      <div className="border-b pb-3 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Student Attendance
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
        <div className="space-y-4">
          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Lecture Date</p>
            <p className="pl-4 pr-8">:</p>
            <p className="text-sm">{getDate()}</p>
          </div>

          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Lecture Details</p>
            <p className="pl-4 pr-8">:</p>
            <p className="text-sm">{getDetails()}</p>
          </div>

          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Course</p>
            <p className="pl-4 pr-8">:</p>
            <p className="text-sm">
              {getSubjectCode()} / {getSubjectName()}
            </p>
          </div>

          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Planned Topic</p>
            <p className="pl-4 pr-8">:</p>
            <p className="text-sm">
              {getPlannedTopic()}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Lecture Time</p>
            <p className="pl-4 pr-8">:</p>            <p className="text-sm">
              {getFromTime()}-{getToTime()}
            </p>
          </div>

          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Faculty Name</p>
            <p className="pl-4 pr-8">:</p>
            <p className="text-sm">{getFacultyName()}</p>
          </div>

          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Room</p>
            <p className="pl-4 pr-8">:</p>
            <p className="text-sm">{getRoom()}</p>
          </div>

          <div className="flex items-center">
            <p className="text-xs font-semibold w-32">Actual Topic</p>
            <p className="pl-4 pr-8">:</p>
            <div className="flex-1">
              <select className="w-full border border-gray-300 rounded bg-white py-1 px-2 text-sm">
                <option>--Select Type--</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2">
          <p className="text-xs font-semibold">Remark:</p>
        </div>
        <textarea
          className="w-full h-24 border border-gray-300 rounded-md p-2 text-sm"
          placeholder="Enter remarks here..."
        ></textarea>{" "}
      </div>
    </div>
  );
};

export default AttendanceDetails;
