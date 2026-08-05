import { useState } from "react";
import { Product } from "@/features/products/products.types";
import { LineItem, computeTotal, defaultLine, isLineValid } from "./factures.lineLogic";

interface UseInvoiceLinesOptions {
  products: Product[];
  onLinesChange?: (lines: LineItem[]) => void;
}

export function useInvoiceLines(initialLines: LineItem[], opts: UseInvoiceLinesOptions) {
  const { products, onLinesChange } = opts;
  const [lines, setLines] = useState<LineItem[]>(initialLines);
  const [entry, setEntry] = useState<LineItem>(defaultLine());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(patch: Partial<LineItem>) {
    setEntry((prev) => ({ ...prev, ...patch }));
  }

  function confirmEntry(): boolean {
    if (!isLineValid(entry)) return false;
    const next =
      editingIndex === null
        ? [...lines, entry]
        : lines.map((l, i) => (i === editingIndex ? entry : l));
    setLines(next);
    setEntry(defaultLine());
    setEditingIndex(null);
    onLinesChange?.(next);
    return true;
  }

  function startEdit(index: number) {
    setEntry(lines[index]);
    setEditingIndex(index);
  }

  function cancelEdit() {
    setEntry(defaultLine());
    setEditingIndex(null);
  }

  function removeLine(index: number) {
    const next = lines.filter((_, i) => i !== index);
    setLines(next);
    // Une suppression annule toute édition en cours pour éviter un editingIndex désynchronisé.
    setEntry(defaultLine());
    setEditingIndex(null);
    onLinesChange?.(next);
  }

  function resetAll(newLines: LineItem[] = []) {
    setLines(newLines);
    setEntry(defaultLine());
    setEditingIndex(null);
  }

  const total = computeTotal(products, lines);

  return {
    lines,
    entry,
    editingIndex,
    updateEntry,
    confirmEntry,
    startEdit,
    cancelEdit,
    removeLine,
    resetAll,
    total,
  };
}

export type UseInvoiceLinesResult = ReturnType<typeof useInvoiceLines>;
