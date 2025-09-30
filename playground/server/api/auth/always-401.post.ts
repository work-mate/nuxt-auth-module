export default defineEventHandler(async (event) => {
  // Always throw a 401 Unauthorized error regardless of request
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized - This endpoint always returns 401 for testing purposes'
  });
});
