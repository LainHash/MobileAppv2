import axios from "axios";
import { Result } from "../types/Result";
import { Home } from "../types/Home";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchHomeData(): Promise<Result<Home>> {
  const res = await axios.get<Result<Home>>(`${BASE_URL}/api/home`);
  return res.data;
}
