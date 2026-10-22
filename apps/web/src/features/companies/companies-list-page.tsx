"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  EllipsisVertical,
  ExternalLink,
  Filter,
  GitFork,
  Grid2X2,
  GripVertical,
  List,
  Plus,
  Search,
  Settings,
  Table2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SortMenu, type SortDirection } from "@/components/ui/sort-menu";
import { sortRecords } from "@/components/ui/sort-records";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Company = { id: string; name: string; phone?: string | null; createdAt?: string; updatedAt?: string; owner?: { id?: string; name: string } | null; contacts?: { leadStatus?: string | null }[]; industry?: string | null; city?: string | null; state?: string | null; country: string; regions: string[]; isArchived: boolean; parentCompanyId?: string | null; customerType?: string | null; companySize?: string | null; annualRevenue?: number | null; customerSince?: string | null };
const companySortOptions = [{ value: "name", label: "Company name" }, { value: "owner", label: "Company owner" }, { value: "createdAt", label: "Create date" }, { value: "updatedAt", label: "Last activity date" }, { value: "lastContactedAt", label: "Last contacted date" }, { value: "nextFollowUpAt", label: "Next follow-up date" }, { value: "contacts", label: "Number of contacts" }, { value: "deals", label: "Number of open deals" }, { value: "annualRevenue", label: "Annual revenue" }, { value: "industry", label: "Industry" }, { value: "regions", label: "Region" }, { value: "city", label: "City / State" }, { value: "country", label: "Country" }, { value: "customerType", label: "Customer type" }, { value: "companySize", label: "Company size" }, { value: "leadStatus", label: "Lead status" }, { value: "lifecycleStage", label: "Lifecycle stage" }];
type CompanyResponse = { data: Company[]; page: number; limit: number; total: number; totalPages: number };
type DateRangeKey = "" | "today" | "yesterday" | "tomorrow" | "this-week" | "this-week-so-far" | "last-week" | "next-week" | "this-month" | "this-month-so-far" | "last-month" | "next-month" | "this-quarter" | "this-fiscal-quarter" | "this-quarter-so-far" | "this-fiscal-quarter-so-far" | "last-quarter" | "last-fiscal-quarter" | "next-quarter" | "next-fiscal-quarter" | "this-year" | "this-fiscal-year" | "this-year-so-far" | "this-fiscal-year-so-far" | "last-year" | "last-fiscal-year" | "next-year" | "next-fiscal-year" | "last-7-days" | "last-14-days" | "last-30-days" | "last-60-days" | "last-90-days" | "last-180-days" | "last-365-days";
type DateOperator = "any-of" | "between" | "known" | "unknown";
const dateRangeOptions: { value: DateRangeKey; label: string; description: string }[] = [
  ["today", "Today", "All of today"], ["yesterday", "Yesterday", "The previous 24 hour day"], ["tomorrow", "Tomorrow", "The next 24 hour day"],
  ["this-week", "This week", "The current calendar week"], ["this-week-so-far", "This week so far", "The current calendar week up to today"], ["last-week", "Last week", "The previous calendar week"], ["next-week", "Next week", "The next calendar week"],
  ["this-month", "This month", "The current calendar month"], ["this-month-so-far", "This month so far", "The current calendar month up to today"], ["last-month", "Last month", "The previous calendar month"], ["next-month", "Next month", "The next calendar month"],
  ["this-quarter", "This quarter", "The current quarter"], ["this-fiscal-quarter", "This fiscal quarter", "The current fiscal quarter"], ["this-quarter-so-far", "This quarter so far", "The current quarter up to today"], ["this-fiscal-quarter-so-far", "This fiscal quarter so far", "The current fiscal quarter up to today"], ["last-quarter", "Last quarter", "The previous full quarter"], ["last-fiscal-quarter", "Last fiscal quarter", "The previous full fiscal quarter"], ["next-quarter", "Next quarter", "The next full quarter"], ["next-fiscal-quarter", "Next fiscal quarter", "The next full fiscal quarter"],
  ["this-year", "This year", "The current calendar year"], ["this-fiscal-year", "This fiscal year", "The current fiscal year"], ["this-year-so-far", "This year so far", "The current calendar year up to today"], ["this-fiscal-year-so-far", "This fiscal year so far", "The current fiscal year up to today"], ["last-year", "Last year", "The previous calendar year"], ["last-fiscal-year", "Last fiscal year", "The previous fiscal year"], ["next-year", "Next year", "The next calendar year"], ["next-fiscal-year", "Next fiscal year", "The next fiscal year"],
  ["last-7-days", "Last 7 days", "The previous 7 days before today"], ["last-14-days", "Last 14 days", "The previous 14 days before today"], ["last-30-days", "Last 30 days", "The previous 30 days before today"], ["last-60-days", "Last 60 days", "The previous 60 days before today"], ["last-90-days", "Last 90 days", "The previous 90 days before today"], ["last-180-days", "Last 180 days", "The previous 180 days before today"], ["last-365-days", "Last 365 days", "The previous 365 days before today"],
].map(([value, label, description]) => ({ value: value as DateRangeKey, label, description }));

