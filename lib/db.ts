import Dexie, { type Table } from "dexie";

// ── Types locaux ────────────────────────────────────────────────────────────

export interface LocalProduct {
  localId?: number;
  serverId?: number;
  shop_id: number;
  name: string;
  category_id: number;
  category_name: string;
  reference?: string | null;
  unit_price: number;
  quantity: number;
  unit: string;
  pack_size: number;
  created_at: string;
  _synced: boolean;
  _deleted?: boolean;
}

export interface LocalCategory {
  localId?: number;
  serverId?: number;
  shop_id: number;
  name: string;
  created_at: string;
  _synced: boolean;
  _deleted?: boolean;
}

export interface LocalClient {
  localId?: number;
  serverId?: number;
  shop_id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string;
  _synced: boolean;
  _deleted?: boolean;
}

export interface LocalInvoiceLine {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface LocalInvoice {
  localId?: number;
  serverId?: number;
  shop_id: number;
  number: string;
  client_id?: number | null;
  client_name?: string | null;
  total: number;
  note?: string | null;
  lines: LocalInvoiceLine[];
  created_at: string;
  _synced: boolean;
  _tempNumber?: boolean;
}

export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";
export type SyncEntity = "product" | "category" | "client" | "invoice";
export type SyncStatus = "pending" | "syncing" | "error";

export interface SyncQueueItem {
  id?: number;
  entity: SyncEntity;
  operation: SyncOperation;
  localId: number;
  serverId?: number;
  payload: unknown;
  status: SyncStatus;
  createdAt: string;
  attempts: number;
  error?: string;
}

// ── Base de données Dexie ───────────────────────────────────────────────────

class SunuBoutikDB extends Dexie {
  products!: Table<LocalProduct>;
  categories!: Table<LocalCategory>;
  clients!: Table<LocalClient>;
  invoices!: Table<LocalInvoice>;
  sync_queue!: Table<SyncQueueItem>;

  constructor() {
    super("sunu-boutik-db");
    this.version(1).stores({
      products:    "++localId, serverId, shop_id, name, category_id, _synced",
      categories:  "++localId, serverId, shop_id, name, _synced",
      clients:     "++localId, serverId, shop_id, name, _synced",
      invoices:    "++localId, serverId, shop_id, number, created_at, _synced",
      sync_queue:  "++id, entity, operation, localId, status, createdAt",
    });
  }
}

export const db = new SunuBoutikDB();
