import { Message } from "./types";
import { disableMessagingForCoins } from "./send-message";

const twilioAccountSID =
  process.env.TWILIO_ACCOUNT_SID || "";
const twilioAuthToken =
  process.env.TWILIO_AUTH_TOKEN || "";
const client = require("twilio")(twilioAccountSID, twilioAuthToken);
export const FROM_PHONE_NUMBER: string = "";

export const sendTwilioMessage = async ({ uid, coinIDs, message }: Message) => {
  try {
    const response = await client.messages.create(message);
    if (!response.errorMessage && !response.errorCode) {
      disableMessagingForCoins({ uid, coinIDs });
    }
    console.log("response", response);
  } catch (e) {
    console.log("e", e);
  }
};
