"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ArrowUpDown as SortIcon,
  Columns3,
  Copy,
  CopyPlus,
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
  Share2,
  Settings,
  Trash2,
  Table2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SortMenu, type SortDirection } from "@/components/ui/sort-menu";
import { sortRecords } from "@/components/ui/sort-records";
import { CompanyForm } from "./company-form";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Company = { id: string; name: string; phone?: string | null; createdAt?: string; updatedAt?: string; owner?: { id?: string; name: string } | null; contacts?: { leadStatus?: string | null }[]; industry?: string | null; city?: string | null; state?: string | null; country: string; regions: string[]; isArchived: boolean; parentCompanyId?: string | null; customerType?: string | null; companySize?: string | null; annualRevenue?: number | null; customerSince?: string | null };
const companySortOptions = [{ value: "name", label: "Company name" }, { value: "owner", label: "Company owner" }, { value: "createdAt", label: "Create date" }, { value: "updatedAt", label: "Last activity date" }, { value: "lastContactedAt", label: "Last contacted date" }, { value: "nextFollowUpAt", label: "Next follow-up date" }, { value: "contacts", label: "Number of contacts" }, { value: "deals", label: "Number of open deals" }, { value: "annualRevenue", label: "Annual revenue" }, { value: "industry", label: "Industry" }, { value: "regions", label: "Region" }, { value: "city", label: "City / State" }, { value: "country", label: "Country" }, { value: "customerType", label: "Customer type" }, { value: "companySize", label: "Company size" }, { value: "leadStatus", label: "Lead status" }, { value: "lifecycleStage", label: "Lifecycle stage" }];
type CompanyResponse = { data: Company[]; page: number; limit: number; total: number; totalPages: number };
type FilterLogic = "AND" | "OR";
type CompanyFilter = { type: "filter"; id: string; association: string; field: string; operator: string; value: string | string[] | boolean };
type FilterGroup = { type: "group"; logic: FilterLogic; children: (CompanyFilter | FilterGroup)[] };
const associationCatalog: { name: string; fields: { label: string; value: string; type: "text" | "number" | "date" | "boolean" }[]; available?: boolean }[] = [
  { name: "Company", fields: [{ label: "Company name", value: "name", type: "text" }, { label: "Industry", value: "industry", type: "text" }, { label: "City", value: "city", type: "text" }, { label: "Country", value: "country", type: "text" }, { label: "Annual revenue", value: "annualRevenue", type: "number" }, { label: "Number of employees", value: "numberOfEmployees", type: "number" }, { label: "Created date", value: "createdAt", type: "date" }] },
  { name: "Contact", fields: [{ label: "First name", value: "firstName", type: "text" }, { label: "Last name", value: "lastName", type: "text" }, { label: "Email", value: "email", type: "text" }, { label: "Lead status", value: "leadStatus", type: "text" }, { label: "Last contacted", value: "lastContactedAt", type: "date" }, { label: "Created date", value: "createdAt", type: "date" }] },
  { name: "Deal", fields: [{ label: "Deal name", value: "name", type: "text" }, { label: "Stage", value: "stage", type: "text" }, { label: "Amount", value: "amount", type: "number" }, { label: "Close date", value: "closeDate", type: "date" }, { label: "Created date", value: "createdAt", type: "date" }] },
  { name: "Lead", fields: [{ label: "Title", value: "title", type: "text" }, { label: "Status", value: "status", type: "text" }, { label: "Priority", value: "priority", type: "text" }, { label: "Value", value: "value", type: "number" }, { label: "Created date", value: "createdAt", type: "date" }] },
  { name: "Activity", fields: [{ label: "Type", value: "type", type: "text" }, { label: "Subject", value: "subject", type: "text" }, { label: "Created date", value: "createdAt", type: "date" }] },
  { name: "Note", fields: [{ label: "Body", value: "body", type: "text" }, { label: "Created date", value: "createdAt", type: "date" }] },
  { name: "Task", fields: [{ label: "Title", value: "title", type: "text" }, { label: "Priority", value: "priority", type: "text" }, { label: "Due date", value: "dueAt", type: "date" }, { label: "Completed date", value: "doneAt", type: "date" }] },
  { name: "User", fields: [{ label: "Name", value: "name", type: "text" }, { label: "Email", value: "email", type: "text" }, { label: "Active", value: "isActive", type: "boolean" }] },
  ...["Call", "Cart", "Communication", "Contract", "Credit memo", "Email", "Form submission", "Invoice", "Marketing event", "Meeting", "Order", "Payment", "Payment link", "Postal Mail", "Quote", "Subscription", "Ticket"].map((name) => ({ name, available: false, fields: [{ label: "Created date", value: "createdAt", type: "date" as const }] }))
];
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
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showSortBuilder, setShowSortBuilder] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [savedView, setSavedView] = useState({ viewMode: "table" as "table" | "board", sortBy: "Company name", sortDirection: "asc" as SortDirection });
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
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({ type: "group", logic: "AND", children: [] });
  const [sortBy, setSortBy] = useState("Company name"); const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) setShowSortBuilder(false);
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) setShowSettingsMenu(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);
  const loadCompanies = async () => {
    setLoading(true); setError("");
    try { const params = new URLSearchParams({ search, archived: String(showArchived) }); if (filterGroup.children.length) params.set("filters", JSON.stringify(filterGroup)); const response = await fetch(`${API_URL}/companies?${params.toString()}`); if (!response.ok) throw new Error(); const result = (await response.json()) as CompanyResponse; setCompanies(result.data); setBoard((current) => ({ ...current, Subscriber: result.data.map((company) => ({ id: company.id, name: company.name, date: company.city || "--", due: company.regions.join(", ") || "No region" })) })); }
    catch { setError("Unable to load companies. Make sure the backend and database are running."); }
    finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(() => void loadCompanies(), 250); return () => window.clearTimeout(timer); }, [search, showArchived, filterGroup]);
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
  }), sortBy, sortDirection, (company, key) => key === "Company name" || key === "name" ? company.name : key === "Company owner" || key === "owner" ? company.owner?.name : key === "Number of Associated Contacts" || key === "contacts" ? company.contacts?.length : key === "Region" || key === "regions" ? company.regions.join(", ") : key === "City" || key === "city" ? `${company.city ?? ""} ${company.state ?? ""}` : key === "Lead Status" || key === "leadStatus" || key === "Lifecycle Stage" || key === "lifecycleStage" ? company.contacts?.[0]?.leadStatus : key === "Create Date" ? company.createdAt : key === "Last Modified Date" || key === "Last Activity Date" ? company.updatedAt : key === "Phone Number" ? company.phone : company[key as keyof Company]);

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
  const saveView = () => setSavedView({ viewMode, sortBy, sortDirection });
  const resetView = () => { setViewMode(savedView.viewMode); setSortBy(savedView.sortBy); setSortDirection(savedView.sortDirection); };
  const exportView = () => {
    const header = ["Company name", "Company owner", "Create date", "Phone number", "Last activity date"];
    // Prefix values that Excel commonly auto-formats with an apostrophe so dates
    // stay visible and phone numbers do not become scientific notation.
    const excelText = (value: string) => value ? `'${value}` : "";
    const rows = visibleCompanies.map((company) => [company.name, company.owner?.name || "", excelText(company.createdAt ? new Date(company.createdAt).toLocaleDateString() : ""), excelText(company.phone || ""), excelText(company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : "")]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "companies.csv"; link.click(); URL.revokeObjectURL(link.href);
  };

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
        {!headerCollapsed ? <>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-medium text-[#111827]">Companies</h2>
            <ChevronDown className="h-5 w-5 text-[#213343]" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CircleButton icon={EllipsisVertical} label="More" />
            <CircleButton icon={GitFork} label="Manage columns" />
            <button className="inline-flex items-center gap-2 rounded-full bg-[#005c5f] px-5 py-2.5 text-sm font-bold text-white shadow-sm" type="button" onClick={() => setShowCompanyForm(true)}>
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
        </> : null}

        <div className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-10 w-[280px] max-w-full items-center gap-3 rounded-full border border-[#9fb3c8] px-4 text-[#516f90]">
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7c98b6]" placeholder={viewMode === "board" ? "Search ( / )" : "Search companies..."} value={search} onChange={(event) => setSearch(event.target.value)} />
              <Search className="h-4 w-4" />
            </label>
            <div className="relative"><button className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium ${filtersVisible ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#9fb3c8] bg-[#f7f9fb]"}`} type="button" onClick={() => { setFiltersVisible(true); setFiltersOpen((open) => !open); }}><Filter className="h-4 w-4" />Filter{filterGroup.children.length ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff5c35] px-1 text-xs text-white">{filterGroup.children.length}</span> : null}</button>{filtersOpen ? <AdvancedFilters value={filterGroup} onChange={setFilterGroup} onClose={() => setFiltersOpen(false)} /> : null}</div>
            <div className="relative" ref={sortMenuRef}><button className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ed] bg-white px-4 text-sm font-medium" type="button" onClick={() => setShowSortBuilder((open) => !open)}><SortIcon className="h-4 w-4" />Sort by<ChevronDown className="h-4 w-4" /></button>{showSortBuilder ? <SortBuilder value={sortBy} direction={sortDirection} onChange={(value, direction) => { setSortBy(value); setSortDirection(direction); }} onClose={() => setShowSortBuilder(false)} /> : null}</div>
            <button className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium ${showArchived ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#9fb3c8] bg-white"}`} type="button" onClick={() => setShowArchived((value) => !value)}>Archived</button>
            <span className="h-8 w-px bg-[#dbe4ed]" />
            <CircleButton icon={Plus} label="Add column" onClick={() => setShowViewMenu(true)} />
            <CircleButton icon={Columns3} label="Edit columns" />
            <button className="inline-flex h-10 items-center gap-2 px-3 text-sm font-bold text-[#213343]" type="button" onClick={() => { setFiltersVisible(true); setFiltersOpen(true); }}><Filter className="h-4 w-4" />Advanced filters</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={settingsMenuRef}>
              <CircleButton icon={Settings} label="View settings" onClick={() => setShowSettingsMenu((open) => !open)} />
              {showSettingsMenu ? <ViewSettingsMenu viewMode={viewMode} setViewMode={setViewMode} sortBy={sortBy} sortDirection={sortDirection} saveView={saveView} resetView={resetView} exportView={exportView} onOpenSort={() => { setShowSettingsMenu(false); setShowSortBuilder(true); }} onClose={() => setShowSettingsMenu(false)} /> : null}
            </div>
            <CircleButton active={headerCollapsed} icon={headerCollapsed ? ChevronUp : ChevronDown} label={headerCollapsed ? "Expand company header" : "Collapse company header"} onClick={() => setHeaderCollapsed((collapsed) => !collapsed)} />
          </div>
        </div>

        {filtersVisible && filterGroup.children.length ? <div className="flex flex-wrap items-center gap-2 border-b border-[#dbe4ed] pb-3 text-sm font-semibold text-[#213343]">{filterGroup.children.map((child, index) => child.type === "group" ? null : <button className="rounded-full border border-[#ffb8a5] bg-[#fff1eb] px-3 py-1.5 text-[#c24126]" key={child.id} type="button" onClick={() => setFilterGroup((current) => ({ ...current, children: current.children.filter((_, childIndex) => childIndex !== index) }))}>{child.association}: {child.field} ×</button>)}<button className="font-semibold text-[#ff5c35]" type="button" onClick={() => setFilterGroup({ type: "group", logic: "AND", children: [] })}>Clear all</button></div> : null}

        {loading ? <div className="p-10 text-center text-[#516f90]">Loading companies...</div> : error ? <div className="p-10 text-center text-[#b42318]">{error}</div> : viewMode === "table" ? <CompaniesTable companies={visibleCompanies} onRefresh={loadCompanies} activityFilterOpen={activityFilterOpen} setActivityFilterOpen={setActivityFilterOpen} activityRange={activityRange} setActivityRange={setActivityRange} activityOperator={activityOperator} setActivityOperator={setActivityOperator} activityStart={activityStart} setActivityStart={setActivityStart} activityEnd={activityEnd} setActivityEnd={setActivityEnd} /> : <CompaniesBoard board={board} onMoveCard={moveCard} onReorderCard={reorderCard} onReorderColumns={reorderColumns} onAddCompany={() => setShowCompanyForm(true)} />}
      </div>
      {showCompanyForm ? <CompanyForm modal onClose={() => setShowCompanyForm(false)} onSaved={() => { setShowCompanyForm(false); void loadCompanies(); }} /> : null}
    </AppShell>
  );
}

function ViewSettingsMenu({ viewMode, setViewMode, sortBy, sortDirection, saveView, resetView, exportView, onOpenSort, onClose }: { viewMode: "table" | "board"; setViewMode: (value: "table" | "board") => void; sortBy: string; sortDirection: SortDirection; saveView: () => void; resetView: () => void; exportView: () => void; onOpenSort: () => void; onClose: () => void }) {
  const action = (callback: () => void) => { callback(); onClose(); };
  return <div className="absolute right-0 top-12 z-50 max-h-[calc(100vh-150px)] w-[310px] overscroll-contain overflow-y-auto rounded-xl border border-[#d0d7de] bg-white p-3 text-left shadow-xl" onWheel={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()}>
    <h3 className="px-3 py-2 text-sm font-bold text-[#213343]">View settings</h3>
    <div className="border-b border-[#e7edf3] pb-3">
      <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-[#8293a6]">View type</p>
      <div className="grid grid-cols-2 gap-2 px-3"><button className={`rounded-lg border px-3 py-2 text-sm font-semibold ${viewMode === "table" ? "border-[#ff5c35] bg-[#fff1eb] text-[#ff5c35]" : "border-[#dbe4ed]"}`} type="button" onClick={() => setViewMode("table")}><Table2 className="mr-2 inline h-4 w-4" />Table</button><button className={`rounded-lg border px-3 py-2 text-sm font-semibold ${viewMode === "board" ? "border-[#ff5c35] bg-[#fff1eb] text-[#ff5c35]" : "border-[#dbe4ed]"}`} type="button" onClick={() => setViewMode("board")}><GripVertical className="mr-2 inline h-4 w-4" />Board</button></div>
    </div>
    <div className="border-b border-[#e7edf3] py-2"><p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8293a6]">Table settings</p><MenuRow icon={Grid2X2} label="Data" value={`${sortBy} · ${sortDirection}`} /><MenuRow icon={Filter} label="Filters" value="Manage filters" /><MenuRow icon={ChevronDown} label="Sort by" value="Manage sorting" onClick={onOpenSort} /></div>
    <div className="border-b border-[#e7edf3] py-2"><p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8293a6]">Sharing</p><MenuRow icon={Copy} label="Copy link to view" onClick={() => void navigator.clipboard?.writeText(window.location.href)} /><MenuRow icon={Share2} label="Manage sharing" /><MenuRow icon={Download} label="Export" hint="Ctrl+Shift+X" onClick={() => action(exportView)} /></div>
    <div className="py-2"><p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8293a6]">Actions</p><MenuRow icon={Settings} label="Save changes" hint="Ctrl+S" onClick={() => action(saveView)} /><MenuRow icon={CopyPlus} label="Reset to last save" onClick={() => action(resetView)} /><MenuRow icon={CopyPlus} label="Clone to new view" /><MenuRow icon={Trash2} label="Delete view" danger /></div>
  </div>;
}

