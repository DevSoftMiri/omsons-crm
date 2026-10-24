"use client";

import { Columns3, Grid2X2 } from "lucide-react";
import { useRef, useState } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CrmPageFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto max-w-[1500px] overflow-x-hidden rounded-xl border border-[#e4e8ed] bg-white p-3 shadow-[0_8px_30px_rgba(33,51,67,0.08)]", className)}>{children}</main>;
}

export function CrmCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-[#dbe4ed] bg-white shadow-sm", className)}>{children}</section>;
}

export function IconButton({ children, active = false, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return <button className={cn("grid h-10 w-10 place-items-center rounded-md border border-[#cbd6e2] transition hover:bg-[#f7f9fb]", active && "border-[#ffb397] bg-[#fff7f3] text-[#ff5c35]", className)} type="button" {...props}>{children}</button>;
}

export function ViewToggle({ value, onChange }: { value: "board" | "table"; onChange: (value: "board" | "table") => void }) {
  return <div className="flex items-center gap-2"><IconButton active={value === "board"} onClick={() => onChange("board")} aria-label="Board view"><Grid2X2 className="h-4 w-4" /></IconButton><IconButton active={value === "table"} onClick={() => onChange("table")} aria-label="Table view"><Columns3 className="h-4 w-4" /></IconButton></div>;
}

export function CollectionPageHeader({ savedViews, activeView, onViewChange, toolbar, filters, actions }: { savedViews: Array<{ label: string; count?: number; icon?: React.ReactNode }>; activeView: string; onViewChange: (value: string) => void; toolbar: React.ReactNode; filters: React.ReactNode; actions?: React.ReactNode }) {
  return <header className="mb-3"><div className="flex items-center gap-6 overflow-x-auto border-b border-[#dbe4ed] px-2 text-sm text-[#516f90]">{savedViews.map((view) => <button key={view.label} type="button" onClick={() => onViewChange(view.label)} className={cn("flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 font-semibold", activeView === view.label ? "border-[#ff5c35] text-[#ff5c35]" : "border-transparent hover:text-[#213343]")}>{view.icon}{view.label}{view.count !== undefined ? <span className="rounded-full bg-[#fff0e9] px-1.5 text-[#ff5c35]">{view.count}</span> : null}</button>)}</div><div className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>{actions}</div><div className="flex flex-wrap items-center gap-5 border-b border-[#dbe4ed] pb-3 text-sm font-semibold text-[#213343]">{filters}</div></header>;
}

export type BoardColumn<T> = { id: string; label: string; color: string; items: T[] };

export function BoardView<T extends { id: string }>({ columns, renderCard, onMove, emptyLabel = "Drop here" }: { columns: BoardColumn<T>[]; renderCard: (item: T, dragging: boolean) => React.ReactNode; onMove: (itemId: string, targetColumnId: string) => void; emptyLabel?: string }) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  return <div className="flex gap-3 overflow-x-auto pb-3">{columns.map((column) => <section key={column.id} onDragEnter={() => setTarget(column.id)} onDragOver={(event) => { event.preventDefault(); setTarget(column.id); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setTarget(null); }} onDrop={(event) => { event.preventDefault(); const itemId = event.dataTransfer.getData("crm-board-item"); if (itemId) onMove(itemId, column.id); setDragged(null); setTarget(null); }} className={cn("min-h-[380px] min-w-[285px] flex-1 rounded-2xl border-2 p-3 transition-all", target === column.id ? "border-[#ff5c35] bg-[#fff4ef] shadow-[0_0_0_3px_rgba(255,92,53,0.16)]" : "border-transparent bg-[#f1f1f1]")}><div className="mb-3 flex items-center gap-2"><span className={cn("rounded-md px-2 py-1 text-sm font-bold text-white", column.color)}>{column.label}</span><span className="text-sm font-semibold text-[#516f90]">{column.items.length}</span>{target === column.id && dragged ? <span className="ml-auto text-xs font-semibold text-[#ff5c35]">{emptyLabel}</span> : null}</div><div className="min-h-[320px] space-y-3">{column.items.map((item) => <div key={item.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("crm-board-item", item.id); setDragged(item.id); }} onDragEnd={() => { setDragged(null); setTarget(null); }} className={cn("cursor-grab select-none active:cursor-grabbing", dragged === item.id && "scale-[1.02] opacity-40")}>{renderCard(item, dragged === item.id)}</div>)}</div></section>)}</div>;
}

