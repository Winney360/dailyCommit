import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "dailycommit";

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  if (cachedClient && cachedDb) {
    console.log("[MongoDB] Using cached connection");
    return cachedDb;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("[MongoDB] Connected successfully");

    cachedClient = client;
    cachedDb = client.db(DB_NAME);

    // Create indexes
    await createIndexes(cachedDb);

    return cachedDb;
  } catch (error) {
    console.error("[MongoDB] Connection error:", error.message);
    throw error;
  }
}

export function getDB() {
  if (!cachedDb) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return cachedDb;
}

async function createIndexes(db) {
  try {
    const usersCollection = db.collection("users");
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    console.log("[MongoDB] Indexes created");
  } catch (error) {
    console.error("[MongoDB] Index creation error:", error.message);
  }
}

export async function closeDB() {
  if (cachedClient) {
    await cachedClient.close();
    console.log("[MongoDB] Connection closed");
    cachedClient = null;
    cachedDb = null;
  }
}