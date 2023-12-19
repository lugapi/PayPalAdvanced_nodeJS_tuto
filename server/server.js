import express from "express";
import fetch from "node-fetch";

import "dotenv/config";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_CURRENCY, PORT = 8885 } = process.env;
const base = "https://api-m.sandbox.paypal.com";
const app = express();

app.set("view engine", "ejs");
app.set("views", "./server/views");

// host static files
app.use(express.static("client"));

// parse post params sent in body in json format
app.use(express.json());

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
    ).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const getVaultFromCustomer = async (customerID) => {

  const accessToken = await generateAccessToken();
  const url = `${base}/v3/vault/payment-tokens?customer_id=` + customerID;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  });

  return handleResponse(response);
};

const deleteVaultFromCustomer = async (cardId) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v3/vault/payment-tokens/` + cardId;

  console.log('url', url);

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "DELETE",
  });

  try {
    const jsonResponse = await response.text();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    console.error("Error processing response:", err);
    throw new Error("Failed to process response.");
  }
};


/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });

  return handleResponse(response);
};

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};


const createOrder = async (content) => {
  console.log("content", content);

  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": getTimestamp(),
    },
    method: "POST",
    body: JSON.stringify(content),
  });

  return handleResponse(response);
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

app.post("/api/getPaymentTokens", async (req, res) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { customerID } = req.body;
    console.log("customerID", customerID);
    const { jsonResponse, httpStatusCode } = await getVaultFromCustomer(customerID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed getPaymentTokens:", error);
    res.status(500).json({ error: "Failed to getPaymentTokens." });
  }
});

app.post("/api/deleteVaultFromCustomer", async (req, res) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { cardId } = req.body;
    console.log("cardId", cardId);
    const { jsonResponse, httpStatusCode } = await deleteVaultFromCustomer(cardId);
    res.status(httpStatusCode).send(jsonResponse);  // Utilisez send() à la place de text()
  } catch (error) {
    console.error("Failed delete Vault:", error);
    res.status(500).json({ error: "Failed delete Vault." });
  }
});


app.post("/api/orders", async (req, res) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { cart, payload } = req.body;
    // console.log("payload", payload);
    const { jsonResponse, httpStatusCode } = await createOrder(payload);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});

// render checkout page with client id & unique client token
app.get("/", async (req, res) => {
  try {
    res.render("checkout", {
      clientId: PAYPAL_CLIENT_ID,
      envCurrency: PAYPAL_CURRENCY,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});
