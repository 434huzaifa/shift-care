import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkShiftConflicts } from "@/lib/conflict-utils";

// POST - Check for shift conflicts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      staffId,
      startDate,
      endDate,
      shift_start_time,
      shift_end_time,
      recurrenceRule,
      excludeShiftId,
    } = body;

    // Validate required fields
    if (!staffId || !startDate || !shift_start_time || !shift_end_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch all existing shifts for this staff
    // We need to check a wide date range to cover all potential conflicts
    const existingShifts = await prisma.shift.findMany({
      where: {
        staffId: parseInt(staffId),
      },
      include: {
        carer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Check for conflicts
    const conflicts = checkShiftConflicts(
      {
        startDate,
        endDate: endDate || startDate,
        startTime: shift_start_time,
        endTime: shift_end_time,
        recurrenceRule: recurrenceRule || null,
        staffId: parseInt(staffId),
      },
      existingShifts,
      excludeShiftId ? parseInt(excludeShiftId) : undefined
    );

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.slice(0, 5), // Return first 5 conflicts
      totalConflicts: conflicts.length,
    });
  } catch (error: any) {
    console.error("Error checking shift conflicts:", error);
    return NextResponse.json(
      { error: "Failed to check shift conflicts" },
      { status: 500 }
    );
  }
}
