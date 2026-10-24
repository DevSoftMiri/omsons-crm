"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Download,
  Filter,
  Grid2X2,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Variant = {
  id: string;
  sku: string;
  name: string;
  specs?: Record<string, string>;
  specsText?: string;
  pack?: number;
  price?: number;
  priceLabel?: string;
  inStock?: boolean;
  images?: string[];
};
type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category?: string;
  categories?: string[];
  page?: number;
  features?: string[];
  descriptionHtml?: string;
  images?: string[];
  variants?: Variant[];
};
type StockStatus = "all" | "in-stock" | "out-of-stock";
type PriceRange =
  "any" | "under-1000" | "1000-5000" | "5000-10000" | "over-10000";
type SortField = "name" | "sku" | "category" | "price" | "variants" | "stock";
type AdvancedFilters = {
  name: string;
  sku: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  minVariants: string;
  pack: string;
  stock: "any" | "in-stock" | "out-of-stock";
  specKey: string;
  specValue: string;
};
const emptyAdvanced: AdvancedFilters = {
  name: "",
  sku: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  minVariants: "",
  pack: "",
  stock: "any",
  specKey: "",
  specValue: "",
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "in-stock" | "out-of-stock">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatus>("all");
  const [priceRange, setPriceRange] = useState<PriceRange>("any");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [advanced, setAdvanced] = useState<AdvancedFilters>(emptyAdvanced);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      product: true,
      sku: true,
      category: true,
      variants: true,
      price: true,
      stock: true,
      actions: true,
    },
  );
  const toolbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/omsons_catalog_2026-27.json")
      .then((response) => response.json())
      .then((data: Product[] | { products?: Product[] }) =>
        setProducts(Array.isArray(data) ? data : (data.products ?? [])),
      )
      .catch(() => setProducts([]));
  }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      )
        setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((item): item is string => Boolean(item)),
        ),
      ).sort(),
    [products],
  );
  const productPrice = (product: Product) =>
    product.variants?.reduce(
      (lowest, variant) =>
        Math.min(
          lowest,
          variant.price ?? Number(variant.priceLabel ?? Infinity),
        ),
      Infinity,
    ) ?? Infinity;
  const productInStock = (product: Product) =>
    product.variants?.some((variant) => variant.inStock) ?? false;
  const filtered = products
    .filter((product) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        `${product.name} ${product.sku} ${product.category}`
          .toLowerCase()
          .includes(query);
      const inStock = productInStock(product);
      const price = productPrice(product);
      const specs =
        product.variants?.flatMap((variant) =>
          Object.entries(variant.specs ?? {}),
        ) ?? [];
      const priceMatches =
        priceRange === "any" ||
        (priceRange === "under-1000"
          ? price < 1000
          : priceRange === "1000-5000"
            ? price >= 1000 && price <= 5000
            : priceRange === "5000-10000"
              ? price > 5000 && price <= 10000
              : price > 10000);
      const advancedMatches =
        (!advanced.name ||
          product.name.toLowerCase().includes(advanced.name.toLowerCase())) &&
        (!advanced.sku ||
          product.sku.toLowerCase().includes(advanced.sku.toLowerCase())) &&
        (!advanced.category || product.category === advanced.category) &&
        (!advanced.minPrice || price >= Number(advanced.minPrice)) &&
        (!advanced.maxPrice || price <= Number(advanced.maxPrice)) &&
        (!advanced.minVariants ||
          (product.variants?.length ?? 0) >= Number(advanced.minVariants)) &&
        (!advanced.pack ||
          product.variants?.some(
            (variant) => variant.pack === Number(advanced.pack),
          )) &&
        (advanced.stock === "any" ||
          (advanced.stock === "in-stock" ? inStock : !inStock)) &&
        (!advanced.specKey ||
          specs.some(
            ([key, value]) =>
              key === advanced.specKey &&
              (!advanced.specValue ||
                value.toLowerCase().includes(advanced.specValue.toLowerCase())),
          ));
      return (
        matchesSearch &&
        (!category || product.category === category) &&
        (tab === "all" || (tab === "in-stock" ? inStock : !inStock)) &&
        (stockStatus === "all" ||
          (stockStatus === "in-stock" ? inStock : !inStock)) &&
        priceMatches &&
        advancedMatches
      );
    })
    .sort((left, right) => {
      const a =
        sortField === "name"
          ? left.name
          : sortField === "sku"
            ? left.sku
            : sortField === "category"
              ? (left.category ?? "")
              : sortField === "price"
                ? productPrice(left)
                : sortField === "variants"
                  ? (left.variants?.length ?? 0)
                  : productInStock(left)
                    ? 1
                    : 0;
      const b =
        sortField === "name"
          ? right.name
          : sortField === "sku"
            ? right.sku
            : sortField === "category"
              ? (right.category ?? "")
              : sortField === "price"
                ? productPrice(right)
                : sortField === "variants"
                  ? (right.variants?.length ?? 0)
                  : productInStock(right)
                    ? 1
                    : 0;
      const result =
        typeof a === "number" && typeof b === "number"
          ? a - b
          : String(a).localeCompare(String(b), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      return sortDirection === "asc" ? result : -result;
    });
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const money = (product: Product) =>
    product.variants?.[0]?.priceLabel
      ? `₹${Number(product.variants[0].priceLabel).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : "--";
  return (
    <AppShell>
      <main
        ref={toolbarRef}
        className="rounded-[14px] border border-[#dbe4ed] bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-[#dbe4ed] pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-[#172b4d]">
              Products{" "}
              <span className="grid h-7 min-w-7 place-items-center rounded-full border border-[#dbe4ed] bg-[#f4f7fa] px-2 text-xs font-medium text-[#718096]">
                {products.length}
              </span>
            </h1>
            <p className="text-sm text-[#718096]">
              Manage your catalog, specifications and variants.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#b8c5d1] px-4 py-2 text-sm font-semibold"
              type="button"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[#ff5c35] px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={() => setAddProductOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add product
            </button>
          </div>
        </div>
        <div className="relative flex items-center justify-between gap-5 border-b border-[#dbe4ed] py-3">
          <div className="flex min-w-0 items-center gap-4">
            <span className="shrink-0 text-sm font-semibold text-[#ff5c35]">
              All products
            </span>
            <label className="flex h-10 w-[min(360px,55vw)] min-w-[220px] items-center gap-2 rounded-lg border border-[#b8c5d1] px-3 text-[#718096]">
              <Search className="h-4 w-4" />
              <input
                className="min-w-0 flex-1 text-sm outline-none"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold ${
                showFilterBar
                  ? "border-[#ff5c35] bg-[#fff8f5] text-[#d94d2c]"
                  : "border-[#b8c5d1] bg-white text-[#172b4d]"
              }`}
              onClick={() => {
                setShowFilterBar((visible) => !visible);
                setOpenMenu(null);
              }}
              type="button"
              aria-expanded={showFilterBar}
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFilterBar ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          <div className="hidden shrink-0 gap-2 pb-1 md:flex">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#b8c5d1] px-4 py-2 text-sm font-semibold"
              onClick={() =>
                setOpenMenu(openMenu === "columns" ? null : "columns")
              }
              type="button"
            >
              <Grid2X2 className="h-4 w-4" />
              Columns
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#b8c5d1] px-4 py-2 text-sm font-semibold"
              onClick={() => downloadProductsCsv(filtered)}
              type="button"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          {openMenu === "columns" ? (
            <ColumnsMenu
              columns={visibleColumns}
              setColumns={setVisibleColumns}
              onClose={() => setOpenMenu(null)}
            />
          ) : null}
        </div>
        {showFilterBar ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#dbe4ed] py-4">
            <select
              className="h-10 rounded-lg border border-[#b8c5d1] bg-white px-3 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Category</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <div className="relative">
              <ToolbarButton
                active={stockStatus !== "all"}
                label={
                  stockStatus === "all"
                    ? "Stock status"
                    : stockStatus === "in-stock"
                      ? "In stock"
                      : "Out of stock"
                }
                open={openMenu === "stock"}
                onClick={() =>
                  setOpenMenu(openMenu === "stock" ? null : "stock")
                }
              />
              {openMenu === "stock" ? (
                <ChoiceMenu
                  title="Stock status"
                  options={[
                    ["all", "All products"],
                    ["in-stock", "In stock"],
                    ["out-of-stock", "Out of stock"],
                  ]}
                  value={stockStatus}
                  onChange={(value) => {
                    setStockStatus(value as StockStatus);
                    setOpenMenu(null);
                  }}
                />
              ) : null}
            </div>
            <div className="relative">
              <ToolbarButton
                active={priceRange !== "any"}
                label={
                  priceRange === "any"
                    ? "Price range"
                    : priceRange === "under-1000"
                      ? "Under ₹1,000"
                      : priceRange === "1000-5000"
                        ? "₹1,000–₹5,000"
                        : priceRange === "5000-10000"
                          ? "₹5,000–₹10,000"
                          : "Above ₹10,000"
                }
                open={openMenu === "price"}
                onClick={() =>
                  setOpenMenu(openMenu === "price" ? null : "price")
                }
              />
              {openMenu === "price" ? (
                <ChoiceMenu
                  title="Price range"
                  options={[
                    ["any", "Any price"],
                    ["under-1000", "Under ₹1,000"],
                    ["1000-5000", "₹1,000–₹5,000"],
                    ["5000-10000", "₹5,000–₹10,000"],
                    ["over-10000", "Above ₹10,000"],
                  ]}
                  value={priceRange}
                  onChange={(value) => {
                    setPriceRange(value as PriceRange);
                    setOpenMenu(null);
                  }}
                />
              ) : null}
            </div>
            <div className="relative">
              <ToolbarButton
                icon={<SlidersHorizontal className="h-4 w-4" />}
                active={sortField !== "name" || sortDirection !== "asc"}
                label="Sort by"
                open={openMenu === "sort"}
                onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
              />
              {openMenu === "sort" ? (
                <SortMenu
                  field={sortField}
                  direction={sortDirection}
                  onChange={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                    setOpenMenu(null);
                  }}
                />
              ) : null}
            </div>
            <div className="relative">
              <button
                className="inline-flex h-10 items-center gap-2 px-2 text-sm font-semibold text-[#ff5c35]"
                type="button"
                onClick={() =>
                  setOpenMenu(openMenu === "advanced" ? null : "advanced")
                }
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced filters
              </button>
              {openMenu === "advanced" ? (
                <AdvancedMenu
                  filters={advanced}
                  setFilters={setAdvanced}
                  categories={categories}
                  clear={() => setAdvanced(emptyAdvanced)}
                />
              ) : null}
            </div>
          </div>
        ) : null}
        <ActiveChips
          filters={advanced}
          setFilters={setAdvanced}
          category={category}
          setCategory={setCategory}
          stockStatus={stockStatus}
          setStockStatus={setStockStatus}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
        />
        <div className="mt-3 overflow-x-auto rounded-lg border border-[#dbe4ed]">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#f7f9fb] text-[11px] uppercase text-[#718096]">
              <tr>
                <th className="w-12 px-3 py-3" />
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Variants</th>
                <th className="px-3 py-3">Price / pack</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  open={expanded.has(product.id)}
                  onToggle={() => toggle(product.id)}
                  money={money(product)}
                />
              ))}
            </tbody>
          </table>
          {!filtered.length ? (
            <div className="p-12 text-center text-sm text-[#718096]">
              No products found.
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between py-4 text-sm text-[#718096]">
          <span>
            {filtered.length} product{filtered.length === 1 ? "" : "s"} ·{" "}
            {filtered.reduce(
              (sum, product) => sum + (product.variants?.length ?? 0),
              0,
            )}{" "}
            variants
          </span>
          <span>
            20 per page <ChevronDown className="ml-1 inline h-4 w-4" />
          </span>
        </div>
      </main>
      {addProductOpen ? (
        <AddProductModal
          categories={categories}
          onClose={() => setAddProductOpen(false)}
          onCreate={(product) => {
            setProducts((current) => [product, ...current]);
            setAddProductOpen(false);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function AddProductModal({
  categories,
  onClose,
  onCreate,
}: {
  categories: string[];
  onClose: () => void;
  onCreate: (product: Product) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: categories[0] ?? "",
    variantSku: "",
    pack: "",
    price: "",
    size: "",
    microRating: "",
    inStock: "true",
  });
  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = `${form.name}-${form.sku}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const variantSku = form.variantSku.trim() || `${form.sku}-001`;
    onCreate({
      id: form.sku.trim(),
      sku: form.sku.trim(),
      slug,
      name: form.name.trim(),
      category: form.category,
      categories: form.category ? [form.category] : [],
      images: ["/Omsons Logo.png"],
      variants: [
        {
          id: variantSku,
          sku: variantSku,
          name: `${form.name.trim()} - ${variantSku}`,
          specs: {
            ...(form.size ? { "Size/Dia (mm)": form.size } : {}),
            ...(form.microRating
              ? { "Micro Rating (µm)": form.microRating }
              : {}),
          },
          pack: form.pack ? Number(form.pack) : undefined,
          price: form.price ? Number(form.price) : undefined,
          priceLabel: form.price || undefined,
          inStock: form.inStock === "true",
          images: ["/Omsons Logo.png"],
        },
      ],
    });
  };

  const fieldClass =
    "mt-1 h-10 w-full rounded-md border border-[#cbd6e2] px-3 text-sm font-normal outline-none focus:border-[#006b70]";
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#111827]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <form
        className="max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-xl bg-white shadow-2xl"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Add product"
      >
        <div className="flex items-center justify-between border-b border-[#dbe4ed] px-6 py-3">
          <div>
            <h2 className="text-xl font-bold text-[#213343]">Add product</h2>
            <p className="text-sm text-[#718096]">
              Add a product and its first variant to your catalog.
            </p>
          </div>
          <button
            className="rounded-md p-2 text-[#516f90] hover:bg-[#f2f7fa]"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[100px_1fr]">
          <div className="grid h-24 w-24 place-items-center rounded-lg border border-[#dbe4ed] bg-[#f7f9fb] p-3">
            <img
              className="max-h-full max-w-full object-contain"
              src="/Omsons Logo.png"
              alt="Omsons logo"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
              Product name
              <input
                className={fieldClass}
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Nylon Syringe Filters, Sterile"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              SKU
              <input
                className={fieldClass}
                required
                value={form.sku}
                onChange={(event) => update("sku", event.target.value)}
                placeholder="e.g. OM260"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Category
              <select
                className={fieldClass}
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </label>
          </div>
        </div>
        <div className="border-t border-[#dbe4ed] px-5 py-4">
          <h3 className="font-bold text-[#213343]">First variant</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Variant SKU
              <input
                className={fieldClass}
                value={form.variantSku}
                onChange={(event) => update("variantSku", event.target.value)}
                placeholder="Optional"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Pack quantity
              <input
                className={fieldClass}
                min="0"
                type="number"
                value={form.pack}
                onChange={(event) => update("pack", event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Price / pack
              <input
                className={fieldClass}
                min="0"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Stock status
              <select
                className={fieldClass}
                value={form.inStock}
                onChange={(event) => update("inStock", event.target.value)}
              >
                <option value="true">In stock</option>
                <option value="false">Out of stock</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Size / Dia (mm)
              <input
                className={fieldClass}
                value={form.size}
                onChange={(event) => update("size", event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Micro Rating (µm)
              <input
                className={fieldClass}
                value={form.microRating}
                onChange={(event) => update("microRating", event.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#dbe4ed] px-5 py-3">
          <button
            className="rounded-md border border-[#cbd6e2] px-4 py-2"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-[#ff5c35] px-5 py-2 font-semibold text-white"
            type="submit"
          >
            Add product
          </button>
        </div>
      </form>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  open,
  active,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  open?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold ${active || open ? "border-[#ff5c35] bg-[#fff8f5] text-[#d94d2c]" : "border-[#b8c5d1] bg-white"}`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}
function ChoiceMenu({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="absolute left-0 top-11 z-50 w-56 rounded-xl border border-[#dbe4ed] bg-white p-2 shadow-xl">
      <p className="px-3 py-2 text-xs font-bold uppercase text-[#8293a6]">
        {title}
      </p>
      {options.map(([key, label]) => (
        <button
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7f9fb]"
          key={key}
          type="button"
          onClick={() => onChange(key)}
        >
          {label}
          {value === key ? <Check className="h-4 w-4 text-[#ff5c35]" /> : null}
        </button>
      ))}
    </div>
  );
}
function SortMenu({
  field,
  direction,
  onChange,
}: {
  field: SortField;
  direction: "asc" | "desc";
  onChange: (field: SortField, direction: "asc" | "desc") => void;
}) {
  return (
    <div className="absolute left-0 top-11 z-50 w-64 rounded-xl border border-[#dbe4ed] bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-bold uppercase text-[#8293a6]">
        Sort products
      </p>
      <select
        className="h-10 w-full rounded-lg border border-[#b8c5d1] px-2 text-sm"
        value={field}
        onChange={(event) =>
          onChange(event.target.value as SortField, direction)
        }
      >
        <option value="name">Product name</option>
        <option value="sku">SKU</option>
        <option value="category">Category</option>
        <option value="price">Price</option>
        <option value="variants">Variant count</option>
        <option value="stock">Stock status</option>
      </select>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className={`rounded-lg border px-2 py-2 text-sm ${direction === "asc" ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#dbe4ed]"}`}
          type="button"
          onClick={() => onChange(field, "asc")}
        >
          A → Z
        </button>
        <button
          className={`rounded-lg border px-2 py-2 text-sm ${direction === "desc" ? "border-[#ff5c35] bg-[#fff1eb]" : "border-[#dbe4ed]"}`}
          type="button"
          onClick={() => onChange(field, "desc")}
        >
          Z → A
        </button>
      </div>
    </div>
  );
}
function FilterMenu({
  category,
  setCategory,
  stockStatus,
  setStockStatus,
  priceRange,
  setPriceRange,
  categories,
  clear,
}: {
  category: string;
  setCategory: (value: string) => void;
  stockStatus: StockStatus;
  setStockStatus: (value: StockStatus) => void;
  priceRange: PriceRange;
  setPriceRange: (value: PriceRange) => void;
  categories: string[];
  clear: () => void;
}) {
  return (
    <div className="absolute left-0 top-11 z-50 w-64 rounded-xl border border-[#dbe4ed] bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-bold uppercase text-[#8293a6]">Filters</p>
      <select
        className="mb-2 h-9 w-full rounded-lg border border-[#b8c5d1] px-2 text-sm"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      >
        <option value="">Any category</option>
        {categories.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <select
        className="mb-2 h-9 w-full rounded-lg border border-[#b8c5d1] px-2 text-sm"
        value={stockStatus}
        onChange={(event) => setStockStatus(event.target.value as StockStatus)}
      >
        <option value="all">Any stock status</option>
        <option value="in-stock">In stock</option>
        <option value="out-of-stock">Out of stock</option>
      </select>
      <select
        className="h-9 w-full rounded-lg border border-[#b8c5d1] px-2 text-sm"
        value={priceRange}
        onChange={(event) => setPriceRange(event.target.value as PriceRange)}
      >
        <option value="any">Any price</option>
        <option value="under-1000">Under ₹1,000</option>
        <option value="1000-5000">₹1,000–₹5,000</option>
        <option value="5000-10000">₹5,000–₹10,000</option>
        <option value="over-10000">Above ₹10,000</option>
      </select>
      <button
        className="mt-3 text-sm font-semibold text-[#ff5c35]"
        type="button"
        onClick={clear}
      >
        Clear all
      </button>
    </div>
  );
}
function AdvancedMenu({
  filters,
  setFilters,
  categories,
  clear,
}: {
  filters: AdvancedFilters;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedFilters>>;
  categories: string[];
  clear: () => void;
}) {
  const update = (key: keyof AdvancedFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  return (
    <div className="absolute right-0 top-11 z-50 max-h-[min(520px,calc(100vh-140px))] w-[330px] overflow-y-auto rounded-xl border border-[#dbe4ed] bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-bold">Advanced filters</p>
        <button
          className="text-sm text-[#ff5c35]"
          type="button"
          onClick={clear}
        >
          Clear
        </button>
      </div>
      <div className="grid gap-2 text-sm">
        <input
          className="h-9 rounded-lg border px-3"
          placeholder="Product name"
          value={filters.name}
          onChange={(event) => update("name", event.target.value)}
        />
        <input
          className="h-9 rounded-lg border px-3"
          placeholder="SKU"
          value={filters.sku}
          onChange={(event) => update("sku", event.target.value)}
        />
        <select
          className="h-9 rounded-lg border px-2"
          value={filters.category}
          onChange={(event) => update("category", event.target.value)}
        >
          <option value="">Any category</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="h-9 rounded-lg border px-2"
            type="number"
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(event) => update("minPrice", event.target.value)}
          />
          <input
            className="h-9 rounded-lg border px-2"
            type="number"
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(event) => update("maxPrice", event.target.value)}
          />
        </div>
        <input
          className="h-9 rounded-lg border px-3"
          type="number"
          placeholder="Minimum variants"
          value={filters.minVariants}
          onChange={(event) => update("minVariants", event.target.value)}
        />
        <input
          className="h-9 rounded-lg border px-3"
          type="number"
          placeholder="Pack quantity"
          value={filters.pack}
          onChange={(event) => update("pack", event.target.value)}
        />
        <select
          className="h-9 rounded-lg border px-2"
          value={filters.stock}
          onChange={(event) =>
            update("stock", event.target.value as AdvancedFilters["stock"])
          }
        >
          <option value="any">Any stock status</option>
          <option value="in-stock">In stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
        <input
          className="h-9 rounded-lg border px-3"
          placeholder="Specification key (e.g. Micro Rating (µm))"
          value={filters.specKey}
          onChange={(event) => update("specKey", event.target.value)}
        />
        <input
          className="h-9 rounded-lg border px-3"
          placeholder="Specification value"
          value={filters.specValue}
          onChange={(event) => update("specValue", event.target.value)}
        />
      </div>
    </div>
  );
}
function ActiveChips({
  filters,
  setFilters,
  category,
  setCategory,
  stockStatus,
  setStockStatus,
  priceRange,
  setPriceRange,
}: {
  filters: AdvancedFilters;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedFilters>>;
  category: string;
  setCategory: (value: string) => void;
  stockStatus: StockStatus;
  setStockStatus: (value: StockStatus) => void;
  priceRange: PriceRange;
  setPriceRange: (value: PriceRange) => void;
}) {
  const chips = Object.entries(filters).filter(
    ([, value]) => value && value !== "any",
  );
  if (category) chips.push(["category", category]);
  if (stockStatus !== "all") chips.push(["stock", stockStatus]);
  if (priceRange !== "any") chips.push(["price", priceRange]);
  return chips.length ? (
    <div className="flex flex-wrap gap-2 border-b border-[#dbe4ed] pb-3">
      {chips.map(([key, value]) => (
        <button
          className="inline-flex items-center gap-1 rounded-full border border-[#ffb8a5] bg-[#fff1eb] px-3 py-1 text-xs text-[#c24126]"
          key={`${key}-${value}`}
          type="button"
          onClick={() => {
            if (key in filters)
              setFilters((current) => ({ ...current, [key]: "" }));
            else if (key === "category") setCategory("");
            else if (key === "stock") setStockStatus("all");
            else setPriceRange("any");
          }}
        >
          {key}: {String(value)}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  ) : null;
}

function ColumnsMenu({
  columns,
  setColumns,
}: {
  columns: Record<string, boolean>;
  setColumns: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onClose: () => void;
}) {
  const labels: [string, string][] = [
    ["product", "Product"],
    ["sku", "SKU"],
    ["category", "Category"],
    ["variants", "Variants"],
    ["price", "Price / pack"],
    ["stock", "Stock"],
    ["actions", "Actions"],
  ];
  return (
    <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[#dbe4ed] bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-bold uppercase text-[#8293a6]">
        Show columns
      </p>
      {labels.map(([key, label]) => (
        <button
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[#f7f9fb]"
          key={key}
          type="button"
          onClick={() =>
            setColumns((current) => ({ ...current, [key]: !current[key] }))
          }
        >
          {columns[key] ? (
            <Check className="h-4 w-4 text-[#ff5c35]" />
          ) : (
            <span className="h-4 w-4" />
          )}
          {label}
        </button>
      ))}
    </div>
  );
}
function downloadProductsCsv(products: Product[]) {
  const rows = products.flatMap((product) =>
    product.variants?.length
      ? product.variants.map((variant) => [
          product.name,
          product.sku,
          product.category ?? "",
          variant.sku,
          variant.pack ?? "",
          variant.priceLabel ?? "",
          variant.inStock ? "In stock" : "Out of stock",
        ])
      : [
          [
            product.name,
            product.sku,
            product.category ?? "",
            "",
            "",
            "",
            "Out of stock",
          ],
        ],
  );
  const csv = `\uFEFF${[["Product", "SKU", "Category", "Variant SKU", "Pack quantity", "Price", "Stock"], ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "products.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function ProductTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`border-b-2 px-1 py-3 text-sm font-semibold ${active ? "border-[#ff5c35] text-[#ff5c35]" : "border-transparent text-[#516f90]"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
function ProductRow({
  product,
  open,
  onToggle,
  money,
}: {
  product: Product;
  open: boolean;
  onToggle: () => void;
  money: string;
}) {
  return (
    <>
      <tr className="border-t border-[#e7edf3] hover:bg-[#fbfcfd]">
        <td className="px-3 py-4">
          <button
            aria-label={open ? "Collapse product" : "Expand product"}
            onClick={onToggle}
            type="button"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-md bg-[#f2f5f8]">
              {product.images?.[0] ? (
                <img
                  className="h-full w-full object-contain"
                  src={product.images[0]}
                  alt=""
                />
              ) : (
                <PackagePlus className="h-5 w-5 text-[#9fb3c8]" />
              )}
            </div>
            <span className="font-semibold text-[#007a8a]">{product.name}</span>
          </div>
        </td>
        <td className="px-3 py-4">{product.sku}</td>
        <td className="px-3 py-4">{product.category || "--"}</td>
        <td className="px-3 py-4">
          {product.variants?.length ?? 0} variant
          {product.variants?.length === 1 ? "" : "s"}
        </td>
        <td className="px-3 py-4">{money}</td>
        <td className="px-3 py-4">
          <span className="inline-flex items-center gap-2 text-[#16844b]">
            <span className="h-2 w-2 rounded-full bg-[#16a05d]" />
            {product.variants?.some((variant) => variant.inStock)
              ? "In stock"
              : "Out of stock"}
          </span>
        </td>
        <td className="px-3 py-4">⋮</td>
      </tr>
      {open ? (
        <tr>
          <td className="bg-[#fbfcfd]" colSpan={8}>
            <div className="m-3 rounded-lg border border-[#dbe4ed] p-3">
              <ul className="mb-3 list-disc pl-5 text-xs text-[#516f90]">
                {(product.features ?? []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="overflow-x-auto rounded-lg border border-[#dbe4ed]">
                <table className="w-full min-w-[700px] text-xs">
                  <thead className="bg-[#eaf0f5] text-left">
                    <tr>
                      <th className="px-3 py-2">Variant SKU</th>
                      <th className="px-3 py-2">Specifications</th>
                      <th className="px-3 py-2">Pack qty</th>
                      <th className="px-3 py-2">Price / pack</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(product.variants ?? []).map((variant) => (
                      <tr
                        className="border-t border-[#e7edf3]"
                        key={variant.id}
                      >
                        <td className="px-3 py-3">{variant.sku}</td>
                        <td className="px-3 py-3">
                          {variant.specsText ??
                            (Object.entries(variant.specs ?? {})
                              .map(([key, value]) => `${key}: ${value}`)
                              .join("; ") ||
                              "--")}
                        </td>
                        <td className="px-3 py-3">{variant.pack ?? "--"}</td>
                        <td className="px-3 py-3">
                          ₹{variant.priceLabel ?? "--"}
                        </td>
                        <td className="px-3 py-3 text-[#16844b]">
                          {variant.inStock ? "● In stock" : "○ Out of stock"}
                        </td>
                        <td className="px-3 py-3">⋮</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 grid gap-3 border-t border-[#dbe4ed] pt-3 text-xs sm:grid-cols-3">
                <div>
                  <strong>Category</strong>
                  <p>{product.category || "--"}</p>
                </div>
                <div>
                  <strong>Product ID</strong>
                  <p>{product.id}</p>
                </div>
                <div>
                  <strong>Catalog page</strong>
                  <p>{product.page || "--"}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