export function SortableBoardView<T extends { id: string }>({ columns, renderCard, onMove, onAdd, onReorderColumns }: { columns: BoardColumn<T>[]; renderCard: (item: T, dragging: boolean) => React.ReactNode; onMove: (itemId: string, targetColumnId: string, beforeItemId?: string) => void; onAdd?: (columnId: string) => void; onReorderColumns?: (fromColumnId: string, toColumnId: string) => void }) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [target, setTarget] = useState<{ columnId: string; beforeId?: string } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const clearDrag = () => { setDragged(null); setTarget(null); };
  const drop = (event: React.DragEvent<HTMLElement>, columnId: string, beforeItemId?: string) => { event.preventDefault(); event.stopPropagation(); const itemId = event.dataTransfer.getData("crm-board-item"); if (itemId) onMove(itemId, columnId, beforeItemId); clearDrag(); };
  return <div ref={boardRef} onDragOver={(event) => { const board = boardRef.current; if (!board) return; const bounds = board.getBoundingClientRect(); if (event.clientX < bounds.left + 96) board.scrollLeft -= 18; if (event.clientX > bounds.right - 96) board.scrollLeft += 18; }} className="flex gap-3 overflow-x-auto pb-3">{columns.map((column) => {
    const activeColumn = target?.columnId === column.id;
    return <section key={column.id} onDragEnter={() => setTarget({ columnId: column.id })} onDragOver={(event) => { event.preventDefault(); setTarget({ columnId: column.id }); }} onDrop={(event) => { const fromColumn = event.dataTransfer.getData("crm-board-column"); if (fromColumn && onReorderColumns) { event.preventDefault(); event.stopPropagation(); onReorderColumns(fromColumn, column.id); setDraggedColumn(null); return; } void drop(event, column.id); }} className={cn("group relative min-h-[380px] min-w-[285px] flex-1 rounded-2xl border-2 p-3 transition-all", activeColumn ? "border-[#1683ff] bg-[#eef8ff] shadow-[0_0_0_3px_rgba(22,131,255,0.14)]" : "border-transparent bg-[#f4f4f4]")}>
      <div className="mb-2 flex items-center gap-2"><button className={cn("cursor-grab rounded-md px-2 py-1 text-sm font-bold text-white", column.color)} draggable={Boolean(onReorderColumns)} onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("crm-board-column", column.id); setDraggedColumn(column.id); }} onDragEnd={() => setDraggedColumn(null)} type="button">☷ {column.label}</button><span className="text-sm font-semibold text-[#516f90]">{column.items.length}</span>{draggedColumn === column.id ? <span className="text-xs text-[#1683ff]">Move</span> : null}{activeColumn && dragged ? <span className="ml-auto text-xs font-semibold text-[#1683ff]">Drop here</span> : null}</div>
      {onAdd ? <button className="absolute left-3 right-3 top-[49px] z-10 rounded-md border border-dashed border-[#9fb3c8] bg-white py-2 text-left text-xs font-semibold text-[#006b70] opacity-0 transition duration-150 group-hover:opacity-100 focus:opacity-100 hover:bg-white" onClick={() => onAdd(column.id)} type="button">+ Contact</button> : null}
      <div className="min-h-[320px] space-y-3 transition-all duration-150 group-hover:pt-10">{column.items.map((item) => <div key={item.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("crm-board-item", item.id); setDragged(item.id); }} onDragEnd={clearDrag} onDragEnter={(event) => { event.stopPropagation(); if (dragged !== item.id) setTarget({ columnId: column.id, beforeId: item.id }); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, column.id, item.id)} className={cn("relative cursor-grab select-none transition active:cursor-grabbing", dragged === item.id && "scale-[1.02] opacity-40", target?.columnId === column.id && target.beforeId === item.id && dragged !== item.id && "before:absolute before:-top-1 before:left-0 before:right-0 before:h-1 before:rounded-full before:bg-[#1683ff]")}>{renderCard(item, dragged === item.id)}</div>)}</div>
    </section>;
  })}</div>;
}

export function RecordDetailHeader({ compact, children }: { compact: boolean; children: React.ReactNode }) {
  return <section className={cn("sticky top-[52px] z-40 rounded-xl border border-[#d0d7de] bg-white shadow-sm transition-all duration-200", compact && "shadow-md")}>{children}</section>;
}
