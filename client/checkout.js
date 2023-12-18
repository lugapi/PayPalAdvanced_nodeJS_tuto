



handleFlow("first_visit", false);

// Select the JSON to send based on configuration
// Check flow on Select
const saveCard = document.querySelector('#save')
const paymentFlow = document.querySelector('#paymentFlow');
const existingClient = document.querySelector('.existingClient');
const cardContainer = document.querySelector('.card_container');
const paymentCards = document.querySelector('#payment-cards');

paymentFlow.onchange = function() {
  existingClient.hidden = true;
  if (paymentFlow.value === "returning_customer") {
    existingClient.hidden = false;
    cardContainer.hidden = true;
    paymentCards.classList.remove('hidden')
    
    handleFlow("returning_customer", false);
  }
  if (paymentFlow.value === "first_visit") {
    cardContainer.hidden = false;
    paymentCards.classList.add('hidden')

    handleFlow("first_visit", false);
  }
};

// Check flow on Save card or not
saveCard.addEventListener('change', () => {
  if(saveCard.checked){
    handleFlow("first_visit", true);
  }else{
    handleFlow("first_visit", false);
    console.log(editor.get())
  }
})








async function createOrderCallback() {
  document.querySelector('.orderRequest pre').innerHTML = prettyPrintObject(editor.get());
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // use the "body" param to optionally pass additional order information
      // like product ids and quantities
      body: JSON.stringify({
        payload : editor.get(),
        cart: [
          {
            id: "YOUR_PRODUCT_ID",
            quantity: "YOUR_PRODUCT_QUANTITY",
          },
        ],
      }),
    });

    const orderData = await response.json();

    if (orderData.id) {
      document.querySelector('.orderResponse pre').innerHTML = prettyPrintObject(orderData);

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

async function onApproveCallback(data, actions) {
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
      document.querySelector('.captureResponse pre').innerHTML = prettyPrintObject(orderData);
    }
  } catch (error) {
    console.error(error);
    resultMessage(
      `Sorry, your transaction could not be processed...<br><br>${error}`
    );
  }
}
 
  const cardField = window.paypal.CardFields({
    createOrder: createOrderCallback,
    onApprove: onApproveCallback,

  });

  // Render each field after checking for eligibility
  if (cardField.isEligible()) {

    // const savePPCheckox = document.getElementById('savePPCheckox');
    // const cardFieldSubmitButton = document.getElementById('card-field-submit-button');
    // savePPCheckox.classList.remove('hidden');
    // cardFieldSubmitButton.classList.remove('hidden');

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

// Example function to show a result to the user. Your site's UI library can be used instead.
function resultMessage(message) {
  const container = document.querySelector("#result-message");
  container.innerHTML = message;
}


document.querySelector('#existingClientSubmit').onclick = function() {
  document.querySelector('#payment-cards').innerHTML = "... LOADING ...";
  const customerID = document.querySelector('.idClientToSelect').value;

  fetch("/api/getPaymentTokens", {
          method: 'post',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              'customerID': customerID,
          }),
      })
      .then((res) => res.json())
      .then((response) => {
          console.log(response);
          document.querySelector('#payment-cards').innerHTML = "";

          const paymentTokens = response.payment_tokens;

          // Sélectionnez la section où vous souhaitez afficher les cartes de paiement
          const paymentCardsSection = document.querySelector('#payment-cards');

          // Créez un élément de carte de paiement
          const cardForm = document.createElement('button');
          cardForm.classList.add('bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'mt-4');
          cardForm.textContent = "Pay with a new card";
          cardForm.onclick = function() {
              if (document.querySelector('.card_container').hidden) {
                  document.querySelector('.card_container').hidden = false;
                  cardForm.textContent = "Hide card form";
              } else {
                  document.querySelector('.card_container').hidden = true;
                  cardForm.textContent = "Pay with a new card";
              }
          };

          if (response.name !== "RESOURCE_NOT_FOUND" && response.payment_tokens) {
              // Créez un seul élément h1 avant la boucle
              const cardTitle = document.createElement('h1');
              const cardsContainer = document.createElement('div');

              cardsContainer.classList.add('flex', 'flex-col', 'flex-wrap', 'justify-center', 'gap-10');
              cardTitle.classList.add('text-2xl', 'font-semibold');
              cardTitle.textContent = "Select existing card";

              // Ajoutez le titre une seule fois à la section
              paymentCardsSection.appendChild(cardTitle);
              paymentCardsSection.appendChild(cardsContainer);

              // Créez des éléments HTML pour chaque méthode de paiement
              paymentTokens.forEach((paymentToken) => {
                  const cardInfo = paymentToken.payment_source.card;

                  // Définissez la classe CSS en fonction de la marque de la carte
                  var cardColor = '';
                  if (cardInfo.brand === 'VISA') {
                      cardColor = 'bg-blue-500'; // Classe CSS pour VISA
                  } else if (cardInfo.brand === 'MASTERCARD') {
                      cardColor = 'bg-red-500'; // Classe CSS pour MASTERCARD
                  } else {
                      cardColor = 'bg-green-500'; // Classe CSS pour AMEX
                  }

                  const cardSection = document.createElement('div');
                  cardSection.classList.add('flex', 'flex-col-reverse', 'gap-2');

                  const actionButton = document.createElement('div');
                  actionButton.classList.add('flex', 'justify-evenly', 'gap-2');

                  const cardElement = document.createElement('div');
                  cardElement.classList.add('w-96', 'h-56', 'rounded-xl', 'relative', 'text-white', 'shadow-2xl', cardColor);

                  // Ajoutez un bouton "Supprimer" à côté de chaque carte
                  const selectButton = document.createElement('button');
                  selectButton.textContent = "Use this card";
                  selectButton.classList.add('bg-blue-600', 'hover:bg-blue-800', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded-full');

                  //add onclick on cardElement
                  selectButton.onclick = function() {
                      createOrderExistingCard(paymentToken.id);
                      cardElement.classList.add('bg-slate-400')
                  };

                  const deleteButton = document.createElement('button');
                  deleteButton.textContent = "Delete this card";
                  deleteButton.classList.add('bg-red-600', 'hover:bg-red-800', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded-full');

                  // Gérez l'événement "click" du bouton "Supprimer"
                  deleteButton.addEventListener('click', function() {

                      fetch('/api/deletePaymentToken', {
                              method: 'post',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                  'cardId': paymentToken.id,
                              }),
                          })
                          .then((res) => {
                              if (res.ok) {
                                  console.log('La carte a été supprimée avec succès.');
                                  cardElement.remove();
                                  selectButton.remove();
                                  deleteButton.remove();
                              } else {
                                  console.error('La suppression de la carte a échoué.');
                              }
                          })
                          .catch((error) => {
                              console.error('Une erreur s\'est produite lors de la suppression de la carte :', error);
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
                      <p class="font-medium tracking-widest">${cardInfo.name}</p>
                  </div>
                  <div>
                      <p class="font-light">Brand</p>
                      <p class="font-medium tracking-widest">${cardInfo.brand}</p>
                  </div>
              </div>
              <div class="pt-1">
                  <p class="font-light">Card Number</p>
                  <p class="font-medium tracking-more-wider">${'**** **** **** ' + cardInfo.last_digits}</p>
              </div>
              <div class="pt-6 pr-6">
                  <div class="flex justify-between">
                      <div>
                          <p class="font-light text-xs">Expiry</p>
                          <p class="font-medium tracking-wider text-sm">${cardInfo.expiry}</p>
                      </div>
                      <div>
                          <p class="font-light text-xs">CVV</p>
                          <p class="font-bold tracking-more-wider text-sm">···</p>
                      </div>
                  </div>
              </div>
          </div>
      `;

                  // Ajoutez la carte de paiement à la section
                  cardSection.appendChild(cardElement);
                  cardsContainer.appendChild(cardSection);
              });
          } else {
              paymentCardsSection.innerHTML = "<h1 class='text-2xl font-semibold'>No cards found</h1>";
          }

          // Ajoutez le bouton pour payer avec une nouvelle carte
          paymentCardsSection.appendChild(cardForm);
      });
};