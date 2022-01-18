// 3rd party libraries
import axios from "axios";
import { format } from "date-fns";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

type CoinMetrics = {
  coin: string;
  initialDate: Date;
  initialInvestment: number;
  targetMultiplier: number;
  user: string;
  multiplier?: number;
  gain?: number;
  historyPrice?: number;
  currenPriceUSD?: number;
};
type UserCoinMetricData = {
  user: string;
  coins: CoinMetrics[];
};
type DeviceTokenData = {
  deviceToken: string;
  user: string;
};
type MessageData = {
  deviceToken: string;
  coin: string;
};
type Message = { notification: { title: string; body: string }; token: string };

const gecko = axios.create({
  baseURL: "https://api.coingecko.com/api/v3/",
  timeout: 10000,
  headers: { accept: "application/json" },
});

const fbApp = admin.initializeApp();
const deviceTokenDB = admin.firestore().collection("deviceToken");
const fbMessaging = admin.messaging(fbApp);

export const messageProfitingCoinsToDevices = functions.pubsub
  .schedule("1 */12 * * *")
  .onRun(async () => {
    const profitingCoins: UserCoinMetricData[] = await getProfitingCoinsList();
    const messages: Message[] = await getMessages(profitingCoins);
    if (messages?.length) {
      await sendMessages(messages);
    }
    return null;
  });

// sendProfitingCoinMessages > getProfitingCoinsList
// get profiting coin documents and assign to array
const getProfitingCoinsList = async () => {
  // create list: each object/item has 1 user and their coins[]
  const coinDB = admin.firestore().collection("coin");
  const docsCollection = await coinDB.get();
  const profitingCoinsList: UserCoinMetricData[] = [];
  // for of: required for async/await
  for (const doc of docsCollection.docs) {
    await addToProfitingCoinsList(
      profitingCoinsList,
      doc.data() as CoinMetrics
    );
  }
  return await Promise.all(profitingCoinsList);
};
// getProfitingCoinData > addToProfitingCoinsList
const addToProfitingCoinsList = async (
  profitingCoinsList: UserCoinMetricData[],
  coinMetric: CoinMetrics
) => {
  const { initialDate, initialInvestment, coin, targetMultiplier, user } =
    coinMetric;
  if (initialDate && initialInvestment && coin && targetMultiplier && user) {
    const currentPriceUSD: number = await getCoinsCurrentPrice(
      coin,
      initialInvestment
    );
    const initialPrice: number = await getSingleCoinInitialPrice(
      coin,
      initialInvestment,
      // @ts-ignore
      initialDate.toDate()
    );
    const initialPriceUSD: number = initialPrice * initialInvestment;
    const multiTargetPriceUSD: number = initialPriceUSD * targetMultiplier;
    const userIndex: number = profitingCoinsList.findIndex(
      (item) => item.user === user
    );
    const isUserInList: boolean = userIndex > -1;
    const isProfitting: boolean = currentPriceUSD >= multiTargetPriceUSD;
    if (
      isProfitting &&
      isUserInList &&
      profitingCoinsList[userIndex] &&
      !profitingCoinsList[userIndex].coins.some((item) => item.coin === coin)
    ) {
      profitingCoinsList[userIndex].coins.push(coinMetric);
    } else if (isProfitting && !isUserInList) {
      profitingCoinsList.push({ ...{ user, coins: [coinMetric] } });
    }
  }
};
// addToProfitingCoinsList > getCoinsCurrentPrice
export const getCoinsCurrentPrice = async (
  coin: string,
  initialInvestment: number
): Promise<number> => {
  const params: URLSearchParams = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "100",
    page: "1",
    sparkline: "false",
  });
  if (coin) {
    params.append("ids", coin);
  }
  const { data }: { data: { current_price: number }[] } = await gecko.get(
    `coins/markets?${params.toString()}`
  );
  const currentPrice: number = (data && data[0] && data[0]?.current_price) || 0;
  if (currentPrice === 0) {
    throw new Error("No current_price available from gecko api.");
  }
  return Number(currentPrice) * initialInvestment;
};
// addToProfitingCoinsList > getSingleCoinInitialPrice
export const getSingleCoinInitialPrice = async (
  coin: string,
  initialInvestment: number,
  initialDate: Date
): Promise<number> => {
  const params: URLSearchParams = new URLSearchParams({
    date: format(initialDate, "dd-MM-yyyy"),
  });
  const history = await gecko.get(`coins/${coin}/history?${params.toString()}`);
  const historyPrice = history?.data?.market_data?.current_price?.usd || 0;
  if (historyPrice === 0) {
    throw new Error("No history price available from gecko api.");
  }
  return historyPrice;
};

// helloWorld > getMessages
const getMessages = async (
  profitingCoins: UserCoinMetricData[]
): Promise<Message[]> => {
  const messages: Message[] = [];
  for (const profitItem of profitingCoins) {
    const deviceToken = await getUserDeviceToken(profitItem.user);
    let coins: string = "";
    profitItem.coins.forEach((coin: CoinMetrics) => {
      if (!coins?.length) {
        coins = coin.coin;
      } else if (coins?.length) {
        coins += `, ${coin.coin}`;
      }
    });
    messages.push(buildMessage({ deviceToken, coin: coins }));
  }
  const allMessages = await Promise.all(messages);
  return allMessages;
};
// getMessages > getUserDeviceToken
const getUserDeviceToken = async (currentUser: string) => {
  let userDeviceToken: string = "";
  if (currentUser) {
    const deviceTokenDBSnapshot: any = deviceTokenDB
      .where("user", "==", currentUser)
      .get();
    const deviceTokenDocs = await deviceTokenDBSnapshot;
    let count = 0;
    deviceTokenDocs.forEach((doc: any) => {
      const { deviceToken = "", user = "" }: DeviceTokenData = doc.data();
      if (count < 1 && user === currentUser) {
        userDeviceToken = deviceToken;
      }
      count++;
    });
  }
  if (!userDeviceToken) {
    throw new Error(`No device token found for user: ${currentUser}.`);
  }
  return userDeviceToken;
};
// getMessages > buildMessage
const buildMessage = ({
  deviceToken: token = "",
  coin = "",
}: MessageData): Message => ({
  notification: {
    title: `Coins: ${coin}, multiplier hit!`,
    body: `A good time to take profits?`,
  },
  token,
});
// helloWorld > sendMessages
const sendMessages = (messages: Message[]) => {
  if (messages?.length) {
    fbMessaging
      .sendAll(messages)
      .then((response) => {
        console.log(response.successCount + " messages were sent successfully");
        console.log(response.failureCount + " messages failed to send");
      })
      .catch((e: any) => console.log);
  }
};
