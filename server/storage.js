import { getDB } from "./db.js";
import { ObjectId } from "mongodb";

export async function createUser(user) {
  try {
    if (!user.id) throw new Error("User ID is required");

    const db = getDB();
    const usersCollection = db.collection("users");

    const userData = {
      _id: new ObjectId(),
      id: String(user.id),
      username: user.username,
      email: user.email || null,
      avatarUrl: user.avatarUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`[MongoDB] Creating user ${user.username} with GitHub ID ${user.id}`);

    const result = await usersCollection.insertOne(userData);

    console.log(`[MongoDB] User created successfully with _id: ${result.insertedId}`);
    return { id: result.insertedId, ...userData };
  } catch (error) {
    console.error("Error in createUser:", error.message);
    throw error;
  }
}

export async function getUserById(id) {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    console.log(`[MongoDB] Fetching user with GitHub ID ${id}`);

    const user = await usersCollection.findOne({ id: String(id) });

    if (user) {
      console.log(`[MongoDB] User found: ${user.username}`);
      return user;
    }

    console.log(`[MongoDB] User not found with GitHub ID ${id}`);
    return null;
  } catch (error) {
    console.error("Error in getUserById:", error.message);
    return null;
  }
}

export async function getUserByUsername(username) {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    console.log(`[MongoDB] Fetching user by username: ${username}`);

    const user = await usersCollection.findOne({ username: username });

    if (user) {
      console.log(`[MongoDB] User found: ${user.username}`);
      return user;
    }

    console.log(`[MongoDB] User not found with username ${username}`);
    return null;
  } catch (error) {
    console.error("Error in getUserByUsername:", error.message);
    return null;
  }
}

export async function deleteUserById(githubId) {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    console.log(`[MongoDB] Deleting user with GitHub ID ${githubId}`);

    const result = await usersCollection.deleteOne({ id: String(githubId) });

    if (result.deletedCount === 0) {
      console.log(`[MongoDB] User not found for deletion`);
      return { success: false };
    }

    console.log(`[MongoDB] User deleted successfully`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("Error in deleteUserById:", error.message);
    throw error;
  }
}

export async function updateUser(githubId, updates) {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    console.log(`[MongoDB] Updating user with GitHub ID ${githubId}`);

    const result = await usersCollection.updateOne(
      { id: String(githubId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      console.log(`[MongoDB] User not found for update`);
      return null;
    }

    const updatedUser = await usersCollection.findOne({ id: String(githubId) });
    console.log(`[MongoDB] User updated successfully`);
    return updatedUser;
  } catch (error) {
    console.error("Error in updateUser:", error.message);
    throw error;
  }
}