// server/storage.js
import { db } from "./firebase.js";
import { collection, doc, setDoc, getDoc, query, where, getDocs, limit } from "firebase/firestore";

// Reference to the "users" collection
const usersCol = collection(db, "users");

// Create a new user
export async function createUser(user) {
  const docRef = doc(usersCol); // auto-generate ID
  await setDoc(docRef, user);
  return { id: docRef.id, ...user };
}

// Get user by ID
export async function getUserById(id) {
  const docRef = doc(usersCol, id);
  const userDoc = await getDoc(docRef);
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : undefined;
}

// Get user by username
export async function getUserByUsername(username) {
  const q = query(usersCol, where("username", "==", username), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return undefined;
  const docData = querySnapshot.docs[0];
  return { id: docData.id, ...docData.data() };
}
