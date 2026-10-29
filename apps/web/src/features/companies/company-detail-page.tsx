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
type CompanyContact = { id: string; firstName: string; lastName?: string | null; email?: string | null; phone?: string | null; title?: string | null; department?: string | null; roleInPurchase?: string | null; lifecycleStage?: string | null; leadStatus?: string | null; owner?: { name: string } | null };
const repairContactText = (value?: string | null) => {
  if (!value || !/[ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡]/.test(value)) return value;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(value, (character) => character.charCodeAt(0)));
  } catch {
    return value;
  }
};
type CompanyDeal = { id: string; name: string; amount?: number | string | null; stage: string; closeDate?: string | null; contactId?: string | null };
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
  const [companyMeetings, setCompanyMeetings] = useState<Meeting[]>([]);
  const loadCompany = async () => {
    const response = await fetch(`${API_URL}/companies`, { cache: "no-store" });
    const result = await response.json() as { data: CompanyRecord[] };
    const records = result.data ?? [];
    setCompanies(records);
    let detail = await fetch(`${API_URL}/companies/${companyId}`, { cache: "no-store" });
    if (!detail.ok) {
      const normalized = companyId.toLowerCase().replace(/-/g, " ");
      const match = records.find((record) => record.id === companyId || record.name.toLowerCase() === normalized || record.name.toLowerCase().replace(/\s+/g, "-") === companyId.toLowerCase());
      if (!match) throw new Error("Company not found");
      detail = await fetch(`${API_URL}/companies/${match.id}`, { cache: "no-store" });
    }
    const loaded = await detail.json() as Partial<CompanyRecord>;
    setCompany({ ...loaded, contacts: Array.isArray(loaded.contacts) ? loaded.contacts : [], deals: Array.isArray(loaded.deals) ? loaded.deals : [], regions: Array.isArray(loaded.regions) ? loaded.regions : [], subCompanies: Array.isArray(loaded.subCompanies) ? loaded.subCompanies : [], id: loaded.id ?? companyId, name: loaded.name ?? "Company", parentCompanyId: loaded.parentCompanyId ?? null } as CompanyRecord);
    const meetingsResponse = await fetch(`${API_URL}/meetings?companyId=${encodeURIComponent((loaded.id ?? companyId) as string)}&limit=100`, { cache: "no-store" });
    if (meetingsResponse.ok) setCompanyMeetings(((await meetingsResponse.json()) as { data?: Meeting[] }).data ?? []);
  };
  useEffect(() => { void Promise.all([loadCompany(), fetch(`${API_URL}/users?limit=100`, { cache: "no-store" }).then((response) => response.json()).then((payload: { data?: Array<{ id: string; name: string }> } | Array<{ id: string; name: string }>) => setUsers(Array.isArray(payload) ? payload : payload.data ?? []))]).catch(() => setError("Unable to load company hierarchy")); }, [companyId]);
  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const toggleSection = (title: string) => setCollapsedSections((sections) => ({ ...sections, [title]: !sections[title] }));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-3 flex items-center gap-2 px-1 text-sm text-[#516f90]">
          <Link className="inline-flex items-center gap-2 hover:text-[#ff5c35]" href="/companies">
            <ChevronLeft className="h-4 w-4" />
            <span>Companies</span>
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-[#213343]">{company?.name ?? "Loading company..."}</span>
        </div>

        <CompanyHeader compact={headerCompact} company={company} companies={companies} users={users} onRefresh={loadCompany} onOpenMeeting={() => setMeetingModalOpen(true)} />
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
              <div className={`relative grid gap-4 pt-2 ${rightRailCollapsed ? "xl:grid-cols-[minmax(0,1fr)_0px]" : "xl:grid-cols-[minmax(0,1fr)_380px]"}`}>
                <OverviewWorkspace />
                <button className={`absolute top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid ${rightRailCollapsed ? "right-0" : "right-[368px]"}`} onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records">
                  <ChevronRight className={`h-4 w-4 transition ${rightRailCollapsed ? "rotate-180" : ""}`} />
                </button>
                <aside className={`space-y-4 ${rightRailCollapsed ? "hidden" : ""}`}>
                  <RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} />
                </aside>
              </div>
            ) : null}
            {activeTab === "Activities" ? (
              <div className={`relative grid gap-4 pt-2 ${rightRailCollapsed ? "xl:grid-cols-[minmax(0,1fr)_0px]" : "xl:grid-cols-[minmax(0,1fr)_380px]"}`}>
                <ActivityWorkspace meetings={companyMeetings} />
                <button className="absolute right-[368px] top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid" onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records">
                  <ChevronRight className={`h-4 w-4 transition ${rightRailCollapsed ? "rotate-180" : ""}`} />
                </button>
                <aside className={rightRailCollapsed ? "hidden" : "space-y-4"}>
                  <RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} />
                </aside>
              </div>
            ) : null}
            {activeTab === "Related" ? (
              <div className="relative grid gap-4 pt-2 xl:grid-cols-[minmax(0,1fr)_380px]">
                <CompanyHierarchy company={company} companies={companies} newRegion={newRegion} selectedSubCompany={selectedSubCompany} setNewRegion={setNewRegion} setSelectedSubCompany={setSelectedSubCompany} onRefresh={loadCompany} error={error} />
                <button className="absolute right-[368px] top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid" onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records"><ChevronRight className="h-4 w-4" /></button>
                <aside className="space-y-4"><RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} /></aside>
              </div>
            ) : null}
            {activeTab === "Settings" ? (
              <div className="relative grid gap-4 pt-2 xl:grid-cols-[minmax(0,1fr)_380px]">
                <PlaceholderTab title="Company settings" />
                <button className="absolute right-[368px] top-8 z-10 hidden h-9 w-9 place-items-center rounded-full border border-[#9fb3c8] bg-white shadow-sm xl:grid" onClick={() => setRightRailCollapsed((collapsed) => !collapsed)} type="button" aria-label="Toggle related records"><ChevronRight className="h-4 w-4" /></button>
                <aside className="space-y-4"><RelatedPanels company={company} onRefresh={loadCompany} collapsedSections={collapsedSections} toggleSection={toggleSection} /></aside>
              </div>
            ) : null}
        </section>
      </div>
      {meetingModalOpen && company ? <MeetingModal meeting={null} users={users} contacts={company.contacts.map((contact) => ({ id: contact.id, firstName: contact.firstName, lastName: contact.lastName, email: contact.email }))} deals={company.deals.map((deal) => ({ id: deal.id, name: deal.name }))} companies={companies.map((item) => ({ id: item.id, name: item.name, parentCompanyId: item.parentCompanyId }))} initialCompanyId={company.id} initialCompanyName={company.name} onClose={() => setMeetingModalOpen(false)} onSaved={async () => { setMeetingModalOpen(false); await loadCompany(); }} /> : null}
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
  const [statusOpen, setStatusOpen] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", owner: "Soft Dev", title: "", department: "", roleInPurchase: "", phone: "", lifecycleStage: "", leadStatus: "" });
  const creating = useRef(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  useEffect(() => { if (tab === "existing") void fetch(`${API_URL}/companies/${companyId}/contacts`).then((response) => response.json()).then((payload: unknown) => { const value = payload as { data?: CompanyContact[]; value?: CompanyContact[] }; setContacts(Array.isArray(payload) ? payload : Array.isArray(value.data) ? value.data : Array.isArray(value.value) ? value.value : []); }); }, [companyId, tab]);
  const create = async (event: React.FormEvent) => { event.preventDefault(); if (creating.current) return; creating.current = true; try { await fetch(`${API_URL}/companies/${companyId}/contacts`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, title: form.title, department: form.department, roleInPurchase: form.roleInPurchase, lifecycleStage: form.lifecycleStage, leadStatus: form.leadStatus, owner: form.owner }) }); await onSaved(); } finally { creating.current = false; } };
  const [linkingIds, setLinkingIds] = useState<Set<string>>(new Set());
  const addExisting = async (id: string) => { if (linkingIds.has(id)) return; setLinkingIds((current) => new Set(current).add(id)); try { const response = await fetch(`${API_URL}/companies/${companyId}/contacts/${id}`, { method: "POST" }); if (response.ok) await onSaved(); } finally { setLinkingIds((current) => { const next = new Set(current); next.delete(id); return next; }); } };
  const available = (Array.isArray(contacts) ? contacts : []).filter((contact) => !(currentContacts ?? []).some((current) => current.id === contact.id) && `${contact.firstName} ${contact.lastName ?? ""} ${contact.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#111827]/45 p-4"><div className="max-h-[90vh] w-full max-w-[680px] overflow-auto rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#dbe4ed] px-6 py-4"><h2 className="text-xl font-bold">{tab === "new" ? "Create new Contact" : "Add existing Contact"}</h2><button className="grid h-9 w-9 place-items-center rounded-md text-[#516f90] transition hover:bg-[#f1f5f9] hover:text-[#213343]" type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="grid grid-cols-2 border-b border-[#dbe4ed] text-center font-semibold"><button className={`border-b-4 px-4 py-3 ${tab === "new" ? "border-[#333]" : "border-transparent"}`} type="button" onClick={() => setTab("new")}>Create new</button><button className={`border-b-4 px-4 py-3 ${tab === "existing" ? "border-[#333]" : "border-transparent"}`} type="button" onClick={() => setTab("existing")}>Add existing</button></div>{tab === "new" ? <form className="grid gap-4 p-6 sm:grid-cols-2" onSubmit={create}>{(["email", "firstName", "lastName", "owner", "title", "department", "roleInPurchase", "phone"] as const).map((field) => <label className="grid gap-1 text-sm font-semibold" key={field}>{field === "owner" ? "Contact owner" : field === "title" ? "Job title" : field === "firstName" ? "First name" : field === "lastName" ? "Last name" : field === "phone" ? "Phone number" : field === "department" ? "Department" : field === "roleInPurchase" ? "Role in purchase" : "Email"}<input className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" required={field === "email" || field === "firstName"} type={field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => update(field, event.target.value)} /></label>)}<label className="grid gap-1 text-sm font-semibold">Lifecycle stage<select className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" value={form.lifecycleStage} onChange={(event) => update("lifecycleStage", event.target.value)}><option value="">Select stage</option><option>Subscriber</option><option>Lead</option><option>Customer</option></select></label><label className="relative grid gap-1 text-sm font-semibold">Lead status<button className="flex w-full items-center justify-between rounded-md border border-[#cbd6e2] px-4 py-3 text-left font-normal" type="button" onClick={() => setStatusOpen((open) => !open)}><span className={leadStatuses.find(([status]) => status === form.leadStatus)?.[1] ?? "text-[#516f90]"}>{form.leadStatus || "Select status"}</span><ChevronDown className="h-4 w-4 text-[#516f90]" aria-hidden="true" /></button>{statusOpen ? <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-48 overflow-y-auto overscroll-contain rounded-md border border-[#cbd6e2] bg-white p-1 shadow-lg">{leadStatuses.map(([status, color]) => <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[#f7f9fb]" type="button" key={status} onClick={() => { update("leadStatus", status); setStatusOpen(false); }}><span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${color}`}>{status}</span></button>)}</div> : null}</label><div className="flex justify-end gap-2 sm:col-span-2"><button className="rounded-md border px-4 py-2" type="button" onClick={onClose}>Cancel</button><button className="rounded-md bg-[#006b70] px-4 py-2 font-semibold text-white" type="submit">Create</button></div></form> : <div className="p-6"><input className="mb-4 w-full rounded-full border-2 border-[#1473e6] px-4 py-3" placeholder="Search Contacts" value={search} onChange={(event) => setSearch(event.target.value)} />{available.length ? available.map((contact) => <label className="flex items-center gap-3 border-b py-3" key={contact.id}><input type="checkbox" disabled={linkingIds.has(contact.id)} onChange={() => void addExisting(contact.id)} /><span>{contact.firstName} {contact.lastName ?? ""} ({contact.email || "No email"})</span></label>) : <p className="py-6 text-center text-sm text-[#516f90]">No existing contacts available.</p>}</div>}</div></div>;
}

