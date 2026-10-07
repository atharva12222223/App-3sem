"use client";

// "Pay via UPI" — shows app chooser (GPay / PhonePe / Paytm / any UPI app)
// with optional amount, then fires the upi:// deep link.
import { useState } from "react";
import { UPI_APPS, buildUpiLink } from "@/lib/upi";

export function UPIPayButton({
  upiId,
  payeeName,
}: {
  upiId: string;
  payeeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const amt = parseFloat(amount);

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full rounded-xl bg-verified-500 py-4 text-lg font-extrabold text-white shadow hover:bg-verified-600"
      >
        💳 Pay via UPI / यूपीआई से भुगतान करें
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700" htmlFor="upi-amount">
              Amount (optional — you can enter it in the app too)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold">₹</span>
              <input
                id="upi-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="e.g. 50"
                className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg font-bold focus:border-verified-500 focus:outline-none"
              />
            </div>
            <div className="mt-2 flex gap-2">
              {[20, 50, 100, 200].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-200"
                >
                  ₹{v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {UPI_APPS.map((app) => (
              <a
                key={app.id}
                href={buildUpiLink(app.id, upiId, payeeName, Number.isFinite(amt) ? amt : undefined)}
                className={`${app.color} flex items-center justify-center gap-2 rounded-xl py-3.5 font-extrabold text-white shadow hover:opacity-90`}
              >
                {app.id === "gpay" && "🔵"}
                {app.id === "phonepe" && "🟣"}
                {app.id === "paytm" && "🩵"}
                {app.id === "generic" && "📲"}
                {app.label}
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500">
            Paying to <strong>{upiId}</strong> · Powered by NPCI UPI
          </p>
        </div>
      )}
    </div>
  );
}
