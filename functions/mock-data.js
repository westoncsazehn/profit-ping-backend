const admin = require("firebase-admin");
const timestamp = require("firebase-admin/lib/firestore/index.js");

const projectId = "profit-ping-eaa93";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
admin.initializeApp({ projectId });
const db = admin.firestore();

const initialDate = timestamp.firestore.Timestamp.fromDate(
  new Date("01-02-2020")
);
const uid = "ooo";
const coinMockData = [
  {
    user: uid,
    initialInvestment: 2,
    initialDate,
    targetMultiplier: 3,
    coin: "bitcoin",
    initialPricePerCoin: 6985.47,
    isMessageEnabled: true,
  },
  {
    user: uid,
    initialInvestment: 1,
    initialDate,
    targetMultiplier: 2,
    coin: "binancecoin",
    initialPricePerCoin: 13.03,
    isMessageEnabled: true,
  },
  {
    user: uid,
    initialInvestment: 10,
    initialDate,
    targetMultiplier: 4,
    coin: "ethereum",
    initialPricePerCoin: 127.41,
  },
];
const phoneMockData = { phoneNumber: 1234567890 };

function addMockData() {
  try {
    coinMockData.map((item) => db.collection("coin").add(item));
    db.collection("phone").doc(uid).set(phoneMockData);
    console.log("data added successfully");
  } catch (error) {
    console.log(error, "adding data failed");
  }
}

addMockData();
