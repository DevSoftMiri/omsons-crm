"use client";
/* eslint-disable no-irregular-whitespace */

import { AppShell } from "@/components/layout/app-shell";
import { CrmPageFrame, ViewToggle } from "@/components/ui/crm-page-template";
import {
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Columns3,
  Download,
  IndianRupee,
  Info,
  EllipsisVertical,
  Filter,
  GitFork,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Table2,
  ListChecks,
  StickyNote,
  ContactRound,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { SortMenu, type SortDirection } from "@/components/ui/sort-menu";
import { sortRecords } from "@/components/ui/sort-records";

type Deal = {
  id: string;
  name: string;
  stage: string;
  pipeline: string;
  amount?: number | null;
  closeDate?: string | null;
  createdAt: string;
  owner?: { name: string } | null;
  contact?: { firstName: string; lastName?: string | null } | null;
  company?: { name: string } | null;
  dealType?: string | null;
  priority?: string;
  probability?: number | null;
  expectedCloseDate?: string | null;
  productCategory?: string | null;
  stageChangedAt?: string | null;
  lastActivityAt?: string | null;
};
type CatalogVariant = {
  id: string;
  sku: string;
  name: string;
  price?: number;
  priceLabel?: string;
  pack?: number;
  inStock?: boolean;
};
type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  variants?: CatalogVariant[];
};
type DealLineItem = {
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  unitPrice: number;
  quantity: number;
  total: number;
};
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const stages = [
  ["Appointment Scheduled", "bg-blue-50 text-[#1473e6]", 20],
  ["Qualified To Buy", "bg-orange-50 text-[#d94d12]", 40],
  ["Presentation Scheduled", "bg-pink-50 text-[#d6008f]", 60],
  ["Decision Maker Bought-In", "bg-violet-50 text-[#4f37d4]", 80],
  ["Contract Sent", "bg-amber-50 text-[#b56200]", 90],
  ["Closed Won", "bg-emerald-600 text-white", 100],
  ["Closed Lost", "bg-rose-700 text-white", 0],
] as const;
const dealSortOptions = [
  { value: "name", label: "Deal name" },
  { value: "amount", label: "Deal amount" },
  { value: "stage", label: "Deal stage" },
  { value: "owner", label: "Deal owner" },
  { value: "createdAt", label: "Create date" },
  { value: "lastActivityAt", label: "Last activity date" },
  { value: "closeDate", label: "Close date" },
  { value: "expectedCloseDate", label: "Expected close date" },
  { value: "priority", label: "Deal priority" },
  { value: "pipeline", label: "Pipeline" },
  { value: "dealType", label: "Deal type" },
  { value: "company", label: "Company name" },
  { value: "contact", label: "Contact name" },
  { value: "probability", label: "Probability" },
  { value: "weightedAmount", label: "Weighted deal value" },
  { value: "daysInStage", label: "Days in current stage" },
];

