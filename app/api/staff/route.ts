import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create staff" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff);
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}
