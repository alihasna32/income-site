export const WITHDRAWAL_METHODS = {
  bank_transfer: {
    label: "Bank transfer",
    fields: [
      { key: "account_name", label: "Account name", placeholder: "Full name on account", required: true },
      { key: "account_number", label: "Account number", placeholder: "e.g. 12345678901", required: true },
      { key: "bank_name", label: "Bank name", placeholder: "e.g. bKash, Nagad, ...", required: true },
    ],
  },
  mobile_wallet: {
    label: "Mobile wallet",
    fields: [
      {
        key: "provider",
        label: "Provider",
        placeholder: "bKash / Nagad / Rocket / Upay",
        required: true,
      },
      { key: "number", label: "Mobile number", placeholder: "01XXXXXXXXX", required: true },
    ],
  },
  paypal: {
    label: "PayPal",
    fields: [
      { key: "email", label: "PayPal email", placeholder: "you@example.com", required: true },
    ],
  },
};

export const WITHDRAWAL_STATUS = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  rejected: { label: "Rejected", tone: "error" },
  completed: { label: "Completed", tone: "success" },
};