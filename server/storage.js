// server/storage.js
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.FIREBASE_API_KEY;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function convertFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { integerValue: String(value) };
  if (typeof value === "boolean") return { booleanValue: value };
  return { stringValue: String(value) };
}

function extractFirestoreData(fields) {
  if (!fields) return {};
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue) result[key] = value.stringValue;
    else if (value.integerValue) result[key] = parseInt(value.integerValue);
    else if (value.booleanValue) result[key] = value.booleanValue;
    else if (value.nullValue) result[key] = null;
    else result[key] = value;
  }
  return result;
}

// Create a new user
export async function createUser(user) {
  try {
    if (!user.id) throw new Error("User ID is required");
    
    const fields = {};
    for (const [key, value] of Object.entries(user)) {
      fields[key] = convertFirestoreValue(value);
    }
    
    const docId = String(user.id);
    const url = `${BASE_URL}/users/${docId}?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    
    if (!response.ok) throw new Error(`Failed to create user: ${response.statusText}`);
    return { id: docId, ...user };
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(id) {
  try {
    const docId = String(id);
    const url = `${BASE_URL}/users/${docId}?key=${API_KEY}`;
    
    const response = await fetch(url);
    if (response.ok) {
      const doc = await response.json();
      return { id: doc.name.split("/").pop(), ...extractFirestoreData(doc.fields) };
    }
    
    // Fallback: query by "id" field
    const queryUrl = `${BASE_URL}:runQuery?key=${API_KEY}`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "id" },
            op: "EQUAL",
            value: convertFirestoreValue(id),
          },
        },
      },
    };
    
    const queryResponse = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryBody),
    });
    
    if (!queryResponse.ok) return null;
    
    const results = await queryResponse.json();
    if (results.length === 0) return null;
    
    const firstDoc = results[0].document;
    return { id: firstDoc.name.split("/").pop(), ...extractFirestoreData(firstDoc.fields) };
  } catch (error) {
    console.error("Error in getUserById:", error);
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username) {
  try {
    const queryUrl = `${BASE_URL}:runQuery?key=${API_KEY}`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "username" },
            op: "EQUAL",
            value: convertFirestoreValue(username),
          },
        },
      },
    };
    
    const response = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryBody),
    });
    
    if (!response.ok) return null;
    
    const results = await response.json();
    if (results.length === 0) return null;
    
    const firstDoc = results[0].document;
    return { id: firstDoc.name.split("/").pop(), ...extractFirestoreData(firstDoc.fields) };
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    return null;
  }
}

// Delete user by ID
export async function deleteUserById(githubId) {
  try {
    console.log(`[DELETE] Starting deletion for GitHub ID: ${githubId}`);
    
    const docId = String(githubId);
    
    // Try direct delete first
    const url = `${BASE_URL}/users/${docId}?key=${API_KEY}`;
    
    console.log(`[DELETE] Attempting direct document deletion...`);
    const response = await fetch(url, { method: "DELETE" });
    
    if (response.ok) {
      console.log(`[DELETE] Document deleted successfully via direct ID`);
      return { success: true };
    }
    
    console.log(`[DELETE] Direct deletion failed, attempting query-based deletion...`);
    
    // Query by "id" field and delete
    const user = await getUserById(githubId);
    if (!user) {
      console.log(`[DELETE] User not found with ID: ${githubId} - treating as already deleted`);
      return { success: true, message: "User already deleted or does not exist" };
    }
    
    console.log(`[DELETE] Found user document, deleting...`);
    const deleteUrl = `${BASE_URL}/users/${user.id}?key=${API_KEY}`;
    const deleteResponse = await fetch(deleteUrl, { method: "DELETE" });
    
    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete document: ${deleteResponse.statusText}`);
    }
    
    console.log(`[DELETE] Document deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error("[DELETE] Error deleting user:", error);
    throw error;
  }
}