import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'gender'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert base64 image to buffer if provided
    let profileImageBuffer:Buffer<ArrayBuffer>|null = null;
    if (body.profileImage && body.profileImage.startsWith('data:image')) {
      const base64Data = body.profileImage.split(',')[1];
      profileImageBuffer = Buffer.from(base64Data, 'base64');
    }

    const carer = await prisma.carer.create({
      data: {
        name: body.name,
        email: body.email,
        gender: body.gender,
        profileImage: profileImageBuffer,
      },
    });

    // Convert profileImage Buffer to base64 string for JSON response
    const carerResponse = {
      ...carer,
      profileImage: carer.profileImage 
        ? `data:image/jpeg;base64,${Buffer.from(carer.profileImage).toString('base64')}`
        : null
    };

    return NextResponse.json(carerResponse, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating carer:", error);
    
    // Handle Prisma-specific errors
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "A carer with this email already exists" },
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
      { error: "An unexpected error occurred while creating carer. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: { OR?: Array<{ name?: { contains: string }; email?: { contains: string } }> } = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.carer.count({ where });

    // Fetch carers with pagination
    const carers = await prisma.carer.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    // Convert profileImage Buffer to base64 string for each carer
    const carersWithImages = carers.map(c => ({
      ...c,
      profileImage: c.profileImage 
        ? `data:image/jpeg;base64,${Buffer.from(c.profileImage).toString('base64')}`
        : null
    }));

    return NextResponse.json({
      carers: carersWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching carers:", error);
    
    // Handle database connection errors
    if (typeof error === 'object' && error !== null && 'code' in error && (error.code === 'P1001' || error.code === 'P1002')) {
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching carers. Please try again." },
      { status: 500 }
    );
  }
}
