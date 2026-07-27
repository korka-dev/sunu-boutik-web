import { db, SyncQueueItem, LocalInvoice, LocalProduct, LocalClient, LocalCategory } from "./db";
import { getToken } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function serverRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur réseau" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Traitement d'un item de la file ────────────────────────────────────────

async function processItem(item: SyncQueueItem): Promise<void> {
  const { entity, operation, localId, payload } = item;

  if (entity === "invoice") {
    if (operation === "CREATE") {
      const inv = payload as LocalInvoice;
      const serverPayload = {
        client_id: inv.client_id ?? null,
        client_name: inv.client_name ?? null,
        note: inv.note ?? null,
        lines: inv.lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      };
      const created = await serverRequest("POST", "/invoices", serverPayload);
      await db.invoices.update(localId, { serverId: created.id, number: created.number, _synced: true, _tempNumber: false });
    }
  }

  if (entity === "product") {
    if (operation === "CREATE") {
      const created = await serverRequest("POST", "/products", payload);
      await db.products.update(localId, { serverId: created.id, _synced: true });
    } else if (operation === "UPDATE") {
      const p = payload as LocalProduct;
      await serverRequest("PATCH", `/products/${p.serverId}`, payload);
      await db.products.update(localId, { _synced: true });
    } else if (operation === "DELETE") {
      const p = payload as LocalProduct;
      if (p.serverId) await serverRequest("DELETE", `/products/${p.serverId}`);
      await db.products.delete(localId);
    }
  }

  if (entity === "client") {
    if (operation === "CREATE") {
      const created = await serverRequest("POST", "/clients", payload);
      await db.clients.update(localId, { serverId: created.id, _synced: true });
    } else if (operation === "UPDATE") {
      const c = payload as LocalClient;
      await serverRequest("PATCH", `/clients/${c.serverId}`, payload);
      await db.clients.update(localId, { _synced: true });
    } else if (operation === "DELETE") {
      const c = payload as LocalClient;
      if (c.serverId) await serverRequest("DELETE", `/clients/${c.serverId}`);
      await db.clients.delete(localId);
    }
  }

  if (entity === "category") {
    if (operation === "CREATE") {
      const created = await serverRequest("POST", "/categories", payload);
      await db.categories.update(localId, { serverId: created.id, _synced: true });
    }
  }
}

// ── Sync principale ─────────────────────────────────────────────────────────

let syncing = false;

export async function processSyncQueue(): Promise<void> {
  if (syncing || !navigator.onLine) return;
  syncing = true;

  try {
    const pending = await db.sync_queue.where("status").equals("pending").sortBy("createdAt");

    for (const item of pending) {
      await db.sync_queue.update(item.id!, { status: "syncing" });
      try {
        await processItem(item);
        await db.sync_queue.delete(item.id!);
      } catch (err) {
        const attempts = (item.attempts || 0) + 1;
        await db.sync_queue.update(item.id!, {
          status: attempts >= 5 ? "error" : "pending",
          attempts,
          error: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    }
  } finally {
    syncing = false;
  }
}

// ── Rafraîchissement du cache local depuis le serveur ───────────────────────

export async function refreshLocalCache(shopId: number): Promise<void> {
  if (!navigator.onLine) return;

  try {
    const [products, categories, clients, invoices] = await Promise.all([
      serverRequest("GET", "/products?page_size=1000"),
      serverRequest("GET", "/categories?page_size=1000"),
      serverRequest("GET", "/clients?page_size=1000"),
      serverRequest("GET", "/invoices?page_size=200"),
    ]);

    await db.transaction("rw", [db.products, db.categories, db.clients, db.invoices], async () => {
      // Produits
      if (products?.items) {
        for (const p of products.items) {
          const existing = await db.products.where("serverId").equals(p.id).first();
          if (!existing) {
            await db.products.add({ ...p, localId: undefined, serverId: p.id, shop_id: shopId, _synced: true });
          } else {
            await db.products.update(existing.localId!, { ...p, serverId: p.id, _synced: true });
          }
        }
      }

      // Catégories
      if (categories?.items) {
        for (const c of categories.items) {
          const existing = await db.categories.where("serverId").equals(c.id).first();
          if (!existing) {
            await db.categories.add({ ...c, localId: undefined, serverId: c.id, shop_id: shopId, _synced: true });
          } else {
            await db.categories.update(existing.localId!, { ...c, serverId: c.id, _synced: true });
          }
        }
      }

      // Clients
      if (clients?.items) {
        for (const c of clients.items) {
          const existing = await db.clients.where("serverId").equals(c.id).first();
          if (!existing) {
            await db.clients.add({ ...c, localId: undefined, serverId: c.id, shop_id: shopId, _synced: true });
          } else {
            await db.clients.update(existing.localId!, { ...c, serverId: c.id, _synced: true });
          }
        }
      }

      // Factures
      if (invoices?.items) {
        for (const inv of invoices.items) {
          const existing = await db.invoices.where("serverId").equals(inv.id).first();
          if (!existing) {
            await db.invoices.add({ ...inv, localId: undefined, serverId: inv.id, shop_id: shopId, _synced: true });
          } else {
            await db.invoices.update(existing.localId!, { ...inv, serverId: inv.id, _synced: true });
          }
        }
      }
    });
  } catch {
    // Silencieux : on continue avec les données locales
  }
}

// ── Compteur de modifications en attente ────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  return db.sync_queue.where("status").equals("pending").count();
}

// ── Ajout à la file de sync ─────────────────────────────────────────────────

export async function enqueue(
  entity: SyncQueueItem["entity"],
  operation: SyncQueueItem["operation"],
  localId: number,
  payload: unknown,
  serverId?: number
): Promise<void> {
  await db.sync_queue.add({
    entity,
    operation,
    localId,
    serverId,
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  // Tentative immédiate si en ligne
  processSyncQueue();
}
