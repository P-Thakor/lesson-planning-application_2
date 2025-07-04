import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { attendanceRecords } = await request.json();

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json(
        { error: 'Invalid attendance records format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert attendance records
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save attendance records' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `${data.length} attendance records saved successfully`,
      data 
    });

  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get('lecture');
    const studentId = searchParams.get('student');
    const date = searchParams.get('date');

    const supabase = await createClient();
    let query = supabase.from('attendance').select('*');

    // Apply filters based on query parameters
    if (lectureId) {
      query = query.eq('lecture', lectureId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (date) {
      // Filter by date (assuming the Date field stores full timestamps)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('Date', startOfDay.toISOString())
        .lte('Date', endOfDay.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
