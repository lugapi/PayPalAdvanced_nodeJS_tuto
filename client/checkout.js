// CHECKOUT.JS
import { handleFlow, createOrderCallback, onApproveCallback, resultMessage } from './flowHandler.js';
import { createOrderExistingCard } from './orderHandler.js';

handleFlow("first_visit", false);

// Select the JSON to send based on configuration
// Check flow on Select
const saveCard = document.querySelector("#save");
const paymentFlow = document.querySelector("#paymentFlow");
const existingClient = document.querySelector(".existingClient");
const cardContainer = document.querySelector(".card_container");
const paymentCards = document.querySelector("#payment-cards");
const idCustomer = document.querySelector(".idClientToSelect");

paymentFlow.onchange = function () {
  existingClient.hidden = true;
  if (paymentFlow.value === "returning_customer") {
    existingClient.hidden = false;
    cardContainer.hidden = true;
    paymentCards.classList.remove("hidden");

    handleFlow("returning_customer", false);
  }
  if (paymentFlow.value === "first_visit") {
    cardContainer.hidden = false;
    paymentCards.classList.add("hidden");

    handleFlow("first_visit", false);
  }
};

// Check flow on Save card or not
saveCard.addEventListener("change", () => {
  if (saveCard.checked) {
    handleFlow("first_visit", true);
    if (paymentFlow.value === "returning_customer") {
      handleFlow("returning_customer", true, idCustomer.value);
    }
  } else {
    handleFlow("first_visit", false);
    console.log(editor.get());
  }
});

if (paymentFlow.value === "returning_customer" && saveCard.checked) {
  handleFlow("returning_customer", true);
}

const cardField = window.paypal.CardFields({
  createOrder: createOrderCallback,
  onApprove: onApproveCallback,
});

// Render each field after checking for eligibility
if (cardField.isEligible()) {
  const nameField = cardField.NameField();
  nameField.render("#card-name-field-container");

  const numberField = cardField.NumberField();
  numberField.render("#card-number-field-container");

  const cvvField = cardField.CVVField();
  cvvField.render("#card-cvv-field-container");

  const expiryField = cardField.ExpiryField();
  expiryField.render("#card-expiry-field-container");

  // Add click listener to submit button and call the submit function on the CardField component
  document
    .getElementById("card-field-submit-button")
    .addEventListener("click", () => {
      cardField.submit().catch((error) => {
        resultMessage(
          `Sorry, your transaction could not be processed...<br><br>${error}`
        );
      });
    });
} else {
  // Hides card fields if the merchant isn't eligible
  document.querySelector("#card-form").style = "display: none";
}

