import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/user - Get current user data
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { settings: true },
    });

    // Create user if doesn't exist
    if (!user && clerkUser) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          referralCode: generateReferralCode(),
          settings: {
            create: {},
          },
        },
        include: { settings: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get usage stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const blueprintCount = await prisma.blueprint.count({
      where: { userId: user.id },
    });

    const blueprintsThisMonth = await prisma.blueprint.count({
      where: {
        userId: user.id,
        createdAt: { gte: thisMonth },
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        blueprintCount,
        blueprintsThisMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PATCH /api/user - Update user settings
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Separate user updates from settings updates
    const { settings, ...userUpdates } = updates;

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdates,
      });
    }

    if (settings) {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...settings },
        update: settings,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
