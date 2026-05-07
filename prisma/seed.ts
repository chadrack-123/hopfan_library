import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@hopfan.church" },
    update: {},
    create: {
      name: "Library Admin",
      email: "admin@hopfan.church",
      password: hashedPassword,
    },
  });

  console.log("Admin seeded:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