document.querySelector("#existingClientSubmit").onclick = function () {
  document.querySelector("#payment-cards").innerHTML = "... LOADING ...";
  const customerID = document.querySelector(".idClientToSelect").value;

  fetch("/api/getPaymentTokens", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerID: customerID,
    }),
  })
    .then((res) => res.json())
    .then((response) => {
      console.log(response);
      document.querySelector("#payment-cards").innerHTML = "";

      const paymentTokens = response.payment_tokens;
      const paymentCardsSection = document.querySelector("#payment-cards");

      // Create payment card element
      const cardForm = document.createElement("button");
      cardForm.classList.add(
        "bg-blue-500",
        "hover:bg-blue-700",
        "text-white",
        "font-bold",
        "py-2",
        "px-4",
        "mt-4"
      );
      cardForm.textContent = "Pay with a new card";
      cardForm.onclick = function () {
        if (document.querySelector(".card_container").hidden) {
          document.querySelector(".card_container").hidden = false;
          cardForm.textContent = "Hide card form";
        } else {
          document.querySelector(".card_container").hidden = true;
          cardForm.textContent = "Pay with a new card";
        }
      };

      if (response.name !== "RESOURCE_NOT_FOUND" && response.payment_tokens) {
        // Créez un seul élément h1 avant la boucle
        const cardTitle = document.createElement("h1");
        const cardsContainer = document.createElement("div");

        cardsContainer.classList.add(
          "flex",
          "flex-col",
          "flex-wrap",
          "justify-center",
          "gap-10"
        );
        cardTitle.classList.add("text-2xl", "font-semibold");
        cardTitle.textContent = "Select existing card";

        paymentCardsSection.appendChild(cardTitle);
        paymentCardsSection.appendChild(cardsContainer);

        // Create a card for each payment token
        paymentTokens.forEach((paymentToken) => {
          const cardInfo = paymentToken.payment_source.card;

          // CSS class for card color
          var cardColor = "";
          if (cardInfo.brand === "VISA") {
            cardColor = "bg-blue-500"; // VISA class
          } else if (cardInfo.brand === "MASTERCARD") {
            cardColor = "bg-red-500"; // MASTERCARD class
          } else {
            cardColor = "bg-green-500"; // AMEX class
          }

          const cardSection = document.createElement("div");
          cardSection.classList.add(
            "flex",
            "flex-col-reverse",
            "gap-2",
            "items-center"
          );

          const actionButton = document.createElement("div");
          actionButton.classList.add("flex", "justify-evenly", "gap-2");

          const cardElement = document.createElement("div");
          cardElement.classList.add(
            "w-96",
            "h-56",
            "rounded-xl",
            "relative",
            "text-white",
            "shadow-2xl",
            cardColor
          );

          // Add delete button to cardElement
          const selectButton = document.createElement("button");
          selectButton.textContent = "Use this card";
          selectButton.classList.add(
            "bg-blue-600",
            "hover:bg-blue-800",
            "text-white",
            "font-bold",
            "py-2",
            "px-4",
            "rounded-full"
          );

          //add onclick on cardElement
          selectButton.onclick = function () {
            createOrderExistingCard(paymentToken.id);
            cardElement.classList.add("bg-slate-400");
          };

          const deleteButton = document.createElement("button");
          deleteButton.textContent = "Delete this card";
          deleteButton.classList.add(
            "bg-red-600",
            "hover:bg-red-800",
            "text-white",
            "font-bold",
            "py-2",
            "px-4",
            "rounded-full"
          );

          // Handle click event on delete button
          deleteButton.addEventListener("click", function () {
            fetch("/api/deleteVaultFromCustomer", {
              method: "post",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cardId: paymentToken.id,
              }),
            })
              .then((res) => {
                if (res.ok) {
                  console.log("Card deleted !");
                  cardElement.remove();
                  selectButton.remove();
                  deleteButton.remove();
                } else {
                  console.error("Card deletion failed !");
                }
              })
              .catch((error) => {
                console.error("Error occurred while deleting card :", error);
              });
          });

          cardSection.appendChild(actionButton);
          actionButton.appendChild(selectButton);
          actionButton.appendChild(deleteButton);

          cardElement.innerHTML = `
          <div class="w-full px-8 absolute top-8">
              <div class="flex justify-between">
                  <div>
                      <p class="font-light">Name</p>
                      <p class="font-medium tracking-widest">${
                        cardInfo.name
                      }</p>
                  </div>
                  <div>
                      <p class="font-light">Brand</p>
                      <p class="font-medium tracking-widest">${
                        cardInfo.brand
                      }</p>
                  </div>
              </div>
              <div class="pt-1">
                  <p class="font-light">Card Number</p>
                  <p class="font-medium tracking-more-wider">${
                    "**** **** **** " + cardInfo.last_digits
                  }</p>
              </div>
              <div class="pt-6 pr-6">
                  <div class="flex justify-between">
                      <div>
                          <p class="font-light text-xs">Expiry</p>
                          <p class="font-medium tracking-wider text-sm">${
                            cardInfo.expiry
                          }</p>
                      </div>
                      <div>
                          <p class="font-light text-xs">CVV</p>
                          <p class="font-bold tracking-more-wider text-sm">···</p>
                      </div>
                  </div>
              </div>
          </div>
      `;

          // Add credit card to cards container
          cardSection.appendChild(cardElement);
          cardsContainer.appendChild(cardSection);
        });
      } else {
        paymentCardsSection.innerHTML =
          "<h1 class='text-2xl font-semibold'>No cards found</h1>";
      }

      // Add new card payment button
      paymentCardsSection.appendChild(cardForm);
    });
};

document.querySelector("#help-title").onclick = function () {
  document.querySelector(".helpContent").classList.toggle("hidden");
};
