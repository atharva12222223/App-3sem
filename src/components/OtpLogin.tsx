"use client";

// Shared phone + OTP login used by all three portals.
// Big inputs, big buttons, numeric keypad — designed for one-thumb outdoor use.
import { useState } from "react";
import { api, saveSession } from "@/lib/api-client";

type Props = {
  role: "VENDOR" | "CUSTOMER" | "ADMIN";
  icon: string;
  title: string;
  subtitle: string;
  onLoggedIn: (res: { token: string; phone: string; isNewVendor?: boolean }) => void;
};

export function OtpLogin({ role, icon, title, subtitle, onLoggedIn }: Props) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [devHint, setDevHint] = useState("");

  async function sendOtp() {
    setError("");
    setBusy(true);
    try {
      const res = await api<{ sent: boolean; devCode?: string }>("/api/auth/otp", {
        method: "POST",
        body: { phone: `91${phone}`, role },
      });
      setDevHint(res.devCode ? `Demo OTP: ${res.devCode}` : "");
      setStep("otp");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError("");
    setBusy(true);
    try {
      const res = await api<{ token: string; isNewVendor?: boolean }>(
        "/api/auth/verify",
        { method: "POST", body: { phone: `91${phone}`, code: otp, role } }
      );
      saveSession(res.token, role, `91${phone}`);
      onLoggedIn({ token: res.token, phone: `91${phone}`, isNewVendor: res.isNewVendor });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
      <div className="mb-4 text-center">
        <div className="text-5xl" aria-hidden>{icon}</div>
        <h1 className="mt-2 text-2xl font-extrabold text-civic-900">{title}</h1>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </div>

      {step === "phone" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
        >
          <label className="block text-sm font-bold text-slate-700" htmlFor="phone">
            📱 Mobile Number / मोबाइल नंबर
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-3 text-lg font-bold">
              +91
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="98765 43210"
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg font-semibold tracking-wide focus:border-civic-600 focus:outline-none"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">
              ⚠️ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || phone.length !== 10}
            className="w-full rounded-xl bg-civic-600 py-4 text-lg font-extrabold text-white shadow disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send OTP →"}
          </button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <label className="block text-sm font-bold text-slate-700" htmlFor="otp">
            🔑 Enter 6-digit OTP / OTP दर्ज करें
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:border-civic-600 focus:outline-none"
          />
          {devHint && (
            <p className="rounded-lg bg-amber-50 p-3 text-center text-sm font-semibold text-amber-800">
              {devHint}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">
              ⚠️ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || otp.length !== 6}
            className="w-full rounded-xl bg-verified-500 py-4 text-lg font-extrabold text-white shadow disabled:opacity-50"
          >
            {busy ? "Verifying…" : "✓ Verify & Continue"}
          </button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full py-2 text-sm font-semibold text-slate-500 underline"
          >
            ← Change number
          </button>
        </form>
      )}
    </div>
  );
}
