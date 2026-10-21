import { Search } from "lucide-react";

export function SearchInput() {
  return (
    <label className="flex w-full max-w-xl items-center gap-2 rounded-md border border-graphite-100 bg-graphite-50 px-3 py-2 text-sm">
      <Search className="h-4 w-4 text-graphite-700" />
      <input className="w-full bg-transparent outline-none" placeholder="Search leads, dealers, companies..." />
    </label>
  );
}
