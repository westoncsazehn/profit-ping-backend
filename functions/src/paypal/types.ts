// 3rd party
import { AxiosResponse } from "axios";

export type AccessTokenType = AxiosResponse<{ access_token: string }>;
export type AxiosAccessTokenType = Promise<AccessTokenType>;
type link = {
  href: string;
  rel: string;
  method: string;
};
export type CreateProductDataType = {
  data: {
    id: string;
    name: string;
    description: string;
    create_time: string;
    links: link[];
  };
};
export type CreatePlanDataType = {
  data: {
    id: string;
    product_id: string;
    name: string;
    status: string;
    description: string;
    usage_type: string;
    create_time: string;
    links: link[];
  };
};