const operatorsByType: Record<string, { value: string; label: string }[]> = {
  text: [{ value: "is", label: "is" }, { value: "is-not", label: "is not" }, { value: "contains", label: "contains" }, { value: "not-contains", label: "does not contain" }, { value: "known", label: "is known" }, { value: "unknown", label: "is unknown" }],
  number: [{ value: "eq", label: "equals" }, { value: "gt", label: "greater than" }, { value: "gte", label: "at least" }, { value: "lt", label: "less than" }, { value: "lte", label: "at most" }],
  date: [{ value: "is", label: "is" }, { value: "gt", label: "after" }, { value: "lt", label: "before" }, { value: "known", label: "is known" }, { value: "unknown", label: "is unknown" }],
  boolean: [{ value: "is", label: "is" }]
};

function AdvancedFilters({ value, onChange, onClose }: { value: FilterGroup; onChange: (value: FilterGroup) => void; onClose: () => void }) {
  const [associationSearch, setAssociationSearch] = useState("");
  const [selectedAssociation, setSelectedAssociation] = useState("Company");
  const association = associationCatalog.find((item) => item.name === selectedAssociation) ?? associationCatalog[0];
  const [selectedField, setSelectedField] = useState(association.fields[0].value);
  const field = association.fields.find((item) => item.value === selectedField) ?? association.fields[0];
  const [operator, setOperator] = useState(operatorsByType[field.type][0].value);
  const [filterValue, setFilterValue] = useState("");
  const addFilter = () => {
    if (!association.available || ["known", "unknown"].includes(operator) || filterValue.trim()) {
      const next: CompanyFilter = { type: "filter", id: `${Date.now()}-${Math.random()}`, association: association.name, field: field.value, operator, value: ["known", "unknown"].includes(operator) ? "" : filterValue };
      onChange({ ...value, children: [...value.children, next] }); setFilterValue("");
    }
  };
  const updateAssociation = (name: string) => { setSelectedAssociation(name); const next = associationCatalog.find((item) => item.name === name) ?? associationCatalog[0]; setSelectedField(next.fields[0].value); setOperator(operatorsByType[next.fields[0].type][0].value); };
  const filteredAssociations = associationCatalog.filter((item) => item.name.toLowerCase().includes(associationSearch.toLowerCase()));
  return <div className="absolute left-0 top-12 z-50 flex max-h-[calc(100vh-180px)] w-[720px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-[#d0d7de] bg-white shadow-xl">
    <aside className="w-[210px] shrink-0 border-r border-[#e7edf3] bg-[#f8fafc] p-3"><h3 className="mb-3 px-2 text-sm font-bold text-[#213343]">Filter by</h3><input className="mb-2 h-9 w-full rounded-lg border border-[#cbd6e2] bg-white px-2 text-xs outline-none" placeholder="Search associations" value={associationSearch} onChange={(event) => setAssociationSearch(event.target.value)} /><div className="max-h-[calc(100vh-270px)] overflow-y-auto">{filteredAssociations.map((item) => <button className={`mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${selectedAssociation === item.name ? "bg-white font-semibold text-[#007a8a] shadow-sm" : "text-[#516f90] hover:bg-white"}`} key={item.name} type="button" onClick={() => updateAssociation(item.name)}>{item.name}{item.available === false ? <span className="text-[10px] text-[#9fb3c8]">Soon</span> : null}</button>)}</div></aside>
    <section className="min-w-0 flex-1 overflow-y-auto p-4"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-base font-bold text-[#213343]">Advanced filters</h3><p className="text-xs text-[#8293a6]">Results update automatically</p></div><button className="text-sm font-semibold text-[#007a8a]" type="button" onClick={onClose}>Done</button></div><div className="mb-4 flex items-center gap-2"><span className="text-xs font-bold uppercase text-[#8293a6]">Match</span><select className="h-8 rounded-lg border border-[#cbd6e2] px-2 text-sm" value={value.logic} onChange={(event) => onChange({ ...value, logic: event.target.value as FilterLogic })}><option value="AND">all filters</option><option value="OR">any filter</option></select></div><div className="space-y-2">{value.children.map((child, index) => child.type === "group" ? <div className="rounded-lg border border-dashed border-[#cbd6e2] p-2" key={`group-${index}`}>Nested group ({child.logic})</div> : <div className="flex items-center gap-2 rounded-lg border border-[#e7edf3] bg-[#f8fafc] p-2" key={child.id}><span className="min-w-0 flex-1 truncate text-sm">{child.association} · {child.field} · {child.operator}{child.value ? ` · ${Array.isArray(child.value) ? child.value.join(" to ") : child.value}` : ""}</span><button className="text-xs font-semibold text-[#b42318]" type="button" onClick={() => onChange({ ...value, children: value.children.filter((_, childIndex) => childIndex !== index) })}>Remove</button></div>)}</div><div className="mt-4 rounded-xl border border-[#dbe4ed] p-3"><div className="grid gap-2 md:grid-cols-3"><select className="h-10 rounded-lg border border-[#9fb3c8] px-2 text-sm" value={selectedAssociation} onChange={(event) => updateAssociation(event.target.value)}>{associationCatalog.map((item) => <option disabled={item.available === false} key={item.name} value={item.name}>{item.name}{item.available === false ? " (not connected)" : ""}</option>)}</select><select className="h-10 rounded-lg border border-[#9fb3c8] px-2 text-sm" value={selectedField} onChange={(event) => { setSelectedField(event.target.value); const next = association.fields.find((item) => item.value === event.target.value) ?? association.fields[0]; setOperator(operatorsByType[next.type][0].value); }} >{association.fields.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select className="h-10 rounded-lg border border-[#9fb3c8] px-2 text-sm" value={operator} onChange={(event) => setOperator(event.target.value)}>{operatorsByType[field.type].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>{!["known", "unknown"].includes(operator) ? <input className="mt-2 h-10 w-full rounded-lg border border-[#9fb3c8] px-3 text-sm" type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"} placeholder="Enter a value" value={filterValue} onChange={(event) => setFilterValue(event.target.value)} /> : null}<div className="mt-3 flex justify-between"><button className="text-sm font-semibold text-[#b42318]" type="button" onClick={() => onChange({ type: "group", logic: "AND", children: [] })}>Clear all</button><button className="rounded-lg bg-[#006b70] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" type="button" disabled={association.available === false || (!["known", "unknown"].includes(operator) && !filterValue.trim())} onClick={addFilter}>Add filter</button></div></div></section>
  </div>;
}

const sortGroups: { title: string; fields: { value: string; label: string }[] }[] = [
  { title: "Company activity", fields: ["Company activity", "Date of last meeting booked in meetings tool", "Campaign of last booking in meetings tool", "Source of last booking in meetings tool", "Last Booked Meeting Date", "Last Logged Call Date", "Last Logged Outgoing Email Date", "Last Open Task Date", "Last Engagement Date", "Last Modified Date", "Last Contacted", "Last Activity Date", "Next Activity Date", "Number of times contacted"].map((label) => ({ value: label, label })) },
  { title: "Deal information", fields: ["First Deal Created Date", "Number of open deals", "Total open deal value", "Number of Associated Deals", "Recent Deal Amount", "Recent Deal Close Date"].map((label) => ({ value: label, label })) },
  { title: "Sales properties", fields: ["Lead Status", "Owner assigned date", "Company owner", "HubSpot Team"].map((label) => ({ value: label, label })) },
  { title: "Company Signals", fields: ["Intent Signals active", "Recent Intent Signals", "Prospecting Agent", "Latest suggested contact date", "Latest Suggested Contact Timestamp", "Max recommendation score", "Plays", "Reason To Reach Out", "Suggested Contact Count"].map((label) => ({ value: label, label })) },
  { title: "Company information", fields: ["About Us", "Street Address", "Street Address 2", "Annual Revenue", "City", "Close Date", "Country/Region", "Create Date", "Days to Close", "Description", "Company Domain Name", "Medium of last booking in meetings tool", "First Contact Create Date", "Year Founded", "Last Touch Converting Campaign", "Latest Traffic Source", "Latest Traffic Source Data 1", "Latest Traffic Source Data 2", "Latest Traffic Source Timestamp", "Original Traffic Source", "Original Traffic Source Drill-Down 1", "Original Traffic Source Drill-Down 2", "Country/Region Code", "Created by user ID", "Current Customer", "Domain status", "Employee range", "Industry group", "Has been enriched", "Company Keywords", "Linkedin handle", "Logo URL", "Merged Company IDs", "Next Renewal Date", "Number of Active Contracts", "Number of child companies", "Record ID", "Record source detail 1", "Record source detail 2", "Record source detail 3", "Record source", "Quick context", "Redirect domain", "Redirect URL", "Revenue range", "State/Region Code", "Updated by user ID", "Industry", "Is Public", "Lifecycle Stage", "Company name", "Number of Associated Contacts", "Number of Employees", "Phone Number", "State/Region", "Time Zone", "Total Money Raised", "Total Revenue", "Type", "Web Technologies", "Website URL", "Postal Code"].map((label) => ({ value: label, label })) },
  { title: "Import", fields: ["List membership"].map((label) => ({ value: label, label })) },
  { title: "Social media information", fields: ["Facebook Company Page", "Facebook Fans", "Google Plus Page", "LinkedIn Company Page", "LinkedIn Bio", "Twitter Bio", "Twitter Followers", "Twitter Handle"].map((label) => ({ value: label, label })) },
  { title: "Web analytics history", fields: ["Time First Seen", "Time Last Seen", "Time of Last Session", "Number of Pageviews", "Number of Sessions"].map((label) => ({ value: label, label })) },
  { title: "Conversion information", fields: ["First Conversion Date", "First Conversion", "First Touch Converting Campaign", "Time of First Session", "Number of Form Submissions", "Recent Conversion Date", "Recent Conversion"].map((label) => ({ value: label, label })) },
  { title: "Target accounts information", fields: ["Ideal Customer Profile Tier", "Target Account", "Number of blockers", "Number of contacts with a buying role", "Number of decision makers"].map((label) => ({ value: label, label })) },
];

function SortBuilder({ value, direction, onChange, onClose }: { value: string; direction: SortDirection; onChange: (value: string, direction: SortDirection) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = sortGroups.map((group) => ({ ...group, fields: group.fields.filter((field) => field.label.toLowerCase().includes(query.toLowerCase())) })).filter((group) => group.fields.length);
  return <div className="absolute left-0 top-12 z-50 max-h-[calc(100vh-180px)] w-[390px] overscroll-contain overflow-y-auto rounded-xl border border-[#d0d7de] bg-white p-3 shadow-xl" onWheel={(event) => event.stopPropagation()}>
    <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-[#213343]">Sort by</h3><button className="text-xs text-[#007a8a]" type="button" onClick={onClose}>Done</button></div>
    <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#9fb3c8] px-3"><Search className="h-4 w-4 text-[#8293a6]" /><input className="h-9 min-w-0 flex-1 text-sm outline-none" placeholder="Search properties" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <div className="mb-3 flex gap-2"><select className="h-10 min-w-0 flex-1 rounded-lg border border-[#9fb3c8] bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value, direction)}>{filtered.map((group) => <optgroup key={group.title} label={group.title}>{group.fields.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}</optgroup>)}</select><div className="flex overflow-hidden rounded-full border border-[#9fb3c8]"><button className={`px-3 text-sm ${direction === "desc" ? "bg-[#e7edf3]" : "bg-white"}`} type="button" onClick={() => onChange(value, "desc")} aria-label="High to low">9 → 0</button><button className={`border-l border-[#9fb3c8] px-3 text-sm ${direction === "asc" ? "bg-[#e7edf3]" : "bg-white"}`} type="button" onClick={() => onChange(value, "asc")} aria-label="Low to high">0 → 9</button></div></div>
    <div className="max-h-[240px] overflow-y-auto rounded-lg border border-[#eef2f6] px-2">{filtered.map((group) => <div key={group.title}><p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-[#8293a6]">{group.title}</p>{group.fields.map((field) => <button className={`block w-full rounded-md px-2 py-1 text-left text-sm ${value === field.value ? "bg-[#eef6f6] font-semibold text-[#006b70]" : "text-[#213343] hover:bg-[#f7f9fb]"}`} key={field.value} type="button" onClick={() => onChange(field.value, direction)}>{field.label}{value === field.value ? <span className="float-right text-xs">✓</span> : null}</button>)}</div>)}</div>
  </div>;
}

function MenuRow({ icon: Icon, label, value, hint, onClick, danger }: { icon: typeof Settings; label: string; value?: string; hint?: string; onClick?: () => void; danger?: boolean }) { return <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7f9fb] ${danger ? "text-[#d92d20]" : "text-[#213343]"}`} type="button" onClick={onClick}><Icon className="h-4 w-4 shrink-0" /><span className="flex-1">{label}</span>{value ? <span className="text-xs text-[#8293a6]">{value}</span> : null}{hint ? <span className="text-xs text-[#8293a6]">{hint}</span> : null}</button>; }

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
            <td className="relative px-4 py-4 text-right"><button type="button" aria-label="Company actions" onClick={() => setOpenMenu((current) => current === company.id ? null : company.id)}><EllipsisVertical className="ml-auto h-5 w-5" /></button>{openMenu === company.id ? <div className="absolute right-3 top-14 z-30 w-52 rounded-xl border border-[#dbe4ed] bg-white p-1 text-left shadow-xl"><Link className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#fff1eb] hover:text-[#ff5c35]" href={`/companies/new?parentCompanyId=${encodeURIComponent(company.id)}`} onClick={() => setOpenMenu(null)}>Add sub-company</Link><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-[#f7f9fb]" href={`/companies/${company.id}`}>View company</Link><button className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fff1eb] ${company.isArchived ? "text-[#007a8a]" : "text-[#b42318]"}`} type="button" onClick={async () => { setOpenMenu(null); await fetch(`${API_URL}/companies/${company.id}/${company.isArchived ? "restore" : "archive"}`, { method: "POST" }); await onRefresh(); }}>{company.isArchived ? "Restore company" : "Archive company"}</button></div> : null}</td>
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

function CircleButton({ icon: Icon, label, onClick, active }: { icon: typeof Plus; label: string; onClick?: () => void; active?: boolean }) {
  return <button className={`grid h-10 w-10 place-items-center rounded-full border text-[#213343] hover:border-[#ff5c35] hover:text-[#ff5c35] ${active ? "border-[#ff5c35] bg-[#fff1eb] text-[#ff5c35]" : "border-[#9fb3c8] bg-white"}`} aria-label={label} onClick={onClick} type="button"><Icon className="h-4 w-4" /></button>;
}

function ViewButton({ icon: Icon, active, onClick }: { icon: typeof List; active?: boolean; onClick: () => void }) {
  return <button className={`grid h-10 w-10 place-items-center rounded-full border border-[#9fb3c8] ${active ? "bg-[#f2f5f8]" : "bg-white"}`} onClick={onClick} type="button"><Icon className="h-4 w-4" /></button>;
}
