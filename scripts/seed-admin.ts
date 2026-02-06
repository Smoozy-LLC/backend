import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@smoozy.app";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: "Admin",
      status: "active",
      isAdmin: true,
      isDeveloper: true,
      sttMinutesLimit: 10000,
      aiCreditsLimit: 1000,
    },
    create: {
      email,
      password: hashedPassword,
      name: "Admin",
      status: "active",
      isAdmin: true,
      isDeveloper: true,
      sttMinutesLimit: 10000,
      aiCreditsLimit: 1000,
    },
  });

  console.log("✅ Admin user created/updated:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
