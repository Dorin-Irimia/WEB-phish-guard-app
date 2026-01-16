import prisma from "./src/index.js";

async function clearAllSessions() {
  try {
    const result = await prisma.session.deleteMany({});
    console.log(`✅ Deleted ${result.count} session(s).`);
    console.log("\n🔄 All users need to login again.");
    console.log("   Go to: http://localhost:3001/login");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSessions();