export function DealsPage() {
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [addOpen, setAddOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [dealCount, setDealCount] = useState(0);
  const [dealName, setDealName] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadDeals = async () => {
    try {
      const response = await fetch(`${API_URL}/deals`);
      if (!response.ok) return;
      const records = (await response.json()) as Deal[];
      setDeals(records);
      setDealCount(records.length);
    } catch {
      /* API may be unavailable while the web app is running alone. */
    }
  };

  useEffect(() => {
    void loadDeals();
  }, []);
  const sortedDeals = sortRecords(deals, sortBy, sortDirection, (deal, key) =>
    key === "owner"
      ? deal.owner?.name
      : key === "company"
        ? deal.company?.name
        : key === "contact"
          ? `${deal.contact?.firstName ?? ""} ${deal.contact?.lastName ?? ""}`
          : key === "weightedAmount"
            ? (deal.amount ?? 0) * ((deal.probability ?? 0) / 100)
            : key === "daysInStage"
              ? deal.stageChangedAt
                ? Date.now() - new Date(deal.stageChangedAt).getTime()
                : null
              : deal[key as keyof Deal],
  );

  return (
    <AppShell>
      <CrmPageFrame className="p-4">
        <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-[#111827]">Deals</h1>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-3">
            <CircleButton icon={EllipsisVertical} label="More" />
            <CircleButton icon={GitFork} label="Automation" />
            <div className="relative">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[#005b5d] px-5 py-2.5 text-sm font-bold text-white shadow-sm"
                onClick={() => setAddOpen((open) => !open)}
                type="button"
              >
                Add deals
                <ChevronDown className="h-4 w-4" />
              </button>
              {addOpen ? (
                <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-[#d0d7de] bg-white py-2 text-sm shadow-xl">
                  {["Create deal", "Import deals", "Create from template"].map(
                    (item) => (
                      <button
                        className="block w-full px-4 py-2 text-left hover:bg-[#f7f9fb]"
                        key={item}
                        onClick={() =>
                          item === "Create deal" &&
                          (setCreateOpen(true), setAddOpen(false))
                        }
                        type="button"
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-b border-[#dbe4ed]">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              className="border-b-2 border-[#202020] bg-[#e9e9e9] px-4 py-2 text-sm font-medium text-[#333]"
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                All deals
              </span>
            </button>
            <button
              className="px-3 py-2 text-sm font-medium text-[#516f90]"
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                My deals
              </span>
            </button>
            <button
              className="p-3 text-[#213343]"
              aria-label="Add view"
              type="button"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 py-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-10 w-[280px] max-w-full items-center gap-3 rounded-full border border-[#dbe4ed] px-4 text-[#516f90]">
              <Search className="h-4 w-4" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7c98b6]"
                placeholder="Search deals..."
              />
            </label>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium ${filtersVisible ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#dbe4ed] bg-[#f7f9fb]"}`}
              onClick={() => setFiltersVisible((visible) => !visible)}
              type="button"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <SortMenu
              options={dealSortOptions}
              value={sortBy}
              direction={sortDirection}
              onChange={(value, direction) => {
                setSortBy(value);
                setSortDirection(direction);
              }}
            />
            <span className="h-8 w-px bg-[#dbe4ed]" />
            <CircleButton icon={Plus} label="Add property" />
            <CircleButton icon={Columns3} label="Edit columns" />
            <button
              className="inline-flex h-10 items-center gap-2 px-3 text-sm font-bold text-[#213343]"
              onClick={() => setFiltersVisible(true)}
              type="button"
            >
              <Filter className="h-4 w-4" />
              Advanced filters
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select className="h-10 rounded-full border border-[#dbe4ed] bg-white px-4 text-sm outline-none">
              <option>Sales Pipeline</option>
            </select>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <CircleButton icon={Settings} label="Settings" />
            <CircleButton icon={ChevronDown} label="Collapse" />
          </div>
        </div>

        {filtersVisible ? (
          <div className="relative flex flex-wrap items-center gap-8 border-b border-[#e5e7eb] px-2 pb-4 text-sm font-bold text-[#202020]">
            {[
              "Deal owner",
              "Create date",
              "Last activity date",
              "Close date",
            ].map((property) => (
              <div className="relative" key={property}>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() =>
                    setActiveProperty(
                      activeProperty === property ? null : property,
                    )
                  }
                  type="button"
                >
                  {property}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {activeProperty === property ? (
                  <PropertyFilter property={property} />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {deals.length === 0 ? (
          <DealsEmptyState onCreateDeal={() => setCreateOpen(true)} />
        ) : null}

        {viewMode === "board" ? (
          <DealsBoard
            deals={sortedDeals}
            onCreateDeal={() => setCreateOpen(true)}
            onCreateTask={() => setTaskOpen(true)}
            onCreateNote={() => setNoteOpen(true)}
            onDealsChange={setDeals}
          />
        ) : (
          <DealsTableEmpty deals={sortedDeals} />
        )}

        <div className="flex items-center justify-between border-t border-[#dbe4ed] px-2 py-3">
          <span className="inline-flex rounded-full bg-[#f2f5f8] px-6 py-3 text-sm font-bold">
            {dealCount} deals
          </span>
          <div className="flex items-center gap-3">
            <CircleButton icon={RefreshCw} label="Refresh" />
            <button className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ed] px-5 py-3 text-sm font-bold">
              <Download className="h-4 w-4" />
              Export
            </button>
            <CircleButton icon={RotateCcw} label="Undo" />
          </div>
        </div>
      </CrmPageFrame>
      {createOpen ? (
        <CreateDealModal
          error={createError}
          dealName={dealName}
          setDealName={setDealName}
          dealAmount={dealAmount}
          setDealAmount={setDealAmount}
          onCancel={() => {
            setCreateError("");
            setCreateOpen(false);
          }}
          onCreate={async (lineItems) => {
            if (!dealName.trim()) return;
            try {
              const lineItemsTotal = lineItems.reduce(
                (total, item) => total + item.total,
                0,
              );
              const response = await fetch(`${API_URL}/deals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: dealName.trim(),
                  amount:
                    lineItems.length > 0
                      ? lineItemsTotal
                      : dealAmount === ""
                        ? null
                        : Number(dealAmount),
                  lineItems,
                }),
              });
              if (!response.ok) {
                setCreateError(await response.text());
                return;
              }
              const createdDeal = (await response.json()) as Deal;
              // Update the local list immediately so the empty state disappears
              // as soon as the first deal is successfully created.
              setDeals((currentDeals) => [createdDeal, ...currentDeals]);
              setDealCount((count) => count + 1);
              setCreateOpen(false);
              setDealName("");
            } catch (error) {
              setCreateError(
                error instanceof Error
                  ? error.message
                  : "Unable to create deal",
              );
            }
          }}
        />
      ) : null}
      {taskOpen ? <TaskModal onClose={() => setTaskOpen(false)} /> : null}
      {noteOpen ? <NoteModal onClose={() => setNoteOpen(false)} /> : null}
    </AppShell>
  );
}

function CreateDealModal({
  dealName,
  setDealName,
  dealAmount,
  setDealAmount,
  onCancel,
  onCreate,
  error,
}: {
  dealName: string;
  setDealName: (value: string) => void;
  dealAmount: string;
  setDealAmount: (value: string) => void;
  onCancel: () => void;
  onCreate: (lineItems: DealLineItem[]) => void;
  error?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{
    product: CatalogProduct;
    variant: CatalogVariant;
  } | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [lineItems, setLineItems] = useState<DealLineItem[]>([]);
  const [lineItemError, setLineItemError] = useState("");
  const lineItemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetch("/omsons_catalog_2026-27.json")
      .then((response) => response.json())
      .then((data: CatalogProduct[] | { products?: CatalogProduct[] }) =>
        setCatalog(Array.isArray(data) ? data : (data.products ?? [])),
      )
      .catch(() => setCatalog([]));
  }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        lineItemRef.current &&
        !lineItemRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const matches = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return [];
    return catalog
      .filter((product) =>
        `${product.name} ${product.sku} ${(product.variants ?? []).map((item) => item.sku).join(" ")}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [catalog, productSearch]);
  const unitPrice =
    selectedVariant?.variant.price ??
    Number(selectedVariant?.variant.priceLabel ?? 0);
  const parsedQuantity = Number(quantity);
  const lineTotal = unitPrice * parsedQuantity;
  const addLineItem = () => {
    if (
      !selectedVariant ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      setLineItemError(
        "Select a product variant and enter a quantity of at least 1.",
      );
      return;
    }
    setLineItems((current) => [
      ...current,
      {
        productId: selectedVariant.product.id,
        productName: selectedVariant.product.name,
        variantId: selectedVariant.variant.id,
        variantSku: selectedVariant.variant.sku,
        unitPrice,
        quantity: parsedQuantity,
        total: lineTotal,
      },
    ]);
    setSelectedVariant(null);
    setProductSearch("");
    setQuantity("1");
    setSuggestionsOpen(false);
    setLineItemError("");
  };
  const money = (value: number) =>
    `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const field = (label: string, children: React.ReactNode) => (
    <label className="block text-sm font-semibold text-[#213343]">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
  const input =
    "h-10 w-full rounded-lg border border-[#b8c5d1] bg-white px-3 text-sm outline-none focus:border-[#005c5f]";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <form
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(lineItems);
        }}
      >
        <div className="flex items-center justify-between border-b border-[#e1e7ed] px-6 py-4">
          <h2 className="text-xl font-semibold">Create Deal</h2>
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg border border-[#b8c5d1] px-3 py-2 text-sm font-semibold text-[#005c5f]"
              onClick={() => setEditing((value) => !value)}
              type="button"
            >
              {editing ? "Done editing" : "Edit form"}
            </button>
            <button
              className="text-2xl text-[#516f90]"
              onClick={onCancel}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
        {editing ? (
          <div className="mx-6 mt-4 rounded-lg border border-[#b8c5d1] bg-[#f7f9fb] p-3 text-sm text-[#516f90]">
            Form editor enabled. You can review the fields below and adjust the
            form configuration here.
          </div>
        ) : null}
        {error ? (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          {field(
            "Deal name",
            <input
              className={input}
              required
              value={dealName}
              onChange={(event) => setDealName(event.target.value)}
            />,
          )}
          {field(
            "Pipeline",
            <select className={input}>
              <option>Sales Pipeline</option>
            </select>,
          )}
          {field(
            "Deal stage",
            <select className={input}>
              <option>Appointment Scheduled</option>
              <option>Qualified To Buy</option>
              <option>Presentation Scheduled</option>
            </select>,
          )}
          {field(
            "Amount",
            <input
              className={input}
              min="0"
              type="number"
              value={dealAmount}
              onChange={(event) => setDealAmount(event.target.value)}
            />,
          )}
          {field("Close date", <input className={input} type="date" />)}
          {field(
            "Deal owner",
            <select className={input}>
              <option>Soft Dev</option>
            </select>,
          )}
          {field(
            "Deal type",
            <select className={input}>
              <option>Select deal type</option>
              <option>New Business</option>
              <option>Existing Business</option>
            </select>,
          )}
          {field(
            "Priority",
            <select className={input}>
              <option>Select priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>,
          )}
          <div className="sm:col-span-2">
            <h3 className="mb-3 border-b border-[#e1e7ed] pb-2 text-sm font-bold">
              Associate Deal with
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field(
                "Contact",
                <input className={input} placeholder="Search" />,
              )}
              {field(
                "Company",
                <input className={input} placeholder="Search" />,
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <h3 className="mb-3 text-sm font-bold">Add line item</h3>
            <div
              className="grid gap-3 sm:grid-cols-[1fr_120px_auto]"
              ref={lineItemRef}
            >
              <div className="relative">
                <input
                  className={input}
                  placeholder="Search product or SKU"
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                    setSelectedVariant(null);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                />
                {suggestionsOpen && matches.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[#b8c5d1] bg-white p-1 shadow-xl">
                    {matches.map((product) => (
                      <div key={product.id}>
                        <p className="px-3 py-2 text-xs font-bold text-[#718096]">
                          {product.name} · {product.sku}
                        </p>
                        {(product.variants ?? []).map((variant) => (
                          <button
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-[#f2f7fa]"
                            key={variant.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariant({ product, variant });
                              setProductSearch(
                                `${product.name} · ${variant.sku}`,
                              );
                              setSuggestionsOpen(false);
                              setLineItemError("");
                            }}
                          >
                            <span>
                              {variant.sku}
                              {variant.pack ? ` · Pack ${variant.pack}` : ""}
                            </span>
                            <span className="font-semibold">
                              {money(
                                variant.price ??
                                  Number(variant.priceLabel ?? 0),
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <input
                className={input}
                min="1"
                placeholder="Quantity"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <button
                className="rounded-lg border border-[#b8c5d1] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  !selectedVariant ||
                  !Number.isInteger(parsedQuantity) ||
                  parsedQuantity < 1
                }
                onClick={addLineItem}
                type="button"
              >
                Add
              </button>
            </div>
            {selectedVariant ? (
              <p className="mt-2 text-sm text-[#516f90]">
                Unit price: <strong>{money(unitPrice)}</strong> · Amount:{" "}
                <strong>{money(lineTotal)}</strong>
              </p>
            ) : null}
            {lineItemError ? (
              <p className="mt-2 text-sm text-red-600">{lineItemError}</p>
            ) : null}
            {lineItems.length > 0 ? (
              <div className="mt-3 divide-y rounded-lg border border-[#dbe4ed]">
                {lineItems.map((item, index) => (
                  <div
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    key={`${item.variantId}-${index}`}
                  >
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-[#718096]">
                        {item.variantSku} · {money(item.unitPrice)} ×{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <strong>{money(item.total)}</strong>
                      <button
                        className="text-[#b42318]"
                        type="button"
                        onClick={() =>
                          setLineItems((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {lineItems.length > 0 ? (
              <p className="mt-2 text-right text-sm font-bold">
                Line items total:{" "}
                {money(
                  lineItems.reduce((total, item) => total + item.total, 0),
                )}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e1e7ed] px-6 py-4">
          <button
            className="rounded-full px-5 py-2.5 text-sm font-semibold"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-[#005c5f] px-5 py-2.5 text-sm font-bold text-white"
            type="submit"
          >
            Create
          </button>
          <button
            className="rounded-full border border-[#005c5f] px-5 py-2.5 text-sm font-bold text-[#005c5f]"
            onClick={() => onCreate(lineItems)}
            type="button"
          >
            Create and add another
          </button>
        </div>
      </form>
    </div>
  );
}

function DealsBoard({
  onCreateDeal,
  onCreateTask,
  onCreateNote,
  deals,
  onDealsChange,
}: {
  onCreateDeal: () => void;
  onCreateTask: () => void;
  onCreateNote: () => void;
  deals: Deal[];
  onDealsChange: (deals: Deal[]) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const moveDeal = async (deal: Deal, stage: string, beforeId?: string) => {
    if (deal.stage === stage && !beforeId) return;
    const previous = deals;
    const without = deals.filter((item) => item.id !== deal.id);
    const targetItems = without.filter((item) => item.stage === stage);
    const insertionIndex = beforeId
      ? targetItems.findIndex((item) => item.id === beforeId)
      : targetItems.length;
    targetItems.splice(
      insertionIndex < 0 ? targetItems.length : insertionIndex,
      0,
      { ...deal, stage },
    );
    const reordered = [
      ...without.filter((item) => item.stage !== stage),
      ...targetItems,
    ];
    onDealsChange(reordered);
    try {
      const response = await fetch(`${API_URL}/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!response.ok) throw new Error("Unable to move deal");
    } catch {
      onDealsChange(previous);
    }
  };
  return (
    <>
      <div
        ref={boardRef}
        className="flex gap-3 overflow-x-auto pb-3"
        onDragOver={(event) => {
          const board = boardRef.current;
          if (!board) return;
          const bounds = board.getBoundingClientRect();
          if (event.clientX < bounds.left + 90) board.scrollLeft -= 14;
          if (event.clientX > bounds.right - 90) board.scrollLeft += 14;
        }}
      >
        {stages.map(([label, color, probability]) => (
          <div
            className={`relative flex h-[calc(100vh-245px)] min-h-[360px] min-w-[290px] flex-col overflow-y-auto overflow-x-hidden rounded-xl bg-[#f4f4f4] p-2.5 transition ${dropStage === label ? "ring-2 ring-[#1683ff] ring-offset-2" : ""}`}
            key={label}
            onDragEnter={() => setDropStage(label)}
            onDragLeave={() => setDropStage(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const deal = deals.find(
                (item) => item.id === event.dataTransfer.getData("deal-id"),
              );
              if (deal) void moveDeal(deal, label);
              setDropStage(null);
            }}
          >
            <div className="sticky top-0 z-30 -mx-2.5 mb-2 flex min-h-[42px] shrink-0 items-center bg-[#f4f4f4] px-2.5 py-2 shadow-[0_2px_0_#f4f4f4]">
              <span
                className={`inline-flex rounded-md px-3 py-1 text-sm font-bold ${color}`}
              >
                {label}
              </span>
              <span className="ml-3 text-sm font-semibold text-[#516f90]">
                {deals.filter((deal) => deal.stage === label).length}
              </span>
            </div>
            {deals
              .filter((deal) => deal.stage === label)
              .map((deal) => (
                <div
                  key={deal.id}
                  onDragEnter={(event) => {
                    event.stopPropagation();
                    const draggedId = event.dataTransfer.getData("deal-id");
                    if (draggedId && draggedId !== deal.id)
                      event.currentTarget.classList.add(
                        "border-t-2",
                        "border-[#1683ff]",
                      );
                  }}
                  onDragLeave={(event) => {
                    event.currentTarget.classList.remove(
                      "border-t-2",
                      "border-[#1683ff]",
                    );
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.classList.remove(
                      "border-t-2",
                      "border-[#1683ff]",
                    );
                    const dragged = deals.find(
                      (item) =>
                        item.id === event.dataTransfer.getData("deal-id"),
                    );
                    if (dragged) void moveDeal(dragged, label, deal.id);
                  }}
                >
                  <DealCard
                    name={deal.name}
                    amount={deal.amount}
                    onCreateTask={onCreateTask}
                    onCreateNote={onCreateNote}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("deal-id", deal.id);
                      const preview = event.currentTarget.cloneNode(
                        true,
                      ) as HTMLElement;
                      preview.style.position = "fixed";
                      preview.style.top = "-1000px";
                      preview.style.width = `${event.currentTarget.offsetWidth}px`;
                      preview.style.opacity = "1";
                      preview.style.pointerEvents = "none";
                      document.body.appendChild(preview);
                      event.dataTransfer.setDragImage(preview, 20, 20);
                      window.setTimeout(() => preview.remove(), 0);
                    }}
                  />
                </div>
              ))}
            <button
              className="mt-3 w-full rounded-full border border-[#8d8d8d] bg-white py-2 text-sm font-medium text-[#213343] hover:bg-[#f7f9fb]"
              onClick={onCreateDeal}
              type="button"
            >
              + Deal
            </button>
            <div className="sticky bottom-0 z-20 mt-3 bg-[#e9e9e9]">
              <DealColumnFooter
                deals={deals.filter((deal) => deal.stage === label)}
                probability={probability}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function DealsEmptyState({ onCreateDeal }: { onCreateDeal: () => void }) {
  return (
    <section className="relative mb-4 overflow-hidden rounded-xl border border-[#f3d8cb] bg-[#fffaf7] px-5 py-12 text-center">
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full border-[70px] border-[#fff1eb]" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-64 w-64 rounded-full border-[70px] border-[#fff1eb]" />
      <Image
        className="mx-auto object-contain"
        src="/Omsons Logo.png"
        alt="Omsons logo"
        width={180}
        height={120}
        priority
      />
      <h2 className="mt-5 text-2xl font-bold text-[#111827]">
        Build a winning sales process
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-[#516f90]">
        Use Deals to track opportunities across your custom sales pipeline and
        report on your revenue.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          className="rounded-full bg-[#005c5f] px-8 py-3 text-sm font-bold text-white"
          onClick={onCreateDeal}
          type="button"
        >
          Add deal
        </button>
        <button className="rounded-full border border-[#9fb3c8] bg-white px-8 py-3 text-sm font-bold">
          Import data from a file
        </button>
      </div>
    </section>
  );
}

function DealColumnFooter({
  deals,
  probability,
}: {
  deals: Deal[];
  probability: number;
}) {
  const totalAmount = deals.reduce(
    (sum, deal) => sum + (deal.amount == null ? 0 : Number(deal.amount)),
    0,
  );
  const weightedAmount = totalAmount * (probability / 100);
  const money = (amount: number) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });

  return (
    <div className="mt-3 rounded-b-[22px] border-t border-[#c9c9c9] bg-[#e9e9e9] px-2 pb-2 pt-1 text-sm leading-6 text-[#202020]">
      <div>
        <strong>{money(totalAmount)}</strong> | Total amount
      </div>
      <div>
        <strong>{money(weightedAmount)}</strong> ({probability}%) | Weighted
        amount{" "}
        <Info
          className="inline-block h-4 w-4 align-[-3px] text-[#666]"
          aria-label="Weighted amount information"
        />
        <strong className="sr-only">{money(weightedAmount)}</strong>
      </div>
    </div>
  );
}

function DealFieldTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/field relative flex" title={label}>
      {children}
      <div className="pointer-events-none invisible absolute bottom-[calc(100%+10px)] left-1/2 z-[1000] box-border w-max max-w-[min(280px,calc(100vw-24px))] -translate-x-1/2 translate-y-1 whitespace-normal rounded-lg bg-[#141414] px-3 py-2 text-left font-[Arial,sans-serif] text-sm font-normal leading-[1.4] text-[#f5f5f5] opacity-0 shadow-xl transition-[opacity,transform,visibility] duration-150 group-hover/field:visible group-hover/field:translate-y-0 group-hover/field:opacity-100 group-focus-within/field:visible group-focus-within/field:translate-y-0 group-focus-within/field:opacity-100">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[9px] border-t-[9px] border-x-transparent border-t-[#141414]" />
      </div>
    </div>
  );
}

function DealCard({
  name,
  amount,
  onDragStart,
  onCreateTask,
  onCreateNote,
}: {
  name: string;
  amount?: number | null;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onCreateTask: () => void;
  onCreateNote: () => void;
}) {
  const [activityOpen, setActivityOpen] = useState(false);
  return (
    <article
      className="group relative mt-2 cursor-grab rounded-xl border-2 border-[#4da3ff] bg-[#e8f6ff] p-2.5 text-xs text-[#213343] shadow-sm transition hover:border-[#1683ff] active:cursor-grabbing [&>p:nth-of-type(n+2)]:hidden"
      draggable
      onDragStart={onDragStart}
    >
      <h3 className="text-sm font-bold text-[#006b70]">{name}</h3>
      <DealFieldTooltip label="Create Date: 10/16/2026 10:09 AM GMT+5:30">
        <p className="mt-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          10/16/2026
        </p>
      </DealFieldTooltip>
      <DealFieldTooltip label="Close Date: 10/31/2026 10:09 AM GMT+5:30">
        <p className="mt-2 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          10/31/2026
        </p>
      </DealFieldTooltip>
      <DealFieldTooltip
        label={`Amount: ${amount == null ? "Not set" : `₹${amount.toLocaleString("en-IN")}`} `}
      >
        <p className="mt-2 flex items-center gap-2">
          <IndianRupee className="h-4 w-4" aria-hidden="true" />
          {amount == null ? "—" : amount.toLocaleString("en-IN")}
        </p>
      </DealFieldTooltip>
      <DealFieldTooltip label="Deal owner: Soft Dev">
        <p className="mt-2 flex items-center gap-2">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          Soft Dev
        </p>
      </DealFieldTooltip>
      <DealFieldTooltip label="Contact">
        <p className="mt-3 flex items-center gap-2 border-b border-[#b9d2df] pb-3 font-medium text-[#006b70]">
          <ContactRound className="h-4 w-4" aria-hidden="true" />
          Contact
        </p>
      </DealFieldTooltip>
      <div className="hidden" aria-hidden="true">
        <p className="mt-3">▣ &nbsp;10/16/2026</p>
        <p className="mt-2">▣ &nbsp;10/31/2026</p>
        <p className="mt-2">▣ &nbsp;$100</p>
        <p className="mt-2">♙ &nbsp;Soft Dev</p>
        <p className="mt-3 border-b border-[#b9d2df] pb-3 font-medium text-[#006b70]">
          ◉ &nbsp;Contact
        </p>
      </div>
      <div className="hidden" aria-hidden="true">
        <span>♧ &nbsp;☷</span>
      </div>
      <div className="relative mt-2 flex items-center justify-between border-t border-[#b9d2df] pt-2">
        <span className="flex items-center gap-3">
          <button
            className="grid h-7 w-7 place-items-center rounded p-1 text-[#213343] hover:bg-white"
            aria-label="Create note"
            onClick={onCreateNote}
            type="button"
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <button
            className="grid h-7 w-7 place-items-center rounded p-1 text-[#213343] hover:bg-white"
            aria-label="Create task"
            onClick={onCreateTask}
            type="button"
          >
            <ListChecks className="h-4 w-4" />
          </button>
        </span>
        <div
          onMouseEnter={() => setActivityOpen(true)}
          onMouseLeave={() => setActivityOpen(false)}
        >
          <button
            className="flex items-center gap-2 rounded-lg border border-[#8d8d8d] bg-[#f7f7f7] px-3 py-1 text-sm text-[#4b4b4b]"
            type="button"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span className="border-l border-[#b8b8b8] pl-2">4 days ago</span>
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
          {activityOpen ? (
            <div className="absolute bottom-10 right-0 z-40 flex w-[520px] overflow-hidden rounded-2xl border border-[#c8c8c8] bg-white text-sm shadow-2xl">
              <div className="w-1/2 border-r p-6">
                <h4 className="text-base font-bold">Previous activity</h4>
                <p className="mt-4 text-[#666]">No previous activity</p>
                <button className="mt-56 rounded-full border px-4 py-2">
                  View all activity ↗
                </button>
              </div>
              <div className="w-1/2 p-6">
                <div className="flex items-start justify-between">
                  <h4 className="text-xl font-bold">Task in 5 days</h4>
                  <button className="font-bold text-[#006b70]" type="button">
                    View details
                  </button>
                </div>
                <p className="mt-4 font-semibold">☷ test</p>
                <p className="text-[#666]">Due Oct 21, 2026 8:00 AM</p>
                <p className="mt-4">
                  ♙ <strong>Owner</strong>　
                  <span className="rounded-full bg-[#eee] px-2 py-1">SD</span>{" "}
                  Soft Dev
                </p>
                <p className="mt-4">
                  <span className="text-blue-600">●</span> Not Started　|　To-do
                </p>
                <h5 className="mt-5 font-bold">Description</h5>
                <div className="mt-2 rounded-full border px-4 py-2">test</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function NoteModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        className="w-full max-w-3xl rounded-xl bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Note</h2>
          <button className="text-2xl" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="border-b px-6 py-4 text-sm">
          For{" "}
          <span className="ml-2 rounded-md border bg-[#f2f2f2] px-3 py-1 font-semibold">
            Deal
          </span>
        </div>
        <div className="p-6">
          <textarea
            className="h-48 w-full resize-none border-0 p-0 text-base outline-none"
            placeholder="Start typing to leave a note..."
            required
          />
          <div className="flex gap-4 border-t pt-3 text-sm font-semibold text-[#444]">
            B <em>I</em> <u>U</u> More⌄　↗　▧　☷　📎　✦
          </div>
        </div>
        <div className="border-t px-6 py-4 font-semibold">
          Associated with 1 record⌄
        </div>
        <label className="flex items-center gap-2 border-t px-6 py-4 text-sm">
          <input type="checkbox" /> Create a <strong>To-do</strong> task to
          follow up <strong>in 3 business days</strong>
        </label>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            className="rounded-full px-5 py-2"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-[#005c5f] px-5 py-2 font-bold text-white"
            type="submit"
          >
            Create note
          </button>
        </div>
      </form>
    </div>
  );
}

function TaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("To-do");
  const [priority, setPriority] = useState("None");
  const [queue, setQueue] = useState("None");
  const [assignee, setAssignee] = useState("Soft Dev");
  const [dueDate, setDueDate] = useState("");
  const [dueOption, setDueOption] = useState("Today");
  const customDateRef = useRef<HTMLInputElement>(null);
  const [reminder, setReminder] = useState("No reminder");
  const [notes, setNotes] = useState("");
  const dueOptions = getDueDateOptions();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          console.info("Task created", {
            title,
            taskType,
            priority,
            queue,
            assignee,
            dueDate,
            reminder,
            notes,
          });
          onClose();
        }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Task</h2>
          <button className="text-2xl" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="space-y-5 p-6">
          <input
            className="h-14 w-full rounded-lg border border-[#8d8d8d] px-4 text-base"
            placeholder="Enter a task title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Due date
              <span className="mt-2 flex gap-2">
                <select
                  className="h-10 min-w-0 flex-1 rounded border p-2"
                  value={dueOption}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDueOption(value);
                    if (value === "Custom Date")
                      window.setTimeout(
                        () => customDateRef.current?.showPicker(),
                        0,
                      );
                  }}
                >
                  {dueOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className="h-10 w-28 rounded border p-2"
                  type="time"
                  defaultValue="08:00"
                />
              </span>
              <input
                ref={customDateRef}
                className="pointer-events-none absolute h-px w-px opacity-0"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                aria-label="Custom due date"
              />
            </label>
            <label className="text-sm font-semibold">
              Reminder
              <select
                className="mt-2 h-10 w-full rounded border p-2"
                value={reminder}
                onChange={(event) => setReminder(event.target.value)}
              >
                <option>No reminder</option>
                <option>At due time</option>
                <option>1 hour before</option>
                <option>1 day before</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="text-sm font-semibold">
              Task type
              <select
                className="mt-2 h-10 w-full rounded border p-2"
                value={taskType}
                onChange={(event) => setTaskType(event.target.value)}
              >
                <option>To-do</option>
                <option>Call</option>
                <option>Email</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Priority
              <select
                className="mt-2 h-10 w-full rounded border p-2"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option>None</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Queue
              <select
                className="mt-2 h-10 w-full rounded border p-2"
                value={queue}
                onChange={(event) => setQueue(event.target.value)}
              >
                <option>None</option>
                <option>Sales queue</option>
                <option>Support queue</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Assigned to
              <select
                className="mt-2 h-10 w-full rounded border p-2"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
              >
                <option>Soft Dev</option>
                <option>Unassigned</option>
              </select>
            </label>
          </div>
          <textarea
            className="h-28 w-full rounded border p-3"
            placeholder="Add notes..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className="flex items-center gap-4 border-t pt-3 text-sm font-semibold text-[#444]">
            <button type="button">B</button>
            <button className="italic" type="button">
              I
            </button>
            <button className="underline" type="button">
              U
            </button>
            <button type="button">Tₓ</button>
            <button type="button">More⌄</button>
            <button type="button">↗</button>
            <button type="button">▧</button>
            <button type="button">☷</button>
          </div>
          <span className="mr-auto text-xs text-[#777]">Draft saved</span>
          <button
            className="text-left text-sm font-semibold text-[#006b70]"
            title="Click this button to update this activity's associations."
            type="button"
          >
            Associated with 1 record⌄
          </button>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            className="rounded-full px-5 py-2"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-[#005c5f] px-5 py-2 font-bold text-white"
            type="submit"
          >
            Create task
          </button>
        </div>
      </form>
    </div>
  );
}

function getDueDateOptions() {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };
  const format = (date: Date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const weekday = (date: Date) =>
    date.toLocaleDateString(undefined, { weekday: "long" });
  return [
    { value: "Today", label: "Today" },
    { value: "Tomorrow", label: `Tomorrow (${format(addDays(1))})` },
    {
      value: "In 1 business day",
      label: `In 1 business day (${weekday(addDays(1))})`,
    },
    {
      value: "In 2 business days",
      label: `In 2 business days (${weekday(addDays(2))})`,
    },
    {
      value: "In 3 business days",
      label: `In 3 business days (${weekday(addDays(3))})`,
    },
    { value: "In 1 week", label: `In 1 week (${format(addDays(7))})` },
    { value: "In 2 weeks", label: `In 2 weeks (${format(addDays(14))})` },
    { value: "In 1 month", label: `In 1 month (${format(addDays(30))})` },
    { value: "In 3 months", label: `In 3 months (${format(addDays(90))})` },
    { value: "In 6 months", label: `In 6 months (${format(addDays(180))})` },
    { value: "Custom Date", label: "Custom Date" },
  ];
}

const filterOperators = [
  "is any of",
  "is equal to",
  "is before",
  "is after",
  "is between",
  "is more than",
  "is less than",
  "is known",
  "is unknown",
];

function PropertyFilter({ property }: { property: string }) {
  return (
    <div className="absolute left-0 top-8 z-30 w-[390px] rounded-2xl border border-[#d0d0d0] bg-white p-5 shadow-xl">
      <div className="absolute -top-2 left-12 h-4 w-4 rotate-45 border-l border-t border-[#d0d0d0] bg-white" />
      <select
        className="relative mb-3 h-10 border-0 bg-transparent px-0 text-base font-medium outline-none"
        aria-label={`${property} operator`}
      >
        {filterOperators.map((operator) => (
          <option key={operator}>{operator}</option>
        ))}
      </select>
      <select
        className="relative h-10 w-full rounded-lg border border-[#333] bg-white px-3 outline-none"
        aria-label={`${property} value`}
      >
        <option value="">Select value</option>
      </select>
    </div>
  );
}

function DealsTableEmpty({ deals }: { deals: Deal[] }) {
  if (deals.length > 0)
    return (
      <div className="overflow-x-auto rounded-xl border border-[#dbe4ed]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[#dbe4ed] bg-[#f7f9fb]">
            <tr>
              <th className="px-4 py-3">Deal name</th>
              <th className="px-4 py-3">Deal stage</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Close date</th>
              <th className="px-4 py-3">Deal owner</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr className="border-b border-[#e7edf3]" key={deal.id}>
                <td className="px-4 py-3 font-bold text-[#007a8a]">
                  {deal.name}
                </td>
                <td className="px-4 py-3">{deal.stage}</td>
                <td className="px-4 py-3">
                  {deal.amount == null ? "—" : `$${deal.amount}`}
                </td>
                <td className="px-4 py-3">
                  {deal.closeDate
                    ? new Date(deal.closeDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">{deal.owner?.name ?? "No owner"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <div className="rounded-xl border border-[#dbe4ed] bg-white p-10 text-center">
      <Image
        className="mx-auto object-contain"
        src="/Omsons Logo.png"
        alt="Omsons logo"
        width={140}
        height={94}
      />
      <h2 className="mt-4 text-xl font-bold">No deals yet</h2>
      <p className="mt-2 text-sm text-[#516f90]">
        Switch to board view or add your first deal to start tracking
        opportunities.
      </p>
    </div>
  );
}

function CircleButton({
  icon: Icon,
  label,
}: {
  icon: typeof Plus;
  label: string;
}) {
  return (
    <button
      className="grid h-10 w-10 place-items-center rounded-full border border-[#dbe4ed] bg-white text-[#213343]"
      aria-label={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
