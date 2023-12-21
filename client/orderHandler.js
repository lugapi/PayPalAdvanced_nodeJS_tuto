// orderHandler.js
import { handleFlow, createOrderCallback, showResponse } from './flowHandler.js';

export async function createOrderExistingCard(cardId) {
    console.log(cardId);
  
    document.getElementById("getOrderButton").classList.add("hidden");
    document.querySelector(".getOrderResponse").classList.add("hidden");
    document.querySelector(".captureResponse pre").innerHTML = "";
    document.querySelector(".captureResponse ").classList.add("hidden");
    document.querySelector(".threeDSResponse pre").innerHTML = "";
    document.querySelector(".threeDSResponse").classList.add("hidden");
    document.getElementById("captureOrderButton").classList.add("hidden");
  
    handleFlow("returning_customer", false, null, true, cardId);
  
    try {
      const orderID = await createOrderCallback(cardId);
      console.log(orderID);
    } catch (error) {
      console.error(error);
      resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`);
    }
  }
  
  export async function captureOrderAfter3DS(orderID) {
    const res = await fetch('api/captureOrder', {
      method: "post",
      body: JSON.stringify({
        orderID: orderID,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const orderData = await res.json();
    showResponse(document.querySelector('.captureResponse'), orderData);
  }
  