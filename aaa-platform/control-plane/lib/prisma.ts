/**
 * Legacy Prisma Client Export
 *
 * This file now re-exports from lib/db.ts for backwards compatibility.
 * New code should import from "@/lib/db" directly and use either:
 * - `prisma` for direct database access (admin/migrations only)
 * - `tenantDb` for tenant-aware operations (recommended)
 */

export { prisma, prisma as default } from "./db";
