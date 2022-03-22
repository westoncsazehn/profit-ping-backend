const { PAYPAL_HOME_URL = "", PAYPAL_PRODUCT_IMAGE_URL = "" } = process.env;

export const productData = {
  name: "Profit Ping Plus",
  description: "Full access to Profit Ping messaging functionality and tools.",
  type: "SERVICE",
  category: "SOFTWARE",
  image_url: PAYPAL_PRODUCT_IMAGE_URL,
  home_url: PAYPAL_HOME_URL,
};
export const getPlanData = (productID: string) => ({
  product_id: productID,
  name: "Profit Ping Plus plan",
  description: "Profit Ping Plus plan",
  status: "ACTIVE",
  billing_cycles: [
    {
      frequency: {
        interval_unit: "MONTH",
        interval_count: 1,
      },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: {
          value: "4.99",
          currency_code: "USD",
        },
      },
    },
  ],
  payment_preferences: {
    auto_bill_outstanding: true,
    setup_fee_failure_action: "CONTINUE",
    payment_failure_threshold: 2,
  },
  taxes: {
    percentage: "0",
    inclusive: true,
  },
});