function dateRangeBounds(range: DateRangeKey, now = new Date()): [number, number] | null {
  if (!range) return null;
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const day = 86400000;
  const end = (date: Date) => { const next = new Date(date); next.setDate(next.getDate() + 1); return next.getTime(); };
  if (range === "last-7-days" || range === "last-14-days" || range === "last-30-days" || range === "last-60-days" || range === "last-90-days" || range === "last-180-days" || range === "last-365-days") return [start.getTime() - Number(range.split("-")[1]) * day, start.getTime()];
  if (range === "today") return [start.getTime(), end(start)];
  if (range === "yesterday") { const date = new Date(start.getTime() - day); return [date.getTime(), start.getTime()]; }
  if (range === "tomorrow") { const date = new Date(end(start)); return [date.getTime(), end(date)]; }
  const period = range.includes("week") ? "week" : range.includes("month") ? "month" : range.includes("year") ? "year" : "quarter";
  if (range.startsWith("last-") || range.startsWith("next-")) { const direction = range.startsWith("last-") ? -1 : 1; const date = new Date(start); if (period === "week") date.setDate(date.getDate() - date.getDay() + direction * 7); if (period === "month") date.setMonth(date.getMonth() + direction); if (period === "quarter") date.setMonth(Math.floor(date.getMonth() / 3) * 3 + direction * 3); if (period === "year") date.setFullYear(date.getFullYear() + direction); const finish = new Date(date); if (period === "week") finish.setDate(finish.getDate() + 7); if (period === "month") finish.setMonth(finish.getMonth() + 1); if (period === "quarter") finish.setMonth(finish.getMonth() + 3); if (period === "year") finish.setFullYear(finish.getFullYear() + 1); return [date.getTime(), finish.getTime()]; }
  const date = new Date(start); if (period === "week") date.setDate(date.getDate() - date.getDay()); if (period === "month") date.setDate(1); if (period === "quarter") date.setMonth(Math.floor(date.getMonth() / 3) * 3, 1); if (period === "year") date.setMonth(0, 1); const finish = new Date(date); if (period === "week") finish.setDate(finish.getDate() + 7); if (period === "month") finish.setMonth(finish.getMonth() + 1); if (period === "quarter") finish.setMonth(finish.getMonth() + 3); if (period === "year") finish.setFullYear(finish.getFullYear() + 1); return [date.getTime(), range.includes("so-far") ? end(start) : finish.getTime()];
}

type BoardColumn = "Subscriber" | "Lead" | "Marketing Qualified Lead" | "Sales Qualified Lead" | "Opportunity";
type CompanyCard = { id: string; name: string; date: string; due: string };
type BoardState = Record<BoardColumn, CompanyCard[]>;

const initialBoard: BoardState = {
  Subscriber: [{ id: "acme", name: "Acme Industries", date: "10/12/2026", due: "in 2 days" }],
  Lead: [],
  "Marketing Qualified Lead": [],
  "Sales Qualified Lead": [],
  Opportunity: []
};

const columnColors: Record<BoardColumn, string> = {
  Subscriber: "bg-[#1473e6] text-white",
  Lead: "bg-[#d94d12] text-white",
  "Marketing Qualified Lead": "bg-[#008a8a] text-white",
  "Sales Qualified Lead": "bg-[#d6008f] text-white",
  Opportunity: "bg-[#f5b51b] text-[#213343]"
};

