// 3rd party
import axios, { AxiosRequestConfig } from "axios";
// local
import { AxiosAccessTokenType } from "./types";
import { getPlanData, productData } from "./data";

const {
  PAYPAL_API_URL = "",
  PAYPAL_CLIENT_ID = "",
  PAYPAL_SECRET = "",
  PAYPAL_TOKEN_PATH = "",
  PAYPAL_PLANS_PATH = "",
  PAYPAL_PRODUCTS_PATH = "",
  PAYPAL_PRODUCT_ID = "",
} = process.env;
const createAxiosPostRequest = (
  accessToken: string,
  url: string,
  data: any
): AxiosRequestConfig<any> => ({
  method: "POST",
  timeout: 10000,
  url,
  headers: {
    "content-type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "PayPal-Request-Id": PAYPAL_PRODUCT_ID,
  },
  data,
});

export const createProduct = (accessToken: string, productID: string) =>
  axios(
    createAxiosPostRequest(
      accessToken,
      `${PAYPAL_API_URL}${PAYPAL_PRODUCTS_PATH}`,
      productData
    )
  );
export const createPlan = (accessToken: string, productID: string) =>
  axios(
    createAxiosPostRequest(
      accessToken,
      `${PAYPAL_API_URL}${PAYPAL_PLANS_PATH}`,
      getPlanData(productID)
    )
  );
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
