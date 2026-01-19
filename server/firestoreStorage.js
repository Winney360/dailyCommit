// server/firestoreStorage.js
import { db } from "./firebase.js";
import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";

// Firestore collection
const usersCol = collection(db, "users");

export async function getUser(id) {
  const userDoc = await getDoc(doc(usersCol, id));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : undefined;
}

export async function getUserByUsername(username) {
  const q = query(usersCol, where("username", "==", username));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return undefined;
  const docData = querySnapshot.docs[0];
  return { id: docData.id, ...docData.data() };
}

export async function createUser(user) {
  // let Firebase generate a document ID
  const docRef = doc(usersCol); 
  await setDoc(docRef, user);
  return { id: docRef.id, ...user };
}
