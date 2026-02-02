/**
 * Health Check Endpoint
 * Used by Docker, Railway, and load balancers to verify service health
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseHealth();
    
    // Check GenAI Core connection
    const genaiHealthy = await checkGenAICoreHealth();

    const isHealthy = dbHealthy && genaiHealthy;

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? "operational" : "down",
          genai_core: genaiHealthy ? "operational" : "down",
        },
        version: "2.0.0",
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error: any) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

/**
 * Check GenAI Core service connectivity
 */
async function checkGenAICoreHealth(): Promise<boolean> {
  try {
    const genaiCoreUrl = process.env.GENAI_CORE_URL || "http://localhost:8000";
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${genaiCoreUrl}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    return response.ok;
  } catch (error) {
    console.error("GenAI Core health check failed:", error);
    return false;
  }
}
