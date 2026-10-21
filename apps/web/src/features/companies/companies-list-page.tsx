"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Company = { id: string; name: string; phone?: string | null; createdAt?: string; updatedAt?: string; owner?: { name: string } | null; industry?: string | null; city?: string | null; state?: string | null; country: string; regions: string[]; isArchived: boolean; parentCompanyId?: string | null };
type CompanyResponse = { data: Company[]; page: number; limit: number; total: number; totalPages: number };

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
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const loadCompanies = async () => {
    setLoading(true); setError("");
    try { const response = await fetch(`${API_URL}/companies?search=${encodeURIComponent(search)}&archived=${showArchived}`); if (!response.ok) throw new Error(); const result = (await response.json()) as CompanyResponse; setCompanies(result.data); }
    catch { setError("Unable to load companies. Make sure the backend and database are running."); }
    finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(() => void loadCompanies(), 250); return () => window.clearTimeout(timer); }, [search, showArchived]);

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
            {viewMode === "board" ? (
              <button className="inline-flex items-center gap-3 border-b-2 border-[#008a3d] px-4 py-2.5 text-sm font-medium text-[#213343]" type="button">
                <GripVertical className="h-4 w-4" />
                All companies-3
                <Check className="h-4 w-4" />
              </button>
            ) : null}
            <button className={`px-4 py-2.5 text-sm font-medium ${viewMode === "table" ? "border-b-2 border-[#ff5c35] bg-[#fff1eb] text-[#ff5c35]" : "text-[#516f90]"}`} onClick={() => setViewMode("table")} type="button">
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
            <button className="p-3 text-[#213343]" aria-label="Add view" onClick={() => setShowViewMenu((open) => !open)} type="button">
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
            <button className="inline-flex h-10 items-center gap-2 rounded-full border border-[#9fb3c8] bg-[#f7f9fb] px-4 text-sm font-medium"><Filter className="h-4 w-4" />Filter</button>
            <button className="inline-flex h-10 items-center gap-2 rounded-full border border-[#9fb3c8] bg-white px-4 text-sm font-medium"><ChevronsUpDown className="h-4 w-4" />Sort by</button>
            <button className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium ${showArchived ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#9fb3c8] bg-white"}`} type="button" onClick={() => setShowArchived((value) => !value)}>Archived</button>
            <span className="h-8 w-px bg-[#dbe4ed]" />
            <CircleButton icon={Plus} label="Add property" />
            <CircleButton icon={Columns3} label="Edit columns" />
            <button className="inline-flex h-10 items-center gap-2 px-3 text-sm font-bold text-[#213343]"><Filter className="h-4 w-4" />Advanced filters</button>
          </div>
          <div className="flex items-center gap-2">
            <ViewButton active={viewMode === "board"} icon={GripVertical} onClick={() => setViewMode("board")} />
            <ViewButton active={viewMode === "table"} icon={Grid2X2} onClick={() => setViewMode("table")} />
            <CircleButton icon={Settings} label="Table settings" />
            <CircleButton icon={ChevronDown} label="Collapse" />
          </div>
        </div>

        {loading ? <div className="p-10 text-center text-[#516f90]">Loading companies...</div> : error ? <div className="p-10 text-center text-[#b42318]">{error}</div> : companies.length === 0 ? <div className="p-10 text-center text-[#516f90]">No companies found.</div> : viewMode === "table" ? <CompaniesTable companies={companies} onRefresh={loadCompanies} /> : <CompaniesBoard board={{ ...board, Subscriber: companies.map((company) => ({ id: company.id, name: company.name, date: company.city || "--", due: company.regions.join(", ") || "No region" })) }} onMoveCard={moveCard} />}
      </div>
    </AppShell>
  );
}

function CreateViewButton({ icon: Icon, label, onClick }: { icon: typeof Table2; label: string; onClick: () => void }) {
  return <button className="rounded-md border border-[#d0d7de] p-4 text-center hover:border-[#ff5c35]" onClick={onClick} type="button"><Icon className="mx-auto h-5 w-5" /><span className="mt-2 block text-sm">{label}</span></button>;
}

function CompaniesTable({ companies, onRefresh }: { companies: Company[]; onRefresh: () => Promise<void> }) {
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
            <th className="px-4 py-4">Last activity date</th>
            <th className="w-14 px-4 py-4 text-right"><Plus className="ml-auto h-5 w-5" /></th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => <tr className="h-20 border-b border-[#e7edf3] text-base hover:bg-[#f7f9fb]" key={company.id}>
            <td className="px-5 py-4"><span className="block h-6 w-6 rounded border border-[#9fb3c8]" /></td>
            <td className="px-4 py-4"><Link className="inline-flex items-center gap-3 font-bold text-[#007a8a]" href={`/companies/${company.id}`}><ChevronRight className="h-4 w-4 text-[#516f90]" /><span className="text-[#ff5c35]">{company.name[0]}</span>{company.name}</Link></td>
            <td className="px-4 py-4">{company.owner?.name || "No owner"}</td>
            <td className="px-4 py-4">{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "--"}</td>
            <td className="px-4 py-4">{company.phone || "--"}</td>
            <td className="px-4 py-4">{company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : "--"}</td>
            <td className="px-4 py-4 text-right"><button type="button" aria-label="Archive company" onClick={async () => { await fetch(`${API_URL}/companies/${company.id}/archive`, { method: "POST" }); await onRefresh(); }}><EllipsisVertical className="ml-auto h-5 w-5" /></button></td>
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

function CompaniesBoard({ board, onMoveCard }: { board: BoardState; onMoveCard: (cardId: string, targetColumn: BoardColumn) => void }) {
  return (
    <div className="overflow-x-auto border-t border-[#dbe4ed] pb-2">
      <div className="flex min-w-[1280px] gap-3 py-3">
        {(Object.keys(board) as BoardColumn[]).map((column) => (
          <section className="flex h-[245px] w-[350px] shrink-0 flex-col rounded-2xl bg-[#eeeeee]" key={column} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const cardId = event.dataTransfer.getData("text/plain"); if (cardId) onMoveCard(cardId, column); }}>
            <div className="px-3 pt-3 text-sm font-bold"><span className={`inline-flex rounded-md px-3 py-1 ${columnColors[column]}`}>{column}</span><span className="ml-2">{board[column].length}</span></div>
            <div className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
              {board[column].map((card) => (
                <Link className="block rounded-2xl border border-[#d0d7de] bg-white p-4 shadow-sm transition hover:shadow-md" draggable href="/companies/acme-industries" key={card.id} onDragStart={(event) => event.dataTransfer.setData("text/plain", card.id)}>
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

function CircleButton({ icon: Icon, label }: { icon: typeof Plus; label: string }) {
  return <button className="grid h-10 w-10 place-items-center rounded-full border border-[#9fb3c8] bg-white text-[#213343]" aria-label={label}><Icon className="h-4 w-4" /></button>;
}

function ViewButton({ icon: Icon, active, onClick }: { icon: typeof List; active?: boolean; onClick: () => void }) {
  return <button className={`grid h-10 w-10 place-items-center rounded-full border border-[#9fb3c8] ${active ? "bg-[#f2f5f8]" : "bg-white"}`} onClick={onClick} type="button"><Icon className="h-4 w-4" /></button>;
}
