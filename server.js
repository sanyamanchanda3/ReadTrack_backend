require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/config/database");
const { env } = require("./src/config/env");

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(`ReadTrack API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
