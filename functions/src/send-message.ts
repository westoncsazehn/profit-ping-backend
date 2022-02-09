// local
import { UserCoinMetricData, CoinMetrics, Message, MessageData } from "./types";
import { gecko } from "./gecko-api";
import { coinDB, phoneDB } from "./firebase-util";
import { FROM_PHONE_NUMBER, sendTwilioMessage } from "./twilio";

// sendProfitingCoinMessages > getProfitingCoinsList
// get profiting coin documents and assign to array
export const getProfitingCoinsList = async () => {
  // create list: each object/item has 1 user and their coins[]
  const docsCollection = await coinDB
    .where("isMessageEnabled", "==", true)
    .get();
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
  const {
    initialDate,
    initialInvestment,
    coin,
    targetMultiplier,
    user,
    initialPricePerCoin,
    isMessageEnabled,
  } = coinMetric;
  if (
    initialDate &&
    initialInvestment &&
    coin &&
    targetMultiplier &&
    user &&
    initialPricePerCoin &&
    isMessageEnabled
  ) {
    const currentPriceUSD: number = await getCoinsCurrentPrice(
      coin,
      initialInvestment
    );
    const initialPriceUSD: number = initialPricePerCoin * initialInvestment;
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
// messageProfitingCoinsToDevices > getMessages
export const getMessages = async (
  profitingCoins: UserCoinMetricData[]
): Promise<Message[]> => {
  const messages: Message[] = [];
  for (const profitItem of profitingCoins) {
    const phoneNumber: number = await getUserPhoneNumber(profitItem.user);
    if (phoneNumber > 0) {
      let coins: string = "";
      let coinIDs: string[] = [];
      profitItem.coins.forEach((coin: CoinMetrics) => {
        if (!coins?.length) {
          coins = coin.coin;
        } else if (coins?.length) {
          coins += `, ${coin.coin}`;
        }
        coinIDs.push(coin.coin);
      });
      messages.push({
        uid: profitItem.user,
        coinIDs: coinIDs,
        message: buildMessage({ phoneNumber: `+1${phoneNumber}`, coin: coins }),
      });
    }
  }
  const allMessages = await Promise.all(messages);
  return allMessages;
};
// getMessages > getUserPhoneNumber
const getUserPhoneNumber = async (uid: string): Promise<number> => {
  const phoneSnapshot = await phoneDB.doc(uid).get();
  if (phoneSnapshot.exists) {
    return Number(phoneSnapshot?.data()?.phoneNumber);
  } else {
    return 0;
  }
};
// getMessages > buildMessage
const buildMessage = ({
  phoneNumber,
  coin = "",
}: MessageData): Message["message"] => ({
  from: FROM_PHONE_NUMBER,
  body: `Profit Ping | Your coins: ${coin}, multiplier hit!`,
  to: phoneNumber,
});
// messageProfitingCoinsToDevices > sendMessages
export const sendMessages = async (messages: Message[]) => {
  if (messages?.length) {
    for (const message of messages) {
      await sendTwilioMessage(message);
    }
  }
};
// sendTwilioMessage > disableMessageEnabled
export const disableMessagingForCoins = async ({
  uid,
  coinIDs,
}: {
  uid: string;
  coinIDs: string[];
}) => {
  try {
    for (const id of coinIDs) {
      const coinSnapshot = await coinDB
        .where("user", "==", uid)
        .where("coin", "==", id)
        .limit(1)
        .get();
      if (coinSnapshot.size > 0) {
        const coinDocRef = coinSnapshot.docs[0].ref;
        await coinDocRef.update({ isMessageEnabled: false });
      }
    }
  } catch (e) {
    console.log("e", e);
  }
};
