// paymentRoutes.js
import express from "express";
import {
    getVaultFromCustomer,
    getOrder,
    deleteVaultFromCustomer,
    captureOrder,
    createOrder
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/getPaymentTokens", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const {
            customerID
        } = req.body;
        console.log("customerID", customerID);
        const {
            jsonResponse,
            httpStatusCode
        } = await getVaultFromCustomer(customerID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed getPaymentTokens:", error);
        res.status(500).json({
            error: "Failed to getPaymentTokens."
        });
    }
});

router.post("/getOrder", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const {
            orderID
        } = req.body;
        console.log("orderID", orderID);
        const {
            jsonResponse,
            httpStatusCode
        } = await getOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed getOrder:", error);
        res.status(500).json({
            error: "Failed to getOrder."
        });
    }
});

router.post("/captureOrder", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const {
            orderID
        } = req.body;
        console.log("orderID", orderID);
        const {
            jsonResponse,
            httpStatusCode
        } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed captureOrder:", error);
        res.status(500).json({
            error: "Failed to captureOrder."
        });
    }
});

router.post("/deleteVaultFromCustomer", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const {
            cardId
        } = req.body;
        console.log("cardId", cardId);
        const {
            jsonResponse,
            httpStatusCode
        } = await deleteVaultFromCustomer(cardId);
        res.status(httpStatusCode).send(jsonResponse); // Utilisez send() à la place de text()
    } catch (error) {
        console.error("Failed delete Vault:", error);
        res.status(500).json({
            error: "Failed delete Vault."
        });
    }
});


router.post("/orders", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const {
            cart,
            payload
        } = req.body;
        // console.log("payload", payload);
        const {
            jsonResponse,
            httpStatusCode
        } = await createOrder(payload);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({
            error: "Failed to create order."
        });
    }
});

router.post("/orders/:orderID/capture", async (req, res) => {
    try {
        const {
            orderID
        } = req.params;
        const {
            jsonResponse,
            httpStatusCode
        } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({
            error: "Failed to capture order."
        });
    }
});

export default router;
