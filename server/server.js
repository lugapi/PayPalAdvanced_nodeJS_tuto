// server.js
import express from "express";
import "dotenv/config";
import paymentRoutes from "./routes/paymentRoutes.js";

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CURRENCY,
  PORT,
} = process.env;

const app = express();

app.set("view engine", "ejs");
app.set("views", "./server/views");
app.use(express.static("client"));
app.use(express.json());

app.use("/api/", paymentRoutes);

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