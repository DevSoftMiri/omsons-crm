"use client";

import {
  Bell,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Home,
  Menu,
  Phone,
  Plus,
  Search,
  Settings,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigationItems = [
  ["Contacts", Phone, "/contacts"],
  ["Companies", Store, "/companies"],
  ["Deals", CheckSquare, "/deals"],
  ["Products", Store, "/products"],
  ["Meetings", CalendarDays, "/meetings"],
  ["Segments", CalendarDays, "/segments"],
  ["Events", CalendarDays, "#"],
  ["Ads", Bell, "#"],
  ["Buyer Intent", Store, "#"],
  ["Brand", Settings, "#"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSetupPrompt] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const closeCreateMenu = (event: MouseEvent) => {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target as Node)
      ) {
        setCreateOpen(false);
      }
    };
    document.addEventListener("mousedown", closeCreateMenu);
    return () => document.removeEventListener("mousedown", closeCreateMenu);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#213343]">
      {mobileNavOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/45 xl:hidden"
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[#232528] text-white shadow-2xl transition-all duration-200 xl:translate-x-0 xl:shadow-none ${sidebarCollapsed ? "w-[240px] xl:w-[68px]" : "w-[240px] xl:w-[190px]"} ${mobileNavOpen ? "translate-x-0" : "-translate-x-full xl:flex"}`}
        style={{
          background:
            "linear-gradient(to bottom, #232528 0%, #232528 72%, #303438 100%)",
        }}
      >
        <div
          className={`flex h-[58px] items-center gap-2 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}
        >
          <img
            className="h-8 w-8 object-contain"
            src="/Omsons Logo.png"
            alt="Omsons logo"
          />
          {!sidebarCollapsed ? (
            <span className="text-sm font-semibold tracking-wide">CRM</span>
          ) : null}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 [scrollbar-color:#5b5f64_transparent] [scrollbar-width:thin]">
          <Link
            className={`mb-4 flex items-center rounded-md py-2.5 text-sm ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} ${pathname === "/" ? "bg-[#666666] text-white" : "text-white/85 hover:bg-white/10"}`}
            href="/"
            onClick={() => setMobileNavOpen(false)}
          >
            <Home className="h-4 w-4" />
            {!sidebarCollapsed ? "Home" : null}
          </Link>

          <div className="border-t border-white/25 py-3">
            <div className="space-y-1">
              {navigationItems.map(([label, Icon, href]) => {
                const active =
                  href === "/deals"
                    ? pathname.startsWith("/deals")
                    : href === "/companies"
                      ? pathname.startsWith("/companies")
                      : href === "/products"
                        ? pathname.startsWith("/products")
                        : href === "/meetings"
                          ? pathname.startsWith("/meetings")
                        : href === "/segments"
                          ? pathname.startsWith("/segments")
                          : false;
                return (
                  <Link
                    className={`flex items-center rounded-md py-2.5 text-sm transition ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} ${
                      active
                        ? "bg-[#666666] text-white"
                        : "text-white/85 hover:bg-white/10"
                    }`}
                    href={href}
                    key={label}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {!sidebarCollapsed ? label : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {showSetupPrompt ? (
          <div className="mx-2 mb-3 shrink-0 rounded-md border border-white/10 bg-[#2d3034] p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <span className="text-[#ff5c35]">▥</span>
              Get more from CRM
            </div>
            <p className="text-xs leading-4 text-white/60">
              Complete your setup to reach your goals faster.
            </p>
            <button className="mt-3 w-full rounded-md bg-[#ff5c35] px-3 py-2 text-xs font-semibold text-white">
              Continue Setup
            </button>
          </div>
        ) : null}
      </aside>

      <div className={sidebarCollapsed ? "xl:pl-[68px]" : "xl:pl-[190px]"}>
        <header className="sticky top-0 z-50 flex h-[52px] items-center justify-between border-b border-black/10 bg-[#2f2f2f] px-3 text-white shadow-sm lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-md p-2 hover:bg-white/10"
              aria-label="Toggle navigation"
              onClick={() => {
                if (window.matchMedia("(min-width: 1280px)").matches)
                  setSidebarCollapsed((collapsed) => !collapsed);
                else setMobileNavOpen(true);
              }}
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <label className="flex h-10 w-[min(520px,42vw)] items-center gap-3 rounded-full border border-white/40 bg-transparent px-5 text-sm text-white/80">
              <input
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/80"
                placeholder="Find in Omsons CRM"
              />
              <Search className="h-5 w-5 shrink-0 text-white" />
            </label>
            <button className="hidden items-center gap-2 px-3 text-base font-semibold text-white lg:flex">
              <span className="text-[#ff5c35]">✦</span>
              Om Assistant
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="hidden">
              <span className="grid h-4 w-4 place-items-center rounded-full border border-white text-[10px]">
                ↑
              </span>
            </button>
            <div className="relative" ref={createMenuRef}>
              <button
                className="flex h-9 items-center gap-2 rounded-md bg-white/10 px-3 text-base font-medium text-white hover:bg-white/15"
                onClick={() => setCreateOpen((open) => !open)}
                aria-label="Create"
                type="button"
              >
                <Plus className="h-6 w-6 rounded-full bg-[#ff5c35] p-1 text-white" />
                New
              </button>
              {createOpen ? (
                <div className="absolute left-0 top-11 z-50 w-52 rounded-lg bg-[#2f2f2f] py-4 text-white shadow-2xl">
                  {["Contact", "Company", "Deal", "Ticket", "Task"].map(
                    (item) => (
                      <button
                        className="block w-full px-8 py-3 text-left text-lg hover:bg-white/10"
                        key={item}
                        type="button"
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              ) : null}
            </div>
            {[Phone, Store, CheckSquare, Settings, Bell].map((Icon, index) => (
              <button
                className="relative hidden rounded-md p-1.5 text-white/90 hover:bg-white/10 sm:block"
                key={index}
                aria-label="Toolbar action"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <span className="hidden h-8 w-px bg-white/35 sm:block" />
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-white/10">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#dbe4ed] text-xs font-semibold text-[#516f90]">
                H
              </span>
              <span className="hidden text-base font-bold sm:inline">
                Hardik
              </span>
              <ChevronDown className="h-4 w-4 text-white" />
            </button>
          </div>
        </header>
        <main className="p-2 lg:p-3">{children}</main>
      </div>
    </div>
  );
}
