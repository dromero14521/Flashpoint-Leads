import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/blueprints/[id] - Get single blueprint
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blueprint = await prisma.blueprint.findFirst({
      where: { id, userId: user.id },
    });

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    return NextResponse.json({ blueprint });
  } catch (error) {
    console.error("Error fetching blueprint:", error);
    return NextResponse.json({ error: "Failed to fetch blueprint" }, { status: 500 });
  }
}

// PATCH /api/blueprints/[id] - Update blueprint
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blueprint = await prisma.blueprint.updateMany({
      where: { id, userId: user.id },
      data: updates,
    });

    if (blueprint.count === 0) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating blueprint:", error);
    return NextResponse.json({ error: "Failed to update blueprint" }, { status: 500 });
  }
}

// DELETE /api/blueprints/[id] - Delete blueprint
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blueprint = await prisma.blueprint.deleteMany({
      where: { id, userId: user.id },
    });

    if (blueprint.count === 0) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blueprint:", error);
    return NextResponse.json({ error: "Failed to delete blueprint" }, { status: 500 });
  }
}
