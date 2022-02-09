// 3rd party libraries
import * as admin from "firebase-admin";

export const fbApp = admin.initializeApp();
export const auth = admin.auth();
export const db = admin.firestore();
export const coinDB = db.collection("coin");
export const phoneDB = db.collection("phone");
