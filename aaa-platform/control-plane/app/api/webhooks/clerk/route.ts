/**
 * Clerk Webhook Handler
 * Automatically initializes user metadata when new users sign up
 */

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { initializeUserMetadata } from "@/lib/clerk";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  // Handle events
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id } = evt.data;

    try {
      // Initialize user metadata with defaults
      await initializeUserMetadata(id, {
        tier: "tier1", // All new users start on free tier
        tenantId: id, // Single-tenant by default (user ID = tenant ID)
      });

      console.log(`✅ Initialized metadata for new user: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to initialize metadata for user ${id}:`, error);
      // Don't fail the webhook - user can still use the app
    }
  }

  if (eventType === "user.updated") {
    console.log("User updated:", evt.data.id);
    // Handle user updates if needed
  }

  if (eventType === "user.deleted") {
    console.log("User deleted:", evt.data.id);
    // Handle user deletion (cleanup database records, etc.)
  }

  return NextResponse.json({ success: true });
}
