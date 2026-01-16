import prisma from "./src/index.js";

async function makeUserAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: bun tsx make-admin.ts <email>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`✅ User "${email}" is already an admin.`);
      
      // Delete all sessions to force re-login
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });
      console.log(`🔄 Deleted all sessions for "${email}". Please login again.`);
      
      process.exit(0);
    }

    // Update to admin
    await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });

    // Delete all sessions to force re-login
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    console.log(`✅ User "${email}" is now an admin!`);
    console.log(`🔄 All sessions deleted. Please login again to see admin panel.`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();
