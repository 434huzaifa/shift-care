import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


// POST - Create a new shift
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      staffId,
      carerId,
      priceAmount,
      priceType,
      start_time,
      end_time,
      hours,
      address,
      bonus,
      instruction,
      recurrenceRule,
      occurrences,
      summary,
    } = body;

    // Validate required fields
    if (!staffId || !priceAmount || !priceType || !start_time || !end_time || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.create({
      data: {
        staffId: parseInt(staffId),
        carerId: parseInt(carerId),
        priceAmount: parseFloat(priceAmount),
        priceType,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        hours: hours ? parseFloat(hours) : null,
        address,
        bonus: bonus ? parseFloat(bonus) : null,
        instruction: instruction || null,
        recurrenceRule: recurrenceRule || null,
        occurrences: occurrences || null,
        summary: summary || null,
      },
      include: {
        staff: true,
        carer: true,
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error: any) {
    console.error("Error creating shift:", error);

    // Handle Prisma errors
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}

// GET - List shifts with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (staffId) {
      where.staffId = parseInt(staffId);
    }

    if (startDate && endDate) {
      // Parse dates as local dates and convert to start/end of day in local timezone
      const startDateTime = new Date(startDate + 'T00:00:00');
      const endDateTime = new Date(endDate + 'T23:59:59.999');
      
      where.start_time = {
        gte: startDateTime,
        lte: endDateTime,
      };
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        include: {
          staff: true,
          carer: true,
        },
        orderBy: {
          start_time: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.shift.count({ where }),
    ]);

    return NextResponse.json({
      shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}
