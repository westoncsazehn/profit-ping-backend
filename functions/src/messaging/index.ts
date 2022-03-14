// local
import { coinDB, phoneDB } from "../firebase";
import { gecko } from "../crypto-api";
import {
  CoinMetrics,
  Message,
  MessageData,
  UserCoinMetricData,
} from "../messaging/types";
import { sendTwilioMessage } from "../messaging/twilio";

const { FROM_PHONE_NUMBER = "" } = process.env;

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
    const { currentPrice, name } = await getCurrentCoinData(
      coin,
      initialInvestment
    );
    const initialPriceUSD: number = initialPricePerCoin * initialInvestment;
    const multiTargetPriceUSD: number = initialPriceUSD * targetMultiplier;
    const userIndex: number = profitingCoinsList.findIndex(
      (item) => item.user === user
    );
    const isUserInList: boolean = userIndex > -1;
    const isProfitting: boolean = currentPrice >= multiTargetPriceUSD;
    const profitCoinMetric = { name, ...coinMetric };
    if (
      isProfitting &&
      isUserInList &&
      profitingCoinsList[userIndex] &&
      !profitingCoinsList[userIndex].coins.some((item) => item.coin === coin)
    ) {
      profitingCoinsList[userIndex].coins.push(profitCoinMetric);
    } else if (isProfitting && !isUserInList) {
      profitingCoinsList.push({ ...{ user, coins: [profitCoinMetric] } });
    }
  }
};
// addToProfitingCoinsList > getCoinsCurrentPrice
const getCurrentCoinData = async (
  coin: string,
  initialInvestment: number
): Promise<{ currentPrice: number; name: string }> => {
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
  const { data }: { data: { current_price: number; name: string }[] } =
    await gecko.get(`coins/markets?${params.toString()}`);
  const currentPrice: number = (data && data[0] && data[0]?.current_price) || 0;
  if (currentPrice === 0) {
    throw new Error("No current_price available from gecko api.");
  }
  const name: string = String(data && data[0] && data[0]?.name);
  return { currentPrice: Number(currentPrice) * initialInvestment, name };
};
// messageProfitingCoinsToDevices > getMessages
export const getMessages = async (
  profitingCoins: UserCoinMetricData[]
): Promise<Message[]> => {
  const messages: Message[] = [];
  for (const profitItem of profitingCoins) {
    const phoneNumber: string = await getUserPhoneNumber(profitItem.user);
    if (phoneNumber) {
      let coins: string = "";
      let coinIDs: string[] = [];
      profitItem.coins.forEach((coin: CoinMetrics) => {
        const coinName = String(coin.name);
        if (!coins?.length) {
          coins = coinName;
        } else if (coins?.length) {
          coins += `, ${coinName}`;
        }
        coinIDs.push(coin.coin);
      });
      messages.push({
        uid: profitItem.user,
        coinIDs: coinIDs,
        message: buildMessage({ phoneNumber, coin: coins }),
      });
    }
  }
  const allMessages = await Promise.all(messages);
  return allMessages;
};
// getMessages > getUserPhoneNumber
const getUserPhoneNumber = async (uid: string): Promise<string> => {
  const phoneSnapshot = await phoneDB.doc(uid).get();
  if (phoneSnapshot.exists) {
    return String(phoneSnapshot?.data()?.phoneNumber);
  } else {
    return "";
  }
};
// getMessages > buildMessage
const buildMessage = ({
  phoneNumber,
  coin = "",
}: MessageData): Message["message"] => {
  const multiplier: string = `multiplier${coin.includes(",") ? "s" : ""}`;
  return {
    from: FROM_PHONE_NUMBER,
    body: `Profit Ping ${multiplier} hit for: ${coin}!`,
    to: phoneNumber,
  };
};
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
