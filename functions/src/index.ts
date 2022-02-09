// 3rd party libraries
import * as functions from "firebase-functions";
// local
import { auth, phoneDB } from "./firebase-util";
import { Message, UserCoinMetricData } from "./types";
import {
  getMessages,
  sendMessages,
  getProfitingCoinsList,
} from "./send-message";
import { deleteUserCoins } from "./delete-user";

export const messageProfitingCoinsToDevices = functions.pubsub
  .schedule("1 */12 * * *")
  .onRun(
    // export const messageProfitingCoinsToDevices = functions.https.onCall(
    async () => {
      const profitingCoins: UserCoinMetricData[] =
        await getProfitingCoinsList();
      const messages: Message[] = await getMessages(profitingCoins);
      if (messages?.length) {
        await sendMessages(messages);
      }
      return null;
    }
  );

exports.deleteUser = functions.https.onCall(async (data, context) => {
  const { uid = "" } = data;
  try {
    await deleteUserCoins(uid);
    await phoneDB.doc(uid).delete();
    await auth.deleteUser(uid);
    return { result: "success" };
  } catch (error) {
    return { errors: String(error) };
  }
});
