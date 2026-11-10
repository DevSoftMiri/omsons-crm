"use client";

if (typeof document !== "undefined") {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, input, select, textarea, a")) return;
      const card = target.closest<HTMLElement>("article");
      if (!card) return;
      const editButton = Array.from(card.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.trim().startsWith("Edit"));
      editButton?.click();
    };
    document.addEventListener("click", handleClick);
}
