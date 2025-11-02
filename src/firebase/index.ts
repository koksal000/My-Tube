import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";
import { useCollection } from "./firestore/use-collection";
import { useDoc } from "./firestore/use-doc";
import { useAuth as useFirebaseAuth, AuthProvider } from "./auth/use-user";
import { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from "./provider";
import { AuthCheck } from "./auth-check";

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  return { firebaseApp, auth, firestore };
}

export {
  initializeFirebase,
  FirebaseProvider,
  AuthProvider,
  useCollection,
  useDoc,
  useFirebaseAuth as useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
  AuthCheck,
};
