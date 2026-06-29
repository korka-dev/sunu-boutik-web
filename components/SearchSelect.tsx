"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  id: number;
  label: string;
  sublabel?: string;
}

export default function SearchSelect({
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
}: {
  options: Option[];
  value: number | "";
  onChange: (id: number | "") => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  allowFreeText?: boolean;
  freeTextValue?: string;
  onFreeTextChange?: (text: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value !== "") onChange("");
          if (allowFreeText) onFreeTextChange?.(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {allowEmpty && (
            <button
              type="button"
              onMouseDown={() => {
                onChange("");
                setQuery("");
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              {emptyLabel || "-- Aucun --"}
            </button>
          )}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">Aucun résultat</p>}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={() => {
                onChange(o.id);
                setQuery(o.label);
                setOpen(false);
                if (allowFreeText) onFreeTextChange?.("");
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
            >
              {o.label}
              {o.sublabel && <span className="block text-xs text-gray-400">{o.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
