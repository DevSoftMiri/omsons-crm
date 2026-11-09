/* eslint-disable no-irregular-whitespace */
"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RecordDetailHeader } from "@/components/ui/crm-page-template";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createHeaders, createIdempotencyKey } from "@/lib/idempotency";
import { industryOptions } from "./company-industries";
import { MeetingModal, type Meeting } from "../meetings/meetings-page";
import {
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Ellipsis,
  GripVertical,
  ExternalLink,
  FileUp,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  UserRound,
  UsersRound,
  Trash2,
  X
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const leadStatuses = [
  ["New", "bg-[#e8f5e9] text-[#2e7d32]"], ["Contacted", "bg-[#e3f2fd] text-[#1565c0]"], ["Qualified", "bg-[#ede7f6] text-[#6a1b9a]"],
  ["Proposal", "bg-[#fff3e0] text-[#e65100]"], ["Won", "bg-[#dff7e8] text-[#087443]"], ["Lost", "bg-[#ffebee] text-[#c62828]"]
] as const;
type CompanyContact = { id: string; firstName: string; lastName?: string | null; email?: string | null; phone?: string | null; title?: string | null; department?: string | null; roleInPurchase?: string | null; lifecycleStage?: string | null; leadStatus?: string | null; owner?: { name: string } | null; company?: { id: string; name: string } | null };
const repairContactText = (value?: string | null) => {
  if (!value || !/[ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡]/.test(value)) return value;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(value, (character) => character.charCodeAt(0)));
  } catch {
    return value;
  }
};
type CompanyDeal = { id: string; name: string; amount?: number | string | null; stage?: string | null; pipeline?: string | null; priority?: string | null; closeDate?: string | null; contactId?: string | null; company?: { id: string; name: string } | null; contact?: { id: string; firstName: string; lastName?: string | null } | null };
type CompanyNote = { id: string; title?: string | null; body: string; createdAt: string; links?: Array<{ activityId: string; kind: string }> };
type CompanyTask = { id: string; title: string; companyId: string; status?: "TODO" | "IN_PROGRESS" | "WAITING" | "COMPLETED"; dueAt?: string | null; reminderAt?: string | null; taskType?: string | null; priority?: string | null; queue?: string | null; notes?: string | null; doneAt?: string | null; assignee?: { id: string; name: string } | null; company?: { id: string; name: string } | null };
type CompanyRecord = { id: string; name: string; website?: string | null; phone?: string | null; regions: string[]; city?: string | null; state?: string | null; postalCode?: string | null; country?: string | null; numberOfEmployees?: number | null; annualRevenue?: number | string | null; timeZone?: string | null; description?: string | null; linkedinCompanyPage?: string | null; industry?: string | null; lifecycleStage?: string | null; leadStatus?: string | null; ownerId?: string | null; ownerName?: string | null; owner?: { id: string; name: string } | null; contacts: CompanyContact[]; deals: CompanyDeal[]; parentCompanyId: string | null; parentCompany?: { id: string; name: string } | null; subCompanies: Array<{ id: string; name: string; regions: string[] }> };

const _info = [
  ["Company owner", "No owner", UserRound],
  ["City", "--", MapPin],
  ["Industry", "--", Building2],
  ["Lifecycle Stage", "Lead", Target],
  ["Lead Status", "--", Target]
] as const;

const contacts = [
  { initials: "BH", name: "Brian Halligan", title: "Executive Chairperson", email: "bh@acmeindustries.com" },
  { initials: "MJ", name: "Maria Johnson", title: "Salesperson", email: "emailmaria@acmeindustries.com" }
];

export function CompanyDetailPage({ companyId = "seed-main-company" }: { companyId?: string }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [newRegion, setNewRegion] = useState("");
  const [selectedSubCompany, setSelectedSubCompany] = useState("");
  const [error, setError] = useState("");
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [companyMeetings, setCompanyMeetings] = useState<Meeting[]>([]);
  const [companyNotes, setCompanyNotes] = useState<CompanyNote[]>([]);
  const [companyTasks, setCompanyTasks] = useState<CompanyTask[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CompanyTask | null>(null);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsError, setDealsError] = useState("");
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState("");
  const loadCompany = async () => {
    setMeetingsLoading(true);
    setMeetingsError("");
    const response = await fetch(`${API_URL}/companies?limit=100`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load companies from the production API");
    const result = await response.json() as { data: CompanyRecord[] };
    const records = result.data ?? [];
    setCompanies(records);
    let detail = await fetch(`${API_URL}/companies/${companyId}`, { cache: "no-store" });
    if (!detail.ok) {
      const normalized = companyId.toLowerCase().replace(/-/g, " ");
      const match = records.find((record) => record.id === companyId || record.name.toLowerCase() === normalized || record.name.toLowerCase().replace(/\s+/g, "-") === companyId.toLowerCase());
      if (match) detail = await fetch(`${API_URL}/companies/${match.id}`, { cache: "no-store" });
      if (!detail.ok && match) {
        setCompany(match as CompanyRecord);
        detail = new Response(JSON.stringify(match), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (!detail.ok) throw new Error("Company not found in the production database");
    }
    const loaded = await detail.json().catch(() => ({})) as Partial<CompanyRecord>;
    if (!loaded.id && !loaded.name) throw new Error("Company response was invalid");
    const resolvedCompanyId = String(loaded.id ?? companyId);
    try {
      const tasksResponse = await fetch(`${API_URL}/tasks?companyId=${encodeURIComponent(resolvedCompanyId)}`, { cache: "no-store" });
      setCompanyTasks(tasksResponse.ok ? await tasksResponse.json() as CompanyTask[] : []);
    } catch { setCompanyTasks([]); }
    const nestedDeals = Array.isArray(loaded.deals) ? loaded.deals : [];
    setDealsLoading(true);
    setDealsError("");
    let associatedDeals = nestedDeals;
    try {
      const dealsResponse = await fetch(`${API_URL}/deals?companyId=${encodeURIComponent(resolvedCompanyId)}`, { cache: "no-store" });
      if (!dealsResponse.ok) throw new Error("Unable to load company deals");
      const dealsPayload = await dealsResponse.json() as unknown;
      associatedDeals = Array.isArray(dealsPayload) ? dealsPayload as CompanyDeal[] : Array.isArray((dealsPayload as { data?: unknown })?.data) ? (dealsPayload as { data: CompanyDeal[] }).data : [];
      if (process.env.NODE_ENV === "development" && associatedDeals.length === 0) console.warn("Company has no associated deals", { companyId: resolvedCompanyId, companyName: loaded.name ?? companyId, nestedDealCount: nestedDeals.length, apiDealCount: associatedDeals.length });
    } catch (dealError) {
      setDealsError(dealError instanceof Error ? dealError.message : "Unable to load company deals");
      associatedDeals = nestedDeals;
    } finally {
      setDealsLoading(false);
    }
    setCompany({ ...loaded, contacts: Array.isArray(loaded.contacts) ? loaded.contacts : [], deals: associatedDeals, regions: Array.isArray(loaded.regions) ? loaded.regions : [], subCompanies: Array.isArray(loaded.subCompanies) ? loaded.subCompanies : [], id: resolvedCompanyId, name: loaded.name ?? "Company", parentCompanyId: loaded.parentCompanyId ?? null } as CompanyRecord);
    try {
      const linkedCompanyId = encodeURIComponent((loaded.id ?? companyId) as string);
      const firstPageResponse = await fetch(`${API_URL}/meetings?companyId=${linkedCompanyId}&page=1&limit=100&sortBy=activityAt&sortOrder=desc`, { cache: "no-store" });
      if (!firstPageResponse.ok) throw new Error("Unable to load company meetings");
      const firstPage = await firstPageResponse.json() as { data?: Meeting[]; limit?: number; total?: number };
      const meetings = [...(firstPage.data ?? [])];
      const limit = firstPage.limit ?? 100;
      const pages = Math.ceil((firstPage.total ?? meetings.length) / limit);
      if (pages > 1) {
        const remainingPages = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => fetch(`${API_URL}/meetings?companyId=${linkedCompanyId}&page=${index + 2}&limit=${limit}&sortBy=activityAt&sortOrder=desc`, { cache: "no-store" }).then(async (pageResponse) => {
          if (!pageResponse.ok) throw new Error("Unable to load all company meetings");
          return pageResponse.json() as Promise<{ data?: Meeting[] }>;
        })));
        remainingPages.forEach((page) => meetings.push(...(page.data ?? [])));
      }
      meetings.sort((left, right) => new Date(right.activityAt).getTime() - new Date(left.activityAt).getTime() || right.id.localeCompare(left.id));
      setCompanyMeetings(meetings);
      const notesResponse = await fetch(`${API_URL}/notes?companyId=${linkedCompanyId}`, { cache: "no-store" });
      if (notesResponse.ok) setCompanyNotes(((await notesResponse.json()) as { data?: CompanyNote[] }).data ?? []);
    } catch (meetingError) {
      setCompanyMeetings([]);
      setMeetingsError(meetingError instanceof Error ? meetingError.message : "Unable to load company meetings");
    } finally {
      setMeetingsLoading(false);
    }
  };
  useEffect(() => { void loadCompany().catch(() => setError("Unable to load company hierarchy")); }, [companyId]);
  const openMeeting = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json() as { data?: Array<{ id: string; name: string }> } | Array<{ id: string; name: string }>;
        setUsers(Array.isArray(payload) ? payload : payload.data ?? []);
      }
    } catch {
      setUsers([]);
    }
    setMeetingModalOpen(true);
  };
  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const toggleSection = (title: string) => setCollapsedSections((sections) => ({ ...sections, [title]: !sections[title] }));

  return (
    <AppShell>
      <div className="mx-auto min-h-screen max-w-[1240px] overflow-visible">
        <div className="mb-3 flex items-center gap-2 px-1 text-sm text-[#516f90]">
          <Link className="inline-flex items-center gap-2 hover:text-[#ff5c35]" href="/companies">
            <ChevronLeft className="h-4 w-4" />
            <span>Companies</span>
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-[#213343]">{company?.name ?? "Loading company..."}</span>
        </div>

        <CompanyHeader compact={headerCompact} company={company} companies={companies} users={users} onRefresh={loadCompany} onOpenMeeting={() => void openMeeting()} onOpenTask={() => setTaskModalOpen(true)} onOpenNote={() => setNoteModalOpen(true)} />
        <section className="mt-4 space-y-3">

            <div className="grid grid-cols-4 border-b border-[#dbe4ed] bg-transparent text-sm">
              {["Overview", "Activities", "Related", "Settings"].map((tab, index) => (
                <button
                  className={`flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1.5 py-3 font-semibold transition hover:bg-[#f7f9fb] ${
                    activeTab === tab ? "border-[#ff5c35] text-[#ff5c35]" : "border-transparent text-[#516f90]"
                  }`}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {index === 0 ? <Sparkles className="h-4 w-4 shrink-0" /> : index === 3 ? <Settings className="h-4 w-4 shrink-0" /> : <UsersRound className="h-4 w-4 shrink-0" />}
                  <span className="min-w-0 truncate">{tab}</span>
                </button>
              ))}
            </div>

            {activeTab === "Overview" ? (
              <div className={`relative min-w-0 grid gap-4 pt-2 ${rightRailCollapsed ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_380px]"}`}>
                <OverviewWorkspace />
                <button className={`absolute top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid ${rightRailCollapsed ? "right-0" : "right-[calc(380px+1rem)]"}`} onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records">
                  <ChevronRight className={`h-4 w-4 transition ${rightRailCollapsed ? "rotate-180" : ""}`} />
                </button>
                <aside className={`space-y-4 ${rightRailCollapsed ? "hidden" : ""}`}>
                  <RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} dealsLoading={dealsLoading} dealsError={dealsError} />
                </aside>
              </div>
            ) : null}
            {activeTab === "Activities" ? (
              <div className={`relative min-w-0 grid gap-4 pt-2 ${rightRailCollapsed ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_380px]"}`}>
                <ActivityWorkspace company={company} meetings={companyMeetings} notes={companyNotes} tasks={companyTasks} loading={meetingsLoading} error={meetingsError} onCreateTask={() => { setEditingTask(null); setTaskModalOpen(true); }} onEditTask={(task) => { setEditingTask(task); setTaskModalOpen(true); }} onTaskChange={loadCompany} />
                <button className={`absolute top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid ${rightRailCollapsed ? "right-0" : "right-[calc(380px+1rem)]"}`} onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records">
                  <ChevronRight className={`h-4 w-4 transition ${rightRailCollapsed ? "rotate-180" : ""}`} />
                </button>
                <aside className={rightRailCollapsed ? "hidden" : "space-y-4"}>
                  <RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} dealsLoading={dealsLoading} dealsError={dealsError} />
                </aside>
              </div>
            ) : null}
            {activeTab === "Related" ? (
              <div className="relative grid gap-4 pt-2 xl:grid-cols-[minmax(0,1fr)_380px]">
                <CompanyHierarchy company={company} companies={companies} newRegion={newRegion} selectedSubCompany={selectedSubCompany} setNewRegion={setNewRegion} setSelectedSubCompany={setSelectedSubCompany} onRefresh={loadCompany} error={error} />
                <button className={`absolute top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid ${rightRailCollapsed ? "right-0" : "right-[calc(380px+1rem)]"}`} onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records"><ChevronRight className="h-4 w-4" /></button>
                <aside className="space-y-4"><RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} dealsLoading={dealsLoading} dealsError={dealsError} /></aside>
              </div>
            ) : null}
            {activeTab === "Settings" ? (
              <div className="relative grid gap-4 pt-2 xl:grid-cols-[minmax(0,1fr)_380px]">
                <PlaceholderTab title="Company settings" />
                <button className={`absolute top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid ${rightRailCollapsed ? "right-0" : "right-[calc(380px+1rem)]"}`} onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records"><ChevronRight className="h-4 w-4" /></button>
                <aside className="space-y-4"><RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} dealsLoading={dealsLoading} dealsError={dealsError} /></aside>
              </div>
            ) : null}
        </section>
      </div>
      {meetingModalOpen && company ? <MeetingModal meeting={null} users={users} contacts={company.contacts.map((contact) => ({ id: contact.id, firstName: contact.firstName, lastName: contact.lastName, email: contact.email }))} deals={company.deals.map((deal) => ({ id: deal.id, name: deal.name }))} companies={companies.map((item) => ({ id: item.id, name: item.name, parentCompanyId: item.parentCompanyId }))} initialCompanyId={company.id} initialCompanyName={company.name} onClose={() => setMeetingModalOpen(false)} onSaved={async () => { setMeetingModalOpen(false); await loadCompany(); }} /> : null}
      {noteModalOpen && company ? <CreateNoteModal company={company} users={users} onClose={() => setNoteModalOpen(false)} onSaved={async () => { setNoteModalOpen(false); await loadCompany(); }} /> : null}
      {taskModalOpen && company ? <CreateTaskModal company={company} users={users} task={editingTask} onClose={() => { setTaskModalOpen(false); setEditingTask(null); }} onSaved={async () => { setTaskModalOpen(false); setEditingTask(null); await loadCompany(); }} /> : null}
    </AppShell>
  );
}

