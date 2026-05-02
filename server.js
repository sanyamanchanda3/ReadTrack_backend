require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/config/database");

// Start server function
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log("MongoDB connected");

    // Use Render's port or fallback
    const PORT = process.env.PORT || 5000;

    // Start server
    app.listen(PORT, () => {
      console.log(` ReadTrack API running on port ${PORT}`);
    });

  } catch (error) {
    console.error(" Failed to start server:", error.message);
    process.exit(1);
  }
}

// Run server
startServer();