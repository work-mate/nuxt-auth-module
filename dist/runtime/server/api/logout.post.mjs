import {
  defineEventHandler
} from "h3";
import { getAuthClient } from "../utils/client.mjs";
export default defineEventHandler(async (event) => {
  const response = await getAuthClient().logoutFromEvent(event);
  return response;
});
