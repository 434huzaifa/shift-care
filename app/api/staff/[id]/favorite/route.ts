import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate ID
    const staffId = parseInt(id);
    if (isNaN(staffId)) {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (typeof body.isFav !== "boolean") {
      return NextResponse.json(
        { error: "isFav must be a boolean value" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: { isFav: body.isFav },
    });

    // Convert profileImage Buffer to base64 string for JSON response
    const staffResponse = {
      ...staff,
      profileImage: staff.profileImage 
        ? `data:image/jpeg;base64,${Buffer.from(staff.profileImage).toString('base64')}`
        : null
    };

    return NextResponse.json(staffResponse);
  } catch (error: unknown) {
    console.error("Error updating favorite status:", error);
    
    // Handle record not found
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while updating favorite status. Please try again." },
      { status: 500 }
    );
  }
}
