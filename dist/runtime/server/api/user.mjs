import {
  defineEventHandler
} from "h3";
import { getAuthClient } from "../utils/client.mjs";
export default defineEventHandler(async (event) => {
  const result = await getAuthClient().getUserFromEvent(event);
  return {
    user: result.user
  };
});
