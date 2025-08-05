const { db, admin } = require("./firebase");

const connectDB = async () => {
  try {
    // Test Firestore connection
    await db.collection('_health').doc('test').set({
      timestamp: new Date(),
      status: 'connected'
    });

    console.log(`✅ Firestore Connected: ${process.env.FIREBASE_PROJECT_ID}`);

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Firestore connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Firestore connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;