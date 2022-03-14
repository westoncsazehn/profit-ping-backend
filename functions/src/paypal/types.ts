// 3rd party
import { AxiosResponse } from "axios";

export type AccessTokenType = AxiosResponse<{ access_token: string }>;
export type AxiosAccessTokenType = Promise<AccessTokenType>;
export type CreateProductDataType = {
  data: {
    id: string;
    name: string;
    description: string;
    create_time: string;
    links: { href: string; rel: string; method: string }[];
  };
};
