"use client";

import { db, LocalInvoice, LocalInvoiceLine, LocalProduct, LocalClient, LocalCategory } from "./db";
import { enqueue } from "./sync";
// Type simplifié pour la création de facture hors ligne
interface InvoiceCreate {
  client_id?: number | null;
  client_name?: string | null;
  note?: string | null;
  lines: { product_id: number; quantity: number; unit_price?: number | null }[];
}

// ── Numéro de facture temporaire ────────────────────────────────────────────

function tempInvoiceNumber(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `TEMP-${stamp}`;
}

// ── FACTURES ────────────────────────────────────────────────────────────────

export async function createInvoiceOffline(
  payload: InvoiceCreate,
  shopId: number,
  products: LocalProduct[]
): Promise<LocalInvoice> {
  const lines: LocalInvoiceLine[] = payload.lines.map((l) => {
    const prod = products.find((p) => p.serverId === l.product_id || p.localId === l.product_id);
    const unit_price = l.unit_price ?? prod?.unit_price ?? 0;
    return {
      product_id: l.product_id,
      product_name: prod?.name ?? `Article #${l.product_id}`,
      quantity: l.quantity,
      unit_price,
      line_total: unit_price * l.quantity,
    };
  });

  const total = lines.reduce((s, l) => s + l.line_total, 0);

  const invoice: LocalInvoice = {
    shop_id: shopId,
    number: tempInvoiceNumber(),
    client_id: payload.client_id ?? null,
    client_name: payload.client_name ?? null,
    note: payload.note ?? null,
    lines,
    total,
    created_at: new Date().toISOString(),
    _synced: false,
    _tempNumber: true,
  };

  const localId = await db.invoices.add(invoice);

  // Déduire le stock localement
  for (const l of payload.lines) {
    const prod = await db.products.where("serverId").equals(l.product_id).first()
      ?? await db.products.get(l.product_id);
    if (prod?.localId) {
      await db.products.update(prod.localId, { quantity: (prod.quantity ?? 0) - l.quantity });
    }
  }

  await enqueue("invoice", "CREATE", localId as number, { ...invoice, localId });
  return { ...invoice, localId: localId as number };
}

export async function getInvoicesOffline(shopId: number, search?: string, dateStr?: string) {
  let invoices = await db.invoices.where("shop_id").equals(shopId).reverse().sortBy("created_at");

  if (search) {
    const q = search.toLowerCase();
    invoices = invoices.filter(
      (i) =>
        i.number.toLowerCase().includes(q) ||
        (i.client_name ?? "").toLowerCase().includes(q)
    );
  }

  if (dateStr) {
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setDate(end.getDate() + 1);
    invoices = invoices.filter((i) => {
      const d = new Date(i.created_at);
      return d >= start && d < end;
    });
  }

  return invoices;
}

export async function getInvoiceOffline(localId: number) {
  return db.invoices.get(localId);
}

export async function getInvoiceByServerId(serverId: number) {
  return db.invoices.where("serverId").equals(serverId).first();
}

// ── PRODUITS ────────────────────────────────────────────────────────────────

export async function getProductsOffline(shopId: number, search?: string) {
  let products = await db.products.where("shop_id").equals(shopId).toArray();
  products = products.filter((p) => !p._deleted);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }
  return products;
}

export async function createProductOffline(payload: Omit<LocalProduct, "localId" | "_synced">, shopId: number) {
  const product: LocalProduct = { ...payload, shop_id: shopId, _synced: false };
  const localId = await db.products.add(product);
  await enqueue("product", "CREATE", localId as number, { ...product, localId });
  return { ...product, localId: localId as number };
}

export async function updateProductOffline(localId: number, changes: Partial<LocalProduct>) {
  await db.products.update(localId, { ...changes, _synced: false });
  const updated = await db.products.get(localId);
  if (updated) await enqueue("product", "UPDATE", localId, updated, updated.serverId);
}

export async function deleteProductOffline(localId: number) {
  const prod = await db.products.get(localId);
  if (!prod) return;
  if (prod.serverId) {
    await db.products.update(localId, { _deleted: true, _synced: false });
    await enqueue("product", "DELETE", localId, prod, prod.serverId);
  } else {
    await db.products.delete(localId);
  }
}

// ── CLIENTS ──────────────────────────────────────────────────────────────────

export async function getClientsOffline(shopId: number, search?: string) {
  let clients = await db.clients.where("shop_id").equals(shopId).toArray();
  clients = clients.filter((c) => !c._deleted);
  if (search) {
    const q = search.toLowerCase();
    clients = clients.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q));
  }
  return clients;
}

export async function createClientOffline(payload: { name: string; phone?: string; address?: string }, shopId: number) {
  const client: LocalClient = {
    ...payload,
    shop_id: shopId,
    created_at: new Date().toISOString(),
    _synced: false,
  };
  const localId = await db.clients.add(client);
  await enqueue("client", "CREATE", localId as number, { ...client, localId });
  return { ...client, localId: localId as number };
}

export async function updateClientOffline(localId: number, changes: Partial<LocalClient>) {
  await db.clients.update(localId, { ...changes, _synced: false });
  const updated = await db.clients.get(localId);
  if (updated) await enqueue("client", "UPDATE", localId, updated, updated.serverId);
}

export async function deleteClientOffline(localId: number) {
  const client = await db.clients.get(localId);
  if (!client) return;
  if (client.serverId) {
    await db.clients.update(localId, { _deleted: true, _synced: false });
    await enqueue("client", "DELETE", localId, client, client.serverId);
  } else {
    await db.clients.delete(localId);
  }
}

// ── CATÉGORIES ───────────────────────────────────────────────────────────────

export async function getCategoriesOffline(shopId: number) {
  return db.categories.where("shop_id").equals(shopId).toArray();
}

export async function createCategoryOffline(name: string, shopId: number) {
  const cat: LocalCategory = {
    name,
    shop_id: shopId,
    created_at: new Date().toISOString(),
    _synced: false,
  };
  const localId = await db.categories.add(cat);
  await enqueue("category", "CREATE", localId as number, { ...cat, localId });
  return { ...cat, localId: localId as number };
}
