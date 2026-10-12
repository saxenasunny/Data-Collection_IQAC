import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@iqac.edu";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "adminpassword123";
  const adminName = process.env.ADMIN_DEFAULT_NAME || "IQAC Administrator";

  console.log("Checking Admin account initialization...");

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash: adminPassword,
        name: adminName,
      },
    });
    console.log(`Initial Admin account configured for: ${adminEmail}`);
  } else {
    console.log(`Admin account already exists for: ${adminEmail}`);
  }

  console.log("Database initialized cleanly without dummy records.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
