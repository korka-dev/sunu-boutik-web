"use client";

import { useEffect, useState } from "react";
import { IconSearch } from "@/components/Icons";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
  maxWidthClassName = "max-w-md",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWidthClassName?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 bg-gray-50/95 backdrop-blur-sm">
      <div className={`mx-auto relative ${maxWidthClassName}`}>
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
