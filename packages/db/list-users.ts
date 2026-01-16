import prisma from "./src/index.js";

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("❌ No users found in database.");
      console.log("\n📝 To create the first admin:");
      console.log("   Go to: http://localhost:3001/setup");
    } else {
      console.log(`\n✅ Found ${users.length} user(s):\n`);
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role:  ${user.role}`);
        console.log(`   ID:    ${user.id}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
