import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!auth) {
    throw new Error("Firebase auth is not configured.");
  }

  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!auth) {
    throw new Error("Firebase auth is not configured.");
  }

  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  if (!auth) {
    return;
  }

  await signOut(auth);
}
