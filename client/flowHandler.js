// flowHandler.js

import { captureOrderAfter3DS } from "./orderHandler.js";

// Function to handle different flows
export function handleFlow(flow, saveCard, customerID, existingCard, cardId) {
  console.log("handleFlow", flow, saveCard, customerID, existingCard, cardId);
  if (flow === "first_visit") {
    if (saveCard) {
      setJSONData(jsonVaultFirstVisit);
    } else {
      setJSONData(json);
    }
  } else if (flow === "returning_customer") {
    if (saveCard) {
      const modifiedJson = { ...jsonVaultFirstVisit }; // Copy the original JSON

      if (customerID !== null) {
        // Ensure nested properties are initialized
        modifiedJson.payment_source = modifiedJson.payment_source || {};
        modifiedJson.payment_source.card =
          modifiedJson.payment_source.card || {};
        modifiedJson.payment_source.card.attributes =
          modifiedJson.payment_source.card.attributes || {};
        modifiedJson.payment_source.card.attributes.customer =
          modifiedJson.payment_source.card.attributes.customer || {};

        modifiedJson.payment_source.card.attributes.customer.id = customerID;
      }
      setJSONData(modifiedJson);
    } else {
      if (existingCard) {
        // JSON for clicking on a saved card
        const jsonClickOnSavedCard = {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: "d9f80740-38f0-11e8-b467-0ed5f89f718b",
              amount: {
                currency_code: "USD",
                value: "100.00",
              },
            },
          ],
          payment_source: {
            card: {
              vault_id: cardId,
            },
          },
          application_context: {
            stored_payment_source: {
              payment_initiator: "CUSTOMER",
              payment_type: "UNSCHEDULED",
              usage: "SUBSEQUENT",
            },
            cancel_url: "https://integration.lugapi.fr/display-request-details",
            return_url: "https://integration.lugapi.fr/display-request-details",
          },
        };
        setJSONData(jsonClickOnSavedCard);
      } else {
        // JSON for returning customer without saving a new card
        setJSONData(json);
      }
    }
  } else {
    // Handle other flows as needed
  }
}

export async function createOrderCallback() {
  showResponse(document.querySelector(".orderRequest"), editor.get());

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // use the "body" param to optionally pass additional order information
      // like product ids and quantities
      body: JSON.stringify({
        payload: editor.get(),
        cart: [
          {
            id: "YOUR_PRODUCT_ID",
            quantity: "YOUR_PRODUCT_QUANTITY",
          },
        ],
      }),
    });

    const orderData = await response.json();

    // check if orderData.links[1] & orderData.links[1].rel exists & is a "payer-action"
    if (orderData.links[1] && orderData.links[1].rel === "payer-action") {
      // get the url from orderData.links[1].href
      var url = orderData.links[1].href;

      // open the url in a new window
      var modal = window.open(url, "ModalWindowName", "width=600,height=400");

      if (modal) {
        // Modal window opened
        document.getElementById("getOrderButton").classList.remove("hidden");
        document.getElementById("getOrderButton").onclick = function () {
          fetch("/api/getOrder", {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderID: orderData.id,
            }),
          })
            .then((res) => res.json())
            .then((orderData) => {
              console.log("getOrderData", orderData);
              showResponse(
                document.querySelector(".getOrderResponse"),
                orderData
              );
              document
                .getElementById("captureOrderButton")
                .classList.remove("hidden");
            });
        };
      } else {
        // Modal window blocked
        alert(
          "Please allow popups for this website in order to complete the payment"
        );
      }

      document.getElementById("captureOrderButton").onclick = function () {
        captureOrderAfter3DS(orderData.id);
      };
    }

    if (orderData.id) {
      showResponse(document.querySelector(".orderResponse"), orderData);

      return orderData.id;
    } else {
      const errorDetail = orderData?.details?.[0];
      const errorMessage = errorDetail
        ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
        : JSON.stringify(orderData);

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(error);
    resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`);
  }
}

export async function onApproveCallback(data, actions) {
  try {
    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const orderData = await response.json();
    // Three cases to handle:
    //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
    //   (2) Other non-recoverable errors -> Show a failure message
    //   (3) Successful transaction -> Show confirmation or thank you message

    const transaction =
      orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
      orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
    const errorDetail = orderData?.details?.[0];

    // this actions.restart() behavior only applies to the Buttons component
    if (errorDetail?.issue === "INSTRUMENT_DECLINED" && !data.card && actions) {
      // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
      // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
      return actions.restart();
    } else if (
      errorDetail ||
      !transaction ||
      transaction.status === "DECLINED"
    ) {
      // (2) Other non-recoverable errors -> Show a failure message
      let errorMessage;
      if (transaction) {
        errorMessage = `Transaction ${transaction.status}: ${transaction.id}`;
      } else if (errorDetail) {
        errorMessage = `${errorDetail.description} (${orderData.debug_id})`;
      } else {
        errorMessage = JSON.stringify(orderData);
      }

      throw new Error(errorMessage);
    } else {
      // (3) Successful transaction -> Show confirmation or thank you message
      // Or go to another URL:  actions.redirect('thank_you.html');
      resultMessage(
        `Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`
      );
      console.log(
        "Capture result",
        orderData,
        JSON.stringify(orderData, null, 2)
      );
      showResponse(document.querySelector(".captureResponse"), orderData);
    }
  } catch (error) {
    console.error(error);
    resultMessage(
      `Sorry, your transaction could not be processed...<br><br>${error}`
    );
  }
}

export function showResponse(container, data) {
  container.querySelector("pre").innerHTML = prettyPrintObject(data);
  container.classList.remove("hidden");
}

// Example function to show a result to the user. Your site's UI library can be used instead.
export function resultMessage(message) {
  const container = document.querySelector("#result-message");
  container.innerHTML = message;
}
