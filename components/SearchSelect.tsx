"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

interface Option {
  id: number;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  options: Option[];
  value?: number | "";
  onChange?: (id: number | "") => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  allowFreeText?: boolean;
  freeTextValue?: string;
  onFreeTextChange?: (text: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchSelect = forwardRef<HTMLInputElement, SearchSelectProps>(function SearchSelect(
  {
    options,
    value,
    onChange,
    placeholder,
    allowEmpty,
    emptyLabel,
    className = "",
    allowFreeText,
    freeTextValue,
    onFreeTextChange,
    onKeyDown,
  },
  ref
) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (selected) {
      setQuery(selected.label);
    } else if (allowFreeText) {
      setQuery(freeTextValue || "");
    } else {
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.label]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (selected) setQuery(selected.label);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  // Liste unique navigable au clavier : l'option "-- Aucun --" (si présente) suivie des résultats filtrés.
  const navigable: Array<{ id: number | ""; label: string }> = [
    ...(allowEmpty ? [{ id: "" as const, label: emptyLabel || "-- Aucun --" }] : []),
    ...filtered.map((o) => ({ id: o.id, label: o.label })),
  ];

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, open]);

  function selectNavigableItem(index: number) {
    const item = navigable[index];
    if (!item) return;
    if (item.id === "") {
      onChange?.("");
      setQuery("");
    } else {
      if (onChange) {
        onChange(item.id);
        if (allowFreeText) onFreeTextChange?.("");
      } else if (allowFreeText) {
        onFreeTextChange?.(item.label);
      }
      setQuery(item.label);
    }
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((i) => Math.min(i + 1, navigable.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        if (selected) setQuery(selected.label);
      }
      return;
    }
    if (e.key === "Enter") {
      if (open && navigable[highlightedIndex]) {
        e.preventDefault();
        selectNavigableItem(highlightedIndex);
        return;
      }
      onKeyDown?.(e);
      return;
    }
    onKeyDown?.(e);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={ref}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (onChange && value !== "") onChange("");
          if (allowFreeText) onFreeTextChange?.(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {allowEmpty && (
            <button
              type="button"
              onMouseDown={() => selectNavigableItem(0)}
              className={`block w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 ${
                highlightedIndex === 0 ? "bg-blue-50" : ""
              }`}
            >
              {emptyLabel || "-- Aucun --"}
            </button>
          )}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">Aucun résultat</p>}
          {filtered.map((o, i) => {
            const navIndex = allowEmpty ? i + 1 : i;
            return (
              <button
                key={o.id}
                type="button"
                onMouseDown={() => selectNavigableItem(navIndex)}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                  highlightedIndex === navIndex ? "bg-blue-50" : ""
                }`}
              >
                {o.label}
                {o.sublabel && <span className="block text-xs text-gray-400">{o.sublabel}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default SearchSelect;
