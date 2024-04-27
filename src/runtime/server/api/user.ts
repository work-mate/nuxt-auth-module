import {
  defineEventHandler,
} from "h3";
import { getAuthClient } from "../utils/client";

export default defineEventHandler(async (event) => {
  const result = await getAuthClient().getUserFromEvent(event);

  return {
    user: result.user
  }
});