export function CompaniesListPage() {
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [activityFilterOpen, setActivityFilterOpen] = useState(false);
  const [activityRange, setActivityRange] = useState<DateRangeKey>("");
  const [activityOperator, setActivityOperator] = useState<DateOperator>("any-of");
  const [activityStart, setActivityStart] = useState("");
  const [activityEnd, setActivityEnd] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [createRange, setCreateRange] = useState<DateRangeKey>("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name"); const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const loadCompanies = async () => {
    setLoading(true); setError("");
    try { const response = await fetch(`${API_URL}/companies?search=${encodeURIComponent(search)}&archived=${showArchived}`); if (!response.ok) throw new Error(); const result = (await response.json()) as CompanyResponse; setCompanies(result.data); setBoard((current) => ({ ...current, Subscriber: result.data.map((company) => ({ id: company.id, name: company.name, date: company.city || "--", due: company.regions.join(", ") || "No region" })) })); }
    catch { setError("Unable to load companies. Make sure the backend and database are running."); }
    finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(() => void loadCompanies(), 250); return () => window.clearTimeout(timer); }, [search, showArchived]);
  const presetBounds = activityOperator === "any-of" ? dateRangeBounds(activityRange) : null;
  const explicitBounds = activityOperator === "between" && activityStart && activityEnd ? [new Date(`${activityStart}T00:00:00`).getTime(), new Date(`${activityEnd}T23:59:59.999`).getTime()] as [number, number] : null;
  const createBounds = dateRangeBounds(createRange);
  const visibleCompanies = sortRecords(companies.filter((company) => {
    if (ownerFilter && company.owner?.id !== ownerFilter) return false;
    if (leadStatusFilter && !company.contacts?.some((contact) => contact.leadStatus === leadStatusFilter)) return false;
    if (createBounds) { const created = company.createdAt ? new Date(company.createdAt).getTime() : NaN; if (!Number.isFinite(created) || created < createBounds[0] || created >= createBounds[1]) return false; }
    const timestamp = company.updatedAt ? new Date(company.updatedAt).getTime() : NaN;
    if (activityOperator === "known") return Number.isFinite(timestamp);
    if (activityOperator === "unknown") return !Number.isFinite(timestamp);
    const bounds = presetBounds ?? explicitBounds;
    return !bounds || (Number.isFinite(timestamp) && timestamp >= bounds[0] && timestamp <= bounds[1]);
  }), sortBy, sortDirection, (company, key) => key === "owner" ? company.owner?.name : key === "contacts" ? company.contacts?.length : key === "regions" ? company.regions.join(", ") : key === "city" ? `${company.city ?? ""} ${company.state ?? ""}` : key === "leadStatus" ? company.contacts?.[0]?.leadStatus : key === "lifecycleStage" ? company.contacts?.[0]?.leadStatus : company[key as keyof Company]);

  const moveCard = (cardId: string, targetColumn: BoardColumn) => {
    setBoard((current) => {
      let movingCard: CompanyCard | undefined;
      const next = Object.fromEntries(
        Object.entries(current).map(([column, cards]) => [
          column,
          cards.filter((card) => {
            if (card.id === cardId) {
              movingCard = card;
              return false;
            }
            return true;
          })
        ])
      ) as BoardState;
      if (movingCard && !next[targetColumn].some((card) => card.id === cardId)) next[targetColumn] = [...next[targetColumn], movingCard];
      return next;
    });
  };

  const addBoardColumn = () => {
    const trimmed = newColumnName.trim();
    if (!trimmed || Object.keys(board).includes(trimmed)) return;
    setBoard((current) => ({ ...current, [trimmed]: [] } as BoardState));
    setNewColumnName("");
    setShowViewMenu(false);
  };
  const reorderColumns = (from: string, to: string) => setBoard((current) => { const entries = Object.entries(current); const fromIndex = entries.findIndex(([key]) => key === from); const toIndex = entries.findIndex(([key]) => key === to); if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current; const [entry] = entries.splice(fromIndex, 1); entries.splice(toIndex, 0, entry); return Object.fromEntries(entries) as BoardState; });

  const reorderCard = (cardId: string, targetColumn: BoardColumn, targetIndex: number) => {
    setBoard((current) => {
      let movingCard: CompanyCard | undefined;
      const next = Object.fromEntries(Object.entries(current).map(([column, cards]) => [column, cards.filter((card) => { if (card.id === cardId) movingCard = card; return card.id !== cardId; })])) as BoardState;
      if (movingCard) next[targetColumn].splice(Math.max(0, Math.min(targetIndex, next[targetColumn].length)), 0, movingCard);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="rounded-[14px] border border-[#dbe4ed] bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-medium text-[#111827]">Companies</h2>
            <ChevronDown className="h-5 w-5 text-[#213343]" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CircleButton icon={EllipsisVertical} label="More" />
            <CircleButton icon={GitFork} label="Manage columns" />
            <button className="inline-flex items-center gap-2 rounded-full bg-[#005c5f] px-5 py-2.5 text-sm font-bold text-white shadow-sm" type="button" onClick={() => window.location.assign("/companies/new")}>
              Add companies
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative border-b border-[#dbe4ed]">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button className={`px-4 py-2.5 text-sm font-medium ${viewMode === "table" || viewMode === "board" ? "border-b-2 border-[#ff5c35] bg-[#fff1eb] text-[#ff5c35]" : "text-[#516f90]"}`} onClick={() => setViewMode("table")} type="button">
              <span className="inline-flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                All companies
              </span>
            </button>
            <button className="px-3 py-2.5 text-sm font-medium text-[#516f90]" type="button">
              <span className="inline-flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                My companies
              </span>
            </button>
            <button className="p-3 text-[#213343]" aria-label="Add column" onClick={() => setShowViewMenu((open) => !open)} type="button">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          {showViewMenu ? (
            <div className="absolute left-3 top-[54px] z-20 w-[430px] max-w-[calc(100vw-40px)] rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xl">
              <h3 className="mb-4 font-bold text-[#213343]">Create new view</h3>
              <div className="grid grid-cols-2 gap-3">
                <CreateViewButton icon={Table2} label="Table" onClick={() => { setViewMode("table"); setShowViewMenu(false); }} />
                <CreateViewButton icon={GripVertical} label="Board" onClick={() => { setViewMode("board"); setShowViewMenu(false); }} />
              </div>
              <div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-md border border-[#cbd6e2] px-3 py-2 text-sm outline-none focus:border-[#ff5c35]" placeholder="Column name" value={newColumnName} onChange={(event) => setNewColumnName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addBoardColumn(); }} /><button className="rounded-md bg-[#006b70] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" type="button" disabled={!newColumnName.trim()} onClick={addBoardColumn}>Add column</button></div>
              <div className="mt-6 border-t border-[#d0d7de] pt-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <button className="inline-flex items-center gap-2" type="button"><ChevronRight className="h-4 w-4" />Add existing view</button>
                  <button className="inline-flex items-center gap-2 text-[#007a8a]" type="button">All views<ExternalLink className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-10 w-[280px] max-w-full items-center gap-3 rounded-full border border-[#9fb3c8] px-4 text-[#516f90]">
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7c98b6]" placeholder={viewMode === "board" ? "Search ( / )" : "Search companies..."} value={search} onChange={(event) => setSearch(event.target.value)} />
              <Search className="h-4 w-4" />
            </label>
            <div className="relative"><button className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium ${filtersVisible ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#9fb3c8] bg-[#f7f9fb]"}`} type="button" onClick={() => { setFiltersVisible((visible) => !visible); setFiltersOpen(false); }}><Filter className="h-4 w-4" />Filter</button>{filtersOpen ? <CompanyFilters companies={companies} ownerFilter={ownerFilter} setOwnerFilter={setOwnerFilter} createRange={createRange} setCreateRange={setCreateRange} leadStatusFilter={leadStatusFilter} setLeadStatusFilter={setLeadStatusFilter} /> : null}</div>
            <SortMenu options={companySortOptions} value={sortBy} direction={sortDirection} onChange={(value, direction) => { setSortBy(value); setSortDirection(direction); }} />
            <button className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium ${showArchived ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#9fb3c8] bg-white"}`} type="button" onClick={() => setShowArchived((value) => !value)}>Archived</button>
            <span className="h-8 w-px bg-[#dbe4ed]" />
            <CircleButton icon={Plus} label="Add column" onClick={() => setShowViewMenu(true)} />
            <CircleButton icon={Columns3} label="Edit columns" />
            <button className="inline-flex h-10 items-center gap-2 px-3 text-sm font-bold text-[#213343]" type="button" onClick={() => { setFiltersVisible(true); setFiltersOpen(true); }}><Filter className="h-4 w-4" />Advanced filters</button>
          </div>
          <div className="flex items-center gap-2">
            <ViewButton active={viewMode === "board"} icon={GripVertical} onClick={() => setViewMode("board")} />
            <ViewButton active={viewMode === "table"} icon={Grid2X2} onClick={() => setViewMode("table")} />
            <CircleButton icon={Settings} label="Table settings" />
            <CircleButton icon={ChevronDown} label="Collapse" />
          </div>
        </div>

        {filtersVisible ? <div className="flex flex-wrap items-center gap-6 border-b border-[#dbe4ed] pb-3 text-sm font-semibold text-[#213343]"><FilterButton label="Company owner" onClick={() => setFiltersOpen(true)} /><FilterButton label="Create date" onClick={() => setFiltersOpen(true)} /><FilterButton label="Last activity date" onClick={() => setFiltersOpen(true)} /><FilterButton label="Lead status" onClick={() => setFiltersOpen(true)} /><button className="font-semibold text-[#ff5c35]" type="button" onClick={() => setFiltersVisible(false)}>Hide filters</button></div> : null}

        {loading ? <div className="p-10 text-center text-[#516f90]">Loading companies...</div> : error ? <div className="p-10 text-center text-[#b42318]">{error}</div> : viewMode === "table" ? <CompaniesTable companies={visibleCompanies} onRefresh={loadCompanies} activityFilterOpen={activityFilterOpen} setActivityFilterOpen={setActivityFilterOpen} activityRange={activityRange} setActivityRange={setActivityRange} activityOperator={activityOperator} setActivityOperator={setActivityOperator} activityStart={activityStart} setActivityStart={setActivityStart} activityEnd={activityEnd} setActivityEnd={setActivityEnd} /> : <CompaniesBoard board={board} onMoveCard={moveCard} onReorderCard={reorderCard} onReorderColumns={reorderColumns} onAddCompany={() => window.location.assign("/companies/new")} />}
      </div>
    </AppShell>
  );
}

function CompanyFilters({ companies, ownerFilter, setOwnerFilter, createRange, setCreateRange, leadStatusFilter, setLeadStatusFilter }: { companies: Company[]; ownerFilter: string; setOwnerFilter: (value: string) => void; createRange: DateRangeKey; setCreateRange: (value: DateRangeKey) => void; leadStatusFilter: string; setLeadStatusFilter: (value: string) => void }) {
  const owners = Array.from(new Map(companies.filter((company) => company.owner?.id).map((company) => [company.owner!.id!, company.owner!.name])).entries());
  return <div className="absolute left-0 top-12 z-40 w-[360px] rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xl"><h3 className="mb-4 text-base font-bold text-[#213343]">Filter companies</h3><label className="mb-3 block text-sm font-semibold">Company owner<select className="mt-1 h-10 w-full rounded-lg border border-[#9fb3c8] bg-white px-3 font-normal" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="">Any owner</option>{owners.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label className="mb-3 block text-sm font-semibold">Create date<select className="mt-1 h-10 w-full rounded-lg border border-[#9fb3c8] bg-white px-3 font-normal" value={createRange} onChange={(event) => setCreateRange(event.target.value as DateRangeKey)}><option value="">Any date</option>{dateRangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="mb-3 block text-sm font-semibold">Lead status<select className="mt-1 h-10 w-full rounded-lg border border-[#9fb3c8] bg-white px-3 font-normal" value={leadStatusFilter} onChange={(event) => setLeadStatusFilter(event.target.value)}><option value="">Any status</option><option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="QUALIFIED">Qualified</option><option value="PROPOSAL">Proposal</option><option value="WON">Won</option><option value="LOST">Lost</option></select></label><p className="mt-4 text-xs text-[#516f90]">Last activity date can be filtered from its column header. Advanced filters are available here.</p></div>;
}

function FilterButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="inline-flex items-center gap-1" type="button" onClick={onClick}>{label}<ChevronDown className="h-4 w-4" /></button>;
}

function CreateViewButton({ icon: Icon, label, onClick }: { icon: typeof Table2; label: string; onClick: () => void }) {
  return <button className="rounded-md border border-[#d0d7de] p-4 text-center hover:border-[#ff5c35]" onClick={onClick} type="button"><Icon className="mx-auto h-5 w-5" /><span className="mt-2 block text-sm">{label}</span></button>;
}

function CompaniesTable({ companies, onRefresh, activityFilterOpen, setActivityFilterOpen, activityRange, setActivityRange, activityOperator, setActivityOperator, activityStart, setActivityStart, activityEnd, setActivityEnd }: { companies: Company[]; onRefresh: () => Promise<void>; activityFilterOpen: boolean; setActivityFilterOpen: React.Dispatch<React.SetStateAction<boolean>>; activityRange: DateRangeKey; setActivityRange: (value: DateRangeKey) => void; activityOperator: DateOperator; setActivityOperator: (value: DateOperator) => void; activityStart: string; setActivityStart: (value: string) => void; activityEnd: string; setActivityEnd: (value: string) => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(companies.filter((company) => companies.some((child) => child.parentCompanyId === company.id)).map((company) => company.id)));
  useEffect(() => { setExpanded(new Set(companies.filter((company) => companies.some((child) => child.parentCompanyId === company.id)).map((company) => company.id))); }, [companies]);
  const parents = companies.filter((company) => !company.parentCompanyId || !companies.some((parent) => parent.id === company.parentCompanyId));
  const orderedCompanies = parents.flatMap((company) => expanded.has(company.id) ? [company, ...companies.filter((child) => child.parentCompanyId === company.id)] : [company]);
  return (
    <div className="overflow-hidden rounded-xl border border-[#dbe4ed]">
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead className="bg-white">
          <tr className="border-b border-[#dbe4ed] text-sm font-bold text-[#111827]">
            <th className="w-14 px-5 py-4"><span className="block h-6 w-6 rounded border border-[#9fb3c8]" /></th>
            <th className="px-4 py-4">Company name</th>
            <th className="px-4 py-4">Company owner</th>
            <th className="px-4 py-4">Create date <span className="ml-1">↓</span></th>
            <th className="px-4 py-4">Phone number</th>
            <th className="relative px-4 py-4"><button className="inline-flex items-center gap-1" type="button" onClick={() => setActivityFilterOpen((open) => !open)}>Last activity date <ChevronDown className="h-4 w-4" /></button>{activityFilterOpen ? <div className="absolute left-0 top-14 z-30 w-[460px] rounded-2xl border border-[#d0d0d0] bg-white p-6 text-left font-normal shadow-xl"><select className="mb-5 h-10 w-full rounded-lg border border-[#333] bg-white px-3 text-base" value={activityOperator} onChange={(event) => setActivityOperator(event.target.value as DateOperator)}><option value="any-of">is any of</option><option value="between">is between</option><option value="known">is known</option><option value="unknown">is unknown</option></select>{activityOperator === "any-of" ? <select className="h-12 w-full rounded-xl border border-[#333] bg-white px-4 text-base" value={activityRange} onChange={(event) => { setActivityRange(event.target.value as DateRangeKey); setActivityFilterOpen(false); }}><option value="">Select value</option>{dateRangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label} — {option.description}</option>)}</select> : activityOperator === "between" ? <div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">From<input className="mt-1 h-11 w-full rounded-lg border border-[#333] px-3 font-normal" type="date" value={activityStart} onChange={(event) => setActivityStart(event.target.value)} /></label><label className="text-sm font-semibold">To<input className="mt-1 h-11 w-full rounded-lg border border-[#333] px-3 font-normal" type="date" value={activityEnd} onChange={(event) => setActivityEnd(event.target.value)} /></label></div> : <p className="text-sm text-[#516f90]">This filter updates the results automatically.</p>}</div> : null}</th>
            <th className="w-14 px-4 py-4 text-right"><Plus className="ml-auto h-5 w-5" /></th>
          </tr>
        </thead>
        <tbody>
          {orderedCompanies.map((company) => <tr className={`h-20 border-b border-[#e7edf3] text-base hover:bg-[#f7f9fb] ${company.parentCompanyId ? "bg-[#fbfcfd]" : ""}`} key={company.id}>
            <td className="px-5 py-4"><span className="block h-6 w-6 rounded border border-[#9fb3c8]" /></td>
            <td className={`px-4 py-4 ${company.parentCompanyId ? "pl-12" : ""}`}><div className="flex items-center gap-3">{company.parentCompanyId ? <span className="relative h-8 w-7 shrink-0 border-l-2 border-b-2 border-[#cbd6e2]" aria-hidden="true" /> : companies.some((child) => child.parentCompanyId === company.id) ? <button className="grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-[#e8f2f8]" aria-label={expanded.has(company.id) ? "Collapse sub-companies" : "Expand sub-companies"} onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(company.id)) next.delete(company.id); else next.add(company.id); return next; })} type="button"><ChevronDown className={`h-5 w-5 text-[#516f90] transition-transform ${expanded.has(company.id) ? "" : "-rotate-90"}`} /></button> : <span className="h-7 w-7 shrink-0" />}{company.parentCompanyId ? <Link className="inline-flex items-center gap-3 font-bold text-[#007a8a]" href={`/companies/${company.id}`}><span className="text-[#ff5c35]">{company.name[0]}</span>{company.name}<span className="rounded-full bg-[#eef4f8] px-2 py-1 text-xs font-medium text-[#516f90]">Sub-company</span></Link> : <Link className="inline-flex items-center gap-3 font-bold text-[#007a8a]" href={`/companies/${company.id}`}><span className="text-[#ff5c35]">{company.name[0]}</span>{company.name}<span className="rounded-full border border-[#a9c9ff] bg-[#eef6ff] px-2 py-1 text-xs font-medium text-[#2563b8]">Main company</span>{companies.filter((child) => child.parentCompanyId === company.id).length ? <span className="text-sm font-normal text-[#718096]">{companies.filter((child) => child.parentCompanyId === company.id).length} sub-company{companies.filter((child) => child.parentCompanyId === company.id).length === 1 ? "" : "ies"}</span> : null}</Link>}</div></td>
            <td className="px-4 py-4">{company.owner?.name || "No owner"}</td>
            <td className="px-4 py-4">{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "--"}</td>
            <td className="px-4 py-4">{company.phone || "--"}</td>
            <td className="px-4 py-4">{company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : "--"}</td>
            <td className="relative px-4 py-4 text-right"><button type="button" aria-label="Company actions" onClick={() => setOpenMenu((current) => current === company.id ? null : company.id)}><EllipsisVertical className="ml-auto h-5 w-5" /></button>{openMenu === company.id ? <div className="absolute right-3 top-14 z-30 w-52 rounded-xl border border-[#dbe4ed] bg-white p-1 text-left shadow-xl"><Link className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#fff1eb] hover:text-[#ff5c35]" href={`/companies/new?parentCompanyId=${encodeURIComponent(company.id)}`} onClick={() => setOpenMenu(null)}>Add sub-company</Link><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-[#f7f9fb]" href={`/companies/${company.id}`}>View company</Link><button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#b42318] hover:bg-[#fff1eb]" type="button" onClick={async () => { setOpenMenu(null); await fetch(`${API_URL}/companies/${company.id}/archive`, { method: "POST" }); await onRefresh(); }}>Delete company</button></div> : null}</td>
          </tr>)}
        </tbody>
      </table>
      <div className="flex flex-col gap-4 border-t border-[#dbe4ed] px-6 py-4 md:flex-row md:items-center md:justify-between">
        <span className="inline-flex w-max rounded-full bg-[#f2f5f8] px-6 py-3 text-sm font-bold">1 company</span>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>Rows per page:</span><button className="inline-flex items-center gap-2 font-semibold">25 <ChevronDown className="h-4 w-4" /></button><span className="mx-2 h-8 w-px bg-[#dbe4ed]" />
          <button className="rounded-full bg-[#f2f5f8] p-3 text-[#9fb3c8]"><ChevronLeft className="h-4 w-4" /></button><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f2f5f8] font-bold">1</span><button className="rounded-full bg-[#f2f5f8] p-3 text-[#9fb3c8]"><ChevronRight className="h-4 w-4" /></button>
          <button className="ml-2 inline-flex items-center gap-2 rounded-full border border-[#dbe4ed] px-5 py-3 font-bold"><Download className="h-4 w-4" />Export</button>
          <button className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ed] px-5 py-3 font-bold"><Upload className="h-4 w-4" />Clone</button>
        </div>
      </div>
    </div>
  );
}

function CompaniesBoard({ board, onMoveCard, onReorderCard, onReorderColumns, onAddCompany }: { board: BoardState; onMoveCard: (cardId: string, targetColumn: BoardColumn) => void; onReorderCard: (cardId: string, targetColumn: BoardColumn, targetIndex: number) => void; onReorderColumns: (from: string, to: string) => void; onAddCompany: () => void }) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<BoardColumn | null>(null);
  return (
    <div className="overflow-x-auto border-t border-[#dbe4ed] pb-2">
      <div className="flex min-w-[1280px] gap-3 py-3">
        {(Object.keys(board) as BoardColumn[]).map((column) => (
          <section className="flex h-[520px] w-[280px] shrink-0 flex-col rounded-2xl bg-[#eeeeee] transition-colors hover:bg-[#e9e9e9]" key={column} onMouseEnter={() => setHoveredColumn(column)} onMouseLeave={() => setHoveredColumn(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const columnId = event.dataTransfer.getData("company-column"); const cardId = event.dataTransfer.getData("text/plain"); if (columnId) onReorderColumns(columnId, column); else if (cardId) onMoveCard(cardId, column); }}>
            <div className="flex items-center gap-2 px-3 pt-3 text-sm font-bold"><button className={`inline-flex cursor-grab items-center rounded-md px-3 py-1 ${columnColors[column] ?? "bg-[#64748b] text-white"}`} draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("company-column", column); setDraggedColumn(column); }} onDragEnd={() => setDraggedColumn(null)} type="button">☷ {column}</button><span>{board[column].length}</span>{draggedColumn === column ? <span className="text-xs text-[#ff5c35]">Move</span> : null}</div>
            {hoveredColumn === column ? <button className="mx-3 mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#b7c3ce] bg-white px-3 py-3 text-sm font-semibold text-[#516f90] transition hover:border-[#ff5c35] hover:text-[#ff5c35]" type="button" onClick={onAddCompany}><Plus className="h-4 w-4" /> Add company</button> : null}
            <div className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
              {board[column].map((card, cardIndex) => (
                <Link className="block rounded-2xl border border-[#d0d7de] bg-white p-4 shadow-sm transition hover:border-[#ff5c35] hover:shadow-md" draggable href={`/companies/${card.id}`} key={card.id} onDragStart={(event) => event.dataTransfer.setData("text/plain", card.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const cardId = event.dataTransfer.getData("text/plain"); if (cardId) onReorderCard(cardId, column, cardIndex); }}>
                  <h3 className="text-base font-bold text-[#007a8a]">{card.name}</h3>
                  <p className="mt-4 flex items-center gap-2 text-sm text-[#213343]"><span>□</span>{card.date}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#dbe4ed] pt-2 text-sm"><span className="text-[#516f90]">edit</span><span className="rounded-full border border-[#9fb3c8] px-3 py-1">call | {card.due}</span></div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function CircleButton({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick?: () => void }) {
  return <button className="grid h-10 w-10 place-items-center rounded-full border border-[#9fb3c8] bg-white text-[#213343] hover:border-[#ff5c35] hover:text-[#ff5c35]" aria-label={label} onClick={onClick} type="button"><Icon className="h-4 w-4" /></button>;
}

function ViewButton({ icon: Icon, active, onClick }: { icon: typeof List; active?: boolean; onClick: () => void }) {
  return <button className={`grid h-10 w-10 place-items-center rounded-full border border-[#9fb3c8] ${active ? "bg-[#f2f5f8]" : "bg-white"}`} onClick={onClick} type="button"><Icon className="h-4 w-4" /></button>;
}
