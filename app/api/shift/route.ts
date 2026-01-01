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
      startDate,
      shift_start_time,
      shift_end_time,
      endDate,
      hours,
      address,
      bonus,
      instruction,
      recurrenceRule,
      occurrences,
      summary,
    } = body;

    // Validate required fields
    if (!staffId || !carerId || !priceAmount || !priceType || !startDate || !shift_start_time || !shift_end_time || !endDate || !address) {
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
        startDate,
        shift_start_time,
        shift_end_time,
        endDate,
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
        { error: "Invalid staff or carer ID" },
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
      // Query shifts where the date range overlaps with our query range
      // A shift overlaps if: startDate <= endDate AND endDate >= startDate
      where.AND = [
        {
          startDate: {
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
          },
        },
      ];
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        include: {
          staff: true,
          carer: true,
        },
        orderBy: [
          {
            startDate: "asc",
          },
          {
            shift_start_time: "asc",
          },
        ],
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
