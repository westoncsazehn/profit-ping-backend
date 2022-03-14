// local
import { Message } from "./types";
import {disableMessagingForCoins} from './index';

const { TWILIO_ACCOUNT_SID = "", TWILIO_AUTH_TOKEN = "" } = process.env;
export const sendTwilioMessage = async ({ uid, coinIDs, message }: Message) => {
  const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  try {
    const response = await client.messages.create(message);
    if (!response.errorMessage && !response.errorCode) {
      disableMessagingForCoins({ uid, coinIDs });
    }
  } catch (e) {
    console.log("e", e);
  }
};
