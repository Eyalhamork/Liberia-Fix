const crypto = require("crypto");

const SUBSCRIPTION_KEY = "b97b829568ae45278bf80c5dd15150b5"; // Your key
const API_USER = crypto.randomUUID();

console.log("Generated API User ID:", API_USER);

// Step 1: Create API User
async function createApiUser() {
  const response = await fetch(
    "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Reference-Id": API_USER,
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      },
      body: JSON.stringify({
        providerCallbackHost: "https://yourdomain.com",
      }),
    }
  );

  if (response.status === 201) {
    console.log("✅ API User created successfully!");
    return true;
  } else {
    console.error("❌ Failed to create API User:", await response.text());
    return false;
  }
}

// Step 2: Create API Key
async function createApiKey() {
  const response = await fetch(
    `https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${API_USER}/apikey`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log("✅ API Key created successfully!");
    console.log("\n=== Your MTN MoMo Credentials ===");
    console.log("MTN_MOMO_API_USER:", API_USER);
    console.log("MTN_MOMO_API_KEY:", data.apiKey);
    console.log("MTN_MOMO_SUBSCRIPTION_KEY:", SUBSCRIPTION_KEY);
  } else {
    console.error("❌ Failed to create API Key:", await response.text());
  }
}

// Run both steps
async function setup() {
  const userCreated = await createApiUser();
  if (userCreated) {
    // Wait 2 seconds before creating key
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await createApiKey();
  }
}

setup();
