"use client";

import { ChevronDown, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";
export type SortOption = { value: string; label: string };

export function SortMenu({ options, value, direction, onChange }: { options: SortOption[]; value: string; direction: SortDirection; onChange: (value: string, direction: SortDirection) => void }) {
  return <div className="relative"><select className="h-10 appearance-none rounded-full border border-[#dbe4ed] bg-white py-2 pl-4 pr-10 text-sm font-medium outline-none" value={value} onChange={(event) => onChange(event.target.value, event.target.value === value ? (direction === "asc" ? "desc" : "asc") : "asc")} aria-label="Sort by">{options.map((option) => <option key={option.value} value={option.value}>{option.label}: {value === option.value ? direction === "asc" ? "Low to high" : "High to low" : "A to Z"}</option>)}</select><ChevronsUpDown className="pointer-events-none absolute right-7 top-3 h-4 w-4" /><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4" /></div>;
}
