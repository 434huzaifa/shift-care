import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


// GET - Get a single shift by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        staff: true,
        carer: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift" },
      { status: 500 }
    );
  }
}

// PUT - Update a shift
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
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

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        ...(staffId && { staffId: parseInt(staffId) }),
        ...(carerId && { carerId: parseInt(carerId) }),
        ...(priceAmount && { priceAmount: parseFloat(priceAmount) }),
        ...(priceType && { priceType }),
        ...(start_time && { start_time: new Date(start_time) }),
        ...(end_time && { end_time: new Date(end_time) }),
        ...(hours !== undefined && { hours: hours ? parseFloat(hours) : null }),
        ...(address && { address }),
        bonus: bonus !== undefined ? (bonus ? parseFloat(bonus) : null) : undefined,
        instruction: instruction !== undefined ? instruction || null : undefined,
        recurrenceRule: recurrenceRule !== undefined ? recurrenceRule || null : undefined,
        occurrences: occurrences !== undefined ? occurrences : undefined,
        summary: summary !== undefined ? summary : undefined,
      },
      include: {
        staff: true,
        carer: true,
      },
    });

    return NextResponse.json(shift);
  } catch (error: any) {
    console.error("Error updating shift:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update shift" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a shift
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Shift deleted successfully" });
  } catch (error:any) {
    console.error("Error deleting shift:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
