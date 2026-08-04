"use client";

import { BonClient } from "./bon-client.types";

function snippet(content: string, maxLength = 120): string {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > maxLength ? `${flat.slice(0, maxLength)}…` : flat;
}

export default function BonClientCard({
  bonClient,
  onOpen,
  onEdit,
  onDelete,
}: {
  bonClient: BonClient;
  onOpen: (bonClient: BonClient) => void;
  onEdit: (bonClient: BonClient) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
      <button onClick={() => onOpen(bonClient)} className="text-left flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{bonClient.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-3">{snippet(bonClient.content)}</p>
      </button>
      <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-400">
        <span>{new Date(bonClient.updated_at).toLocaleString("fr-FR")}</span>
        <div className="space-x-3">
          <button onClick={() => onEdit(bonClient)} className="text-blue-600 hover:underline">
            Modifier
          </button>
          <button onClick={() => onDelete(bonClient.id)} className="text-red-600 hover:underline">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
