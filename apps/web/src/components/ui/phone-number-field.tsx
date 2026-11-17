"use client";

import { useMemo, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/max";

const countries = getCountries().map((short) => ({
  short: short === "GB" ? "UK" : short,
  name: new Intl.DisplayNames(["en"], { type: "region" }).of(short) ?? short,
  code: `+${getCountryCallingCode(short)}`,
})).sort((left, right) => left.name.localeCompare(right.name));

type Props = { country: string; code: string; number: string; onChange: (value: { country: string; code: string; number: string; formatted: string }) => void };

export function PhoneNumberField({ country, code, number, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [countryListOpen, setCountryListOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => countries.filter((item) => `${item.name} ${item.short} ${item.code}`.toLowerCase().includes(search.trim().toLowerCase())), [search]);
  const update = (next: Partial<{ country: string; code: string; number: string }>) => {
    const value = { country, code, number, ...next };
    onChange({ ...value, formatted: value.number ? `${value.code} ${value.number}` : "" });
  };
  return <>
    <button className="h-12 w-full rounded-md border border-[#213343] bg-white px-4 text-left text-[#516f90]" onClick={() => setOpen(true)} type="button">{number ? `${code} ${number}` : "Phone number"}</button>
    {open ? <div className="fixed inset-0 z-[120] grid place-items-center bg-[#111827]/35 p-4" onClick={() => setOpen(false)}><div className="w-full max-w-[574px] rounded-2xl bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Edit Phone Number"><div className="mb-6 flex items-center justify-between"><h3 className="text-xl font-bold">Edit Phone Number</h3><button className="text-xl" onClick={() => setOpen(false)} type="button" aria-label="Close">×</button></div><div className="rounded-2xl border p-4"><div className="flex h-12 overflow-hidden rounded-lg border"><button className="w-20 border-r px-3 text-left" onClick={() => setCountryListOpen((value) => !value)} type="button">{country}</button><input className="w-20 border-r px-3 outline-none" value={code} onChange={(event) => update({ code: event.target.value })} placeholder="+91" aria-label="Phone country code" /><input className="min-w-0 flex-1 px-3 outline-none" value={number} onChange={(event) => update({ number: event.target.value })} placeholder="Phone number" aria-label="Phone number" /></div><button className="mt-3 text-left text-sm font-semibold text-[#006b70]" onClick={() => setSearch("")} type="button">Select a country code and enter a phone number.</button></div>{countryListOpen ? <><input className="mt-3 h-10 w-full rounded-md border border-[#cbd6e2] px-3 text-sm outline-none" placeholder="Search country" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="mt-2 max-h-64 overflow-y-auto rounded-lg border p-1">{filtered.map((item) => <button className="flex w-full justify-between rounded px-3 py-2 text-left text-sm hover:bg-[#f2f7fa]" key={item.short} onClick={() => { update({ country: item.short, code: item.code }); setCountryListOpen(false); setSearch(""); }} type="button"><span>{item.name} <span className="text-xs text-[#718096]">({item.short})</span></span><span className="text-[#516f90]">{item.code}</span></button>)}</div></> : null}<div className="mt-6 flex gap-3"><button className="rounded-full bg-[#006b70] px-5 py-2 text-white" onClick={() => setOpen(false)} type="button">Save</button><button className="rounded-full border px-5 py-2" onClick={() => setOpen(false)} type="button">Cancel</button></div></div></div> : null}
  </>;
}
