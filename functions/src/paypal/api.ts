// 3rd party
import axios from "axios";
// local
import { AxiosAccessTokenType } from "./types";
const {
  PAYPAL_API_URL = "",
  PAYPAL_CLIENT_ID = "",
  PAYPAL_SECRET = "",
  PAYPAL_TOKEN_PATH = "",
  PAYPAL_PRODUCTS_PATH = "",
  PAYPAL_PRODUCT_ID = "",
  PAYPAL_HOME_URL = "",
  PAYPAL_PRODUCT_IMAGE_URL = "",
} = process.env;

export const getAccessToken = (): AxiosAccessTokenType => {
  const accessTokenParams = new URLSearchParams();
  accessTokenParams.append("grant_type", "client_credentials");

  return axios({
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    auth: {
      username: PAYPAL_CLIENT_ID,
      password: PAYPAL_SECRET,
    },
    data: accessTokenParams,
    url: `${PAYPAL_API_URL}${PAYPAL_TOKEN_PATH}`,
  });
};

export const createProduct = (accessToken: string, productID: string) =>
  axios({
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": PAYPAL_PRODUCT_ID,
    },
    timeout: 10000,
    data: {
      name: "Profit Ping Plus",
      description:
        "Full access to Profit Ping messaging functionality and tools.",
      type: "SERVICE",
      category: "SOFTWARE",
      image_url: PAYPAL_PRODUCT_IMAGE_URL,
      home_url: PAYPAL_HOME_URL,
    },
    url: `${PAYPAL_API_URL}${PAYPAL_PRODUCTS_PATH}`,
  });
