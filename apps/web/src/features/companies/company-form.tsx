"use client";
import { AppShell } from "@/components/layout/app-shell";
import { GripVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createHeaders, createIdempotencyKey } from "@/lib/idempotency";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const input =
  "w-full rounded-md border border-[#9fb3c8] px-3 py-2 text-sm font-normal outline-none focus:border-[#006b70]";
type FormState = {
  domainName: string;
  name: string;
  ownerId: string;
  industry: string;
  type: string;
  city: string;
  state: string;
  postalCode: string;
  numberOfEmployees: string;
  annualRevenue: string;
  timeZone: string;
  description: string;
  linkedinCompanyPage: string;
};

export function CompanyForm({
  parentCompanyId,
  modal = false,
  onClose,
  onSaved,
}: {
  parentCompanyId?: string;
  modal?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
} = {}) {
  const fieldLabels: Record<keyof FormState, string> = {
    domainName: "Company domain name",
    name: "Company name",
    ownerId: "Company owner",
    industry: "Industry",
    type: "Type",
    city: "City",
    state: "State/Region",
    postalCode: "Postal code",
    numberOfEmployees: "Number of employees",
    annualRevenue: "Annual revenue",
    timeZone: "Time zone",
    description: "Description",
    linkedinCompanyPage: "LinkedIn company page",
  };
  const [form, setForm] = useState<FormState>({
    domainName: "",
    name: "",
    ownerId: "",
    industry: "",
    type: "",
    city: "",
    state: "",
    postalCode: "",
    numberOfEmployees: "",
    annualRevenue: "",
    timeZone: "",
    description: "",
    linkedinCompanyPage: "",
  });
  const [parentId, setParentId] = useState(parentCompanyId || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formEditorOpen, setFormEditorOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Set<keyof FormState>>(
    () => new Set(Object.keys(fieldLabels) as Array<keyof FormState>),
  );
  const [fieldOrder, setFieldOrder] = useState<Array<keyof FormState>>(
    () => Object.keys(fieldLabels) as Array<keyof FormState>,
  );
  const [draggedField, setDraggedField] = useState<keyof FormState | null>(null);
  const [dropTarget, setDropTarget] = useState<keyof FormState | null>(null);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [customFieldOrder, setCustomFieldOrder] = useState<string[]>([]);
  const [customFieldName, setCustomFieldName] = useState("");
  useEffect(() => {
    if (!parentCompanyId)
      setParentId(
        new URLSearchParams(window.location.search).get("parentCompanyId") ||
          "",
      );
  }, [parentCompanyId]);
  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/companies`, {
        method: "POST",
        headers: createHeaders(createIdempotencyKey()),
        body: JSON.stringify({
          ...form,
          customerType: form.type || undefined,
          ownerId: form.ownerId || undefined,
          numberOfEmployees: form.numberOfEmployees
            ? Number(form.numberOfEmployees)
            : undefined,
          annualRevenue: form.annualRevenue
            ? Number(form.annualRevenue)
            : undefined,
          parentCompanyId: parentId || undefined,
          customFields,
        }),
      });
      if (!response.ok) throw new Error("Unable to create company");
      const company = (await response.json()) as { id: string };
      if (modal) onSaved?.();
      else window.location.assign(`/companies/${company.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create company",
      );
    } finally {
      setSaving(false);
    }
  };
  const field = (
    key: keyof FormState,
    label: string,
    type = "text",
    required = false,
  ) => (
    <label className="grid gap-1 text-sm font-semibold text-[#213343]">
      <span>{label}</span>
      <input
        className={input}
        required={required}
        type={type}
        value={form[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    </label>
  );
  const renderField = (key: keyof FormState) =>
    key === "description" ? (
      <label
        className="grid gap-1 text-sm font-semibold text-[#213343] sm:col-span-2 xl:col-span-3"
        key={key}
      >
        <span>{fieldLabels[key]}</span>
        <textarea
          className={`${input} min-h-20 resize-y`}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </label>
    ) : (
      field(
        key,
        fieldLabels[key],
        key === "numberOfEmployees" || key === "annualRevenue"
          ? "number"
          : key === "linkedinCompanyPage"
            ? "url"
            : "text",
        key === "domainName" || key === "name",
      )
    );
  const orderedVisibleFields = fieldOrder.filter((key) =>
    visibleFields.has(key),
  );
  const moveField = (index: number, direction: -1 | 1) =>
    setFieldOrder((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const reorderField = (from: keyof FormState, to: keyof FormState) => {
    if (from === to) return;
    setFieldOrder((current) => {
      const next = [...current];
      const fromIndex = next.indexOf(from);
      const toIndex = next.indexOf(to);
      if (fromIndex < 0 || toIndex < 0) return current;
      next.splice(fromIndex, 1);
      next.splice(next.indexOf(to), 0, from);
      return next;
    });
  };
  const content = (
    <div className="mx-auto max-h-[calc(100vh-32px)] w-full max-w-5xl rounded-2xl border border-[#dbe4ed] bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#213343]">
          {parentId ? "Add sub-company" : "Add company"}
        </h1>
        <div className="flex items-center gap-4">
          <button
            className="rounded-md border border-[#007a8a] px-3 py-2 text-sm font-semibold text-[#007a8a]"
            onClick={() => setFormEditorOpen(true)}
            type="button"
          >
            Edit form fields
          </button>
          <button
            className="text-sm text-[#007a8a]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
      {formEditorOpen ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-[#172235]/45 p-4">
          <div className="max-h-[calc(100vh-32px)] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#213343]">
                  Edit form fields
                </h2>
                <p className="text-sm text-[#718096]">
                  Drag fields to reorder them or remove fields from the form.
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-[#007a8a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005c5f]"
                onClick={() => setAddFieldOpen((open) => !open)}
                type="button"
              >
                + Add field
              </button>
            </div>
            {addFieldOpen ? (
              <div className="mb-4 rounded-xl border border-[#b9d8df] bg-[#f2fbfb] p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#006b70]">
                  Add a custom field
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className={`${input} bg-white`}
                    value={customFieldName}
                    onChange={(event) => setCustomFieldName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const name = customFieldName.trim();
                        if (!name || customFieldOrder.includes(name)) return;
                        setCustomFieldOrder((current) => [...current, name]);
                        setCustomFields((current) => ({ ...current, [name]: "" }));
                        setCustomFieldName("");
                        setAddFieldOpen(false);
                      }
                    }}
                    placeholder="Column name, e.g. Account manager"
                  />
                  <button
                    className="rounded-md bg-[#007a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#005c5f] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!customFieldName.trim() || customFieldOrder.includes(customFieldName.trim())}
                    onClick={() => {
                      const name = customFieldName.trim();
                      if (!name || customFieldOrder.includes(name)) return;
                      setCustomFieldOrder((current) => [...current, name]);
                      setCustomFields((current) => ({ ...current, [name]: "" }));
                      setCustomFieldName("");
                      setAddFieldOpen(false);
                    }}
                    type="button"
                  >
                    Add field
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#718096]">
                  You can also restore a standard field below.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {fieldOrder.filter((key) => !visibleFields.has(key)).map((key) => (
                    <button
                      className="rounded-full border border-[#9fc8ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#006b70] transition hover:border-[#007a8a] hover:bg-[#e6f6f6]"
                      key={key}
                      onClick={() => {
                        setVisibleFields((current) => new Set([...current, key]));
                        setAddFieldOpen(false);
                      }}
                      type="button"
                    >
                      + {fieldLabels[key]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {fieldOrder.map((key, index) => (
                <div
                  className={`rounded-xl border p-3 transition-all ${visibleFields.has(key) ? "border-[#b9d8df] bg-[#f7fcfc]" : "border-dashed border-[#cbd6e2] opacity-60"} ${dropTarget === key ? "-translate-y-1 border-[#007a8a] bg-[#e6f6f6] shadow-lg ring-2 ring-[#007a8a]/20" : "shadow-sm"}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    if (draggedField && draggedField !== key) setDropTarget(key);
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = draggedField ?? (event.dataTransfer.getData("text/plain") as keyof FormState);
                    if (from) reorderField(from, key);
                    setDraggedField(null);
                    setDropTarget(null);
                  }}
                  key={key}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      aria-label={`Drag ${fieldLabels[key]}`}
                      className="cursor-grab rounded p-1 text-[#718096] hover:bg-[#dff1f3] active:cursor-grabbing"
                      draggable
                      onDragStart={(event) => {
                        setDraggedField(key);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", key);
                      }}
                      onDragEnd={() => {
                        setDraggedField(null);
                        setDropTarget(null);
                      }}
                      title="Drag to reorder"
                    >
                      <GripVertical size={18} />
                    </span>
                    <strong className="flex-1 px-2 text-sm">
                      {fieldLabels[key]}
                    </strong>
                    <button
                      className="text-xs text-[#516f90]"
                      onClick={() => moveField(index, -1)}
                      type="button"
                    >
                      ↑
                    </button>
                    <button
                      className="text-xs text-[#516f90]"
                      onClick={() => moveField(index, 1)}
                      type="button"
                    >
                      ↓
                    </button>
                    <button
                      aria-label={`Remove ${fieldLabels[key]}`}
                      className="ml-2 rounded p-1 text-[#b42318] hover:bg-[#fff0ed]"
                      onClick={() =>
                        setVisibleFields((current) => {
                          const next = new Set(current);
                          next.delete(key);
                          return next;
                        })
                      }
                      title="Remove from form"
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      checked={visibleFields.has(key)}
                      onChange={() =>
                        setVisibleFields((current) => {
                          const next = new Set(current);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        })
                      }
                      type="checkbox"
                    />
                    Show field
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button
                className="rounded-md border px-4 py-2 text-sm font-semibold"
                onClick={() => setFormEditorOpen(false)}
                type="button"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <form
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        onSubmit={submit}
      >
        {orderedVisibleFields.map(renderField)}
        {customFieldOrder.map((name) => (
          <label
            className="grid gap-1 text-sm font-semibold text-[#213343]"
            key={`custom-${name}`}
          >
            <span>{name}</span>
            <input
              className={input}
              value={customFields[name] ?? ""}
              onChange={(event) =>
                setCustomFields((current) => ({
                  ...current,
                  [name]: event.target.value,
                }))
              }
            />
          </label>
        ))}
        {error ? (
          <p className="text-sm text-[#b42318] xl:col-span-3">{error}</p>
        ) : null}
        <button
          className="rounded-md bg-[#006b70] px-4 py-2 font-semibold text-white disabled:opacity-50 xl:col-span-3"
          disabled={saving}
          type="submit"
        >
          {saving
            ? "Saving..."
            : parentId
              ? "Create sub-company"
              : "Create company"}
        </button>
      </form>
    </div>
  );
  return modal ? (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#172235]/45 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className="flex max-h-full w-full items-center justify-center" onMouseDown={(event) => event.stopPropagation()}>
        {content}
      </div>
    </div>
  ) : (
    <AppShell>{content}</AppShell>
  );
}
