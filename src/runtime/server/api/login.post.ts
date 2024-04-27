import { defineEventHandler, sendRedirect, getQuery, readBody, setResponseStatus } from 'h3'
import { SupportedAuthProvider, type ErrorResponse } from '../../models';
import { getAuthClient } from '../utils/client';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const provider = body.provider;

  if(!provider) {
    setResponseStatus(event, 400);
    const error = {
      message: "provider is required",
      data: {
        provider: ["provider is required"]
      }
    } satisfies ErrorResponse

    return error;
  }

  const authClient = getAuthClient();
  const authProvider = authClient.provider(provider);
  // const authProvider = authClient.local();

  if(!authProvider) {
    return authProvider;
  }

  try {
    authProvider.validateRequestBody(body);
  } catch(e: any) {
    setResponseStatus(event, 400);
    return e;
  }

  // if(provider == SupportedAuthProvider.LOCAL) {
  //   authProvider = authClient.local();
  // }



  return {
    body
  }
})
