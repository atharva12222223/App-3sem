"use client";

// Search + category filter chips. Chips are icon-led for quick scanning.
import { CATEGORIES, CategoryId } from "@/lib/categories";

export function SearchFilterBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  dutyOnly,
  onDutyOnlyChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  category: CategoryId | "ALL";
  onCategoryChange: (c: CategoryId | "ALL") => void;
  dutyOnly: boolean;
  onDutyOnlyChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder='Search "chaat", "flowers", "sabzi"…'
          aria-label="Search vendors"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base font-semibold shadow-sm focus:border-civic-600 focus:outline-none"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter by category">
        <FilterChip
          active={category === "ALL"}
          onClick={() => onCategoryChange("ALL")}
          icon="✨"
          label="All"
        />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.id}
            active={category === c.id}
            onClick={() => onCategoryChange(c.id)}
            icon={c.icon}
            label={c.en}
            labelHi={c.hi}
          />
        ))}
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={dutyOnly}
          onChange={(e) => onDutyOnlyChange(e.target.checked)}
          className="h-5 w-5 accent-verified-500"
        />
        🟢 Show only open vendors right now / केवल खुले विक्रेता
      </label>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon,
  label,
  labelHi,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  labelHi?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition ${
        active
          ? "border-civic-600 bg-civic-600 text-white shadow"
          : "border-slate-200 bg-white text-slate-700 hover:border-civic-600"
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
      {labelHi && <span className={`text-xs ${active ? "opacity-80" : "text-slate-400"}`}>{labelHi}</span>}
    </button>
  );
}
