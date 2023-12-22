// jsonEditor.js
// create the editor
const container = document.getElementById("jsoneditor");
const options = {
  modes: ["text", "code", "tree", "form", "view"],
  mode: "tree",
  search: true,
};
const editor = new JSONEditor(container, options);

// Function to set JSON data in the editor
function setJSONData(jsonData) {
  editor.set(jsonData);
  editor.expandAll();
}

// Your default JSON
const json = {
  intent: "CAPTURE",
  purchase_units: [
    {
      amount: {
        currency_code: currency,
        value: "100.00",
      },
    },
  ],
  payment_source: {
    card: {
      stored_credential: {
        payment_initiator: "CUSTOMER",
        payment_type: "ONE_TIME",
        usage: "FIRST",
      },
      // attributes: {
      //   verification: {
      //     method: "SCA_ALWAYS",
      //   },
      // },
    },
  },
};

// Your JSON for first visit with saveCard
const jsonVaultFirstVisit = {
  intent: "CAPTURE",
  purchase_units: [
    {
      reference_id: "d9f80740-38f0-11e8-b467-0ed5f89f718b",
      amount: {
        currency_code: currency,
        value: "100.00",
      },
    },
  ],
  payment_source: {
    card: {
      name: "Firstname Lastname",
      billing_address: {
        address_line_1: "123 Main St.",
        address_line_2: "Unit B",
        admin_area_2: "Anytown",
        admin_area_1: "CA",
        postal_code: "12345",
        country_code: "US",
      },
      attributes: {
        vault: {
          store_in_vault: "ON_SUCCESS",
        },
      },
    },
  },
};
