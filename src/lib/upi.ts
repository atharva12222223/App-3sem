// UPI deep-link helpers per NPCI spec (upi://pay?pa=...&pn=...&am=...).
// On mobile these open the user's chosen UPI app; on desktop web, apps also
// expose intent URLs. Amount is optional — "Pay what you like" is common
// for street vendors, so we let the payer enter the amount in-app.

export type UpiApp = "gpay" | "phonepe" | "paytm" | "generic";

export const UPI_APPS: { id: UpiApp; label: string; color: string }[] = [
  { id: "gpay", label: "Google Pay", color: "bg-[#4285F4]" },
  { id: "phonepe", label: "PhonePe", color: "bg-[#5f259f]" },
  { id: "paytm", label: "Paytm", color: "bg-[#00b9f1]" },
  { id: "generic", label: "Any UPI App", color: "bg-emerald-600" },
];

export function buildUpiLink(
  app: UpiApp,
  upiId: string,
  payeeName: string,
  amount?: number,
  note = "Street Vendor Payment"
): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName.slice(0, 25),
    tn: note.slice(0, 50),
    cu: "INR",
    ...(amount && amount > 0 ? { am: amount.toFixed(2) } : {}),
  });
  switch (app) {
    case "gpay":
      return `gpay://upi/pay?${params}`;
    case "phonepe":
      return `phonepe://pay?${params}`;
    case "paytm":
      return `paytmmp://pay?${params}`;
    default:
      return `upi://pay?${params}`;
  }
}

export function isValidUpiId(upiId: string): boolean {
  return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId);
}
