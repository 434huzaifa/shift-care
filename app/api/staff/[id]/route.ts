import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
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

    // Convert base64 image to buffer if provided
    let profileImageBuffer = undefined;
    if (body.profileImage !== undefined) {
      if (body.profileImage && body.profileImage.startsWith('data:image')) {
        const base64Data = body.profileImage.split(',')[1];
        profileImageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        profileImageBuffer = null;
      }
    }

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        name: body.name,
        email: body.email,
        jobTitle: body.jobTitle,
        nationality: body.nationality,
        nationalityFlag: body.nationalityFlag || null,
        location: body.location,
        locationFlag: body.locationFlag || null,
        status: body.status,
        gender: body.gender,
        isFav: body.isFav,
        ...(profileImageBuffer !== undefined && { profileImage: profileImageBuffer }),
      },
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
    console.error("Error updating staff:", error);
    
    // Handle record not found
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }
    
    // Handle unique constraint violations
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A staff member with this email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while updating staff. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.staff.delete({
      where: { id: staffId },
    });

    return NextResponse.json({ 
      success: true,
      message: "Staff and all related shifts deleted successfully" 
    });
  } catch (error: unknown) {
    console.error("Error deleting staff:", error);
    
    // Handle record not found
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Staff member not found or already deleted" },
        { status: 404 }
      );
    }
    
    // Handle foreign key constraints
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete staff member due to existing related records" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting staff. Please try again." },
      { status: 500 }
    );
  }
}
