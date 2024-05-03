import {
  defineEventHandler,
} from "h3";
import { getAuthClient } from "../utils/client";

export default defineEventHandler(async (event) => {
  const response = await getAuthClient().logoutFromEvent(event);

  return response;
});