function CompanyHierarchy({ company, companies, newRegion, selectedSubCompany, setNewRegion, setSelectedSubCompany, onRefresh, error }: { company: CompanyRecord | null; companies: CompanyRecord[]; newRegion: string; selectedSubCompany: string; setNewRegion: (value: string) => void; setSelectedSubCompany: (value: string) => void; onRefresh: () => Promise<void>; error: string }) {
  const updateRegions = async (regions: string[]) => {
    if (!company) return;
    await fetch(`${API_URL}/companies/${company.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: company.name, regions }) });
    await onRefresh();
  };
  const addRegion = async () => {
    const region = newRegion.trim();
    if (region && company && !company.regions.includes(region)) { setNewRegion(""); await updateRegions([...company.regions, region]); }
  };
  const addSubCompany = async () => {
    if (!company || !selectedSubCompany) return;
    await fetch(`${API_URL}/companies/${company.id}/sub-companies/${selectedSubCompany}`, { method: "POST" });
    setSelectedSubCompany(""); await onRefresh();
  };
  const removeSubCompany = async (id: string) => {
    if (!company || !window.confirm("Unlink this sub-company?")) return;
    await fetch(`${API_URL}/companies/${company.id}/sub-companies/${id}`, { method: "DELETE" });
    await onRefresh();
  };
  if (!company) return <PlaceholderTab title={error || "Loading company hierarchy"} />;
  const options = companies.filter((item) => item.id !== company.id && !item.parentCompanyId);
  return <div className="space-y-4 rounded-xl border border-[#dbe4ed] bg-white p-5">
    <div><h2 className="text-lg font-bold text-[#213343]">Company hierarchy</h2><p className="text-sm text-[#516f90]">Manage direct sub-companies without rolling up their records.</p></div>
    {company.parentCompany ? <p className="rounded-md bg-[#f7f9fb] px-3 py-2 text-sm">Main company: <Link className="font-semibold text-[#007a8a]" href={`/companies/${company.parentCompany.id}`}>{company.parentCompany.name}</Link></p> : null}
    <div className="flex flex-wrap gap-2">{company.subCompanies.length ? company.subCompanies.map((sub) => <span className="inline-flex items-center gap-2 rounded-full bg-[#eef6f6] px-3 py-1.5 text-sm" key={sub.id}><Link className="font-semibold text-[#007a8a]" href={`/companies/${sub.id}`}>{sub.name}</Link><button type="button" aria-label={`Unlink ${sub.name}`} onClick={() => void removeSubCompany(sub.id)}><Trash2 className="h-3.5 w-3.5 text-[#b42318]" /></button></span>) : <span className="text-sm text-[#516f90]">No sub-companies yet.</span>}</div>
    <div className="flex flex-wrap gap-2"><select className="rounded-md border border-[#9fb3c8] px-3 py-2 text-sm" value={selectedSubCompany} onChange={(event) => setSelectedSubCompany(event.target.value)}><option value="">Select existing company</option>{options.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button className="rounded-md bg-[#006b70] px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => void addSubCompany()}>Add sub-company</button></div>
    <div className="border-t border-[#dbe4ed] pt-4"><h3 className="font-bold text-[#213343]">Regions</h3><div className="mt-2 flex flex-wrap gap-2">{company.regions.map((region) => <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1eb] px-3 py-1.5 text-sm" key={region}>{region}<button type="button" onClick={() => void updateRegions(company.regions.filter((item) => item !== region))} aria-label={`Remove ${region}`}>&times;</button></span>)}</div><div className="mt-3 flex gap-2"><input className="rounded-md border border-[#9fb3c8] px-3 py-2 text-sm" placeholder="Add region" value={newRegion} onChange={(event) => setNewRegion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addRegion(); }} /><button className="rounded-md border border-[#006b70] px-4 py-2 text-sm font-semibold text-[#006b70]" type="button" onClick={() => void addRegion()}>Add region</button></div></div>
  </div>;
}

function CompanyContactModal({ companyId, currentContacts, onClose, onSaved }: { companyId: string; currentContacts: CompanyContact[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [contacts, setContacts] = useState<CompanyContact[]>([]); const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", owner: "", title: "", department: "", roleInPurchase: "", phone: "", lifecycleStage: "", leadStatus: "" });
  const creating = useRef(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  useEffect(() => { if (tab !== "existing") return; setLoadingContacts(true); setError(""); void fetch(`${API_URL}/contacts`).then(async (response) => { const payload = await response.json().catch(() => null); if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Unable to load contacts"); return payload; }).then((payload: unknown) => { const value = payload as { data?: CompanyContact[]; value?: CompanyContact[] } | null; setContacts(Array.isArray(payload) ? payload : Array.isArray(value?.data) ? value.data : Array.isArray(value?.value) ? value.value : []); }).catch((loadError) => { setContacts([]); setError(loadError instanceof Error ? loadError.message : "Unable to load contacts"); }).finally(() => setLoadingContacts(false)); }, [tab]);
  const create = async (event: React.FormEvent) => { event.preventDefault(); if (creating.current) return; creating.current = true; setSaving(true); setError(""); try { const response = await fetch(`${API_URL}/contacts`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, title: form.title, department: form.department, roleInPurchase: form.roleInPurchase, lifecycleStage: form.lifecycleStage, leadStatus: form.leadStatus, owner: form.owner, companyId }) }); const payload = await response.json().catch(() => null); if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Unable to create contact"); await onSaved(); } catch (createError) { setError(createError instanceof Error ? createError.message : "Unable to create contact"); } finally { creating.current = false; setSaving(false); } };
  const [linkingIds, setLinkingIds] = useState<Set<string>>(new Set());
  const addExisting = async (id: string) => { if (linkingIds.has(id)) return; setLinkingIds((current) => new Set(current).add(id)); setError(""); try { const response = await fetch(`${API_URL}/companies/${companyId}/contacts/${id}`, { method: "POST" }); const payload = await response.json().catch(() => null); if (!response.ok) throw new Error((payload as { message?: string } | null)?.message || "Unable to link contact"); await onSaved(); } catch (linkError) { setError(linkError instanceof Error ? linkError.message : "Unable to link contact"); } finally { setLinkingIds((current) => { const next = new Set(current); next.delete(id); return next; }); } };
  const available = (Array.isArray(contacts) ? contacts : []).filter((contact) => !(currentContacts ?? []).some((current) => current.id === contact.id) && `${contact.firstName} ${contact.lastName ?? ""} ${contact.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#111827]/45 p-4"><div className="max-h-[90vh] w-full max-w-[680px] overflow-auto rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#dbe4ed] px-6 py-4"><h2 className="text-xl font-bold">{tab === "new" ? "Create new Contact" : "Add existing Contact"}</h2><button className="grid h-9 w-9 place-items-center rounded-md text-[#516f90] transition hover:bg-[#f1f5f9] hover:text-[#213343]" type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="grid grid-cols-2 border-b border-[#dbe4ed] text-center font-semibold"><button className={`border-b-4 px-4 py-3 ${tab === "new" ? "border-[#333]" : "border-transparent"}`} type="button" onClick={() => { setTab("new"); setError(""); }}>Create new</button><button className={`border-b-4 px-4 py-3 ${tab === "existing" ? "border-[#333]" : "border-transparent"}`} type="button" onClick={() => { setTab("existing"); setError(""); }}>Add existing</button></div>{error ? <p className="mx-6 mt-4 rounded-md bg-[#fff1f0] px-3 py-2 text-sm text-[#b42318]">{error}</p> : null}{tab === "new" ? <form className="grid gap-4 p-6 sm:grid-cols-2" onSubmit={create}>{(["email", "firstName", "lastName", "owner", "title", "department", "roleInPurchase", "phone"] as const).map((field) => <label className="grid gap-1 text-sm font-semibold" key={field}>{field === "owner" ? "Contact owner" : field === "title" ? "Job title" : field === "firstName" ? "First name" : field === "lastName" ? "Last name" : field === "phone" ? "Phone number" : field === "department" ? "Department" : field === "roleInPurchase" ? "Role in purchase" : "Email"}<input className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" required={field === "email" || field === "firstName"} type={field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => update(field, event.target.value)} /></label>)}<label className="grid gap-1 text-sm font-semibold">Lifecycle stage<select className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" value={form.lifecycleStage} onChange={(event) => update("lifecycleStage", event.target.value)}><option value="">Select stage</option><option>Subscriber</option><option>Lead</option><option>Customer</option></select></label><label className="relative grid gap-1 text-sm font-semibold">Lead status<button className="flex w-full items-center justify-between rounded-md border border-[#cbd6e2] px-4 py-3 text-left font-normal" type="button" onClick={() => setStatusOpen((open) => !open)}><span className={leadStatuses.find(([status]) => status === form.leadStatus)?.[1] ?? "text-[#516f90]"}>{form.leadStatus || "Select status"}</span><ChevronDown className="h-4 w-4 text-[#516f90]" aria-hidden="true" /></button>{statusOpen ? <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-48 overflow-y-auto overscroll-contain rounded-md border border-[#cbd6e2] bg-white p-1 shadow-lg">{leadStatuses.map(([status, color]) => <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[#f7f9fb]" type="button" key={status} onClick={() => { update("leadStatus", status); setStatusOpen(false); }}><span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${color}`}>{status}</span></button>)}</div> : null}</label><div className="flex justify-end gap-2 sm:col-span-2"><button className="rounded-md border px-4 py-2" type="button" onClick={onClose}>Cancel</button><button className="rounded-md bg-[#006b70] px-4 py-2 font-semibold text-white" disabled={saving} type="submit">{saving ? "Creating..." : "Create"}</button></div></form> : <div className="p-6"><input className="mb-4 w-full rounded-full border-2 border-[#1473e6] px-4 py-3" placeholder="Search Contacts" value={search} onChange={(event) => setSearch(event.target.value)} />{loadingContacts ? <p className="py-6 text-center text-sm text-[#516f90]">Loading contacts...</p> : available.length ? available.map((contact) => <label className="flex items-center gap-3 border-b py-3" key={contact.id}><input type="checkbox" disabled={linkingIds.has(contact.id)} onChange={() => void addExisting(contact.id)} /><span>{contact.firstName} {contact.lastName ?? ""} ({contact.email || "No email"}){contact.company?.name ? ` — ${contact.company.name}` : ""}</span></label>) : <p className="py-6 text-center text-sm text-[#516f90]">No existing contacts available.</p>}</div>}</div></div>;
}

function CreateDealModal({ company, onClose, onSaved }: { company: CompanyRecord; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", amount: "", closeDate: "", stage: "Appointment Scheduled", priority: "MEDIUM", contactId: "", dealType: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/deals`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ name: form.name.trim(), amount: form.amount || null, closeDate: form.closeDate || null, stage: form.stage, priority: form.priority, dealType: form.dealType || null, contactId: form.contactId || null, companyId: company.id, pipeline: "Sales Pipeline" }) });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || "Unable to create deal");
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create deal");
    } finally {
      setSaving(false);
    }
  };
  const input = "h-10 w-full rounded-lg border border-[#b8c5d1] bg-white px-3 text-sm outline-none focus:border-[#005c5f]";
  const field = (label: string, children: React.ReactNode, full = false) => <label className={`block min-w-0 text-sm font-semibold text-[#213343] ${full ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block">{label}</span>{children}</label>;
  return <div className="fixed inset-0 z-[90] flex h-dvh items-center justify-center overflow-hidden bg-[#111827]/45 p-2 sm:p-4" onMouseDown={onClose} role="dialog" aria-modal="true"><form className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex shrink-0 items-center justify-between border-b border-[#dbe4ed] px-4 py-3 sm:px-6 sm:py-4"><h2 className="text-xl font-semibold">Create Deal</h2><button className="rounded-md px-2 text-2xl leading-none text-[#516f90] hover:bg-[#f1f5f9]" type="button" onClick={onClose} aria-label="Close create deal form"><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5"><div className="grid min-w-0 gap-4 sm:grid-cols-2">{field("Deal name", <input className={input} required value={form.name} onChange={(event) => update("name", event.target.value)} />, true)}{field("Company", <input className={`${input} bg-[#f7f9fb]`} value={company.name} readOnly />, true)}{field("Pipeline", <select className={input} value="Sales Pipeline" disabled><option>Sales Pipeline</option></select>)}{field("Deal stage", <select className={input} value={form.stage} onChange={(event) => update("stage", event.target.value)}><option>Appointment Scheduled</option><option>Presentation Scheduled</option><option>Decision Maker Bought-In</option><option>Contract Sent</option><option>Closed Won</option><option>Closed Lost</option></select>)}{field("Amount", <input className={input} type="number" min="0" value={form.amount} onChange={(event) => update("amount", event.target.value)} />)}{field("Close date", <input className={input} type="date" value={form.closeDate} onChange={(event) => update("closeDate", event.target.value)} />)}{field("Deal owner", <select className={input} disabled><option>Soft Dev</option></select>)}{field("Deal type", <select className={input} value={form.dealType} onChange={(event) => update("dealType", event.target.value)}><option value="">Select deal type</option><option>New Business</option><option>Existing Business</option></select>)}{field("Priority", <select className={input} value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>)}{field("Contact", <select className={input} value={form.contactId} onChange={(event) => update("contactId", event.target.value)}><option value="">No contact</option>{company.contacts.map((contact) => <option value={contact.id} key={contact.id}>{contact.firstName} {contact.lastName ?? ""}</option>)}</select>)}{error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p> : null}</div></div><div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[#dbe4ed] px-4 py-4 sm:px-6"><button className="rounded-md border px-4 py-2" type="button" onClick={onClose}>Cancel</button><button className="rounded-md bg-[#006b70] px-5 py-2 font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Creating..." : "Create"}</button></div></form></div>;
}

function RelatedPanels({ company, onRefresh, collapsedSections, toggleSection, dealsLoading, dealsError }: { company: CompanyRecord | null; onRefresh: () => Promise<void>; collapsedSections: Record<string, boolean>; toggleSection: (title: string) => void; dealsLoading: boolean; dealsError: string }) {
  const [contactModal, setContactModal] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [contactCards, setContactCards] = useState<CompanyContact[]>(company?.contacts ?? []);
  useEffect(() => { setContactCards(company?.contacts ?? []); }, [company?.contacts]);
  const dropContact = (from: number, to: number) => setContactCards((current) => { if (from === to) return current; const next = [...current]; const [card] = next.splice(from, 1); next.splice(to, 0, card); return next; });
  return <div className="space-y-4">
          <div
            className="hidden"
            aria-label="Toggle related records"
          >
            <ChevronRight className="h-4 w-4" />
          </div>

            <CollapsiblePanel
              title={`Contacts (${company?.contacts.length ?? 0})`}
              action={<button className="rounded-md border border-[#cbd6e2] px-4 py-2" type="button" onClick={() => setContactModal(true)}>+ Add</button>}
              icon={<UsersRound className="h-4 w-4" />}
              collapsed={collapsedSections["Contacts (2)"]}
              onToggle={() => toggleSection("Contacts (2)")}
            >
              <div className="space-y-3">
                {contactCards.map((contact, contactIndex) => (
                  <div className="rounded-lg border border-[#dbe4ed] p-3" draggable key={contact.id} onDragStart={(event) => event.dataTransfer.setData("contact-index", String(contactIndex))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData("contact-index")); if (Number.isInteger(from)) dropContact(from, contactIndex); }}>
                    <div className="flex gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff1eb] font-bold text-[#9b4a24]">{`${contact.firstName[0] ?? ""}${contact.lastName?.[0] ?? ""}`.toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold">{contact.firstName} {contact.lastName ?? ""}</p>
                            <p className="text-xs text-[#516f90]">{contact.title || "No job title"}</p><div className="mt-2 flex flex-wrap gap-1.5 text-[11px]"><span className="rounded-full bg-[#eef2ff] px-2 py-1 font-semibold text-[#40558d]">Department: {repairContactText(contact.department) || "Not set"}</span><span className="rounded-full bg-[#f3f0ff] px-2 py-1 font-semibold text-[#68459a]">Role in purchase: {repairContactText(contact.roleInPurchase) || "Not set"}</span></div>
                            <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#eef6f6] px-2 py-0.5 text-[11px] font-semibold text-[#006b70]">{contact.lifecycleStage || "No lifecycle stage"}</span><span className="rounded-full bg-[#fff1eb] px-2 py-0.5 text-[11px] font-semibold text-[#9b4a24]">{contact.leadStatus || "No lead status"}</span><span className="rounded-full bg-[#f2f5f8] px-2 py-0.5 text-[11px] font-semibold text-[#516f90]">{contact.owner?.name || "No owner"}</span></div>
                          </div>
                          <div className="flex items-center gap-1"><span className="cursor-grab rounded p-1 text-[#516f90]" title="Drag to reorder"><GripVertical className="h-4 w-4" /></span><details className="relative"><summary className="cursor-pointer list-none rounded p-1 text-[#516f90] hover:bg-[#f1f5f9]"><Ellipsis className="h-4 w-4" /></summary><div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-[#dbe4ed] bg-white p-1 text-xs shadow-lg"><button className="block w-full rounded px-3 py-2 text-left hover:bg-[#f7f9fb]" type="button" onClick={async () => { if (!window.confirm(`Unlink ${contact.firstName} ${contact.lastName ?? ""} from this company?`)) return; const response = await fetch(`${API_URL}/companies/${company?.id}/contacts/${contact.id}`, { method: "DELETE" }); if (response.ok) await onRefresh(); }}>Unlink contact</button><button className="block w-full rounded px-3 py-2 text-left text-red-700 hover:bg-[#fff1eb]" type="button" onClick={async () => { if (window.confirm("Delete this contact permanently?")) { await fetch(`${API_URL}/contacts/${contact.id}`, { method: "DELETE" }); await onRefresh(); } }}>Delete contact</button></div></details></div>
                        </div>
                        <p className="mt-3 flex items-center gap-2 text-xs text-[#213343]">
                          <Mail className="h-3.5 w-3.5 text-[#516f90]" />
                          <span className="truncate">{contact.email || "No email"}</span>
                          <Copy className="h-3.5 w-3.5 text-[#516f90]" />
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-xs text-[#516f90]">
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone || "No phone"}
                        </p>
                        <button className="mt-3 w-full rounded-md border border-[#dbe4ed] px-3 py-2 text-sm font-semibold">View full contact</button>
                      </div>
                    </div>
                  </div>
                ))}
                {!company?.contacts.length ? <p className="rounded-lg bg-[#f7f9fb] p-5 text-center text-sm text-[#516f90]">No contacts added to this company yet.</p> : null}
              </div>
              <a className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#f75c2f]" href="#">
                View all associated contacts
                <ChevronRight className="h-4 w-4" />
              </a>
            </CollapsiblePanel>
            {contactModal && company ? <CompanyContactModal companyId={company.id} currentContacts={company.contacts} onClose={() => setContactModal(false)} onSaved={async () => { setContactModal(false); await onRefresh(); }} /> : null}

            <CollapsiblePanel
              title={`Deals (${company?.deals?.length ?? 0})`}
              action={<button className="rounded-md border border-[#cbd6e2] px-4 py-2" type="button" onClick={() => setDealModal(true)}>+ Add</button>}
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              collapsed={collapsedSections[`Deals (${company?.deals?.length ?? 0})`]}
              onToggle={() => toggleSection(`Deals (${company?.deals?.length ?? 0})`)}
            >
              {dealsLoading ? <div className="rounded-lg bg-[#f7f9fb] p-6 text-center"><p className="text-sm text-[#516f90]">Loading associated deals...</p></div> : dealsError && !company?.deals?.length ? <div className="rounded-lg bg-[#fff1f0] p-6 text-center"><p className="text-sm text-[#b42318]">{dealsError}</p></div> : company?.deals?.length ? <div className="space-y-3">{company.deals.map((deal) => <Link className="block rounded-xl border border-[#dbe4ed] bg-white p-4 transition hover:border-[#007a8a] hover:shadow-sm" href={`/deals?companyId=${encodeURIComponent(company?.id ?? "")}`} key={deal.id}><div className="flex items-start justify-between gap-3"><p className="font-bold text-[#007a8a]">{deal.name}</p><span className="shrink-0 rounded-full bg-[#e8f5e9] px-2.5 py-1 text-xs font-semibold text-[#287d42]">{deal.stage || "No stage"}</span></div><div className="mt-3 grid gap-1.5 text-sm text-[#516f90]"><p>Amount: <span className="font-semibold text-[#213343]">{deal.amount == null ? "--" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(deal.amount))}</span></p><p>Close date: <span className="font-semibold text-[#213343]">{deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : "No close date"}</span></p>{deal.contact ? <p>Contact: <span className="font-semibold text-[#213343]">{deal.contact.firstName} {deal.contact.lastName ?? ""}</span></p> : null}</div><span className="mt-3 inline-flex rounded-full bg-[#edf0f2] px-3 py-1 text-xs text-[#516f90]">Deal with {deal.company?.name ?? company.name}</span></Link>)}</div> : <div className="rounded-lg bg-[#f7f9fb] p-6 text-center">
                <BriefcaseBusiness className="mx-auto h-9 w-9 text-[#7c98b6]" />
                <p className="mt-3 text-sm font-bold">No deals yet</p>
                <p className="mt-1 text-xs text-[#516f90]">Create a deal to track this company&apos;s opportunities.</p>
                <button className="mt-4 rounded-md bg-[#ff5c35] px-4 py-2 text-sm font-bold text-white" type="button" onClick={() => setDealModal(true)}>Create deal</button>
              </div>}
              {company ? <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#007a8a]" href={`/deals?companyId=${encodeURIComponent(company.id)}`}>View all associated Deals <ExternalLink className="h-4 w-4" /></Link> : null}
            </CollapsiblePanel>
            {dealModal && company ? <CreateDealModal company={company} onClose={() => setDealModal(false)} onSaved={async () => { setDealModal(false); await onRefresh(); }} /> : null}

            <CollapsiblePanel
              title="Tickets (0)"
              action={<AddButton />}
              icon={<Ticket className="h-4 w-4" />}
              settings
              collapsed={collapsedSections["Tickets (0)"]}
              onToggle={() => toggleSection("Tickets (0)")}
            >
              <RightEmptyState text="Track the customer requests associated with this record." />
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Payments (0)"
              action={<AddButton />}
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              settings
              collapsed={collapsedSections["Payments (0)"]}
              onToggle={() => toggleSection("Payments (0)")}
            >
              <p className="text-base leading-8 text-[#213343]">
                Track payments associated with this record. A payment is created when a customer pays or a recurring payment is processed through CRM.
              </p>
              <button className="mx-auto mt-5 block rounded-full border border-[#9fb3c8] px-5 py-2 text-sm font-semibold">Set up payments</button>
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Attachments"
              action={<button className="inline-flex items-center gap-1 text-sm font-bold">Add <ChevronDown className="h-4 w-4" /></button>}
              icon={<FileUp className="h-4 w-4" />}
              collapsed={collapsedSections.Attachments}
              onToggle={() => toggleSection("Attachments")}
            >
              <RightEmptyState text="See the files attached to your activities or uploaded to this record." />
            </CollapsiblePanel>
          </div>;
}

function CollapsiblePanel({
  title,
  children,
  action,
  icon,
  settings,
  collapsed,
  onToggle
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  settings?: boolean;
  collapsed?: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[#d0d7de] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button className="flex min-w-0 items-center gap-2 text-left font-bold text-[#213343]" onClick={onToggle} type="button">
          <ChevronDown className={`h-4 w-4 shrink-0 transition ${collapsed ? "-rotate-90" : ""}`} />
          {icon}
          <span className="truncate text-lg">{title}</span>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          {action}
          {settings ? (
            <button className="grid h-8 w-8 place-items-center rounded-full border border-[#9fb3c8]" aria-label={`${title} settings`}>
              <Settings className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {collapsed ? null : children}
    </section>
  );
}

function RightEmptyState({ text }: { text: string }) {
  return (
    <div className="py-5 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eef5fb] text-[#7c98b6]">
        <Search className="h-7 w-7" />
      </div>
      <p className="mx-auto mt-4 max-w-[220px] text-base leading-8 text-[#213343]">{text}</p>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-[#dbe4ed] bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-bold text-[#213343]">{title}</h2>
      <p className="mt-2 text-sm text-[#516f90]">This workspace is ready for the next CRM module.</p>
    </section>
  );
}

function CreateNoteModal({ company, users, onClose, onSaved }: { company: CompanyRecord; users: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => Promise<void> }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState(false);
  const [followUpType, setFollowUpType] = useState("TASK");
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void fetch(`${API_URL}/meetings?companyId=${encodeURIComponent(company.id)}&limit=100`, { cache: "no-store" }).then((response) => response.json()).then((payload: { data?: Meeting[] }) => setMeetings(payload.data ?? [])).catch(() => setError("Unable to load existing activities")); }, [company.id]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [onClose, saving]);
  const applyFormat = (command: string, value?: string) => { const selection = window.getSelection(); if (!selection?.rangeCount) return; if (command === "link") { const url = window.prompt("Link URL", "https://"); if (!url) return; const anchor = document.createElement("a"); anchor.href = url; anchor.target = "_blank"; anchor.rel = "noreferrer"; const range = selection.getRangeAt(0); try { range.surroundContents(anchor); } catch { anchor.textContent = range.toString(); range.deleteContents(); range.insertNode(anchor); } } else if (command === "heading") { const range = selection.getRangeAt(0); const block = range.commonAncestorContainer.parentElement?.closest("p,div,h1,h2,h3") ?? range.commonAncestorContainer.parentElement; if (block) { const heading = document.createElement(value || "h2"); heading.innerHTML = block.innerHTML; block.replaceWith(heading); } } else if (command === "bullet" || command === "number") { const list = document.createElement(command === "bullet" ? "ul" : "ol"); list.className = "ml-6 list-disc"; const item = document.createElement("li"); item.innerHTML = selection.toString() || "List item"; list.appendChild(item); const range = selection.getRangeAt(0); range.deleteContents(); range.insertNode(list); } else { const tag = command === "bold" ? "strong" : command === "italic" ? "em" : command === "underline" ? "u" : "s"; const range = selection.getRangeAt(0); const node = document.createElement(tag); node.textContent = selection.toString(); range.deleteContents(); range.insertNode(node); } editorRef.current?.focus(); setBody(editorRef.current?.innerHTML ?? ""); };
  const plainBody = body.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!plainBody) { setError("Note content is required"); return; } setSaving(true); setError(""); try { const response = await fetch(`${API_URL}/notes`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ title, body, companyId: company.id, links: selected.map((id) => ({ id, kind: "MEETING" })), followUp: followUp ? { enabled: true, title: followUpTitle || title || plainBody.slice(0, 80), type: followUpType, dueAt, ownerId } : undefined }) }); if (!response.ok) { const payload = await response.json().catch(() => null) as { message?: string } | null; throw new Error(payload?.message || "Unable to create note"); } await onSaved(); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to create note"); } finally { setSaving(false); } };
  const presets = [{ label: "In 2 business days", days: 2 }, { label: "In 3 business days", days: 3 }, { label: "In 1 week", days: 5 }, { label: "In 2 weeks", days: 10 }, { label: "In 1 month", days: 22 }];
  const businessDate = (days: number) => { const date = new Date(); let added = 0; while (added < days) { date.setDate(date.getDate() + 1); if (date.getDay() !== 0 && date.getDay() !== 6) added++; } return date.toLocaleDateString(); };
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-[#111827]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><form className="flex max-h-[92vh] w-full max-w-[850px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onSubmit={submit}><div className="flex items-center justify-between border-b border-[#dbe4ed] px-5 py-4"><h2 className="text-lg font-bold text-[#213343]">Create note</h2><button type="button" aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#8293a6]">Note title<input className="mt-1 w-full rounded-md border border-[#cbd6e2] px-3 py-2 text-sm font-normal text-[#213343]" placeholder="Enter a note title" value={title} onChange={(event) => { setTitle(event.target.value); if (!followUpTitle) setFollowUpTitle(event.target.value); }} /></label><label className="text-xs font-semibold text-[#8293a6]">Company<input className="mt-1 w-full rounded-md border border-[#cbd6e2] bg-[#f7f9fb] px-3 py-2 text-sm font-normal text-[#213343]" value={company.name} readOnly /></label></div><label className="mt-4 block text-xs font-semibold text-[#8293a6]">Note<div className="mt-1 overflow-hidden rounded-md border border-[#cbd6e2]"><div className="flex flex-wrap gap-1 border-b border-[#dbe4ed] bg-[#f7f9fb] p-2">{[["Paragraph", "heading", "p"], ["B", "bold"], ["I", "italic"], ["U", "underline"], ["S", "strike"], ["• List", "bullet"], ["1. List", "number"], ["Quote", "heading", "blockquote"], ["Link", "link"]].map(([label, command, value]) => <button key={`${label}-${command}`} type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#213343] hover:bg-white" aria-label={label} onClick={() => applyFormat(command, value)}>{label}</button>)}</div><div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Note content" data-placeholder="Start typing your company notes…" className="min-h-40 p-4 text-sm font-normal text-[#213343] outline-none empty:before:text-[#9aaabd] empty:before:content-[attr(data-placeholder)]" onInput={(event) => setBody(event.currentTarget.innerHTML)} /></div></label><p className="mt-2 text-[11px] text-[#8293a6]">Write paragraphs, bullet points, numbered lists, or a mix of formats.</p><div className="mt-5"><div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#213343]">Associated with <span className="rounded-md border border-[#cbd6e2] bg-[#f7f9fb] px-2 py-1 text-xs">▧ {company.name}</span><span className="text-xs text-[#007a8a]">+ Link existing activity</span></div><div className="mt-2 flex flex-wrap gap-2">{meetings.map((meeting) => <label className="inline-flex items-center gap-1 rounded-full border border-[#cbd6e2] px-2 py-1 text-xs" key={meeting.id}><input type="checkbox" checked={selected.includes(meeting.id)} onChange={() => setSelected((current) => current.includes(meeting.id) ? current.filter((id) => id !== meeting.id) : [...current, meeting.id])} />{meeting.name}</label>)}</div>{!meetings.length ? <p className="mt-2 text-xs text-[#8293a6]">No existing meetings found for this company.</p> : null}</div><label className="mt-5 flex items-center gap-2 border-t border-[#e7edf3] pt-4 text-sm text-[#213343]"><input type="checkbox" checked={followUp} onChange={(event) => setFollowUp(event.target.checked)} />Create a follow-up activity</label>{followUp ? <div className="mt-3 grid gap-3 rounded-lg bg-[#f7f9fb] p-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#516f90]">Activity type<select className="mt-1 w-full rounded border px-2 py-2 text-sm" value={followUpType} onChange={(event) => setFollowUpType(event.target.value)}><option value="TASK">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option></select></label><label className="text-xs font-semibold text-[#516f90]">Assigned to<select className="mt-1 w-full rounded border px-2 py-2 text-sm" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}><option value="">No owner</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label className="text-xs font-semibold text-[#516f90] sm:col-span-2">Follow-up title<input className="mt-1 w-full rounded border px-2 py-2 text-sm" value={followUpTitle || title} onChange={(event) => setFollowUpTitle(event.target.value)} /></label><div className="sm:col-span-2"><p className="text-xs font-semibold text-[#516f90]">Follow-up date and time</p><div className="mt-1 flex flex-wrap gap-2">{presets.map((preset) => <button type="button" key={preset.label} className="rounded border px-2 py-1 text-xs" onClick={() => { const date = new Date(); let added = 0; while (added < preset.days) { date.setDate(date.getDate() + 1); if (date.getDay() !== 0 && date.getDay() !== 6) added++; } setDueAt(date.toISOString().slice(0, 16)); }}>{preset.label} ({businessDate(preset.days)})</button>)}<input className="rounded border px-2 py-1 text-sm" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div></div></div> : null}{error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}</div><div className="flex justify-end gap-3 border-t border-[#dbe4ed] px-5 py-4"><button type="button" className="rounded-md border border-[#cbd6e2] px-4 py-2 text-sm" onClick={onClose}>Cancel</button><button type="submit" disabled={saving} className="rounded-md bg-[#007a83] px-5 py-2 text-sm font-semibold text-white">{saving ? "Creating..." : "Create note"}</button></div></form></div>;
}

function CompanyHeader({ compact, company, companies, users, onRefresh, onOpenMeeting, onOpenTask, onOpenNote }: { compact: boolean; company: CompanyRecord | null; companies: CompanyRecord[]; users: Array<{ id: string; name: string }>; onRefresh: () => Promise<void>; onOpenMeeting: () => void; onOpenTask: () => void; onOpenNote: () => void }) {
  const companyName = company?.name ?? "Loading company...";
  const website = company?.website?.replace(/^https?:\/\//, "") ?? "No website";
  const isSubCompany = Boolean(company?.parentCompany);
  const hierarchyOptions = company?.parentCompany
    ? companies.filter((item) => item.parentCompanyId === company.parentCompany?.id).sort((left, right) => left.name.localeCompare(right.name))
    : (company?.subCompanies ?? []).slice().sort((left, right) => left.name.localeCompare(right.name));
  const switchCompany = (id: string) => {
    if (id && id !== company?.id) window.location.assign(`/companies/${id}`);
  };
  return (
    <>
      <RecordDetailHeader compact={compact}>
        <div className="hidden">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#343a40]" href="/">
            <ChevronLeft className="h-4 w-4" />
            Companies
          </Link>
          <button className="inline-flex items-center gap-1 text-sm font-bold">
            Actions
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className={`relative flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between ${compact ? "min-h-[76px]" : "min-h-[106px]"}`}>
          <div className="flex shrink-0 items-start gap-3 lg:order-3 lg:ml-auto">
            <button className="hidden items-center gap-2 rounded-md border border-[#cbd6e2] px-4 py-2 text-sm font-bold lg:inline-flex">Actions <ChevronDown className="h-4 w-4" /></button>
            <div className="grid grid-cols-6 gap-2 text-center text-[11px]">
              {[["Note", MessageSquarePlus], ["Email", Mail], ["Call", Phone], ["Task", Target], ["Meeting", CalendarDays], ["More", Ellipsis]].map(([label, Icon]) => <button className="min-w-0 text-center" key={label as string} type="button" onClick={label === "Meeting" ? onOpenMeeting : label === "Task" ? onOpenTask : label === "Note" ? onOpenNote : undefined}><span className="mx-auto grid h-9 w-9 place-items-center rounded-full border border-[#9fb3c8]"><Icon className="h-4 w-4" /></span><span className="mt-1 block truncate">{label as string}</span></button>)}
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3 lg:order-1">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff0e9] text-2xl font-black text-[#ff5c35]">{companyName[0]?.toUpperCase() ?? "C"}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#111827]">{companyName}</h1>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isSubCompany ? "bg-[#f2f5f8] text-[#516f90]" : "bg-[#eef6ff] text-[#2563b8]"}`}>
                  {isSubCompany ? "Sub-company" : "Main company"}
                </span>
              </div>
              {company?.parentCompany ? (
                <Link className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#516f90]" href={`/companies/${company.parentCompany.id}`}>
                  <span>Main company:</span>
                  <span className="rounded-full bg-[#f7f9fb] px-2.5 py-1 text-[#007a8a] hover:bg-[#eef6f6]">{company.parentCompany.name}</span>
                </Link>
              ) : null}
              {hierarchyOptions.length ? (
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#516f90]">
                  <span>{isSubCompany ? "Sub-companies" : "Switch to sub-company"}</span>
                  <select className="max-w-[220px] rounded-md border border-[#cbd6e2] bg-white px-2 py-1 text-xs font-semibold text-[#213343]" value={company?.id ?? ""} onChange={(event) => switchCompany(event.target.value)} aria-label="Switch company">
                    {company ? <option value={company.id}>{isSubCompany ? company.name : "This company"}</option> : null}
                    {hierarchyOptions.filter((item) => item.id !== company?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              ) : null}
            </div>
          </div>
          <div className={`mt-1 flex items-center gap-2 text-sm font-bold text-[#007a8a] lg:order-2 ${compact ? "hidden" : ""}`}>
            <span>{website}</span>
            <ExternalLink className="h-3.5 w-3.5" />
            <Copy className="h-3.5 w-3.5 text-[#516f90]" />
          </div>
          <div className="hidden">
            {[
              ["Note", MessageSquarePlus],
              ["Email", Mail],
              ["Call", Phone],
              ["Task", Target],
              ["Meeting", CalendarDays],
              ["More", Ellipsis]
            ].map(([label, Icon]) => (
              <button className="min-w-0" key={label as string} type="button">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-full border border-[#9fb3c8]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="mt-1 block truncate">{label as string}</span>
              </button>
            ))}
          </div>
        </div>
      {compact ? null : <CompanyInformationPanel company={company} users={users} onRefresh={onRefresh} />}
      </RecordDetailHeader>
    </>
  );
}

function OverviewWorkspace() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2 px-1">
        <ChevronDown className="h-5 w-5 text-[#213343]" />
        <h2 className="text-2xl font-bold text-[#213343]">Overview</h2>
      </div>

      <div className="space-y-5">
          <OverviewCard title="Company insights" bordered action={<AiBadge />} trailing={<Settings className="h-4 w-4" />}>
            <div className="rounded-2xl border border-[#ff7ab8] p-5">
              <GeneratedAt time="Generated October 13, 2026 12:12 PM" />
              <div className="mt-4 space-y-2 text-sm leading-6">
                <p>
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#213343]" />
                  <strong>Recent product discussion:</strong> A meeting with Maria Johnson on October 12, 2026, covered the company&apos;s new product line.
                  <span className="ml-2 rounded-full bg-[#eef2f6] px-2 py-0.5 text-xs">1</span>
                </p>
                <p className="pl-6 text-[#516f90]">suggested action: Consider following up to clarify product requirements.</p>
              </div>
              <button className="mx-auto mt-5 flex items-center gap-2 text-sm font-bold">
                <ChevronDown className="h-4 w-4" />
                See more
              </button>
              <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#ff2f8b] px-4 py-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                Ask a question
              </button>
            </div>
          </OverviewCard>

          <OverviewCard title="Recent interactions" action={<AiBadge />}>
            <GeneratedAt time="Generated October 13, 2026 9:07 AM" />
            <p className="mt-4 text-sm leading-7 text-[#213343]">
              Interest is increasing through recent emails, calls, and meetings. Discussions are progressing toward a team decision, with flavor
              requirements still unresolved. Consider scheduling meeting to confirm flavor requirements and align the team.
            </p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#9fb3c8] px-4 py-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4" />
              Schedule a meeting
            </button>
            <InteractionPanel title="Inbound" empty />
            <InteractionPanel title="Outbound" />
            <ReactionRow />
          </OverviewCard>
      </div>

      <div className="flex items-center gap-2 px-1 pt-2">
        <ChevronDown className="h-5 w-5 text-[#213343]" />
        <h2 className="text-2xl font-bold text-[#213343]">Health</h2>
      </div>

      <OverviewCard title="Sentiment" action={<AiBadge />}>
        <GeneratedAt time="Generated October 13, 2026 12:12 PM" />
        <p className="mt-4 text-sm leading-7 text-[#213343]">
          Sentiment is receptive, supported by Maria&apos;s interest in the product line and the team meeting planned for next week. The upcoming factory
          tour further signals active engagement and purchase potential. Consider emailing to confirm the tour and clarify preferred flavors and pricing needs.
        </p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#9fb3c8] px-4 py-2 text-sm font-semibold">
          <Mail className="h-4 w-4" />
          Create an email
        </button>
        <SentimentGauge />
        <div className="mt-4 flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4" />
          <Phone className="h-4 w-4" />
          <Mail className="h-4 w-4" />
          <span>3 Sources</span>
        </div>
        <ReactionRow />
      </OverviewCard>

      <OverviewCard title="Challenges" action={<AiBadge />}>
        <GeneratedAt time="Generated October 13, 2026 12:54 PM" />
        <div className="py-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eef5fb] text-[#7c98b6]">
            <Search className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm text-[#213343]">No challenges found.</p>
        </div>
      </OverviewCard>

      <OverviewCard title="Positive feedback" action={<AiBadge />}>
        <GeneratedAt time="Generated October 13, 2026 12:54 PM" />
        <p className="mt-4 text-sm font-bold">Strong Interest in Product Offerings</p>
        <p className="mt-2 text-sm leading-7">
          Maria and Brian&apos;s teams showed interest in the product offerings and continued discussions through scheduled meetings and follow-up plans.
          <span className="ml-2 rounded-full bg-[#eef2f6] px-2 py-0.5 text-xs">1</span>
          <span className="ml-1 rounded-full bg-[#eef2f6] px-2 py-0.5 text-xs">2</span>
          <span className="ml-1 rounded-full bg-[#eef2f6] px-2 py-0.5 text-xs">3</span>
          <span className="ml-1 rounded-full bg-[#eef2f6] px-2 py-0.5 text-xs">4</span>
        </p>
        <ReactionRow />
      </OverviewCard>
    </section>
  );
}

function CompanyInformationPanel({ company, users, onRefresh }: { company: CompanyRecord | null; users: Array<{ id: string; name: string }>; onRefresh: () => Promise<void> }) {
  type EditableField = "ownerName" | "industry" | "name" | "city" | "state" | "postalCode" | "numberOfEmployees" | "annualRevenue" | "timeZone" | "description" | "linkedinCompanyPage" | "lifecycleStage";
  type Drafts = Record<EditableField, string>;
  const emptyDrafts: Drafts = { ownerName: "", industry: "", name: "", city: "", state: "", postalCode: "", numberOfEmployees: "", annualRevenue: "", timeZone: "", description: "", linkedinCompanyPage: "", lifecycleStage: "Subscriber" };
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts);
  const [savingFields, setSavingFields] = useState<Set<EditableField>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EditableField, string>>>({});
  const [savedFields, setSavedFields] = useState<Set<EditableField>>(new Set());
  const [pendingValues, setPendingValues] = useState<Partial<Drafts>>({});
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [showMore, setShowMore] = useState(false);

  const companyValue = (field: EditableField): string => {
    if (!company) return "";
    if (field === "ownerName") return company.ownerName ?? company.owner?.name ?? "";
    return String(company[field] ?? "");
  };
  useEffect(() => {
    if (!company) return;
    setDrafts((current) => {
      const next = { ...current };
      (Object.keys(emptyDrafts) as EditableField[]).forEach((field) => {
        const serverValue = companyValue(field);
        const pendingValue = pendingValues[field];
        if (pendingValue === undefined || pendingValue === serverValue) {
          next[field] = serverValue;
          if (pendingValue !== undefined && pendingValue === serverValue) {
            setPendingValues((pending) => { const copy = { ...pending }; delete copy[field]; return copy; });
          }
        }
      });
      return next;
    });
  }, [company]);

  const updateDraft = (field: EditableField, value: string) => {
    setDrafts((current) => ({ ...current, [field]: value }));
    setSavedFields((current) => { const next = new Set(current); next.delete(field); return next; });
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };
  const updateField = async (field: EditableField, value: string) => {
    if (!company) return;
    const normalizedValue = value.replace(/\s+/g, " ").trim();
    if (normalizedValue === companyValue(field).replace(/\s+/g, " ").trim()) return;
    setSavingFields((current) => new Set(current).add(field));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    try {
      const bodyValue = ["numberOfEmployees", "annualRevenue"].includes(field) ? (normalizedValue ? Number(normalizedValue) : null) : normalizedValue;
      const response = await fetch(`${API_URL}/companies/${company.id}`, { method: "PATCH", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ [field]: bodyValue }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
        const message = Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message;
        throw new Error(message || `Unable to update ${field}`);
      }
      const updated = await response.json() as Partial<CompanyRecord>;
      const savedValue = field === "ownerName" ? updated.ownerName ?? "" : String(updated[field] ?? normalizedValue);
      setDrafts((current) => ({ ...current, [field]: savedValue }));
      setPendingValues((current) => ({ ...current, [field]: savedValue }));
      setSavedFields((current) => new Set(current).add(field));
      void onRefresh();
    } catch (error) {
      setFieldErrors((current) => ({ ...current, [field]: error instanceof Error ? error.message : `Unable to update ${field}` }));
    } finally {
      setSavingFields((current) => { const next = new Set(current); next.delete(field); return next; });
    }
  };
  const saveOnBlur = (field: EditableField) => void updateField(field, drafts[field]);
  const filteredIndustries = industryOptions.filter((industry) => industry.toLocaleLowerCase().includes(industrySearch.trim().toLocaleLowerCase()));
  const lifecycleStages = ["Subscriber", "Lead", "Marketing Qualified Lead", "Sales Qualified Lead", "Opportunity", "Customer", "Evangelist", "Other"];
  const baseTextFields = [
    ["Company name", "name", company?.name, Building2]
  ] as const;
  const additionalTextFields = [
    ["City", "city", company?.city, MapPin],
    ["State/Region", "state", company?.state, MapPin], ["Postal code", "postalCode", company?.postalCode, MapPin],
    ["Number of employees", "numberOfEmployees", company?.numberOfEmployees, UsersRound], ["Annual revenue", "annualRevenue", company?.annualRevenue, Target], ["Time zone", "timeZone", company?.timeZone, CalendarDays], ["LinkedIn company page", "linkedinCompanyPage", company?.linkedinCompanyPage, ExternalLink]
  ] as const;
  return (
      <aside className="h-max border-t border-[#dbe4ed] bg-white px-4 py-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-[#213343]">Company information</h3>
        <Ellipsis className="h-4 w-4 text-[#516f90]" />
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <label className="grid grid-cols-[26px_1fr] gap-3"><Target className="mt-6 h-4 w-4 text-[#516f90]" /><span><span className="mb-1 block text-xs text-[#516f90]">Lifecycle stage</span><select className="w-full rounded-md border border-[#cbd6e2] px-2 py-1.5 text-sm font-semibold text-[#213343]" value={drafts.lifecycleStage} disabled={savingFields.has("lifecycleStage")} onChange={(event) => updateDraft("lifecycleStage", event.target.value)} onBlur={() => saveOnBlur("lifecycleStage")}>{lifecycleStages.map((stage) => <option key={stage}>{stage}</option>)}</select>{savingFields.has("lifecycleStage") ? <span className="mt-1 block text-xs text-[#516f90]">Saving...</span> : savedFields.has("lifecycleStage") ? <span className="mt-1 block text-xs text-green-700">Saved</span> : fieldErrors.lifecycleStage ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.lifecycleStage} <button type="button" className="underline" onClick={() => saveOnBlur("lifecycleStage")}>Retry</button></span> : null}</span></label>
        <div className="flex items-end gap-2">
          <UserRound className="mb-2 h-5 w-5 text-[#516f90]" />
          <label className="min-w-0 flex-1 text-xs text-[#516f90]">Owner name<input className="mt-1 w-full rounded-md border border-[#cbd6e2] px-2 py-1.5 text-sm font-semibold text-[#213343]" disabled={savingFields.has("ownerName")} value={drafts.ownerName} placeholder="No owner" onChange={(event) => updateDraft("ownerName", event.target.value)} onBlur={() => saveOnBlur("ownerName")} />{savingFields.has("ownerName") ? <span className="mt-1 block text-xs text-[#516f90]">Saving...</span> : savedFields.has("ownerName") ? <span className="mt-1 block text-xs text-green-700">Saved</span> : fieldErrors.ownerName ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.ownerName} <button type="button" className="underline" onClick={() => saveOnBlur("ownerName")}>Retry</button></span> : null}</label>
        </div>
        <div className="relative grid grid-cols-[26px_1fr] gap-3">
          <Building2 className="mt-6 h-4 w-4 text-[#516f90]" />
          <span><span className="mb-1 block text-xs text-[#516f90]">Industry</span><button type="button" className="flex w-full items-center justify-between rounded-md border border-[#cbd6e2] px-2 py-1 text-left text-sm font-semibold text-[#213343]" onClick={() => setIndustryOpen((open) => !open)}><span className="truncate">{drafts.industry || "Select industry"}</span><ChevronDown className="h-4 w-4 shrink-0" /></button>{industryOpen ? <div className="absolute left-7 right-0 top-[54px] z-30 rounded-xl border border-[#cbd6e2] bg-white p-3 shadow-xl"><div className="flex items-center rounded-full border-2 border-[#1473e6] px-3"><Search className="h-4 w-4 text-[#516f90]" /><input autoFocus className="min-w-0 flex-1 px-2 py-2 text-sm outline-none" placeholder="Search" value={industrySearch} onChange={(event) => setIndustrySearch(event.target.value)} /></div><div className="mt-2 max-h-64 overflow-y-auto">{filteredIndustries.map((industry) => <button type="button" key={industry} className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-[#f1f5f9]" onClick={() => { setIndustryOpen(false); setIndustrySearch(""); updateDraft("industry", industry); void updateField("industry", industry); }}>{industry}</button>)}{!filteredIndustries.length ? <p className="px-2 py-3 text-sm text-[#516f90]">No industries found.</p> : null}</div></div> : null}{savingFields.has("industry") ? <span className="mt-1 block text-xs text-[#516f90]">Saving...</span> : savedFields.has("industry") ? <span className="mt-1 block text-xs text-green-700">Saved</span> : fieldErrors.industry ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.industry} <button type="button" className="underline" onClick={() => saveOnBlur("industry")}>Retry</button></span> : null}</span>
        </div>
        {baseTextFields.map(([label, field, value, Icon]) => (
          <label className="grid grid-cols-[26px_1fr] gap-3" key={label}>
            <Icon className="mt-6 h-4 w-4 text-[#516f90]" />
            <span>
              <span className="mb-1 block text-xs text-[#516f90]">{label}</span>
              <input className="w-full rounded-md border border-[#cbd6e2] px-2 py-1 text-sm font-semibold text-[#213343]" value={drafts[field]} disabled={savingFields.has(field)} onChange={(event) => updateDraft(field, event.target.value)} onBlur={() => saveOnBlur(field)} />
              {savingFields.has(field) ? <span className="mt-1 block text-xs text-[#516f90]">Saving...</span> : savedFields.has(field) ? <span className="mt-1 block text-xs text-green-700">Saved</span> : fieldErrors[field] ? <span className="mt-1 block text-xs text-red-700">{fieldErrors[field]} <button type="button" className="underline" onClick={() => saveOnBlur(field)}>Retry</button></span> : null}
            </span>
          </label>
        ))}
        <button className="lg:col-span-4 inline-flex items-center justify-center gap-2 rounded-md border border-[#cbd6e2] px-3 py-2 text-sm font-semibold text-[#516f90] hover:bg-[#f7f9fb]" type="button" onClick={() => setShowMore((current) => !current)}>{showMore ? "Show less" : "See more"}{showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        {showMore ? <>
          {additionalTextFields.map(([label, field, value, Icon]) => (
            <label className="grid grid-cols-[26px_1fr] gap-3" key={label}>
              <Icon className="mt-6 h-4 w-4 text-[#516f90]" />
              <span>
                <span className="mb-1 block text-xs text-[#516f90]">{label}</span>
                <input className="w-full rounded-md border border-[#cbd6e2] px-2 py-1 text-sm font-semibold text-[#213343]" value={drafts[field]} disabled={savingFields.has(field)} type={field === "numberOfEmployees" || field === "annualRevenue" ? "number" : "text"} onChange={(event) => updateDraft(field, event.target.value)} onBlur={() => saveOnBlur(field)} />
                {savingFields.has(field) ? <span className="mt-1 block text-xs text-[#516f90]">Saving...</span> : savedFields.has(field) ? <span className="mt-1 block text-xs text-green-700">Saved</span> : fieldErrors[field] ? <span className="mt-1 block text-xs text-red-700">{fieldErrors[field]} <button type="button" className="underline" onClick={() => saveOnBlur(field)}>Retry</button></span> : null}
              </span>
            </label>
          ))}
          <label className="grid grid-cols-[26px_1fr] gap-3 lg:col-span-4"><FileUp className="mt-6 h-4 w-4 text-[#516f90]" /><span><span className="mb-1 block text-xs text-[#516f90]">Description</span><textarea className="min-h-20 w-full rounded-md border border-[#cbd6e2] px-2 py-1 text-sm font-semibold text-[#213343]" value={drafts.description} disabled={savingFields.has("description")} onChange={(event) => updateDraft("description", event.target.value)} onBlur={() => saveOnBlur("description")} />{savingFields.has("description") ? <span className="mt-1 block text-xs text-[#516f90]">Saving...</span> : savedFields.has("description") ? <span className="mt-1 block text-xs text-green-700">Saved</span> : fieldErrors.description ? <span className="mt-1 block text-xs text-red-700">{fieldErrors.description} <button type="button" className="underline" onClick={() => saveOnBlur("description")}>Retry</button></span> : null}</span></label>
        </> : null}
      </div>
    </aside>
  );
}

function OverviewCard({
  title,
  children,
  action,
  trailing,
  bordered
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  trailing?: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <article className={`rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm ${bordered ? "shadow-[0_8px_18px_rgba(33,51,67,0.08)]" : ""}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#213343]">{title}</h3>
        <div className="flex items-center gap-2">
          {action}
          {trailing ? <button className="grid h-8 w-8 place-items-center rounded-full border border-[#dbe4ed]">{trailing}</button> : null}
        </div>
      </div>
      {children}
    </article>
  );
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#ff2f8b] to-[#ff5c35] px-2 py-1 text-xs font-bold text-white">
      <Sparkles className="h-3 w-3" />
      AI
    </span>
  );
}

function GeneratedAt({ time }: { time: string }) {
  return (
    <p className="flex items-center gap-2 text-xs text-[#516f90]">
      {time}
      <RefreshCw className="h-4 w-4 text-[#ff2f8b]" />
    </p>
  );
}

function InteractionPanel({ title, empty }: { title: string; empty?: boolean }) {
  const rows = [
    ["Logged call", "October 12, 2026", Phone],
    ["Logged call", "October 12, 2026", Phone],
    ["Meeting - (Sample meeting) Maria Johnson (Sample ...", "October 12, 2026", CalendarDays],
    ["Logged email with", "October 12, 2026", Mail],
    ["Logged email with", "October 10, 2026", Mail]
  ] as const;

  return (
    <div className="mt-5 rounded-2xl border border-[#d0d7de] p-4">
      <h4 className="font-bold">{title}</h4>
      {empty ? (
        <div className="py-8 text-center text-[#7c98b6]">
          <Search className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm">No inbound activity yet.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {rows.map(([label, date, Icon], index) => (
            <div className="flex items-center justify-between gap-4 text-sm" key={`${label}-${date}-${index}`}>
              <span className="flex min-w-0 items-center gap-2 font-bold text-[#007a8a]">
                <Icon className="h-4 w-4 shrink-0 text-[#213343]" />
                <span className="truncate">{label}</span>
              </span>
              <span className="shrink-0 text-[#516f90]">{date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentGauge() {
  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="relative h-24 w-44 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-20 rounded-t-full border-[14px] border-b-0 border-[#37b26c]" />
        <div className="absolute bottom-0 left-0 h-20 w-1/3 rounded-tl-full border-[14px] border-r-0 border-b-0 border-[#ff3b45]" />
        <div className="absolute bottom-0 left-[32%] h-20 w-1/3 border-[14px] border-x-0 border-b-0 border-[#ffd166]" />
        <div className="absolute bottom-8 left-[58%] h-0 w-0 rotate-45 border-x-[8px] border-b-[28px] border-x-transparent border-b-[#25364d]" />
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#111827] px-3 py-1 text-xs font-bold text-white">Receptive</span>
      </div>
      <p className="mt-1 text-sm font-bold">Sentiment</p>
    </div>
  );
}

function ReactionRow() {
  return (
    <div className="mt-5 flex items-center gap-4 text-[#213343]">
      <ThumbsUp className="h-4 w-4" />
      <ThumbsDown className="h-4 w-4" />
    </div>
  );
}

function ActivityWorkspace({ company, meetings, notes, tasks, loading, error, onCreateTask, onEditTask, onTaskChange }: { company: CompanyRecord | null; meetings: Meeting[]; notes: CompanyNote[]; tasks: CompanyTask[]; loading: boolean; error: string; onCreateTask: () => void; onEditTask: (task: CompanyTask) => void; onTaskChange: () => Promise<void> }) {
  const [activeActivityTab, setActiveActivityTab] = useState("All activities");
  const meetingTabActive = activeActivityTab === "Meetings";
  const taskTabActive = activeActivityTab === "Tasks";
  const taskIndicator = tasks.length > 0 && tasks.every((task) => Boolean(task.doneAt)) ? "border-[#16a34a]" : "border-[#dc2626]";
  return (
    <section className="rounded-lg border border-[#dbe4ed] bg-white shadow-sm">
      <div className="bg-[#f3f4f6] p-4">
        <div className="border-b border-[#cbd6e2]">
          <div className="flex flex-wrap gap-1 text-sm font-semibold text-[#343a40]">
            {["All activities", "Notes", "Emails", "Calls", "Tasks", "Meetings"].map((item, index) => (
              <button type="button" onClick={() => setActiveActivityTab(item)} className={`mr-3 px-0 py-3 ${activeActivityTab === item ? `border-b-4 ${item === "Tasks" ? taskIndicator : "border-[#343a40]"} text-[#111827]` : "text-[#516f90]"}`} key={item}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex h-10 w-[250px] max-w-full items-center gap-2 rounded-full border border-[#9fb3c8] bg-white px-4 text-[#516f90]">
            <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#516f90]" placeholder="Search activities" />
            <Search className="h-4 w-4" />
          </label>
          <button className="inline-flex items-center gap-1 self-start text-xs font-bold text-[#343a40] xl:self-auto">
            Collapse all
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-3 rounded-md bg-[#e8e8e8] px-4 py-2 text-xs font-bold">
            Activity (17/29)
            <ChevronDown className="h-4 w-4" />
            <span className="text-base font-normal text-[#516f90]">x</span>
          </button>
          <FilterButton label="All time" />
          <FilterButton label="Activity assigned to" />
          <button className="px-2 py-3 text-sm font-bold text-[#343a40]">Clear all</button>
        </div>

        {taskTabActive ? <TaskActivityList company={company} tasks={tasks} onCreateTask={onCreateTask} onEditTask={onEditTask} onTaskChange={onTaskChange} /> : null}
        {!taskTabActive && (meetingTabActive || activeActivityTab === "All activities") ? <>
        <div className="mt-5 flex items-center justify-between gap-3"><h3 className="text-lg font-medium text-[#343a40]">{meetingTabActive ? "All meetings" : "Meetings"}</h3><span className="rounded-full bg-[#e8eef4] px-3 py-1 text-xs font-semibold text-[#516f90]">{meetings.length} {meetings.length === 1 ? "meeting" : "meetings"}</span></div>
        <div className="mt-4 space-y-4">
          {loading ? <p className="rounded-lg border border-dashed border-[#cbd6e2] p-5 text-sm text-[#516f90]">Loading meetings...</p> : null}
          {error ? <p className="rounded-lg border border-dashed border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</p> : null}
          {meetings.length ? meetings.map((meeting) => <TimelineCard key={meeting.id} title={meeting.name} date={new Date(meeting.activityAt).toLocaleString()} body={[meeting.type, meeting.location].filter(Boolean).join(" · ") || "Company meeting"} outcome={meeting.outcome} />) : <p className="rounded-lg border border-dashed border-[#cbd6e2] p-5 text-sm text-[#516f90]">No meetings linked to this company yet.</p>}
        </div></> : null}

        {(activeActivityTab === "All activities" || activeActivityTab === "Notes") && notes.length ? <><h3 className="mt-6 text-lg font-medium text-[#343a40]">Notes</h3><div className="mt-4 space-y-3">{notes.map((note) => <article className="rounded-2xl border border-[#d0d7de] bg-white p-4" key={note.id}><h4 className="font-bold text-[#213343]">{note.title || "Note"}</h4><div className="prose prose-sm mt-2 max-w-none text-[#343a40]" dangerouslySetInnerHTML={{ __html: note.body }} /><p className="mt-3 text-xs text-[#516f90]">{new Date(note.createdAt).toLocaleString()}</p></article>)}</div></> : null}

        <h3 className={activeActivityTab === "All activities" ? "mt-6 text-lg font-medium text-[#343a40]" : "hidden"}>October 2026</h3>
        <div className={activeActivityTab === "All activities" ? "mt-4 space-y-3" : "hidden"}>
          <TimelineCard
            title="Logged call"
            date="Oct 12, 2026 at 1:29 PM GMT+5:30"
            body="(Sample call) Brought Maria through our latest product line. She's interested and is going to get back to me."
          />
          <TimelineCard
            title="Record Enriched"
            date="Oct 12, 2026 at 1:29 PM GMT+5:30"
            body="2 properties were updated: Company name, Logo URL."
          />
        </div>
      </div>
    </section>
  );
}

function TaskActivityListLegacy({ company, tasks, onCreateTask, onEditTask, onTaskChange }: { company: CompanyRecord | null; tasks: CompanyTask[]; onCreateTask: () => void; onEditTask: (task: CompanyTask) => void; onTaskChange: () => Promise<void> }) {
  const [savingId, setSavingId] = useState("");
  useEffect(() => {
    const bindings: Array<{ element: HTMLElement; handler: (event: MouseEvent) => void }> = [];
    tasks.forEach((task) => {
      const element = Array.from(document.querySelectorAll<HTMLElement>("article")).find((item) => item.textContent?.includes(task.title));
      if (!element) return;
      const handler = (event: MouseEvent) => { if ((event.target as HTMLElement).closest("input,button")) return; onEditTask(task); };
      element.classList.add("cursor-pointer"); element.addEventListener("click", handler); bindings.push({ element, handler });
    });
    return () => bindings.forEach(({ element, handler }) => element.removeEventListener("click", handler));
  }, [tasks, onEditTask]);
  const toggle = async (task: CompanyTask) => {
    setSavingId(task.id);
    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doneAt: task.doneAt ? null : new Date().toISOString() }) });
      if (!response.ok) throw new Error("Unable to update task");
      await onTaskChange();
    } finally { setSavingId(""); }
  };
  return <section className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-medium text-[#343a40]">Tasks</h3><div className="flex items-center gap-2"><span className="rounded-full bg-[#e8eef4] px-3 py-1 text-xs font-semibold text-[#516f90]">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span><button className="rounded-md bg-[#006b70] px-3 py-2 text-xs font-semibold text-white" type="button" onClick={onCreateTask}>+ Create task</button></div></div><div className="mt-4 space-y-2">{tasks.length ? tasks.map((task) => <article className={`flex items-start gap-3 rounded-lg border border-[#dbe4ed] bg-white p-3 ${task.doneAt ? "opacity-60" : ""}`} key={task.id}><input className="mt-1 h-4 w-4 accent-[#006b70]" type="checkbox" checked={Boolean(task.doneAt)} disabled={savingId === task.id} onChange={() => void toggle(task)} aria-label={`Mark ${task.title} ${task.doneAt ? "incomplete" : "complete"}`} /><div className="min-w-0 flex-1"><p className={`font-semibold text-[#213343] ${task.doneAt ? "line-through" : ""}`}>{task.title}</p><p className="mt-1 text-xs text-[#516f90]">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"} · {task.taskType || "To-do"} · Priority: {task.priority || "None"} · {task.assignee?.name || "Unassigned"}</p>{task.notes ? <p className="mt-1 truncate text-xs text-[#8293a6]">{task.notes}</p> : null}</div></article>) : <div className="rounded-lg border border-dashed border-[#cbd6e2] p-5 text-sm text-[#516f90]">No tasks linked to this company yet.</div>}</div></section>;
}

function TaskActivityListLegacyStyled({ company, tasks, onCreateTask, onEditTask, onTaskChange }: { company: CompanyRecord | null; tasks: CompanyTask[]; onCreateTask: () => void; onEditTask: (task: CompanyTask) => void; onTaskChange: () => Promise<void> }) {
  const [savingId, setSavingId] = useState("");
  const toggle = async (task: CompanyTask) => {
    setSavingId(task.id);
    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doneAt: task.doneAt ? null : new Date().toISOString() }) });
      if (!response.ok) throw new Error("Unable to update task");
      await onTaskChange();
    } finally { setSavingId(""); }
  };
  return <section className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-medium text-[#343a40]">Tasks</h3><div className="flex items-center gap-2"><span className="rounded-full bg-[#e8eef4] px-3 py-1 text-xs font-semibold text-[#516f90]">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span><button className="rounded-md bg-[#006b70] px-3 py-2 text-xs font-semibold text-white" type="button" onClick={onCreateTask}>+ Create task</button></div></div><div className="mt-4 space-y-2">{tasks.length ? tasks.map((task) => <article className={`flex cursor-pointer items-start gap-3 rounded-lg border border-[#dbe4ed] bg-white p-3 ${task.doneAt ? "opacity-60" : ""}`} key={task.id} onClick={(event) => { if ((event.target as HTMLElement).closest("input,button")) return; onEditTask(task); }}><input className="mt-1 h-4 w-4 accent-[#006b70]" type="checkbox" checked={Boolean(task.doneAt)} disabled={savingId === task.id} onChange={() => void toggle(task)} aria-label={`Mark ${task.title} ${task.doneAt ? "incomplete" : "complete"}`} /><div className="min-w-0 flex-1"><p className={`font-semibold text-[#213343] ${task.doneAt ? "line-through" : ""}`}>{task.title}</p><p className="mt-1 text-xs text-[#516f90]">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"} · {task.taskType || "To-do"} · Priority: {task.priority || "None"} · {task.assignee?.name || "Unassigned"}</p>{task.notes ? <div className="prose prose-xs mt-2 line-clamp-3 max-w-none text-xs text-[#8293a6]" dangerouslySetInnerHTML={{ __html: sanitizeTaskNotes(task.notes) }} /> : null}</div></article>) : <div className="rounded-lg border border-dashed border-[#cbd6e2] p-5 text-sm text-[#516f90]">No tasks linked to this company yet.</div>}</div></section>;
}

function TaskActivityListLegacyOptimistic({ company, tasks, onCreateTask, onEditTask, onTaskChange }: { company: CompanyRecord | null; tasks: CompanyTask[]; onCreateTask: () => void; onEditTask: (task: CompanyTask) => void; onTaskChange: () => Promise<void> }) {
  const [savingId, setSavingId] = useState("");
  const toggle = async (task: CompanyTask) => { setSavingId(task.id); try { const response = await fetch(`${API_URL}/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doneAt: task.doneAt ? null : new Date().toISOString() }) }); if (!response.ok) throw new Error("Unable to update task"); await onTaskChange(); } finally { setSavingId(""); } };
  const priorityStyle = (priority?: string | null) => ({ LOW: "bg-[#2563eb] text-white", MEDIUM: "bg-[#d97706] text-white", HIGH: "bg-[#ea580c] text-white", URGENT: "bg-[#dc2626] text-white" }[priority || ""] || "bg-[#64748b] text-white");
  return <section className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-medium text-[#343a40]">Tasks</h3><div className="flex items-center gap-2"><span className="rounded-full bg-[#e8eef4] px-3 py-1 text-xs font-semibold text-[#516f90]">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span><button className="rounded-md bg-[#006b70] px-3 py-2 text-xs font-semibold text-white" type="button" onClick={onCreateTask}>+ Create task</button></div></div><div className="mt-4 space-y-2">{tasks.length ? tasks.map((task) => <article className={`flex cursor-pointer items-start gap-3 rounded-lg border border-[#dbe4ed] bg-white p-3 shadow-sm transition hover:border-[#8da4b8] ${task.doneAt ? "opacity-60" : ""}`} key={task.id} onClick={(event) => { if ((event.target as HTMLElement).closest("input,button")) return; onEditTask(task); }}><input className="mt-1 h-4 w-4 accent-[#006b70]" type="checkbox" checked={Boolean(task.doneAt)} disabled={savingId === task.id} onChange={() => void toggle(task)} aria-label={`Mark ${task.title} ${task.doneAt ? "incomplete" : "complete"}`} /><div className="min-w-0 flex-1"><p className={`font-semibold text-[#213343] ${task.doneAt ? "line-through" : ""}`}>{task.title}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#516f90]"><span className="rounded bg-[#eef3f8] px-2 py-1">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"}</span><span className="rounded bg-[#eef3f8] px-2 py-1">{task.taskType || "To-do"}</span><span className={`rounded px-2 py-1 font-bold ${priorityStyle(task.priority)}`}>Priority: {task.priority || "None"}</span><span className="rounded bg-[#eef3f8] px-2 py-1">{task.assignee?.name || "Unassigned"}</span></div>{task.notes ? <div className="prose prose-xs mt-2 line-clamp-3 max-w-none text-xs text-[#8293a6]" dangerouslySetInnerHTML={{ __html: sanitizeTaskNotes(task.notes) }} /> : null}</div></article>) : <div className="rounded-lg border border-dashed border-[#cbd6e2] p-5 text-sm text-[#516f90]">No tasks linked to this company yet.</div>}</div></section>;
}

const taskStatuses = [{ value: "TODO", label: "To Do", color: "#1683ff", bg: "#eaf3ff" }, { value: "IN_PROGRESS", label: "In Progress", color: "#16834f", bg: "#eaf8f0" }, { value: "WAITING", label: "Waiting", color: "#a06400", bg: "#fff5df" }, { value: "COMPLETED", label: "Completed", color: "#007d68", bg: "#e5f8f2" }] as const;

function StatusDropdown({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const currentIndex = Math.max(0, taskStatuses.findIndex((item) => item.value === value));
  const current = taskStatuses[currentIndex];
  useEffect(() => { if (!open) return; const updatePosition = () => { const button = rootRef.current?.querySelector("button"); if (!button) return; const bounds = button.getBoundingClientRect(); setMenuPosition({ top: bounds.bottom + 4, left: bounds.left, width: Math.max(bounds.width, 150) }); }; const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node) && !(event.target as HTMLElement).closest("[data-task-status-menu]")) setOpen(false); }; const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; updatePosition(); window.addEventListener("resize", updatePosition); window.addEventListener("scroll", updatePosition, true); document.addEventListener("mousedown", close); document.addEventListener("keydown", key); return () => { window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); }; }, [open]);
  const choose = (index: number) => { onChange(taskStatuses[index].value); setOpen(false); };
  return <div className="relative" ref={rootRef} onKeyDown={(event) => { if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) { event.preventDefault(); setOpen(true); setFocused(currentIndex); } else if (open && event.key === "ArrowDown") { event.preventDefault(); setFocused((index) => (index + 1) % taskStatuses.length); } else if (open && event.key === "ArrowUp") { event.preventDefault(); setFocused((index) => (index - 1 + taskStatuses.length) % taskStatuses.length); } else if (open && event.key === "Enter") { event.preventDefault(); choose(focused); } }}><button className="inline-flex min-w-[125px] items-center justify-between gap-2 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: current.bg, color: current.color }} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen((isOpen) => !isOpen); setFocused(currentIndex); }}>{current.label}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open ? <div data-task-status-menu className="fixed z-[9999] overflow-hidden rounded-md border border-[#cbd6e2] bg-white p-1 shadow-2xl" style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }} role="listbox" aria-label="Task status" onMouseDown={(event) => event.stopPropagation()}>{taskStatuses.map((item, index) => <button className={`flex w-full items-center rounded px-3 py-2 text-left text-xs font-semibold transition ${focused === index ? "ring-2 ring-inset ring-[#1683ff]" : ""}`} style={{ color: item.color, backgroundColor: item.bg }} role="option" aria-selected={item.value === value} type="button" key={item.value} onMouseEnter={() => setFocused(index)} onClick={() => choose(index)}>{item.label}</button>)}</div> : null}</div>;
}

function TaskActivityList({ company, tasks, onCreateTask, onEditTask, onTaskChange }: { company: CompanyRecord | null; tasks: CompanyTask[]; onCreateTask: () => void; onEditTask: (task: CompanyTask) => void; onTaskChange: () => Promise<void> }) {
  const [savingId, setSavingId] = useState("");
  const statusOf = (task: CompanyTask) => task.status || (task.doneAt ? "COMPLETED" : "TODO");
  const updateStatus = async (task: CompanyTask, status: string) => { setSavingId(task.id); try { const response = await fetch(`${API_URL}/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error("Unable to update task status"); await onTaskChange(); } finally { setSavingId(""); } };
  const toggle = async (task: CompanyTask) => { await updateStatus(task, statusOf(task) === "COMPLETED" ? "TODO" : "COMPLETED"); };
  const priorityStyle = (priority?: string | null) => ({ LOW: "bg-[#2563eb] text-white", MEDIUM: "bg-[#d97706] text-white", HIGH: "bg-[#ea580c] text-white", URGENT: "bg-[#dc2626] text-white" }[priority || ""] || "bg-[#64748b] text-white");
  return <section className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-medium text-[#343a40]">Tasks</h3><div className="flex items-center gap-2"><span className="rounded-full bg-[#e8eef4] px-3 py-1 text-xs font-semibold text-[#516f90]">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span><button className="rounded-md bg-[#006b70] px-3 py-2 text-xs font-semibold text-white" type="button" onClick={onCreateTask}>+ Create task</button></div></div><div className="mt-4 space-y-2">{tasks.length ? tasks.map((task) => { const isDone = statusOf(task) === "COMPLETED"; return <article className={`flex cursor-pointer items-start gap-3 rounded-lg border border-[#dbe4ed] bg-white p-3 shadow-sm transition hover:border-[#8da4b8] ${isDone ? "opacity-60" : ""}`} key={task.id} onClick={(event) => { if ((event.target as HTMLElement).closest("input,button,select")) return; onEditTask(task); }}><input className="mt-1 h-4 w-4 accent-[#006b70]" type="checkbox" checked={isDone} disabled={savingId === task.id} onChange={() => void toggle(task)} aria-label={`Mark ${task.title} ${isDone ? "incomplete" : "complete"}`} /><div className="min-w-0 flex-1"><p className={`font-semibold text-[#213343] ${isDone ? "line-through" : ""}`}>{task.title}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#516f90]"><StatusDropdown value={statusOf(task)} disabled={savingId === task.id} onChange={(value) => void updateStatus(task, value)} /><span className="rounded bg-[#eef3f8] px-2 py-1">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"}</span><span className="rounded bg-[#eef3f8] px-2 py-1">{task.taskType || "To-do"}</span><span className={`rounded px-2 py-1 font-bold ${priorityStyle(task.priority)}`}>Priority: {task.priority || "None"}</span><span className="rounded bg-[#eef3f8] px-2 py-1">{task.assignee?.name || "Unassigned"}</span></div>{task.notes ? <div className="prose prose-xs mt-2 line-clamp-3 max-w-none text-xs text-[#8293a6]" dangerouslySetInnerHTML={{ __html: sanitizeTaskNotes(task.notes) }} /> : null}</div></article>; }) : <div className="rounded-lg border border-dashed border-[#cbd6e2] p-5 text-sm text-[#516f90]">No tasks linked to this company yet.</div>}</div></section>;
}

function sanitizeTaskNotes(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<(?!\/?(?:strong|b|em|i|u|s|blockquote|p|br|div|ul|ol|li|a|input)(?:\s[^>]*)?>)[^>]*>/gi, "")
    .replace(/<input(?![^>]*type=["']checkbox["'])[^>]*>/gi, "");
}

function CreateTaskModal({ company, users, task, onClose, onSaved }: { company: CompanyRecord; users: Array<{ id: string; name: string }>; task?: CompanyTask | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ title: task?.title || "", dueAt: task?.dueAt ? task.dueAt.slice(0, 16) : "", reminderAt: task?.reminderAt ? task.reminderAt.slice(0, 16) : "", taskType: task?.taskType || "TODO", priority: task?.priority || "", queue: task?.queue || "", assigneeId: task?.assignee?.id || users[0]?.id || "", notes: task?.notes || "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [active, setActive] = useState({ bold: false, italic: false, underline: false, bullet: false, number: false }); const editorRef = useRef<HTMLDivElement>(null); const rangeRef = useRef<Range | null>(null);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  useEffect(() => { if (editorRef.current) editorRef.current.innerHTML = form.notes || ""; }, [task?.id]);
  useEffect(() => { const buttons = document.querySelectorAll<HTMLButtonElement>('form button[type="submit"]'); const button = buttons[buttons.length - 1]; if (!button) return; const valid = form.title.trim().length > 0; button.classList.toggle("bg-[#006b70]", valid); button.classList.toggle("text-white", valid); button.classList.toggle("bg-[#f1f1f1]", !valid); button.classList.toggle("text-[#888]", !valid); button.textContent = saving ? (task ? "Saving..." : "Creating...") : (task ? "Save" : "Create task"); }, [form.title, saving, task]);
  const refreshState = () => { const selection = window.getSelection(); if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return; const parent = selection.anchorNode?.parentElement; setActive({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline"), bullet: Boolean(parent?.closest("ul")), number: Boolean(parent?.closest("ol")) }); rangeRef.current = selection.getRangeAt(0).cloneRange(); };
  useEffect(() => { const handler = () => refreshState(); document.addEventListener("selectionchange", handler); return () => document.removeEventListener("selectionchange", handler); }, []);
  const format = (command: string, value?: string) => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (rangeRef.current && selection) { selection.removeAllRanges(); selection.addRange(rangeRef.current); }
    try {
      document.execCommand("styleWithCSS", false, "false");
      if (command === "insertUnorderedList") {
        document.execCommand("insertHTML", false, '<div><input type="checkbox" /> <span></span></div>');
      } else {
        document.execCommand(command, false, value);
      }
    } catch { /* unsupported */ }
    if (editorRef.current) update("notes", editorRef.current.innerHTML);
    refreshState();
  };
  const insertImage = (url: string) => { if (url.trim()) format("insertImage", url.trim()); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (saving) return; setSaving(true); setError(""); try { const response = await fetch(`${API_URL}/tasks${task ? `/${task.id}` : ""}`, { method: task ? "PATCH" : "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ ...form, notes: sanitizeTaskNotes(form.notes), companyId: company.id, dueAt: form.dueAt || null, reminderAt: form.reminderAt || null, priority: form.priority || null, queue: form.queue || null, assigneeId: form.assigneeId || null }) }); const payload = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(payload?.message || "Unable to save task"); await onSaved(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save task"); } finally { setSaving(false); } };
  const tool = (isActive: boolean) => `rounded border px-2 py-1 text-sm font-semibold ${isActive ? "border-[#006b70] bg-[#d8eeee] text-[#005c5f] ring-1 ring-[#006b70]" : "border-transparent text-[#213343] hover:border-[#cbd6e2] hover:bg-[#f7f9fb]"}`;
  return <div className="fixed inset-0 z-[100] flex h-dvh items-center justify-center bg-black/30 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true"><form className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex shrink-0 items-center justify-between border-b px-5 py-3"><h2 className="text-xl font-bold">Task</h2><button type="button" onClick={onClose} aria-label="Close task form"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto"><div className="p-5"><input className="w-full border-0 p-0 text-base font-semibold outline-none placeholder:text-[#666]" placeholder="Enter a task title" required value={form.title} onChange={(event) => update("title", event.target.value)} /><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm text-[#666]">Due date<input className="mt-2 w-full rounded border px-2 py-2 font-normal" type="datetime-local" value={form.dueAt} onChange={(event) => update("dueAt", event.target.value)} /></label><label className="text-sm text-[#666]">Reminder<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.reminderAt} onChange={(event) => update("reminderAt", event.target.value)}><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option></select></label></div></div><div className="grid grid-cols-2 gap-4 border-y px-5 py-4 sm:grid-cols-4"><label className="text-sm text-[#666]">Task Type<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.taskType} onChange={(event) => update("taskType", event.target.value)}><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option></select></label><label className="text-sm text-[#666]">Priority<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="">None</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label className="text-sm text-[#666]">Queue<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.queue} onChange={(event) => update("queue", event.target.value)}><option value="">None</option><option>Sales</option><option>Support</option></select></label><label className="text-sm text-[#666]">Assigned to<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.assigneeId} onChange={(event) => update("assigneeId", event.target.value)}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></div><div className="p-5"><div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Task notes" className="min-h-36 overflow-auto text-sm outline-none empty:before:text-[#aaa] empty:before:content-['Add_notes...']" onInput={(event) => { update("notes", event.currentTarget.innerHTML); refreshState(); }} onMouseUp={refreshState} onKeyUp={refreshState} onFocus={refreshState} /><div className="mt-4 flex flex-wrap items-center gap-1 border-t pt-3"><button className={tool(active.bold)} type="button" aria-label="Bold" aria-pressed={active.bold} onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")}><strong>B</strong></button><button className={tool(active.italic)} type="button" aria-label="Italic" aria-pressed={active.italic} onMouseDown={(event) => event.preventDefault()} onClick={() => format("italic")}><em>I</em></button><button className={tool(active.underline)} type="button" aria-label="Underline" aria-pressed={active.underline} onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")}><u>U</u></button><button className={tool(false)} type="button" aria-label="Remove formatting" onMouseDown={(event) => event.preventDefault()} onClick={() => format("removeFormat")}>Tₓ</button><button className={tool(active.bullet)} type="button" aria-label="Bulleted list" aria-pressed={active.bullet} onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertUnorderedList")}>• List</button><button className={tool(active.number)} type="button" aria-label="Numbered list" aria-pressed={active.number} onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertOrderedList")}>1. List</button><button className={tool(false)} type="button" aria-label="Insert link" onMouseDown={(event) => event.preventDefault()} onClick={() => format("createLink", window.prompt("Link URL") || "")}>↗</button></div><p className="mt-4 border-t pt-4 text-sm font-bold">Associated with 1 record⌄</p>{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}</div></div><div className="flex shrink-0 justify-end border-t px-5 py-4"><button className="rounded-full bg-[#f1f1f1] px-6 py-3 font-bold text-[#888] disabled:opacity-60" disabled={saving} type="submit">{saving ? "Creating..." : "Create task"}</button></div></form></div>;
}

function CreateTaskModalLegacyFormatting({ company, users, onClose, onSaved }: { company: CompanyRecord; users: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", dueAt: "", reminderAt: "", taskType: "TODO", priority: "", queue: "", assigneeId: users[0]?.id || "", notes: "" });
  const [dueOpen, setDueOpen] = useState(false); const [moreOpen, setMoreOpen] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const dueRef = useRef<HTMLDivElement>(null); const editorRef = useRef<HTMLDivElement>(null); const selectionRef = useRef<Range | null>(null);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const addDays = (days: number, business = false) => { const date = new Date(); let added = 0; while (added < days) { date.setDate(date.getDate() + 1); if (!business || (date.getDay() !== 0 && date.getDay() !== 6)) added += 1; } date.setHours(8, 0, 0, 0); return date; };
  const toInput = (date: Date) => { const pad = (value: number) => String(value).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; };
  const dateOptions = [{ label: "Today", date: () => { const date = new Date(); date.setHours(8, 0, 0, 0); return date; } }, { label: "Tomorrow", date: () => addDays(1) }, { label: "In 1 business day", date: () => addDays(1, true) }, { label: "In 2 business days", date: () => addDays(2, true) }, { label: "In 3 business days", date: () => addDays(3, true) }, { label: "In 1 week", date: () => addDays(7) }, { label: "In 2 weeks", date: () => addDays(14) }, { label: "In 1 month", date: () => addDays(30) }, { label: "In 3 months", date: () => addDays(90) }, { label: "In 6 months", date: () => addDays(180) }];
  useEffect(() => { const close = (event: MouseEvent) => { if (dueRef.current && !dueRef.current.contains(event.target as Node)) setDueOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const selectedDate = form.dueAt ? new Date(form.dueAt) : null; const dueLabel = selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }) : `In 3 business days (${addDays(3, true).toLocaleDateString(undefined, { weekday: "long" })})`;
  const remember = () => { const selection = window.getSelection(); if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) selectionRef.current = selection.getRangeAt(0).cloneRange(); };
  const format = (command: string, value?: string) => { editorRef.current?.focus(); const selection = window.getSelection(); if (selectionRef.current && selection) { selection.removeAllRanges(); selection.addRange(selectionRef.current); } try { document.execCommand(command, false, value); } catch { /* unsupported */ } if (editorRef.current) update("notes", editorRef.current.innerHTML); remember(); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (saving) return; setSaving(true); setError(""); try { const response = await fetch(`${API_URL}/tasks`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ ...form, companyId: company.id, dueAt: form.dueAt || addDays(3, true).toISOString(), reminderAt: form.reminderAt || null, priority: form.priority || null, queue: form.queue || null, assigneeId: form.assigneeId || null }) }); const payload = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(payload?.message || "Unable to create task"); await onSaved(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create task"); } finally { setSaving(false); } };
  const tool = "rounded px-2 py-1 text-sm font-semibold text-[#213343] hover:bg-[#f7f9fb]";
  return <div className="fixed inset-0 z-[100] flex h-dvh items-center justify-center bg-black/30 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true"><form className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex shrink-0 items-center justify-between border-b px-5 py-3"><h2 className="text-xl font-bold">Task</h2><button type="button" onClick={onClose} aria-label="Close task form"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto"><div className="p-5"><input className="w-full border-0 p-0 text-base font-semibold outline-none placeholder:text-[#666]" placeholder="Enter a task title" required value={form.title} onChange={(event) => update("title", event.target.value)} /><div className="mt-7 grid gap-5 sm:grid-cols-2"><div ref={dueRef} className="relative"><p className="text-sm text-[#666]">Due date</p><button className="mt-2 font-bold text-[#343434]" type="button" onClick={() => setDueOpen((open) => !open)}>◷ {dueLabel} <span className="ml-2 text-sm">{selectedDate ? selectedDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "8:00 AM"}</span></button>{dueOpen ? <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-lg border border-[#cbd6e2] bg-white p-2 shadow-xl">{dateOptions.map((option) => <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[#f7f9fb]" type="button" key={option.label} onClick={() => { update("dueAt", toInput(option.date())); setDueOpen(false); }}>{option.label} ({option.date().toLocaleDateString(undefined, { weekday: "long" })})</button>)}<label className="mt-1 block border-t px-3 pt-2 text-sm font-semibold">Custom date and time<input className="mt-1 w-full rounded border px-2 py-1 font-normal" type="datetime-local" value={form.dueAt} onChange={(event) => { update("dueAt", event.target.value); setDueOpen(false); }} /></label></div> : null}</div><div><p className="text-sm text-[#666]">Reminder</p><select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.reminderAt} onChange={(event) => update("reminderAt", event.target.value)}><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option></select></div></div></div><div className="grid grid-cols-2 gap-4 border-y px-5 py-4 sm:grid-cols-4"><label className="text-sm text-[#666]">Task Type<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.taskType} onChange={(event) => update("taskType", event.target.value)}><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option></select></label><label className="text-sm text-[#666]">Priority<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="">None</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label className="text-sm text-[#666]">Queue<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.queue} onChange={(event) => update("queue", event.target.value)}><option value="">None</option><option>Sales</option><option>Support</option></select></label><label className="text-sm text-[#666]">Assigned to<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.assigneeId} onChange={(event) => update("assigneeId", event.target.value)}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></div><div className="p-5"><div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Task notes" data-placeholder="Add notes..." className="min-h-36 overflow-auto text-sm outline-none empty:before:text-[#aaa] empty:before:content-[attr(data-placeholder)]" onFocus={remember} onMouseUp={remember} onKeyUp={remember} onInput={(event) => update("notes", event.currentTarget.innerHTML)} /><div className="relative mt-4 flex flex-wrap items-center gap-1 border-t pt-3"><button className={tool} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")}>B</button><button className={`${tool} italic`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("italic")}>I</button><button className={`${tool} underline`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")}>U</button><button className={tool} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("removeFormat")}>Tₓ</button><button className={tool} type="button" onClick={() => setMoreOpen((open) => !open)}>More⌄</button>{moreOpen ? <div className="absolute bottom-10 left-20 z-20 rounded border bg-white p-1 shadow-lg"><button className="block px-3 py-1 text-left text-sm" type="button" onClick={() => format("strikeThrough")}>Strikethrough</button><button className="block px-3 py-1 text-left text-sm" type="button" onClick={() => format("formatBlock", "blockquote")}>Quote</button></div> : null}<button className={tool} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("createLink", window.prompt("Link URL") || "")}>↗</button><button className={tool} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { const url = window.prompt("Image URL"); if (url) format("insertImage", url); }}>▧</button><button className={tool} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertUnorderedList")}>☷</button><button className={tool} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertOrderedList")}>1.</button></div><p className="mt-4 border-t pt-4 text-sm font-bold">Associated with 1 record⌄</p>{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}</div></div><div className="flex shrink-0 justify-end border-t px-5 py-4"><button className="rounded-full bg-[#f1f1f1] px-6 py-3 font-bold text-[#888] disabled:opacity-60" disabled={saving} type="submit">{saving ? "Creating..." : "Create task"}</button></div></form></div>;
}

function CreateTaskModalLegacyStatic({ company, users, onClose, onSaved }: { company: CompanyRecord; users: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", dueAt: "", reminderAt: "", taskType: "TODO", priority: "", queue: "", assigneeId: users[0]?.id || "", notes: "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [moreOpen, setMoreOpen] = useState(false); const editorRef = useRef<HTMLDivElement>(null); const selectionRef = useRef<Range | null>(null);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const rememberSelection = () => { const selection = window.getSelection(); if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) selectionRef.current = selection.getRangeAt(0).cloneRange(); };
  const applyFormat = (command: string, value?: string) => { editorRef.current?.focus(); const selection = window.getSelection(); if (selectionRef.current && selection) { selection.removeAllRanges(); selection.addRange(selectionRef.current); } try { document.execCommand(command, false, value); } catch { /* unsupported browser command */ } if (editorRef.current) update("notes", editorRef.current.innerHTML); rememberSelection(); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (saving) return; setSaving(true); setError(""); try { const response = await fetch(`${API_URL}/tasks`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ ...form, notes: sanitizeTaskNotes(form.notes), companyId: company.id, dueAt: form.dueAt || null, reminderAt: form.reminderAt || null, priority: form.priority || null, queue: form.queue || null, assigneeId: form.assigneeId || null }) }); const payload = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(payload?.message || "Unable to create task"); await onSaved(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create task"); } finally { setSaving(false); } };
  const button = "rounded px-2 py-1 text-sm font-semibold text-[#213343] hover:bg-white";
  return <div className="fixed inset-0 z-[100] flex h-dvh items-center justify-center bg-black/30 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true"><form className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex shrink-0 items-center justify-between border-b px-5 py-3"><h2 className="text-xl font-bold">Task</h2><button type="button" onClick={onClose} aria-label="Close task form"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto"><div className="p-5"><input className="w-full border-0 p-0 text-base font-semibold outline-none placeholder:text-[#666]" placeholder="Enter a task title" required value={form.title} onChange={(event) => update("title", event.target.value)} /><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><p className="text-sm text-[#666]">Due date</p><p className="mt-2 font-bold text-[#343434]">{form.dueAt ? new Date(form.dueAt).toLocaleString() : "In 3 business days"}</p></div><div><p className="text-sm text-[#666]">Reminder</p><select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.reminderAt} onChange={(event) => update("reminderAt", event.target.value)}><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option></select></div></div></div><div className="grid grid-cols-2 gap-4 border-y px-5 py-4 sm:grid-cols-4"><label className="text-sm text-[#666]">Task Type<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.taskType} onChange={(event) => update("taskType", event.target.value)}><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option></select></label><label className="text-sm text-[#666]">Priority<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="">None</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label className="text-sm text-[#666]">Queue<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.queue} onChange={(event) => update("queue", event.target.value)}><option value="">None</option><option>Sales</option><option>Support</option></select></label><label className="text-sm text-[#666]">Assigned to<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.assigneeId} onChange={(event) => update("assigneeId", event.target.value)}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></div><div className="p-5"><div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Task notes" data-placeholder="Add notes..." className="min-h-36 overflow-auto text-sm outline-none empty:before:text-[#aaa] empty:before:content-[attr(data-placeholder)]" onFocus={rememberSelection} onMouseUp={rememberSelection} onKeyUp={rememberSelection} onInput={(event) => update("notes", event.currentTarget.innerHTML)} /><div className="relative mt-4 flex flex-wrap items-center gap-1 border-t pt-3"><button className={button} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("bold")}><strong>B</strong></button><button className={`${button} italic`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("italic")}>I</button><button className={`${button} underline`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("underline")}>U</button><button className={button} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("removeFormat")}>Tₓ</button><button className={button} type="button" onClick={() => setMoreOpen((open) => !open)}>More⌄</button>{moreOpen ? <div className="absolute bottom-10 left-20 z-20 rounded border bg-white p-1 shadow-lg"><button className="block w-full px-3 py-1 text-left text-sm" type="button" onClick={() => applyFormat("strikeThrough")}>Strikethrough</button><button className="block w-full px-3 py-1 text-left text-sm" type="button" onClick={() => applyFormat("formatBlock", "blockquote")}>Quote</button></div> : null}<button className={button} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("createLink", window.prompt("Link URL") || "")}>↗</button><button className={button} type="button" aria-label="Insert image" onMouseDown={(event) => event.preventDefault()} onClick={() => { const url = window.prompt("Image URL"); if (url) applyFormat("insertImage", url); }}>▧</button><button className={button} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("insertUnorderedList")}>☷</button><button className={button} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("insertOrderedList")}>1.</button></div><p className="mt-4 border-t pt-4 text-sm font-bold">Associated with 1 record⌄</p>{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}</div></div><div className="flex shrink-0 justify-end border-t px-5 py-4"><button className="rounded-full bg-[#f1f1f1] px-6 py-3 font-bold text-[#888] disabled:opacity-60" disabled={saving} type="submit">{saving ? "Creating..." : "Create task"}</button></div></form></div>;
}

function CreateTaskModalLegacyRich({ company, users, onClose, onSaved }: { company: CompanyRecord; users: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", dueAt: "", reminderAt: "", taskType: "TODO", priority: "", queue: "", assigneeId: users[0]?.id || "", notes: "" });
  const [dueOpen, setDueOpen] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const dueRef = useRef<HTMLDivElement>(null);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const addDays = (days: number, business = false) => { const date = new Date(); let added = 0; while (added < days) { date.setDate(date.getDate() + 1); if (!business || (date.getDay() !== 0 && date.getDay() !== 6)) added += 1; } date.setHours(8, 0, 0, 0); return date; };
  const formatInput = (date: Date) => { const pad = (value: number) => String(value).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; };
  const options = [{ label: "Today", date: () => { const date = new Date(); date.setHours(8, 0, 0, 0); return date; } }, { label: "Tomorrow", date: () => addDays(1) }, { label: "In 1 business day", date: () => addDays(1, true) }, { label: "In 2 business days", date: () => addDays(2, true) }, { label: "In 3 business days", date: () => addDays(3, true) }, { label: "In 1 week", date: () => addDays(7) }, { label: "In 2 weeks", date: () => addDays(14) }, { label: "In 1 month", date: () => addDays(30) }, { label: "In 3 months", date: () => addDays(90) }, { label: "In 6 months", date: () => addDays(180) }];
  useEffect(() => { const close = (event: MouseEvent) => { if (dueRef.current && !dueRef.current.contains(event.target as Node)) setDueOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const selectedDate = form.dueAt ? new Date(form.dueAt) : null;
  const dateLabel = selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }) : "In 3 business days (" + addDays(3, true).toLocaleDateString(undefined, { weekday: "long" }) + ")";
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (saving) return; setSaving(true); setError(""); try { const dueAt = form.dueAt || addDays(3, true).toISOString(); const response = await fetch(`${API_URL}/tasks`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ ...form, companyId: company.id, dueAt, reminderAt: form.reminderAt || null, priority: form.priority || null, queue: form.queue || null, assigneeId: form.assigneeId || null }) }); const payload = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(payload?.message || "Unable to create task"); await onSaved(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create task"); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-[100] flex h-dvh items-center justify-center bg-black/30 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true"><form className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex shrink-0 items-center justify-between border-b px-5 py-3"><h2 className="text-xl font-bold">Task</h2><button type="button" onClick={onClose} aria-label="Close task form"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto"><div className="p-5"><input className="w-full border-0 p-0 text-base font-semibold outline-none placeholder:text-[#666]" placeholder="Enter a task title" required value={form.title} onChange={(event) => update("title", event.target.value)} /><div className="mt-7 grid gap-5 sm:grid-cols-2"><div ref={dueRef} className="relative"><p className="text-sm text-[#666]">Due date</p><button className="mt-2 font-bold text-[#343434]" type="button" onClick={() => setDueOpen((open) => !open)}>{dateLabel} <span className="ml-2 text-sm">◷ {selectedDate ? selectedDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "8:00 AM"}</span></button>{dueOpen ? <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-lg border border-[#cbd6e2] bg-white p-2 shadow-xl">{options.map((option) => <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[#f7f9fb]" type="button" key={option.label} onClick={() => { update("dueAt", formatInput(option.date())); setDueOpen(false); }}>{option.label} ({option.date().toLocaleDateString(undefined, { weekday: "long" })})</button>)}<label className="mt-1 block border-t px-3 pt-2 text-sm font-semibold">Custom date and time<input className="mt-1 w-full rounded border px-2 py-1 font-normal" type="datetime-local" value={form.dueAt} onChange={(event) => { update("dueAt", event.target.value); setDueOpen(false); }} /></label></div> : null}</div><div><p className="text-sm text-[#666]">Reminder</p><select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.reminderAt} onChange={(event) => update("reminderAt", event.target.value)}><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option></select></div></div></div><div className="grid grid-cols-2 gap-4 border-y px-5 py-4 sm:grid-cols-4"><label className="text-sm text-[#666]">Task Type<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.taskType} onChange={(event) => update("taskType", event.target.value)}><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option></select></label><label className="text-sm text-[#666]">Priority<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="">None</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label className="text-sm text-[#666]">Queue<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.queue} onChange={(event) => update("queue", event.target.value)}><option value="">None</option><option>Sales</option><option>Support</option></select></label><label className="text-sm text-[#666]">Assigned to<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.assigneeId} onChange={(event) => update("assigneeId", event.target.value)}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></div><div className="p-5"><textarea className="min-h-32 w-full resize-y border-0 text-sm outline-none placeholder:text-[#aaa]" placeholder="Add notes..." value={form.notes} onChange={(event) => update("notes", event.target.value)} /><p className="mt-3 border-t pt-3 text-sm font-semibold">Associated with 1 record⌄</p>{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}</div></div><div className="flex shrink-0 justify-end border-t px-5 py-4"><button className="rounded-full bg-[#f1f1f1] px-6 py-3 font-bold text-[#888] disabled:opacity-60" disabled={saving} type="submit">{saving ? "Creating..." : "Create task"}</button></div></form></div>;
}

function CreateTaskModalLegacy({ company, users, onClose, onSaved }: { company: CompanyRecord; users: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", dueAt: "", reminderAt: "", taskType: "TODO", priority: "", queue: "", assigneeId: users[0]?.id || "", notes: "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [repeat, setRepeat] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const businessDate = (days: number) => { const date = new Date(); let added = 0; while (added < days) { date.setDate(date.getDate() + 1); if (date.getDay() !== 0 && date.getDay() !== 6) added += 1; } date.setHours(8, 0, 0, 0); return date; };
  const dueLabel = form.dueAt ? new Date(form.dueAt).toLocaleString([], { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "In 3 business days (Tuesday)";
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (saving) return; setSaving(true); setError(""); try { const dueAt = form.dueAt || businessDate(3).toISOString(); const response = await fetch(`${API_URL}/tasks`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ ...form, companyId: company.id, dueAt, reminderAt: form.reminderAt || null, priority: form.priority || null, queue: form.queue || null, assigneeId: form.assigneeId || null }) }); const payload = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(payload?.message || "Unable to create task"); await onSaved(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create task"); } finally { setSaving(false); } };
  const format = (command: string, value?: string) => { document.execCommand(command, false, value); };
  return <div className="fixed inset-0 z-[100] flex h-dvh items-center justify-center bg-black/30 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true"><form className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex shrink-0 items-center justify-between border-b px-5 py-3"><h2 className="text-xl font-bold">Task</h2><button type="button" onClick={onClose} aria-label="Close task form"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto"><div className="p-5"><input className="w-full border-0 p-0 text-base font-semibold outline-none placeholder:text-[#666]" placeholder="Enter a task title" required value={form.title} onChange={(event) => update("title", event.target.value)} /><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><p className="text-sm text-[#666]">Due date</p><button className="mt-2 font-bold text-[#343434]" type="button" onClick={() => update("dueAt", businessDate(3).toISOString())}>{dueLabel}</button><span className="ml-3 text-sm font-semibold">◷ 8:00 AM</span></div><div><p className="text-sm text-[#666]">Reminder</p><select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.reminderAt} onChange={(event) => update("reminderAt", event.target.value)}><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option></select></div></div><label className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#666]"><input className="h-6 w-6" type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} />Set to repeat <span className="rounded-full border px-1 text-xs">i</span></label></div><div className="grid grid-cols-2 gap-4 border-y px-5 py-4 sm:grid-cols-4"><label className="text-sm text-[#666]">Task Type<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.taskType} onChange={(event) => update("taskType", event.target.value)}><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option></select></label><label className="text-sm text-[#666]">Priority<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="">None</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label className="text-sm text-[#666]">Queue<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.queue} onChange={(event) => update("queue", event.target.value)}><option value="">None</option><option>Sales</option><option>Support</option></select></label><label className="text-sm text-[#666]">Assigned to<select className="mt-2 w-full border-0 p-0 font-bold outline-none" value={form.assigneeId} onChange={(event) => update("assigneeId", event.target.value)}><option value="">Soft Dev</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></div><div className="p-5"><div contentEditable suppressContentEditableWarning className="min-h-36 text-sm outline-none empty:before:text-[#aaa] empty:before:content-['Add_notes...']" onInput={(event) => update("notes", event.currentTarget.innerText)}>{form.notes}</div><div className="mt-4 flex items-center gap-4 border-t pt-3 text-lg"><button type="button" onClick={() => format("bold")}><strong>B</strong></button><button className="italic" type="button" onClick={() => format("italic")}>I</button><button className="underline" type="button" onClick={() => format("underline")}>U</button><button type="button" onClick={() => format("strikeThrough")}>T̶</button><button className="text-sm font-bold" type="button">More⌄</button><button type="button" onClick={() => format("createLink", prompt("Link URL") || "")}>↗</button><button type="button">▧</button><button type="button">☷</button></div><p className="mt-4 border-t pt-4 text-sm font-bold">Associated with 1 record⌄</p>{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}</div></div><div className="flex shrink-0 justify-end border-t px-5 py-4"><button className="rounded-full bg-[#f1f1f1] px-6 py-3 font-bold text-[#888] disabled:opacity-60" disabled={saving} type="submit">{saving ? "Creating..." : "Create task"}</button></div></form></div>;
}

function CreateTaskModalOld({ company, users, onClose, onSaved }: { company: CompanyRecord; users: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", dueAt: "", reminderAt: "", taskType: "TODO", priority: "", queue: "", assigneeId: users[0]?.id || "", notes: "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (saving) return; setSaving(true); setError(""); try { const response = await fetch(`${API_URL}/tasks`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ ...form, companyId: company.id, dueAt: form.dueAt || null, reminderAt: form.reminderAt || null, priority: form.priority || null, queue: form.queue || null, assigneeId: form.assigneeId || null }) }); const payload = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(payload?.message || "Unable to create task"); await onSaved(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create task"); } finally { setSaving(false); } };
  const input = "h-10 w-full rounded-lg border border-[#b8c5d1] bg-white px-3 text-sm outline-none focus:border-[#005c5f]";
  return <div className="fixed inset-0 z-[100] flex h-dvh items-center justify-center bg-black/30 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true"><form className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex shrink-0 items-center justify-between border-b px-5 py-4"><h2 className="text-xl font-bold">Task</h2><button type="button" onClick={onClose} aria-label="Close task form"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><label className="block text-sm font-semibold">Enter a task title<input className={`${input} mt-2`} required value={form.title} onChange={(event) => update("title", event.target.value)} /></label><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Due date<input className={`${input} mt-2`} type="datetime-local" value={form.dueAt} onChange={(event) => update("dueAt", event.target.value)} /></label><label className="text-sm font-semibold">Reminder<select className={`${input} mt-2`} value={form.reminderAt} onChange={(event) => update("reminderAt", event.target.value)}><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option></select></label><label className="text-sm font-semibold">Task Type<select className={`${input} mt-2`} value={form.taskType} onChange={(event) => update("taskType", event.target.value)}><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option></select></label><label className="text-sm font-semibold">Priority<select className={`${input} mt-2`} value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="">None</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label className="text-sm font-semibold">Queue<select className={`${input} mt-2`} value={form.queue} onChange={(event) => update("queue", event.target.value)}><option value="">None</option><option>Sales</option><option>Support</option></select></label><label className="text-sm font-semibold">Assigned to<select className={`${input} mt-2`} value={form.assigneeId} onChange={(event) => update("assigneeId", event.target.value)}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></div><label className="mt-5 block text-sm font-semibold">Add notes<textarea className="mt-2 min-h-32 w-full resize-y rounded-lg border border-[#b8c5d1] p-3 text-sm outline-none focus:border-[#005c5f]" value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label><p className="mt-4 rounded-md bg-[#f7f9fb] px-3 py-2 text-sm font-semibold text-[#516f90]">Associated with: {company.name}</p>{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}</div><div className="flex shrink-0 justify-end gap-2 border-t px-5 py-4"><button className="rounded-md border px-4 py-2" type="button" onClick={onClose}>Cancel</button><button className="rounded-md bg-[#006b70] px-5 py-2 font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Creating..." : "Create task"}</button></div></form></div>;
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-xs font-bold text-[#343a40]">
      {label}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

const meetingOutcomeClass: Record<string, string> = { Scheduled: "border-blue-200 bg-blue-50 text-blue-700", Completed: "border-green-200 bg-green-50 text-green-700", Rescheduled: "border-amber-200 bg-amber-50 text-amber-700", Cancelled: "border-red-200 bg-red-50 text-red-700", "No show": "border-purple-200 bg-purple-50 text-purple-700" };

function TimelineCard({ title, date, body, outcome }: { title: string; date: string; body: string; outcome?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const isMeeting = title !== "Logged call" && title !== "Record Enriched";
  return (
    <article className="rounded-2xl border border-[#d0d7de] bg-white p-4 shadow-[0_8px_20px_rgba(33,51,67,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {isMeeting ? <button type="button" className="shrink-0" aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`} onClick={() => setExpanded((current) => !current)}><ChevronRight className={`h-4 w-4 text-[#516f90] transition-transform ${expanded ? "rotate-90" : ""}`} /></button> : <ChevronRight className="h-4 w-4 shrink-0 text-[#516f90]" />}
          <h4 className="truncate text-sm font-bold text-[#343a40]">{title}</h4>
        </div>
        <time className="shrink-0 text-xs text-[#516f90]">{date}</time>
      </div>
      <p className="mt-3 pl-7 text-sm leading-6 text-[#343a40]">{body}</p>
      {outcome ? <span className={`ml-7 mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${meetingOutcomeClass[outcome] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>{outcome}</span> : null}
      {isMeeting && expanded ? <div className="mt-4 grid gap-3 border-t border-[#e7edf3] pl-7 pt-4 text-sm sm:grid-cols-2"><MeetingDetail label="Details" value={body} /><MeetingDetail label="Status" value={outcome ?? "No outcome"} /></div> : null}
    </article>
  );
}

function MeetingDetail({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-xs font-semibold uppercase tracking-wide text-[#8293a6]">{label}</span><span className="mt-1 block text-[#213343]">{value}</span></div>;
}

function _ActionButton({ active, icon: Icon, label }: { active?: boolean; icon: typeof Mail; label: string }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
        active ? "border-[#ff5c35] bg-[#ff5c35] text-white" : "border-[#dbe4ed] bg-white text-[#213343] hover:bg-[#f7f9fb]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function AddButton() {
  return (
    <button className="inline-flex items-center gap-1 rounded-md border border-[#dbe4ed] px-3 py-1.5 text-sm font-semibold">
      <Plus className="h-4 w-4" />
      Add
    </button>
  );
}

function Panel({ title, children, action, icon }: { title: string; children: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#dbe4ed] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-[#213343]">
          {icon}
          {title}
        </h2>
        {action ?? <Ellipsis className="h-4 w-4 text-[#516f90]" />}
      </div>
      {children}
    </section>
  );
}

function _InsightCard({ title, body, suggestion }: { title: string; body: string; suggestion: string }) {
  return (
    <Panel
      title={title}
      action={
        <span className="inline-flex items-center gap-1 rounded-md bg-[#ffe8dc] px-3 py-1.5 text-xs font-bold text-[#f75c2f]">
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </span>
      }
      icon={title === "Company insights" ? <Sparkles className="h-4 w-4 text-[#ff5c35]" /> : <MessageSquarePlus className="h-4 w-4" />}
    >
      <div className="rounded-lg bg-[#fff4ef] p-4">
        <p className="mb-3 flex items-center gap-2 text-xs text-[#516f90]">
          Generated October 12, 2026, 1:31 PM
          <RefreshCw className="h-3.5 w-3.5 text-[#ff5c35]" />
        </p>
        <p className="text-sm leading-6 text-[#213343]">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#ff5c35]" />
          <strong>{body.split(":")[0]}:</strong>
          {body.includes(":") ? body.slice(body.indexOf(":") + 1) : body}
        </p>
        <p className="mt-2 pl-4 text-xs leading-5 text-[#516f90]">{suggestion}</p>
        <div className="mt-4 border-t border-[#f3c7b8] pt-3 text-center text-xs font-bold text-[#213343]">See more insights</div>
      </div>
      {title === "Company insights" ? (
        <button className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#ff8f70] px-4 py-2 text-sm font-bold text-[#bd4b26]">
          <Bot className="h-4 w-4" />
          Ask a question
        </button>
      ) : null}
    </Panel>
  );
}


