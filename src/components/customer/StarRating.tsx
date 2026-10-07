"use client";

// 1–5 star rating: read-only display mode and interactive input mode
// with oversized tap targets.
export function StarRating({
  value,
  readOnly = false,
  onChange,
  size = "md",
}: {
  value: number;
  readOnly?: boolean;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? "text-base" : size === "lg" ? "text-4xl" : "text-2xl";

  if (readOnly) {
    return (
      <span className={`${px} tracking-tight`} role="img" aria-label={`Rated ${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i}>{i <= Math.round(value) ? "★" : "☆"}</span>
        ))}
      </span>
    );
  }

  return (
    <div className={`flex gap-1 ${px}`} role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange?.(i)}
          className={`rounded-lg px-1 transition hover:scale-110 ${
            i <= value ? "text-amber-500" : "text-slate-300"
          }`}
        >
          {i <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
