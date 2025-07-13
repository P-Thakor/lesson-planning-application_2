import { getTimetablesByFacultyId } from "@/app/actions/timtableApi";
import ClientAttendanceModule from "@/app/attendance-module/ClientAttendanceModule";
import FacultySidebar from "@/components/FacultySidebar";
import { signOut } from "@/app/actions/auth";
import { AuthProvider } from "@/lib/AuthContext";
import { DashboardProvider } from "@/context/DashboardContext";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Timetable } from "@/types/types";

export default async function AttendanceModulePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error or user not found:", authError);
    redirect("/auth/login");
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user data:", userError);
    redirect("/auth/login");
  }

  // Try multiple approaches to find the role data
  const { data: roleDataWithUserId, error: roleErrorWithUserId } = await supabase
    .from("user_role")
    .select("*, departments(*, institutes(*))")
    .eq("user_id", userData.id);

  const { data: roleDataWithAuthId, error: roleErrorWithAuthId } = await supabase
    .from("user_role")
    .select("*, departments(*, institutes(*))")
    .eq("user_id", userData.auth_id);

  const { data: roleDataWithSupabaseId, error: roleErrorWithSupabaseId } = await supabase
    .from("user_role")
    .select("*, departments(*, institutes(*))")
    .eq("user_id", user.id);

  // Use whichever query returns data
  let roleData = null;

  if (roleDataWithUserId && roleDataWithUserId.length > 0) {
    roleData = roleDataWithUserId;
  } else if (roleDataWithAuthId && roleDataWithAuthId.length > 0) {
    roleData = roleDataWithAuthId;
  } else if (roleDataWithSupabaseId && roleDataWithSupabaseId.length > 0) {
    roleData = roleDataWithSupabaseId;
  }

  // Fetch timetable for the specified faculty ID using existing backend function
  let timeTableData: Timetable[];
  // console.log('data:', roleData);

  // Get current day as string (e.g., 'Monday')
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  try {
    const allTimeTableData = await getTimetablesByFacultyId(
      userData.id || userData.auth_id || user.id
    );
    // Only include lectures and labs for the current day
    timeTableData = (allTimeTableData || []).filter(
      (entry: any) => {
        const entryDay = (entry.day || '').toLowerCase();
        const today = currentDay.toLowerCase();
        const type = (entry.type || '').toLowerCase();
        return entryDay === today && (type === 'lecture' || type === 'lab');
      }
    );
    console.log("Time Table Data (filtered for today):", timeTableData);
  } catch (error) {
    console.error("Error fetching time table data:", error);
    timeTableData = [];
  }
  
  return (
    <AuthProvider>
      <DashboardProvider value={{ userData, roleData: roleData || [] }}>
        <div className="flex h-screen bg-gray-100">
          <FacultySidebar signOut={signOut} />
          <main className="flex-1 overflow-y-auto">
            <ClientAttendanceModule timetable={timeTableData} />
          </main>
        </div>
      </DashboardProvider>
    </AuthProvider>
  );
}