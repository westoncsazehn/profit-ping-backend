// 3rd party libraries
import * as functions from "firebase-functions";
// local
import { getMessages, getProfitingCoinsList, sendMessages } from "./messaging";
import { auth, phoneDB, plansDB, productsDB, subscribersDB } from "./firebase";
import { CreatePlanDataType, CreateProductDataType } from "./paypal/types";
import { createPlan, createProduct, getAccessToken } from "./paypal/api";
import { Message, UserCoinMetricData } from "./messaging/types";
import { deleteUserCoins } from "./delete-user";

const { PAYPAL_PRODUCT_ID = "" } = process.env;

// CLOUD FUNCTION > Send Profit Ping Messages
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
// CLOUD FUNCTION > Delete All User Data
exports.deleteUser = functions.https.onCall(async (data, context) => {
  const { uid = "" } = data;
  try {
    await deleteUserCoins(uid);
    await phoneDB.doc(uid).delete();
    await subscribersDB.doc(uid).delete();
    await auth.deleteUser(uid);
    return { result: "success" };
  } catch (error) {
    return { errors: String(error) };
  }
});
// CLOUD FUNCTION > Paypal > Create Profit Ping Plus product
exports.createProduct = functions.https.onCall(async () => {
  try {
    const {
      data: { access_token: accessToken },
    }: any = await getAccessToken();
    const productID: string = `${PAYPAL_PRODUCT_ID}-${new Date().getMilliseconds()}`;
    if (!accessToken || !productID)
      throw new Error("Access key / product id not created");
    const { data }: CreateProductDataType = await createProduct(
      accessToken,
      productID
    );
    if (!data) throw new Error("No data from production creation found.");
    await productsDB.add({ ...data });
    const { id } = data;
    const { data: planData }: CreatePlanDataType = await createPlan(
      accessToken,
      id
    );
    await plansDB.add({ ...planData });
    return { result: "success" };
  } catch (error) {
    return { errors: String(error) };
  }
});