function CreateDealModal({ company, onClose, onSaved }: { company: CompanyRecord; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", amount: "", closeDate: "", stage: "Appointment Scheduled", priority: "MEDIUM", contactId: "" });
  const creating = useRef(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (creating.current) return; creating.current = true; try { const response = await fetch(`${API_URL}/deals`, { method: "POST", headers: createHeaders(createIdempotencyKey()), body: JSON.stringify({ ...form, amount: form.amount || null, contactId: form.contactId || null, companyId: company.id }) }); if (response.ok) await onSaved(); } finally { creating.current = false; } };
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#111827]/45 p-4"><form className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-xl bg-white shadow-2xl" onSubmit={submit}><div className="flex items-center justify-between border-b border-[#dbe4ed] px-6 py-4"><h2 className="text-xl font-bold">Create deal</h2><button className="grid h-9 w-9 place-items-center rounded-md text-[#516f90] transition hover:bg-[#f1f5f9] hover:text-[#213343]" type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="grid gap-4 p-6 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold sm:col-span-2">Deal name<input className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" required value={form.name} onChange={(event) => update("name", event.target.value)} /></label><label className="grid gap-1 text-sm font-semibold">Amount<input className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" type="number" min="0" value={form.amount} onChange={(event) => update("amount", event.target.value)} /></label><label className="grid gap-1 text-sm font-semibold">Close date<input className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" type="date" value={form.closeDate} onChange={(event) => update("closeDate", event.target.value)} /></label><label className="grid gap-1 text-sm font-semibold">Deal stage<select className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" value={form.stage} onChange={(event) => update("stage", event.target.value)}><option>Appointment Scheduled</option><option>Presentation Scheduled</option><option>Decision Maker Bought-In</option><option>Contract Sent</option><option>Closed Won</option><option>Closed Lost</option></select></label><label className="grid gap-1 text-sm font-semibold">Priority<select className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label className="grid gap-1 text-sm font-semibold sm:col-span-2">Contact<select className="rounded-md border border-[#cbd6e2] px-3 py-2 font-normal" value={form.contactId} onChange={(event) => update("contactId", event.target.value)}><option value="">No contact</option>{company.contacts.map((contact) => <option value={contact.id} key={contact.id}>{contact.firstName} {contact.lastName ?? ""}</option>)}</select></label></div><div className="flex justify-end gap-2 border-t border-[#dbe4ed] px-6 py-4"><button className="rounded-md border px-4 py-2" type="button" onClick={onClose}>Cancel</button><button className="rounded-md bg-[#ff5c35] px-5 py-2 font-semibold text-white" type="submit">Create deal</button></div></form></div>;
}

function RelatedPanels({ company, onRefresh, collapsedSections, toggleSection }: { company: CompanyRecord | null; onRefresh: () => Promise<void>; collapsedSections: Record<string, boolean>; toggleSection: (title: string) => void }) {
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
                          <div className="flex items-center gap-1"><span className="cursor-grab rounded p-1 text-[#516f90]" title="Drag to reorder"><GripVertical className="h-4 w-4" /></span><details className="relative"><summary className="cursor-pointer list-none rounded p-1 text-[#516f90] hover:bg-[#f1f5f9]"><Ellipsis className="h-4 w-4" /></summary><div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-[#dbe4ed] bg-white p-1 text-xs shadow-lg"><button className="block w-full rounded px-3 py-2 text-left hover:bg-[#f7f9fb]" type="button" onClick={async () => { await fetch(`${API_URL}/companies/${company?.id}/contacts/${contact.id}`, { method: "DELETE" }); await onRefresh(); }}>Unlink contact</button><button className="block w-full rounded px-3 py-2 text-left text-red-700 hover:bg-[#fff1eb]" type="button" onClick={async () => { if (window.confirm("Delete this contact permanently?")) { await fetch(`${API_URL}/contacts/${contact.id}`, { method: "DELETE" }); await onRefresh(); } }}>Delete contact</button></div></details></div>
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
              collapsed={collapsedSections["Deals (0)"]}
              onToggle={() => toggleSection("Deals (0)")}
            >
              {company?.deals?.length ? <div className="space-y-2">{company.deals.map((deal) => <div className="rounded-lg border border-[#dbe4ed] p-3" key={deal.id}><p className="font-bold text-[#007a8a]">{deal.name}</p><p className="mt-1 text-sm text-[#516f90]">{deal.stage} {deal.amount ? `ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹${deal.amount}` : ""}</p></div>)}</div> : <div className="rounded-lg bg-[#f7f9fb] p-6 text-center">
                <BriefcaseBusiness className="mx-auto h-9 w-9 text-[#7c98b6]" />
                <p className="mt-3 text-sm font-bold">No deals yet</p>
                <p className="mt-1 text-xs text-[#516f90]">Create a deal to track this company&apos;s opportunities.</p>
                <button className="mt-4 rounded-md bg-[#ff5c35] px-4 py-2 text-sm font-bold text-white" type="button" onClick={() => setDealModal(true)}>Create deal</button>
              </div>}
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

function CompanyHeader({ compact, company, companies, users, onRefresh, onOpenMeeting }: { compact: boolean; company: CompanyRecord | null; companies: CompanyRecord[]; users: Array<{ id: string; name: string }>; onRefresh: () => Promise<void>; onOpenMeeting: () => void }) {
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
              {[["Note", MessageSquarePlus], ["Email", Mail], ["Call", Phone], ["Task", Target], ["Meeting", CalendarDays], ["More", Ellipsis]].map(([label, Icon]) => <button className="min-w-0 text-center" key={label as string} type="button" onClick={label === "Meeting" ? onOpenMeeting : undefined}><span className="mx-auto grid h-9 w-9 place-items-center rounded-full border border-[#9fb3c8]"><Icon className="h-4 w-4" /></span><span className="mt-1 block truncate">{label as string}</span></button>)}
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

function ActivityWorkspace({ meetings }: { meetings: Meeting[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#dbe4ed] bg-white shadow-sm">
      <div className="bg-[#f3f4f6] p-4">
        <div className="border-b border-[#cbd6e2]">
          <div className="flex flex-wrap gap-1 text-sm font-semibold text-[#343a40]">
            {["All activities", "Notes", "Emails", "Calls", "Tasks", "Meetings"].map((item, index) => (
              <button className={`mr-3 px-0 py-3 ${index === 0 ? "border-b-4 border-[#343a40] text-[#111827]" : ""}`} key={item}>
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

        <h3 className="mt-5 text-lg font-medium text-[#343a40]">Meetings</h3>
        <div className="mt-4 space-y-4">
          {meetings.length ? meetings.map((meeting) => <TimelineCard key={meeting.id} title={meeting.name} date={new Date(meeting.activityAt).toLocaleString()} body={[meeting.type, meeting.outcome, meeting.location].filter(Boolean).join(" · ") || "Company meeting"} />) : <p className="rounded-lg border border-dashed border-[#cbd6e2] p-5 text-sm text-[#516f90]">No meetings linked to this company yet.</p>}
        </div>

        <h3 className="mt-6 text-lg font-medium text-[#343a40]">October 2026</h3>
        <div className="mt-4 space-y-3">
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

function FilterButton({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-xs font-bold text-[#343a40]">
      {label}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

function TimelineCard({ title, date, body }: { title: string; date: string; body: string }) {
  return (
    <article className="rounded-2xl border border-[#d0d7de] bg-white p-4 shadow-[0_8px_20px_rgba(33,51,67,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight className="h-4 w-4 shrink-0 text-[#516f90]" />
          <h4 className="truncate text-sm font-bold text-[#343a40]">{title}</h4>
        </div>
        <time className="shrink-0 text-xs text-[#516f90]">{date}</time>
      </div>
      <p className="mt-3 pl-7 text-sm leading-6 text-[#343a40]">{body}</p>
    </article>
  );
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


