export default defineEventHandler(async (event) => {
  // Check if user is authenticated by looking for auth token in Authorization header
  const authToken = getHeader(event, 'authorization');
  console.log('Auth Token:', authToken);
  const isLoggedIn = !!authToken;

  // Generate random data
  const randomData = {
    temperature: Math.floor(Math.random() * 100) + 1, // 1-100 degrees
    meltingPoint: Math.floor(Math.random() * 1000) + 100, // 100-1100 degrees
    material: getRandomMaterial(),
    timestamp: new Date().toISOString(),
    experimentId: generateRandomId(),
    properties: {
      density: Number.parseFloat((Math.random() * 10 + 1).toFixed(2)), // 1.00-11.00
      viscosity: Math.floor(Math.random() * 500) + 50, // 50-550
      heatCapacity: Number.parseFloat((Math.random() * 5 + 0.5).toFixed(3)), // 0.500-5.500
    },
    measurements: Array.from({ length: 5 }, () => ({
      time: Math.floor(Math.random() * 3600), // 0-3600 seconds
      value: Number.parseFloat((Math.random() * 50 + 10).toFixed(1)), // 10.0-60.0
    })),
  };

  // Return response with auth status and random data
  return {
    success: true,
    isLoggedIn,
    authStatus: isLoggedIn ? 'authenticated' : 'guest',
    data: randomData,
    meta: {
      requestTime: new Date().toISOString(),
      endpoint: '/api/auth/melting',
      dataGenerated: true,
    },
  };
});

// Helper functions
function getRandomMaterial(): string {
  const materials = [
    'Aluminum',
    'Copper',
    'Iron',
    'Gold',
    'Silver',
    'Zinc',
    'Lead',
    'Tin',
    'Nickel',
    'Platinum',
  ];
  return materials[Math.floor(Math.random() * materials.length)];
}

function generateRandomId(): string {
  return 'EXP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
