export default defineEventHandler(async (event) => {
  // In a real app, you'd extract and validate the JWT token from headers
  // const token = getCookie(event, 'auth:token') || getHeader(event, 'authorization');
  
  // Mock user data - in production, you'd fetch this from your database
  const userData = {
    id: 1,
    email: "david6@email.com",
    name: "David Oyinbo",
    firstName: "David",
    lastName: "Oyinbo",
    avatar: "https://avatars.githubusercontent.com/u/12345?v=4",
    role: "admin",
    permissions: ["read", "write", "delete"],
    createdAt: "2023-01-15T10:30:00Z",
    lastLoginAt: "2024-09-30T15:45:00Z",
    isEmailVerified: true,
    preferences: {
      theme: "dark",
      language: "en",
      notifications: true
    }
  };

  return {
    user: userData
  };
});