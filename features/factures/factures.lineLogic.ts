import { Product, ProductForm } from "@/features/products/products.types";
import { Invoice } from "./factures.types";

export type SaleUnit = "unite" | "carton";

export interface LineItem {
  product_id: number;
  quantity: number | "";
  saleUnit: SaleUnit;
  unitPriceOverride: string;
  form: ProductForm;
}

export const defaultLine = (): LineItem => ({
  product_id: 0,
  quantity: 1,
  saleUnit: "unite",
  unitPriceOverride: "",
  form: "principale",
});

export function productOf(products: Product[], id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

function numericQuantity(quantity: number | ""): number {
  return quantity === "" ? 0 : quantity;
}

export function baseQuantity(products: Product[], line: LineItem): number {
  const product = productOf(products, line.product_id);
  const packSize = product?.pack_size || 1;
  const qty = numericQuantity(line.quantity);
  return line.saleUnit === "carton" ? qty * packSize : qty;
}

export function effectiveUnitPrice(products: Product[], line: LineItem): number {
  const product = productOf(products, line.product_id);
  if (line.unitPriceOverride !== "" && !Number.isNaN(parseFloat(line.unitPriceOverride))) {
    return parseFloat(line.unitPriceOverride);
  }
  if (product?.is_transformable && line.form === "secondaire") {
    return product.unit_price_secondaire || 0;
  }
  return product?.unit_price || 0;
}

export function availableStock(products: Product[], line: LineItem): number | undefined {
  const product = productOf(products, line.product_id);
  if (!product) return undefined;
  if (product.is_transformable && line.form === "secondaire") return product.quantity_secondaire;
  return product.quantity;
}

export function lineTotal(products: Product[], line: LineItem): number {
  return effectiveUnitPrice(products, line) * baseQuantity(products, line);
}

export function computeTotal(products: Product[], lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(products, l), 0);
}

export function isLineValid(line: LineItem): boolean {
  return !!line.product_id && line.quantity !== "" && line.quantity > 0;
}

export function toApiLine(products: Product[], line: LineItem) {
  const override = line.unitPriceOverride !== "" ? parseFloat(line.unitPriceOverride) : NaN;
  const product = productOf(products, line.product_id);
  return {
    product_id: line.product_id,
    quantity: baseQuantity(products, line),
    unit_price: Number.isNaN(override) ? null : override,
    form: product?.is_transformable ? line.form : null,
  };
}

export function linesFromInvoice(invoice: Invoice): LineItem[] {
  return invoice.lines.map((l) => ({
    product_id: l.product_id,
    quantity: l.quantity,
    saleUnit: "unite" as const,
    unitPriceOverride: String(l.unit_price),
    form: (l.form as ProductForm) || "principale",
  }));
}
