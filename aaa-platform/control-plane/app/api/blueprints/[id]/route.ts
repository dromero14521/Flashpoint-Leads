import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { tenantDb, prisma } from "@/lib/db";

// GET /api/blueprints/[id] - Get single blueprint
export async function GET(
  _request: Request,
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

    // Use tenant-aware client - automatically filters by tenantId
    const blueprint = await tenantDb.blueprint.findFirst({
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

    // Use tenant-aware client for update with security check
    // First verify the blueprint exists and belongs to user
    const existing = await tenantDb.blueprint.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    // Update the blueprint (tenantId already verified)
    const blueprint = await tenantDb.blueprint.update({
      where: { id: existing.id },
      data: updates,
    });

    return NextResponse.json({ success: true, blueprint });
  } catch (error) {
    console.error("Error updating blueprint:", error);
    return NextResponse.json({ error: "Failed to update blueprint" }, { status: 500 });
  }
}

// DELETE /api/blueprints/[id] - Delete blueprint
export async function DELETE(
  _request: Request,
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

    // Use tenant-aware client for delete with security check
    // First verify the blueprint exists and belongs to user
    const existing = await tenantDb.blueprint.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    // Delete the blueprint (tenantId already verified)
    await tenantDb.blueprint.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blueprint:", error);
    return NextResponse.json({ error: "Failed to delete blueprint" }, { status: 500 });
  }
}
