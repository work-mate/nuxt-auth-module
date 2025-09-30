export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // Extract email_address and password from request body
  const { email_address, password } = body;
  
  // Check if required fields are provided
  if (!email_address || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email address and password are required'
    });
  }
  
  // Validate credentials against expected values
  const validEmail = "david6@email.com";
  const validPassword = "password";
  
  if (email_address === validEmail && password === validPassword) {
    // Successful login - return token
    return {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYXZpZDZAZW1haWwuY29tIiwiaWF0IjoxNjM5NTg0MDAwLCJleHAiOjE2Mzk2NzA0MDB9.sample_jwt_token",
      refresh_token: "refresh_token_sample_12345"
    };
  } else {
    // Invalid credentials
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email address or password'
    });
  }
});