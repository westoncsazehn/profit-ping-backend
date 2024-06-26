export type CoinMetrics = {
  coin: string;
  name?: string;
  initialDate: Date;
  initialInvestment: number;
  initialPricePerCoin: number;
  targetMultiplier: number;
  user: string;
  isMessageEnabled: boolean;
  multiplier?: number;
  gain?: number;
  historyPrice?: number;
  currenPriceUSD?: number;
};
export type UserCoinMetricData = {
  user: string;
  coins: CoinMetrics[];
};
export type MessageData = {
  phoneNumber: string;
  coin: string;
};
export type Message = {
  uid: string;
  coinIDs: string[];
  message: {
    to: string;
    body: string;
    from: string;
  };
};
