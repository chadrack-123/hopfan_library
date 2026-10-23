import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const REQUIRED_ADMIN_ENV = ["ADMIN_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD"] as const;

function readAdminConfig() {
  const missing = REQUIRED_ADMIN_ENV.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required administrator environment variable(s): ${missing.join(", ")}. ` +
        "No database changes were made."
    );
  }

  const name = process.env.ADMIN_NAME!.trim();
  const email = process.env.ADMIN_EMAIL!.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD!;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address. No database changes were made.");
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters. No database changes were made.");
  }

  const normalizedPassword = password.trim().toLowerCase();
  if (
    normalizedPassword.startsWith("<") ||
    normalizedPassword.includes("replace-with") ||
    normalizedPassword.includes("change-me") ||
    normalizedPassword.includes("example-password")
  ) {
    throw new Error("ADMIN_PASSWORD is still a placeholder. No database changes were made.");
  }

  return { name, email, password };
}

async function main() {
  const { name, email, password } = readAdminConfig();
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  const prisma = new PrismaClient({ adapter });

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.upsert({
      where: { email },
      update: { name, password: hashedPassword },
      create: { name, email, password: hashedPassword },
    });

    console.log("Administrator seeded:", admin.email);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Administrator seed failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
