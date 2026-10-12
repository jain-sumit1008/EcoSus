import { createApp } from "./app.js";
import { connectDatabase, registerShutdown } from "./config/database.js";
import { env } from "./config/env.js";

async function start() {
  try {
    await connectDatabase();
    const app = createApp();
    const server = app.listen(env.port, () => {
      console.info(`EcoPulse API listening on port ${env.port}`);
    });
    registerShutdown(server);
  } catch (error) {
    console.error("Failed to start EcoPulse API. Check MongoDB connectivity and environment variables.");
    console.error(error.message);
    process.exit(1);
  }
}

start();
