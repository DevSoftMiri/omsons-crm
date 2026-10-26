"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { AppShell } from "@/components/layout/app-shell";
import {
  BoardView,
  CollectionPageHeader,
  CrmCard,
  CrmPageFrame,
  IconButton,
  SortableBoardView,
} from "@/components/ui/crm-page-template";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/max";
import { createHeaders, createIdempotencyKey } from "@/lib/idempotency";
import {
  CalendarDays,
  ChevronDown,
  Columns3,
  Copy,
  ExternalLink,
  Filter,
  Grid2X2,
  Info,
  ListChecks,
  ListFilter,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowUp,
  StickyNote,
  UsersRound,
} from "lucide-react";
import { SortMenu, type SortDirection } from "@/components/ui/sort-menu";
import { sortRecords } from "@/components/ui/sort-records";

const contacts: Array<{ id: string; initials: string; name: string; email: string }> = [];
const contactSortOptions = [
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "createdAt", label: "Create date" },
  { value: "lastActivityAt", label: "Last activity date" },
  { value: "lastContactedAt", label: "Last contacted date" },
  { value: "nextFollowUpAt", label: "Next follow-up date" },
  { value: "owner", label: "Contact owner" },
  { value: "leadStatus", label: "Lead status" },
  { value: "lifecycleStage", label: "Lifecycle stage" },
  { value: "title", label: "Job title" },
  { value: "company", label: "Company name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "region", label: "Region" },
  { value: "contactSource", label: "Contact source" },
];
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const phoneCountries = getCountries()
  .map((short) => ({
    short: short === "GB" ? "UK" : short,
    name: new Intl.DisplayNames(["en"], { type: "region" }).of(short) ?? short,
    code: `+${getCountryCallingCode(short)}`,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));
const departmentOptions = [
  "Management",
  "Purchase",
  "Production",
  "Quality",
  "Engineering",
  "Stores",
  "Sales",
  "Accounts",
  "Administration",
  "Laboratory / R&D",
  "General",
];
const purchaseRoleOptions = [
  ["Decision Maker", "bg-violet-100 text-violet-700"],
  ["Purchase Contact", "bg-blue-100 text-blue-700"],
  ["Technical Evaluator", "bg-cyan-100 text-cyan-700"],
  ["End User", "bg-emerald-100 text-emerald-700"],
  ["Accounts Contact", "bg-amber-100 text-amber-700"],
  ["Primary Contact / Person In-charge", "bg-rose-100 text-rose-700"],
] as const;

function getPurchaseRoleColor(role: string) {
  return (
    purchaseRoleOptions.find(([option]) => option === role)?.[1] ??
    "bg-slate-100 text-slate-700"
  );
}

export function ContactsPage() {
  const [activeSegment, setActiveSegment] = useState("All contacts");
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [addStage, setAddStage] = useState("");
  const [sortBy, setSortBy] = useState("firstName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const sortedContacts = sortRecords(
    contacts,
    sortBy,
    sortDirection,
    (contact, key) =>
      key === "firstName"
        ? contact.name.split(" ")[0]
        : key === "lastName"
          ? contact.name.split(" ").slice(1).join(" ")
          : contact[key as keyof typeof contact],
  );
  if (viewMode === "board")
    return (
      <AppShell>
        <CrmPageFrame>
          <div className="mb-3 flex items-center justify-between px-2">
            <h1 className="text-2xl font-bold text-[#213343]">Contacts</h1>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[#ff5c35] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setAddStage("lead")}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add contact
            </button>
          </div>
          <ContactToolbar
            activeSegment={activeSegment}
            setActiveSegment={setActiveSegment}
            onTable={() => setViewMode("table")}
            filtersVisible={filtersVisible}
            setFiltersVisible={setFiltersVisible}
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            setSortDirection={setSortDirection}
          />
          <SharedContactBoard
            key={addStage || "none"}
            initialAddStage={addStage}
            onCloseAdd={() => setAddStage("")}
          />
        </CrmPageFrame>
      </AppShell>
    );
  return (
    <AppShell>
      <CrmPageFrame className="max-w-[1280px]">
        <h1 className="mb-3 px-2 text-2xl font-bold text-[#213343]">
          Contacts
        </h1>
        <div className="flex items-center gap-7 border-b border-[#dbe4ed] px-2 text-xs text-[#516f90]">
          {[
            "All contacts",
            "Newsletter subscribers",
            "Unsubscribed",
            "All customers",
          ].map((item, index) => (
            <button
              key={item}
              onClick={() => setActiveSegment(item)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 font-semibold ${activeSegment === item ? "border-[#ff5c35] text-[#ff5c35]" : "border-transparent"}`}
              type="button"
            >
              <UsersRound className="h-4 w-4" />
              {item}
              {index === 0 ? (
                <span className="rounded-full bg-[#fff0e9] px-1.5 text-[#ff5c35]">
                  2
                </span>
              ) : null}
            </button>
          ))}
          <button className="text-lg" type="button">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex h-9 w-56 items-center gap-2 rounded-md border border-[#cbd6e2] px-3 text-xs text-[#516f90]">
              <Search className="h-4 w-4" />
              <input
                className="min-w-0 flex-1 outline-none"
                placeholder="Search contacts..."
              />
            </label>
            <ToolbarButton
              icon={<Filter className="h-3.5 w-3.5" />}
              label="Filter"
            />
            <SortMenu
              options={contactSortOptions}
              value={sortBy}
              direction={sortDirection}
              onChange={(value, direction) => {
                setSortBy(value);
                setSortDirection(direction);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("board")}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#cbd6e2]"
              type="button"
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-md border border-[#ffb397] bg-[#fff7f3] text-[#ff5c35]"
              type="button"
            >
              <Columns3 className="h-4 w-4" />
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd6e2] px-3 text-xs font-semibold"
              type="button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Columns
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5 border-b border-[#dbe4ed] pb-3 text-xs font-semibold text-[#213343]">
          <span>
            Contact owner <ChevronDown className="inline h-3 w-3" />
          </span>
          <span>
            Create date <ChevronDown className="inline h-3 w-3" />
          </span>
          <span>
            Last activity date <ChevronDown className="inline h-3 w-3" />
          </span>
          <span>
            Lead status <ChevronDown className="inline h-3 w-3" />
          </span>
          <button className="grid h-7 w-7 place-items-center rounded-full border border-[#cbd6e2]">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button className="font-semibold text-[#ff5c35]">
            {" "}
            &nbsp;Advanced filters
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-md border border-[#e2e7ec]">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#f7f9fb] text-[#516f90]">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" />
                </th>
                <th className="w-[22%] px-2 py-3">
                  Name <ArrowUp className="inline h-3 w-3" />
                </th>
                <th className="w-[21%] px-2 py-3">Email</th>
                <th className="w-[12%] px-2 py-3">Phone Number</th>
                <th className="w-[11%] px-2 py-3">Lead Status</th>
                <th className="w-[13%] px-2 py-3">
                  Favorite Content
                  <br />
                  Topics
                </th>
                <th className="w-[12%] px-2 py-3">
                  Preferred
                  <br />
                  Channels
                </th>
                <th className="w-[10%] px-2 py-3">Create Date</th>
                <th className="w-8 px-2 py-3">
                  <MoreVertical className="h-4 w-4" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedContacts.map((contact) => (
                <tr className="border-t border-[#e8edf1]" key={contact.email}>
                  <td className="px-3 py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      className="inline-flex items-center hover:text-[#ff5c35]"
                      href={`/contacts/${contact.id}`}
                    >
                      <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-[#fff0e9] font-semibold text-[#e55b2f]">
                        {contact.initials}
                      </span>
                      <span className="font-semibold">{contact.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-3">
                    {contact.email}{" "}
                    <ExternalLink className="ml-1 inline h-3 w-3 text-[#ff5c35]" />
                  </td>
                  <td className="px-2 py-3 text-[#7c98b6]"></td>
                  <td className="px-2 py-3 text-[#7c98b6]"></td>
                  <td className="px-2 py-3 text-[#7c98b6]"></td>
                  <td className="px-2 py-3 text-[#7c98b6]"></td>
                  <td className="px-2 py-3 text-[#7c98b6]"></td>
                  <td className="px-2 py-3">
                    <MoreVertical className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-28" />
        </div>
        <div className="flex items-center justify-between pt-2 text-xs text-[#516f90]">
          <span>2 contacts</span>
          <div className="flex gap-2">
            <button className="grid h-8 w-8 place-items-center rounded-md border border-[#dbe4ed]">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="rounded-md border border-[#dbe4ed] px-3 py-2">
              {" "}
              &nbsp;Export
            </button>
            <button className="rounded-md border border-[#dbe4ed] px-3 py-2">
              <Copy className="mr-1 inline h-3 w-3" />
              Clone
            </button>
          </div>
        </div>
      </CrmPageFrame>
    </AppShell>
  );
}

type LegacyContactCard = { name: string; email: string; ago: string };

function LegacyContactsBoard() {
  const columns: Array<[string, string, string, LegacyContactCard[]]> = [
    ["Subscriber", "0", "bg-[#0878d1]", []],
    [
      "Lead",
      "1",
      "bg-[#e94b08]",
      [],
    ],
    ["Marketing Qualified Lead", "0", "bg-[#008b87]", []],
    ["Sales Qualified Lead", "0", "bg-[#d90088]", []],
    [
      "Opportunity",
      "1",
      "bg-[#6d45d8]",
      [],
    ],
    ["Customer", "0", "bg-[#1c8b5b]", []],
    ["Evangelist", "0", "bg-[#4774c7]", []],
    ["Other", "0", "bg-[#64748b]", []],
  ];
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map(([title, count, color, cards]) => (
        <section
          className="min-h-[380px] min-w-[285px] flex-1 rounded-2xl bg-[#f1f1f1] p-3"
          key={title}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`${color} rounded-md px-2 py-1 text-sm font-bold text-white`}
            >
              {title}
            </span>
            <span className="text-sm font-semibold text-[#516f90]">
              {count}
            </span>
          </div>
          <div className="space-y-3">
            {cards.map((card) => (
              <article
                className="rounded-2xl border border-[#cbd0d5] bg-white p-4 shadow-sm"
                key={card.email}
              >
                <h3 className="font-bold text-[#006d70]">{card.name}</h3>
                <p className="mt-3 text-sm text-[#006d70]"> {card.email} </p>
                <div className="mt-4 flex items-center justify-between border-t border-[#dbe4ed] pt-2 text-xs text-[#516f90]">
                  <span></span>
                  <span className="rounded-md border border-[#aeb6bd] px-3 py-2">
                    {" "}
                    {card.ago} &nbsp;
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SharedContactBoard({
  initialAddStage,
  onCloseAdd,
}: {
  initialAddStage?: string;
  onCloseAdd?: () => void;
}) {
  const [columns, setColumns] = useState([
    {
      id: "subscriber",
      label: "Subscriber",
      color: "bg-[#0878d1]",
      items: [] as ContactCard[],
    },
    {
      id: "lead",
      label: "Lead",
      color: "bg-[#e94b08]",
      items: [],
    },
    {
      id: "marketing-qualified",
      label: "Marketing Qualified Lead",
      color: "bg-[#008b87]",
      items: [],
    },
    {
      id: "sales-qualified",
      label: "Sales Qualified Lead",
      color: "bg-[#d90088]",
      items: [],
    },
    {
      id: "opportunity",
      label: "Opportunity",
      color: "bg-[#6d45d8]",
      items: [],
    },
    { id: "customer", label: "Customer", color: "bg-[#1c8b5b]", items: [] },
    { id: "evangelist", label: "Evangelist", color: "bg-[#4774c7]", items: [] },
    { id: "other", label: "Other", color: "bg-[#64748b]", items: [] },
  ]);
  const [addStage, setAddStage] = useState<string | null>(
    initialAddStage || null,
  );
  useEffect(() => {
    let active = true;
    void fetch(`${API_URL}/contacts`)
      .then((response) => (response.ok ? response.json() : []))
      .then((payload: unknown) => {
        if (!active || !Array.isArray(payload)) return;
        const stageIds: Record<string, string> = {
          Subscriber: "subscriber",
          Lead: "lead",
          "Marketing Qualified Lead": "marketing-qualified",
          "Sales Qualified Lead": "sales-qualified",
          Opportunity: "opportunity",
          Customer: "customer",
          Evangelist: "evangelist",
          Other: "other",
        };
        setColumns((current) => {
          const next = current.map((column) => ({
            ...column,
            items: [] as ContactCard[],
          }));
          for (const item of payload as Array<{
            id: string;
            firstName: string;
            lastName?: string | null;
            email?: string | null;
            title?: string | null;
            department?: string | null;
            roleInPurchase?: string | null;
            lifecycleStage?: string | null;
          }>) {
            const column = next.find(
              (entry) =>
                entry.id === (stageIds[item.lifecycleStage || ""] || "other"),
            );
            if (column)
              column.items.push({
                id: item.id,
                name: `${item.firstName} ${item.lastName || ""}`.trim(),
                email: item.email || "",
                title: item.title || "",
                department: item.department || "",
                roleInPurchase: item.roleInPurchase || "",
                ago: "Recently added",
              });
          }
          return next;
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setAddStage(initialAddStage || null);
  }, [initialAddStage]);
  const [activityForm, setActivityForm] = useState<{
    type: "Note" | "Task";
    contactName: string;
  } | null>(null);
  const moveContact = (
    contactId: string,
    targetId: string,
    beforeId?: string,
  ) =>
    setColumns((current) => {
      const source = current.find((column) =>
        column.items.some((item) => item.id === contactId),
      );
      if (!source) return current;
      const contact = source.items.find((item) => item.id === contactId)!;
      const withoutContact = current.map((column) => ({
        ...column,
        items: column.items.filter((item) => item.id !== contactId),
      }));
      return withoutContact.map((column) => {
        if (column.id !== targetId) return column;
        const insertionIndex = beforeId
          ? column.items.findIndex((item) => item.id === beforeId)
          : -1;
        const items = [...column.items];
        items.splice(
          insertionIndex < 0 ? items.length : insertionIndex,
          0,
          contact,
        );
        return { ...column, items };
      });
    });
  const addContact = async (contact: {
    firstName: string;
    lastName: string;
    email: string;
    stage: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    roleInPurchase?: string;
    leadStatus?: string;
  }) => {
    const target = contact.stage || addStage;
    if (!target) return;
    const lifecycleStage =
      columns.find((column) => column.id === target)?.label || target;
    const department =
      contact.department ||
      document.querySelector<HTMLSelectElement>('[name="department"]')?.value ||
      "";
    const roleInPurchase =
      contact.roleInPurchase ||
      document.querySelector<HTMLSelectElement>('[name="roleInPurchase"]')
        ?.value ||
      "";
    const response = await fetch(`${API_URL}/contacts`, {
      method: "POST",
      headers: createHeaders(createIdempotencyKey()),
      body: JSON.stringify({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.jobTitle,
        department,
        roleInPurchase,
        leadStatus: contact.leadStatus,
        lifecycleStage,
      }),
    });
    if (!response.ok) {
      window.alert("Unable to save contact");
      return;
    }
    const saved = await response.json();
    setColumns((current) =>
      current.map((column) =>
        column.id === target
          ? {
              ...column,
              items: [
                ...column.items,
                {
                  id: saved.id,
                  name: `${saved.firstName} ${saved.lastName || ""}`.trim(),
                  email: saved.email || "",
                  title: saved.title || "",
                  department: saved.department || "",
                  roleInPurchase: saved.roleInPurchase || "",
                  ago: "Just now",
                },
              ],
            }
          : column,
      ),
    );
    setAddStage(null);
    onCloseAdd?.();
  };
  /* Legacy inline return retained below for reference during the template migration.
  return <><SortableBoardView columns={columns} onMove={moveContact} onAdd={setAddStage} renderCard={(contact) => <CrmCard className="border-2 border-[#4da3ff] bg-[#e8f6ff] p-3 shadow-sm transition hover:border-[#1683ff] hover:shadow-md"><Link className="block text-sm font-bold text-[#006b70] hover:underline" href={`/contacts/${contact.id}`}>{contact.name}</Link><p className="mt-3 flex items-center gap-1 text-sm text-[#006b70]"> <span className="truncate">{contact.email}</span> </p><div className="mt-4 flex items-center justify-between border-t border-[#b9dced] pt-2 text-xs text-[#516f90]"><span></span><span className="rounded-md border border-[#9fb3c8] bg-white px-3 py-2"> {contact.ago} &nbsp;</span></div></CrmCard>} />{addStage ? <AddContactModal initialStage={addStage} stages={columns.map((column) => ({ id: column.id, label: column.label }))} onCancel={() => setAddStage(null)} onCreate={addContact} /></>;</n }

*/
  return (
    <>
      <SortableBoardView
        columns={columns}
        onMove={moveContact}
        onAdd={setAddStage}
        renderCard={(contact) => (
          <CrmCard className="border-2 border-[#4da3ff] bg-[#e8f6ff] p-3 shadow-sm transition hover:border-[#1683ff] hover:shadow-md">
            <Link
              className="block text-sm font-bold text-[#006b70] hover:underline"
              href={`/contacts/${contact.id}`}
            >
              {contact.name}
            </Link>
            <p className="mt-3 text-sm text-[#006b70]">
              Email: {contact.email}
            </p>
            {contact.title || contact.department || contact.roleInPurchase ? (
              <dl className="mt-3 space-y-1 text-xs text-[#516f90]">
                {contact.title ? (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-[#345b78]">Job title:</dt>
                    <dd className="min-w-0 truncate">{contact.title}</dd>
                  </div>
                ) : null}
                {contact.department ? (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-[#345b78]">Department:</dt>
                    <dd className="min-w-0 truncate">{contact.department}</dd>
                  </div>
                ) : null}
                {contact.roleInPurchase ? (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-[#345b78]">Role in Purchase:</dt>
                    <dd className="min-w-0 truncate">
                      <span
                        className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-xs font-semibold ${getPurchaseRoleColor(contact.roleInPurchase)}`}
                        title={contact.roleInPurchase}
                      >
                        {contact.roleInPurchase}
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            <div className="mt-4 flex items-center justify-between border-t border-[#b9dced] pt-2 text-xs text-[#516f90]">
              <span className="flex items-center gap-2">
                <button
                  className="grid h-7 w-7 place-items-center rounded p-1 hover:bg-white"
                  aria-label={`Create note for ${contact.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivityForm({
                      type: "Note",
                      contactName: contact.name,
                    });
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  <StickyNote className="h-4 w-4" />
                </button>
                <button
                  className="grid h-7 w-7 place-items-center rounded p-1 hover:bg-white"
                  aria-label={`Create task for ${contact.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivityForm({
                      type: "Task",
                      contactName: contact.name,
                    });
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  <ListChecks className="h-4 w-4" />
                </button>
              </span>
              <button
                className="flex items-center gap-2 rounded-md border border-[#9fb3c8] bg-white px-3 py-1.5"
                type="button"
              >
                <CalendarDays className="h-4 w-4" />
                <span>{contact.ago}</span>
                <Info className="h-4 w-4" />
              </button>
            </div>
          </CrmCard>
        )}
      />
      {addStage ? (
        <AddContactModal
          initialStage={addStage}
          stages={columns.map((column) => ({
            id: column.id,
            label: column.label,
            color: column.color,
          }))}
          onCancel={() => setAddStage(null)}
          onCreate={addContact}
        />
      ) : null}
      {activityForm ? (
        <ContactActivityModal
          type={activityForm.type}
          contactName={activityForm.contactName}
          onClose={() => setActivityForm(null)}
        />
      ) : null}
    </>
  );
}

function ContactActivityModal({
  type,
  contactName,
  onClose,
}: {
  type: "Note" | "Task";
  contactName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#111827]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Create ${type.toLowerCase()}`}
    >
      <form
        className="w-full max-w-[520px] rounded-xl bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <div className="flex items-center justify-between border-b border-[#dbe4ed] px-6 py-4">
          <h2 className="text-xl font-bold">Create {type.toLowerCase()}</h2>
          <button onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="grid gap-4 p-6">
          <p className="text-sm text-[#516f90]">For {contactName}</p>
          <label className="grid gap-1.5 text-sm font-semibold">
            {type === "Note" ? "Note" : "Task title"}
            <input
              className="h-10 rounded-md border border-[#cbd6e2] px-3 font-normal outline-none focus:border-[#006b70]"
              autoFocus
              required
              placeholder={
                type === "Note" ? "Write a note..." : "Enter task title"
              }
            />
          </label>
          {type === "Task" ? (
            <label className="grid gap-1.5 text-sm font-semibold">
              Due date
              <input
                className="h-10 rounded-md border border-[#cbd6e2] px-3 font-normal outline-none focus:border-[#006b70]"
                type="date"
              />
            </label>
          ) : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#dbe4ed] px-6 py-4">
          <button
            className="rounded-md border border-[#cbd6e2] px-4 py-2"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-[#006b70] px-5 py-2 text-white"
            type="submit"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

function AddContactModal({
  initialStage,
  stages,
  onCancel,
  onCreate,
}: {
  initialStage: string;
  stages: Array<{ id: string; label: string; color: string }>;
  onCancel: () => void;
  onCreate: (contact: {
    firstName: string;
    lastName: string;
    email: string;
    stage: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    roleInPurchase?: string;
    leadStatus?: string;
  }) => Promise<void> | void;
}) {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    owner: "Soft Dev",
    jobTitle: "",
    department: "",
    roleInPurchase: "",
    phone: "",
    stage: initialStage,
    leadStatus: "",
  });
  const [stageOpen, setStageOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState("IN");
  const [phoneCode, setPhoneCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneExtension, setPhoneExtension] = useState("");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [stageOpenUp, setStageOpenUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const stageButtonRef = useRef<HTMLButtonElement>(null);
  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  /* Legacy inline form markup retained below while the staged form is rendered after it.
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#111827]/45 p-4" role="dialog" aria-modal="true" aria-label="Create contact"><form className="w-full max-w-[620px] rounded-xl bg-white shadow-2xl" onSubmit={(event) => { event.preventDefault(); onCreate(form); }}><div className="flex items-center justify-between border-b border-[#dbe4ed] px-6 py-4"><h2 className="text-xl font-bold text-[#213343]">Create contact</h2><button className="text-xl text-[#516f90]" onClick={onCancel} type="button" aria-label="Close"></button></div><div className="grid gap-4 p-6 sm:grid-cols-2"><Field label="Email"><input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@company.com" type="email" /></Field><Field label="First name"><input value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></Field><Field label="Last name"><input value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></Field><Field label="Contact owner"><input value={form.owner} onChange={(event) => update("owner", event.target.value)} /></Field><Field label="Job title"><input value={form.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} /></Field><Field label="Phone number"><button className="h-12 w-full rounded-md border border-[#213343] bg-white px-4 text-left text-[#516f90]" onClick={() => setPhoneOpen(true)} type="button">{phoneNumber ? phoneCode + " " + phoneNumber : "Phone number"}</button>{phoneOpen ? <div className="fixed inset-0 z-[120] grid place-items-center bg-[#111827]/35 p-4" onClick={() => setPhoneOpen(false)}><div className="w-full max-w-[574px] rounded-2xl bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-6 flex items-center justify-between"><h3 className="text-xl font-bold">Edit Phone Number</h3><button onClick={() => setPhoneOpen(false)} type="button">X</button></div><div className="rounded-2xl border p-4"><div className="flex h-12 overflow-hidden rounded-lg border"><button className="w-20 border-r" onClick={() => setPhoneOpen((open) => !open)} type="button">{phoneCountry} <ChevronDown className="inline h-4 w-4" /></button><input className="w-20 border-r px-3 outline-none" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} /><input className="min-w-0 flex-1 border-r px-3 outline-none" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Phone number" /><input className="w-32 px-3 outline-none" value={phoneExtension} onChange={(event) => setPhoneExtension(event.target.value)} placeholder="Extension" /></div><p className="mt-2 text-sm font-semibold text-[#516f90]">Select a country code and enter a phone number.</p></div><div className="mt-5 font-semibold text-[#006b70]">Remove number formatting</div><div className="mt-6 flex gap-3"><button className="rounded-full bg-[#f1f2f3] px-5 py-2" onClick={() => setPhoneOpen(false)} type="button">Apply</button><button className="rounded-full border px-5 py-2" onClick={() => setPhoneOpen(false)} type="button">Cancel</button></div></div></div> : null}</Field><Field label="Lifecycle stage"><select value={form.stage} onChange={(event) => update("stage", event.target.value)}>{stages.map((stage) => <option value={stage.id} key={stage.id}>{stage.label}</option>)}</select></Field><Field label="Lead status"><select value={form.leadStatus} onChange={(event) => update("leadStatus", event.target.value)}><option value="">Select lead status</option><option>New</option><option>Open</option><option>In progress</option><option>Unqualified</option></select></Field></div><div className="flex flex-wrap justify-end gap-3 border-t border-[#dbe4ed] px-6 py-4"><button className="rounded-md border border-[#cbd6e2] px-4 py-2 text-sm font-semibold" onClick={onCancel} type="button">Cancel</button><button className="rounded-md border border-[#006b70] px-4 py-2 text-sm font-semibold text-[#006b70]" type="button">Create and add another</button><button className="rounded-md bg-[#006b70] px-5 py-2 text-sm font-semibold text-white" type="submit">Create</button></div></form></div>;
*/
  const selectedStage = stages.find((stage) => stage.id === form.stage);
  const selectStage = (stageId: string) => {
    update("stage", stageId);
    setStageOpen(false);
  };
  const selectPhoneCountry = (country: string, code: string) => {
    setPhoneCountry(country);
    setPhoneCode(code);
    setPhoneOpen(false);
    setCountrySearch("");
  };
  const filteredPhoneCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return phoneCountries;
    return phoneCountries.filter((country) =>
      `${country.name} ${country.short} ${country.code}`
        .toLowerCase()
        .includes(query),
    );
  }, [countrySearch]);
  useEffect(() => {
    if (!stageOpen) return;
    const updateMenuDirection = () => {
      const rect = stageButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setStageOpenUp(window.innerHeight - rect.bottom < 360 && rect.top > 360);
    };
    updateMenuDirection();
    window.addEventListener("resize", updateMenuDirection);
    window.addEventListener("scroll", updateMenuDirection, true);
    return () => {
      window.removeEventListener("resize", updateMenuDirection);
      window.removeEventListener("scroll", updateMenuDirection, true);
    };
  }, [stageOpen]);
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#111827]/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        className="w-full max-w-[620px] rounded-xl bg-white shadow-2xl"
          onSubmit={async (event) => {
          event.preventDefault();
            if (submitting) return;
            setSubmitting(true);
            try { await onCreate({
            ...form,
            phone: phoneNumber ? `${phoneCode} ${phoneNumber}` : "",
            }); } finally { setSubmitting(false); }
        }}
      >
        <div className="flex items-center justify-between border-b border-[#dbe4ed] px-6 py-4">
          <h2 className="text-xl font-bold">Create contact</h2>
          <button onClick={onCancel} type="button">
            Close
          </button>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Email">
            <input
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              type="email"
            />
          </Field>
          <Field label="First name">
            <input
              value={form.firstName}
              onChange={(event) => update("firstName", event.target.value)}
            />
          </Field>
          <Field label="Last name">
            <input
              value={form.lastName}
              onChange={(event) => update("lastName", event.target.value)}
            />
          </Field>
          <Field label="Contact owner">
            <input
              value={form.owner}
              onChange={(event) => update("owner", event.target.value)}
            />
          </Field>
          <Field label="Job title">
            <input
              value={form.jobTitle}
              onChange={(event) => update("jobTitle", event.target.value)}
            />
          </Field>
          <Field label="Phone number">
            <div className="flex h-10 w-full overflow-hidden rounded-md border border-[#cbd6e2] bg-white">
              <div className="relative shrink-0">
                <button
                  className="flex h-full items-center gap-2 border-r border-[#cbd6e2] px-3 text-sm font-normal"
                  onClick={() => setPhoneOpen((open) => !open)}
                  type="button"
                >
                  <span>{phoneCountry}</span>
                  <span className="text-xs text-[#516f90]"></span>
                </button>
                {phoneOpen ? (
                  <div
                    className="fixed inset-0 z-[120] grid place-items-center bg-[#111827]/35 p-4"
                    onPointerDown={() => setPhoneOpen(false)}
                    role="presentation"
                  >
                    <div
                      className="w-full max-w-sm rounded-xl border border-[#dbe4ed] bg-white p-4 shadow-2xl"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      role="dialog"
                      aria-label="Select country code"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-[#213343]">
                            Select country code
                          </h3>
                          <p className="text-xs text-[#718096]">
                            Choose the country for this phone number.
                          </p>
                        </div>
                        <button
                          className="rounded-md px-2 py-1 text-xl text-[#516f90] hover:bg-[#f2f7fa]"
                          onClick={() => setPhoneOpen(false)}
                          type="button"
                          aria-label="Close country selector"
                        ></button>
                      </div>
                      <input
                        className="mb-2 h-10 w-full rounded-md border border-[#cbd6e2] px-3 text-sm outline-none focus:border-[#006b70]"
                        placeholder="Search country"
                        value={countrySearch}
                        onChange={(event) =>
                          setCountrySearch(event.target.value)
                        }
                        autoFocus
                      />
                      <div className="max-h-72 overflow-y-auto rounded-lg border border-[#e5ebf0] p-1">
                        {filteredPhoneCountries.map((country) => (
                          <button
                            className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-[#f2f7fa]"
                            key={country.short}
                            onClick={() =>
                              selectPhoneCountry(country.short, country.code)
                            }
                            type="button"
                          >
                            <span>
                              {country.name}{" "}
                              <span className="text-xs text-[#718096]">
                                ({country.short})
                              </span>
                            </span>
                            <span className="text-[#516f90]">
                              {country.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <span className="flex items-center border-r border-[#cbd6e2] px-3 text-sm text-[#516f90]">
                {phoneCode}
              </span>
              <input
                className="min-w-0 flex-1 px-3 text-sm outline-none"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Phone number"
                type="tel"
              />
            </div>
          </Field>
          <Field label="Lifecycle stage">
            <div className="relative">
              <button
                ref={stageButtonRef}
                aria-expanded={stageOpen}
                className="flex h-10 w-full items-center justify-between rounded-md border border-[#cbd6e2] bg-white px-3 text-left font-normal outline-none transition focus:border-[#006b70]"
                onClick={() => setStageOpen((open) => !open)}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${selectedStage?.color ?? "bg-[#94a3b8]"}`}
                  />
                  {selectedStage?.label ?? "Select stage"}
                </span>
                <span className="text-[#516f90]"></span>
              </button>
              {stageOpen ? (
                <div
                  className={`absolute left-0 right-0 z-30 max-h-[min(22rem,calc(100vh-2rem))] overflow-y-auto rounded-md border border-[#cbd6e2] bg-white p-1 shadow-xl ${stageOpenUp ? "bottom-full mb-1" : "top-full mt-1"}`}
                >
                  {stages.map((stage) => (
                    <button
                      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition hover:bg-[#f2f7fa] ${stage.id === form.stage ? "bg-[#f2f7fa] font-semibold" : ""}`}
                      key={stage.id}
                      onClick={() => selectStage(stage.id)}
                      type="button"
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${stage.color}`}
                      />
                      {stage.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="Lead status">
            <select
              value={form.leadStatus}
              onChange={(event) => update("leadStatus", event.target.value)}
            >
              <option value="">Select lead status</option>
              <option>New</option>
              <option>Open</option>
              <option>In progress</option>
              <option>Unqualified</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#dbe4ed] px-6 py-4">
          <button
            className="rounded-md border border-[#cbd6e2] px-4 py-2"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md border border-[#006b70] px-4 py-2 text-[#006b70]"
            type="button"
          >
            Create and add another
          </button>
          <button
            className="rounded-md bg-[#006b70] px-5 py-2 text-white"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RoleInPurchaseSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const selected = purchaseRoleOptions.find(([role]) => role === value);
  return (
    <div className="relative mt-2">
      <input type="hidden" name="roleInPurchase" value={value} />
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border border-[#cbd6e2] bg-white px-3 text-left font-normal outline-none focus:border-[#006b70]"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {selected ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selected[1]}`}
          >
            {selected[0]}
          </span>
        ) : (
          <span className="text-[#516f90]">Role in Purchase</span>
        )}
        <ChevronDown className="h-4 w-4 text-[#516f90]" />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-1 max-h-64 overflow-y-auto rounded-md border border-[#cbd6e2] bg-white p-1 shadow-xl">
          <button
            className="w-full px-3 py-2 text-left text-sm text-[#516f90] hover:bg-[#f2f7fa]"
            type="button"
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
          >
            Role in Purchase
          </button>
          {purchaseRoleOptions.map(([role, color]) => (
            <button
              className="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-[#f2f7fa]"
              key={role}
              type="button"
              onClick={() => {
                setValue(role);
                setOpen(false);
              }}
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
              >
                {role}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`grid min-w-0 gap-1.5 text-sm font-semibold text-[#213343] ${className}`}
    >
      <span>{label}</span>
      <span className="min-w-0 [&>input]:h-10 [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-[#cbd6e2] [&>input]:px-3 [&>input]:font-normal [&>input]:outline-none [&>input:focus]:border-[#006b70] [&>select]:h-10 [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-[#cbd6e2] [&>select]:px-3 [&>select]:font-normal [&>select]:outline-none [&>select:focus]:border-[#006b70]">
        {label === "Job title" ? null : children}
        {label === "Job title" ? (
          <>
            <select
              className="mt-3 h-10 w-full rounded-md border border-[#cbd6e2] px-3 font-normal outline-none focus:border-[#006b70]"
              name="department"
              defaultValue=""
            >
              <option value="">Department</option>
              {departmentOptions.map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
            <RoleInPurchaseSelect />
          </>
        ) : null}
      </span>
    </label>
  );
}
function LegacyDraggableContactsBoard() {
  const [columns, setColumns] = useState([
    { title: "Subscriber", color: "bg-[#0878d1]", cards: [] as ContactCard[] },
    {
      title: "Lead",
      color: "bg-[#e94b08]",
      cards: [],
    },
    { title: "Marketing Qualified Lead", color: "bg-[#008b87]", cards: [] },
    { title: "Sales Qualified Lead", color: "bg-[#d90088]", cards: [] },
    {
      title: "Opportunity",
      color: "bg-[#6d45d8]",
      cards: [],
    },
    { title: "Customer", color: "bg-[#1c8b5b]", cards: [] },
    { title: "Evangelist", color: "bg-[#4774c7]", cards: [] },
    { title: "Other", color: "bg-[#64748b]", cards: [] },
  ]);
  const [dragged, setDragged] = useState<{
    column: number;
    card: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const drop = (target: number) => {
    if (!dragged || dragged.column === target) {
      setDragged(null);
      setDropTarget(null);
      return;
    }
    setColumns((current) =>
      current.map((column, index) =>
        index === target
          ? {
              ...column,
              cards: [
                ...column.cards,
                current[dragged.column].cards[dragged.card],
              ],
            }
          : index === dragged.column
            ? {
                ...column,
                cards: column.cards.filter(
                  (_, cardIndex) => cardIndex !== dragged.card,
                ),
              }
            : column,
      ),
    );
    setDragged(null);
    setDropTarget(null);
  };
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((column, columnIndex) => (
        <section
          key={column.title}
          onDragEnter={() => setDropTarget(columnIndex)}
          onDragOver={(event) => {
            event.preventDefault();
            setDropTarget(columnIndex);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setDropTarget(null);
          }}
          onDrop={() => drop(columnIndex)}
          className={`min-h-[380px] min-w-[285px] flex-1 rounded-2xl border-2 p-3 transition-all duration-150 ${dropTarget === columnIndex ? "border-[#ff5c35] bg-[#fff4ef] shadow-[0_0_0_3px_rgba(255,92,53,0.16)]" : "border-transparent bg-[#f1f1f1]"}`}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`${column.color} rounded-md px-2 py-1 text-sm font-bold text-white`}
            >
              {column.title}
            </span>
            <span className="text-sm font-semibold text-[#516f90]">
              {column.cards.length}
            </span>
            {dropTarget === columnIndex && dragged ? (
              <span className="ml-auto text-xs font-semibold text-[#ff5c35]">
                Drop here
              </span>
            ) : null}
          </div>
          <div className="min-h-[320px] space-y-3">
            {column.cards.map((card, cardIndex) => (
              <article
                key={card.email}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  setDragged({ column: columnIndex, card: cardIndex });
                }}
                onDragEnd={() => {
                  setDragged(null);
                  setDropTarget(null);
                }}
                className={`select-none cursor-grab rounded-2xl border border-[#cbd0d5] bg-white p-4 shadow-sm transition active:cursor-grabbing ${dragged?.column === columnIndex && dragged.card === cardIndex ? "scale-[1.02] opacity-40 ring-2 ring-[#ff5c35]" : "hover:-translate-y-0.5 hover:shadow-md"}`}
              >
                <h3 className="font-bold text-[#006d70]">{card.name}</h3>
                <p className="mt-3 text-sm text-[#006d70]"> {card.email} </p>
                <div className="mt-4 flex items-center justify-between border-t border-[#dbe4ed] pt-2 text-xs text-[#516f90]">
                  <span></span>
                  <span className="rounded-md border border-[#aeb6bd] px-3 py-2">
                    {" "}
                    {card.ago} &nbsp;
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type ContactCard = {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  roleInPurchase: string;
  ago: string;
};

function ContactToolbar({
  activeSegment,
  setActiveSegment,
  onTable,
  filtersVisible,
  setFiltersVisible,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
}: {
  activeSegment: string;
  setActiveSegment: (value: string) => void;
  onTable: () => void;
  filtersVisible: boolean;
  setFiltersVisible: (value: boolean) => void;
  sortBy: string;
  sortDirection: SortDirection;
  setSortBy: (value: string) => void;
  setSortDirection: (value: SortDirection) => void;
}) {
  return (
    <CollectionPageHeader
      activeView={activeSegment}
      onViewChange={setActiveSegment}
      savedViews={[
        "All contacts",
        "Newsletter subscribers",
        "Unsubscribed",
        "All customers",
      ].map((label, index) => ({
        label,
        count: index === 0 ? 2 : undefined,
        icon: <UsersRound className="h-4 w-4" />,
      }))}
      toolbar={
        <>
          <label className="flex h-10 w-64 items-center gap-2 rounded-md border border-[#cbd6e2] px-3 text-sm text-[#516f90]">
            <Search className="h-4 w-4" />
            <input
              className="min-w-0 flex-1 outline-none"
              placeholder="Search contacts..."
            />
          </label>
          <ToolbarButton icon={<Filter className="h-4 w-4" />} label="Filter" />
          <ToolbarButton
            icon={<ListFilter className="h-4 w-4" />}
            label="Sort by"
          />
        </>
      }
      actions={
        <div className="flex items-center gap-2">
          <IconButton active aria-label="Board view">
            <Grid2X2 className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={onTable} aria-label="Table view">
            <Columns3 className="h-4 w-4" />
          </IconButton>
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cbd6e2] px-3 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Columns
          </button>
        </div>
      }
      filters={
        <>
          <span>
            Contact owner <ChevronDown className="inline h-4 w-4" />
          </span>
          <span>
            Create date <ChevronDown className="inline h-4 w-4" />
          </span>
          <span>
            Last activity date <ChevronDown className="inline h-4 w-4" />
          </span>
          <span>
            Lead status <ChevronDown className="inline h-4 w-4" />
          </span>
          <IconButton className="h-8 w-8 rounded-full">
            <Plus className="h-4 w-4" />
          </IconButton>
          <button className="font-semibold text-[#ff5c35]">
            {" "}
            &nbsp;Advanced filters
          </button>
        </>
      }
    />
  );
  return (
    <div className="mb-4">
      <div className="flex items-center gap-7 overflow-x-auto border-b border-[#dbe4ed] px-2 text-sm text-[#516f90]">
        {[
          "All contacts",
          "Newsletter subscribers",
          "Unsubscribed",
          "All customers",
        ].map((item, index) => (
          <button
            key={item}
            onClick={() => setActiveSegment(item)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 font-semibold ${activeSegment === item ? "border-[#ff5c35] text-[#ff5c35]" : "border-transparent"}`}
            type="button"
          >
            <UsersRound className="h-5 w-5" />
            {item}
            {index === 0 ? (
              <span className="rounded-full bg-[#fff0e9] px-1.5 text-[#ff5c35]">
                2
              </span>
            ) : null}
          </button>
        ))}
        <button className="text-xl" type="button">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex flex-wrap gap-2">
          <label className="flex h-11 w-64 items-center gap-2 rounded-md border border-[#cbd6e2] px-4 text-sm text-[#516f90]">
            <Search className="h-5 w-5" />
            <input
              className="min-w-0 flex-1 outline-none"
              placeholder="Search contacts..."
            />
          </label>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cbd6e2] px-4 text-sm font-semibold"
            onClick={() => setFiltersVisible(!filtersVisible)}
            type="button"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <ToolbarButton
            icon={<ListFilter className="h-4 w-4" />}
            label="Sort by"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid h-11 w-11 place-items-center rounded-md border border-[#ffb397] bg-[#fff7f3] text-[#ff5c35]"
            type="button"
          >
            <Grid2X2 className="h-5 w-5" />
          </button>
          <button
            onClick={onTable}
            className="grid h-11 w-11 place-items-center rounded-md border border-[#cbd6e2]"
            type="button"
          >
            <Columns3 className="h-5 w-5" />
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cbd6e2] px-4 text-sm font-semibold"
            type="button"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Columns
          </button>
        </div>
      </div>
      {filtersVisible ? (
        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-[#213343]">
          <span>
            Contact owner <ChevronDown className="inline h-4 w-4" />
          </span>
          <span>
            Create date <ChevronDown className="inline h-4 w-4" />
          </span>
          <span>
            Last activity date <ChevronDown className="inline h-4 w-4" />
          </span>
          <span>
            Lead status <ChevronDown className="inline h-4 w-4" />
          </span>
          <button
            className="font-semibold text-[#ff5c35]"
            onClick={() => setFiltersVisible(false)}
            type="button"
          >
            Hide filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd6e2] px-3 text-xs font-semibold">
      {icon}
      {label}
      {label === "Sort by" ? <ChevronDown className="h-3 w-3" /> : null}
    </button>
  );
}
