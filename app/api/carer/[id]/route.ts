import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const carerId = parseInt(id);

    if (isNaN(carerId)) {
      return NextResponse.json(
        { error: "Invalid carer ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Convert base64 image to buffer if provided
    let profileImageBuffer:Buffer<ArrayBuffer>|undefined = undefined;
    if (body.profileImage && body.profileImage.startsWith('data:image')) {
      const base64Data = body.profileImage.split(',')[1];
      profileImageBuffer = Buffer.from(base64Data, 'base64');
    }

    const carer = await prisma.carer.update({
      where: { id: carerId },
      data: {
        name: body.name,
        email: body.email,
        gender: body.gender,
        ...(profileImageBuffer !== undefined && { profileImage: profileImageBuffer }),
      },
    });

    // Convert profileImage Buffer to base64 string for JSON response
    const carerResponse = {
      ...carer,
      profileImage: carer.profileImage 
        ? `data:image/jpeg;base64,${Buffer.from(carer.profileImage).toString('base64')}`
        : null
    };

    return NextResponse.json(carerResponse);
  } catch (error: unknown) {
    console.error("Error updating carer:", error);
    
    // Handle record not found
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Carer not found" },
        { status: 404 }
      );
    }
    
    // Handle unique constraint violations
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A carer with this email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while updating carer. Please try again." },
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
    const carerId = parseInt(id);

    if (isNaN(carerId)) {
      return NextResponse.json(
        { error: "Invalid carer ID" },
        { status: 400 }
      );
    }

    await prisma.carer.delete({
      where: { id: carerId },
    });

    return NextResponse.json({ 
      success: true,
      message: "Carer and all related shifts deleted successfully" 
    });
  } catch (error: unknown) {
    console.error("Error deleting carer:", error);
    
    // Handle record not found
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: "Carer not found or already deleted" },
        { status: 404 }
      );
    }
    
    // Handle foreign key constraints
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete carer due to existing related records" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting carer. Please try again." },
      { status: 500 }
    );
  }
}
