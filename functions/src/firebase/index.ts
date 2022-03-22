import admin = require("firebase-admin");

admin.initializeApp();
export const auth = admin.auth();
export const db = admin.firestore();
export const coinDB = db.collection("coin");
export const phoneDB = db.collection("phone");
export const productsDB = db.collection("products");
export const plansDB = db.collection("plans");