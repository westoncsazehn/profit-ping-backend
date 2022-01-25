const admin = require("firebase-admin");
const timestamp = require("firebase-admin/lib/firestore/index.js");

const projectId = "profit-ping-eaa93";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
admin.initializeApp({ projectId });
const db = admin.firestore();

const initialDate = timestamp.firestore.Timestamp.fromDate(
  new Date("01-02-2020")
);
const mockData = [
  {
    user: "westoncsazehn@gmail.com",
    initialInvestment: 2,
    initialDate,
    targetMultiplier: 3,
    coin: "bitcoin",
    initialPricePerCoin: 6985.47,
  },
  {
    user: "westoncsazehn@gmail.com",
    initialInvestment: 1,
    initialDate,
    targetMultiplier: 2,
    coin: "binancecoin",
    initialPricePerCoin: 13.03,
  },
  {
    user: "westoncsazehn@gmail.com",
    initialInvestment: 10,
    initialDate,
    targetMultiplier: 4,
    coin: "ethereum",
    initialPricePerCoin: 127.41,
  },
];

function addData() {
  try {
    mockData.map((item) => db.collection("coin").add(item));
    console.log("data added successfully");
  } catch (error) {
    console.log(error, "adding data failed");
  }
}

addData();
