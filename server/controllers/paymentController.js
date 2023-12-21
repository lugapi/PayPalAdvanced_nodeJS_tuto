// paymentController.js
import fetch from "node-fetch";

// Constantes liées à PayPal
const PAYPAL = {
    BASE: process.env.PAYPAL_BASE,
    CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    CURRENCY: process.env.PAYPAL_CURRENCY,
};

const TOKEN_URL = `${PAYPAL.BASE}/v1/oauth2/token`;
const VAULT_URL = `${PAYPAL.BASE}/v3/vault/payment-tokens`;
const ORDER_URL = `${PAYPAL.BASE}/v2/checkout/orders`;
const CAPTURE_URL = (orderID) => `${PAYPAL.BASE}/v2/checkout/orders/${orderID}/capture`;

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
    try {
        if (!PAYPAL.CLIENT_ID || !PAYPAL.CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(`${PAYPAL.CLIENT_ID}:${PAYPAL.CLIENT_SECRET}`).toString("base64");

        const response = await fetch(TOKEN_URL, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to generate Access Token: ${data.error}`);
        }

        return data.access_token;
    } catch (error) {
        throw new Error(`Failed to generate Access Token: ${error.message}`);
    }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const getVaultFromCustomer = async (customerID) => {

    const accessToken = await generateAccessToken();
    const url = `${VAULT_URL}?customer_id=${customerID}`;

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
    const url = `${VAULT_URL}/` + cardId;

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
        handleError(res, error, "Failed to delete Vault");
    }
};


/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = CAPTURE_URL(orderID);

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
    const url = ORDER_URL;

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

const getOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${ORDER_URL}/${orderID}`;

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        method: "GET",
    });

    return handleResponse(response);
}



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

export {
    getVaultFromCustomer,
    deleteVaultFromCustomer,
    captureOrder,
    createOrder,
    getOrder
};