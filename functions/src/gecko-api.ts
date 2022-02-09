// 3rd party libraries
import axios from "axios";

export const gecko = axios.create({
    baseURL: "https://api.coingecko.com/api/v3/",
    timeout: 10000,
    headers: { accept: "application/json" },
});