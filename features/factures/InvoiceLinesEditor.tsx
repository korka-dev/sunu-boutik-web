"use client";

import { useRef, useState } from "react";
import SearchSelect from "@/components/SearchSelect";
import { Product, ProductForm } from "@/features/products/products.types";
import { availableStock, effectiveUnitPrice, lineTotal, productOf } from "./factures.lineLogic";
import { UseInvoiceLinesResult } from "./useInvoiceLines";

export default function InvoiceLinesEditor({
  products,
  state,
}: {
  products: Product[];
  state: UseInvoiceLinesResult;
}) {
  const { lines, entry, editingIndex, updateEntry, confirmEntry, startEdit, cancelEdit, removeLine, total } = state;
  const [lineError, setLineError] = useState("");
  const productInputRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);

  const product = productOf(products, entry.product_id);
  const hasPack = (product?.pack_size || 1) > 1;
  const stock = availableStock(products, entry);
  const overStock = !!product && (stock ?? 0) < (entry.quantity || 0);

  function handleSelectProduct(id: number | "") {
    const p = products.find((pr) => pr.id === id);
    updateEntry({
      product_id: id || 0,
      saleUnit: "unite",
      form: "principale",
      unitPriceOverride: p ? String(p.unit_price) : "",
    });
    setLineError("");
    if (id) {
      requestAnimationFrame(() => {
        quantityRef.current?.focus();
        quantityRef.current?.select();
      });
    }
  }

  function handleCommit() {
    const ok = confirmEntry();
    if (ok) {
      setLineError("");
      productInputRef.current?.focus();
    } else {
      setLineError(!entry.product_id ? "Sélectionnez un article" : "Quantité invalide");
    }
  }

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit();
    }
  }

  return (
    <div>
      {editingIndex !== null && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 mb-3">
          <span>Modification de la ligne #{editingIndex + 1}</span>
          <button
            type="button"
            onClick={() => {
              cancelEdit();
              setLineError("");
              productInputRef.current?.focus();
            }}
            className="ml-4 underline text-blue-700 hover:text-blue-900"
          >
            Annuler
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-2 items-center pb-3">
        <div className="col-span-12 sm:col-span-4">
          <SearchSelect
            ref={productInputRef}
            options={products.map((p) => ({
              id: p.id,
              label: p.name,
              sublabel: p.is_transformable
                ? `${p.quantity} ${p.unit} / ${p.quantity_secondaire} ${p.unit_secondaire} dispo.`
                : `${p.quantity} dispo.${p.pack_size > 1 ? ` — carton ${p.pack_size}` : ""}`,
            }))}
            value={entry.product_id || ""}
            onChange={handleSelectProduct}
            onKeyDown={handleEnter}
            placeholder="Article..."
          />
        </div>

        {hasPack ? (
          <select
            value={entry.saleUnit}
            onChange={(e) => updateEntry({ saleUnit: e.target.value as "unite" | "carton" })}
            className="col-span-6 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="unite">Unité</option>
            <option value="carton">Carton</option>
          </select>
        ) : product?.is_transformable ? (
          <select
            value={entry.form}
            onChange={(e) => {
              const f = e.target.value as ProductForm;
              const price = f === "secondaire" ? product.unit_price_secondaire : product.unit_price;
              updateEntry({ form: f, unitPriceOverride: price != null ? String(price) : "" });
            }}
            className="col-span-6 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="principale">{product.unit}</option>
            <option value="secondaire">{product.unit_secondaire}</option>
          </select>
        ) : (
          <div className="hidden sm:block sm:col-span-2" />
        )}

        <input
          ref={quantityRef}
          type="number"
          step="0.01"
          min="0.01"
          value={entry.quantity}
          onChange={(e) => updateEntry({ quantity: e.target.value === "" ? "" : Number(e.target.value) })}
          onKeyDown={handleEnter}
          className={`col-span-3 sm:col-span-2 rounded-md border px-2 py-2 text-sm ${
            overStock ? "border-red-400 text-red-600" : "border-gray-300"
          }`}
          placeholder="Qté"
        />
        <input
          type="number"
          step="1"
          min="0"
          value={entry.unitPriceOverride}
          onChange={(e) => updateEntry({ unitPriceOverride: e.target.value })}
          onKeyDown={handleEnter}
          className="col-span-3 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
          placeholder="Prix U"
        />
        <button
          type="button"
          onClick={handleCommit}
          className="col-span-12 sm:col-span-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700"
        >
          {editingIndex !== null ? "Mettre à jour" : "+ Ajouter"}
        </button>
      </div>
      {lineError && <p className="text-sm text-red-600 -mt-1 mb-3">{lineError}</p>}

      {lines.length > 0 && (
        <div className="space-y-1 border-t pt-3">
          {lines.map((line, i) => {
            const p = productOf(products, line.product_id);
            const unitLabel =
              (p?.pack_size || 1) > 1 && line.saleUnit === "carton"
                ? "Carton"
                : p?.is_transformable
                ? line.form === "secondaire"
                  ? p.unit_secondaire
                  : p.unit
                : p?.unit || "";
            const isBeingEdited = editingIndex === i;
            return (
              <div
                key={i}
                onClick={() => {
                  if (isBeingEdited) return;
                  startEdit(i);
                  setLineError("");
                  productInputRef.current?.focus();
                }}
                className={`grid grid-cols-12 gap-2 items-center border-b py-2 text-sm rounded-md ${
                  isBeingEdited ? "bg-blue-50" : "cursor-pointer hover:bg-gray-50"
                }`}
                title={isBeingEdited ? undefined : "Cliquer pour modifier"}
              >
                <div className="col-span-4 truncate">{p?.name || "—"}</div>
                <div className="col-span-2 text-gray-500">{unitLabel}</div>
                <div className="col-span-2 text-right tabular-nums">{line.quantity}</div>
                <div className="col-span-1 text-right tabular-nums">
                  {effectiveUnitPrice(products, line).toLocaleString()}
                </div>
                <div className="col-span-2 text-right font-medium tabular-nums">
                  {lineTotal(products, line).toLocaleString()}
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLine(i);
                    }}
                    className="text-red-500 hover:text-red-700 font-bold"
                    title="Supprimer"
                  >
                    × suppr
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end border-t pt-3 mt-3">
        <p className="font-semibold text-lg tabular-nums">Total : {total.toLocaleString()} FCFA</p>
      </div>
    </div>
  );
}
