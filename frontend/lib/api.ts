// API Client for Odin Force / Odin War Room Backend Gateway

const API_BASE = ""; // Relative path utilizing Next.js proxy rewrites to :8000

export interface IngestResponse {
  ok: boolean;
  status: string;
  code?: string;
  message?: string;
  bundle_id?: string;
  company?: { name: string } | null;
  contracts?: Array<{ id: string; title: string; counterparty?: string; path?: string }>;
  checkpoints?: Array<{ id: string; date: string; label: string }>;
  drops?: Array<{ id: string; label: string }>;
  warnings?: string[];
  contracts_indexed?: number;
  events_ingested?: number;
  corrupted_lines_quarantined?: number;
}

export interface AnalyzeResponse {
  ok: boolean;
  status: string;
  message?: string;
  detail?: string;
}

export interface BackendStatus {
  ingested: boolean;
  analyzed: boolean;
  status: "idle" | "running" | "complete" | "partial" | "error";
  streams: Record<string, number>;
}

export interface WarRoomState {
  ingested?: boolean;
  checkpoint_date?: string;
  checkpoint_label?: string;
  checkpoints?: Array<{ id: string; date: string; label: string }>;
  contracts?: string[];
  summary?: {
    transaction_total_cents?: number | null;
    contract_count?: number;
    clause_count?: number;
    event_count?: number;
    transaction_count?: number;
    flagged_transaction_count?: number;
  };
  heatmap?: {
    months?: string[];
    by_contract?: Record<string, number[]>;
    by_clause_type?: Record<string, number[]>;
  };
  graph?: {
    width?: number;
    height?: number;
    nodes?: Array<{ id: string; label: string; x: number; y: number; contract_id: string; citation_id?: string }>;
    edges?: Array<{ from: string; to: string; kind: string; label?: string; citation_id?: string }>;
  };
  alerts?: Array<{
    id?: string;
    contract_id?: string;
    severity: "critical" | "warning" | "info";
    title: string;
    deadline?: string;
    impact_cents?: number | null;
    citation_id?: string;
  }>;
  drafts?: Array<{
    id: string;
    title: string;
    type?: string;
    status: string;
    recipient?: string;
    needs_human_approval?: boolean;
    body?: string;
  }>;
  timeline?: Array<{
    date?: string;
    target_date?: string;
    event?: string;
    title?: string;
    status?: string;
    completed?: boolean;
    amount_cents?: number | null;
    citation_id?: string;
  }>;
}

export interface CitationDetail {
  citation_id?: string;
  doc_id?: string;
  section?: string;
  clause_text?: string;
  quote?: string;
  verified?: boolean;
  tag?: string;
  confidence?: number;
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: Array<{
    type?: string;
    label?: string;
    citation_id?: string;
    doc_id?: string;
    section?: string;
  }>;
  matched?: boolean;
}

export async function resetBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/reset`, { method: "POST" });
    return res.ok;
  } catch (err) {
    console.warn("resetBackend error:", err);
    return false;
  }
}

export async function ingestBundle(
  file?: File | null,
  path?: string | null
): Promise<IngestResponse> {
  let res: Response;
  if (file) {
    const formData = new FormData();
    formData.append("zipf", file);
    res = await fetch(`${API_BASE}/api/ingest`, {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch(`${API_BASE}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path || "" }),
    });
  }

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.detail || `Ingestion failed (${res.status})`);
  }
  return data;
}

export async function runAnalyze(budget: "full" | "low" = "full"): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budget }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.detail || data.message || `Analysis failed (${res.status})`);
  }
  return data;
}

export async function getBackendStatus(): Promise<BackendStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    if (res.ok) return await res.json();
  } catch (err) {
    // Backend offline or unreachable
  }
  return null;
}

export async function getWarRoomState(
  checkpoint: string | number = 0,
  drop: string = ""
): Promise<WarRoomState | null> {
  try {
    const query = new URLSearchParams();
    if (checkpoint !== undefined && checkpoint !== null) {
      query.set("checkpoint", String(checkpoint));
    }
    if (drop) {
      query.set("drop", drop);
    }
    const res = await fetch(`${API_BASE}/api/state?${query.toString()}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getWarRoomState error:", err);
  }
  return null;
}

export async function getCitation(citationId: string): Promise<CitationDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/citations/${encodeURIComponent(citationId)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getCitation error:", err);
  }
  return null;
}

export async function getExtractions(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/extractions`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getExtractions error:", err);
  }
  return [];
}

export async function reextractClause(extractionId: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/reextract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extraction_id: extractionId }),
  });
  return await res.json();
}

export async function getRulings(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/rulings`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getRulings error:", err);
  }
  return [];
}

export async function getGuardrailsAudit(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/guardrails`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getGuardrailsAudit error:", err);
  }
  return null;
}

export async function getTraps(): Promise<{ total_traps: number; caught_count: number; traps: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/traps`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getTraps error:", err);
  }
  return { total_traps: 0, caught_count: 0, traps: [] };
}

export async function getTraces(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/traces`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getTraces error:", err);
  }
  return null;
}

export async function getDebate(checkpoint?: string): Promise<any[]> {
  try {
    const query = checkpoint ? `?checkpoint=${encodeURIComponent(checkpoint)}` : "";
    const res = await fetch(`${API_BASE}/api/debate${query}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getDebate error:", err);
  }
  return [];
}

export async function getDrafts(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/drafts`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getDrafts error:", err);
  }
  return [];
}

export async function patchDraft(
  draftId: string,
  status: "approved" | "rejected" | "completed",
  body?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/drafts/${encodeURIComponent(draftId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, body }),
  });
  return await res.json();
}

export async function approveAction(actionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/actions/${encodeURIComponent(actionId)}/approve`, {
    method: "POST",
  });
  return await res.json();
}

export async function dispatchAction(actionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/actions/${encodeURIComponent(actionId)}/dispatch`, {
    method: "POST",
  });
  return await res.json();
}

export async function askUploadedData(question: string): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || "Failed to answer from uploaded records.");
  }
  return data;
}

export async function getDossiers(): Promise<Record<string, any>> {
  try {
    const res = await fetch(`${API_BASE}/api/reports/dossiers`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getDossiers error:", err);
  }
  return {};
}

export async function getCompanyReport(checkpoint?: string): Promise<any> {
  try {
    const query = checkpoint ? `?checkpoint=${encodeURIComponent(checkpoint)}` : "";
    const res = await fetch(`${API_BASE}/api/reports/company${query}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getCompanyReport error:", err);
  }
  return null;
}

export async function getContractReport(docId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/reports/contract/${encodeURIComponent(docId)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("getContractReport error:", err);
  }
  return null;
}

export function getReportDownloadUrl(type: "company" | "contract", id?: string, format = "md"): string {
  if (type === "company") {
    return `${API_BASE}/api/reports/company/download?format=${format}`;
  }
  return `${API_BASE}/api/reports/contract/${encodeURIComponent(id || "")}/download?format=${format}`;
}

export function getDraftExportUrl(draftId: string, format = "md"): string {
  return `${API_BASE}/api/drafts/${encodeURIComponent(draftId)}/export?format=${format}`;
}
