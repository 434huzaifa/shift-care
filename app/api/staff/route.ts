import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    const requiredFields = ['name', 'email', 'jobTitle', 'nationality', 'location', 'gender'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert base64 image to buffer if provided
    let profileImageBuffer = null;
    if (body.profileImage && body.profileImage.startsWith('data:image')) {
      const base64Data = body.profileImage.split(',')[1];
      profileImageBuffer = Buffer.from(base64Data, 'base64');
    }

    const staff = await prisma.staff.create({
      data: {
        name: body.name,
        email: body.email,
        jobTitle: body.jobTitle,
        nationality: body.nationality,
        nationalityFlag: body.nationalityFlag || null,
        location: body.location,
        locationFlag: body.locationFlag || null,
        status: body.status || "ACTIVE",
        gender: body.gender,
        isFav: body.isFav || false,
        profileImage: profileImageBuffer,
      },
    });

    // Convert profileImage Buffer to base64 string for JSON response
    const staffResponse = {
      ...staff,
      profileImage: staff.profileImage 
        ? `data:image/jpeg;base64,${Buffer.from(staff.profileImage).toString('base64')}`
        : null
    };

    return NextResponse.json(staffResponse, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating staff:", error);
    
    // Handle Prisma-specific errors
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A staff member with this email already exists" },
        { status: 409 }
      );
    }
    
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid reference in the data" },
        { status: 400 }
      );
    }
    
    // Handle validation errors
    if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: ('message' in error ? error.message : "Validation failed") || "Validation failed" },
        { status: 400 }
      );
    }
    
    // Generic error fallback
    return NextResponse.json(
      { error: "An unexpected error occurred while creating staff. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { jobTitle: { contains: search } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.staff.count({ where });

    // Get paginated staff
    const staff = await prisma.staff.findMany({
      where,
      orderBy: [
        { isFav: "desc" },
        { createdAt: "desc" }
      ],
      skip,
      take: limit,
    });

    // Convert profileImage Buffer to base64 string for JSON serialization
    const staffWithImages = staff.map(s => ({
      ...s,
      profileImage: s.profileImage 
        ? `data:image/jpeg;base64,${Buffer.from(s.profileImage).toString('base64')}`
        : null
    }));

    return NextResponse.json({
      staff: staffWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching staff:", error);
    
    // Handle database connection errors
    if (typeof error === 'object' && error !== null && 'code' in error && (error.code === 'P1001' || error.code === 'P1002')) {
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching staff. Please try again." },
      { status: 500 }
    );
  }
}
