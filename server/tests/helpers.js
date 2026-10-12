import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { seedDemoData } from "../scripts/seedDemoData.js";

let mongo;

export async function setupTestApp() {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.AUTH_SECRET = "test-auth-secret-please-change";
  process.env.DEMO_MODE = "true";
  await mongoose.connect(process.env.MONGODB_URI);
  await seedDemoData();
  return createApp();
}

export async function teardownTestApp() {
  await mongoose.disconnect();
  await mongo?.stop();
}
