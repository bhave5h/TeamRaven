export type CheckpointDate = "2027-03-15" | "2027-06-01" | "2027-09-15" | (string & {});

export interface Citation {
  docId: string;
  section: string;
  title: string;
  quote: string;
  fullParagraph: string;
  verified: boolean;
  matchScore: number;
}

export interface ContractNode {
  id: string;
  label: string;
  type: "standard" | "cloud_vendor" | "customer" | "contractor" | "amendment";
  party: string;
  effectiveDate: string;
  status: "active" | "superseded" | "disputed" | "at_risk";
  slaTier?: string;
  riskScore: number;
  exposureAmount: number;
  supersededBy?: string;
  citation: Citation;
  x: number;
  y: number;
}

export interface ContractEdge {
  id: string;
  source: string;
  target: string;
  type: "supersedes" | "covenant_conflict" | "upstream_dependency" | "subcontract";
  label: string;
  severity: "critical" | "warning" | "info";
  details: string;
}

export interface DebateTurn {
  id: string;
  round: number;
  agent: "loki" | "heimdall" | "tyr" | "thor" | "odin";
  agentName: string;
  agentRole: string;
  timestamp: string;
  stance: "adversarial" | "evidence" | "adjudication" | "clarification" | "orchestration";
  content: string;
  citation?: Citation;
  rulingStatus?: "upheld" | "dismissed" | "renegotiate" | "pending";
}

export interface TrapItem {
  id: number;
  name: string;
  category: "sla" | "liability" | "temporal" | "accounting" | "operational" | "quarantine";
  issue: string;
  detectionEngine: string;
  agentAction: string;
  affectedContracts: string[];
  exposureImpact: number;
  status: "detected" | "remedied";
  citation: Citation;
}

export interface AlertItem {
  id: string;
  checkpoint: CheckpointDate;
  urgency: "critical" | "warning" | "informational";
  title: string;
  description: string;
  contractId: string;
  deadline?: string;
  actionRequired: string;
  citation: Citation;
}

export interface ActionNotice {
  id: string;
  type: "breach_notice" | "credit_claim" | "dispute_rejection" | "non_renewal_denial";
  recipient: string;
  recipientAddress: string;
  subject: string;
  body: string;
  checkpoint: CheckpointDate;
  status: "drafted" | "approved" | "dispatched";
  financialImpact: number;
  primaryCitation: Citation;
}

export interface FinancialMetric {
  checkpoint: CheckpointDate;
  totalGrossExposure: number;
  downstreamOwed: number;
  upstreamRecoverable: number;
  netFinancialLeakage: number;
  contractsAtRisk: number;
  slaViolationCount: number;
}

export interface ExtractionItem {
  contract: string;
  field: string;
  value: string;
  confidence: number;
  citationKey: string;
  flag?: string;
}

export interface RulingItem {
  claim: string;
  lokiAttack: string;
  heimdallEvidence: string;
  verdict: "TRUE" | "FALSE" | "VALID" | "DISMISSED";
  rationale: string;
}

export interface QuarantinedItem {
  source: string;
  payload: string;
  reason: string;
}

export interface ArithmeticOverride {
  item: string;
  llmValue: string;
  pythonValue: string;
}

export interface AgentTransition {
  from: string;
  to: string;
  action: string;
}

export interface WorkstreamPlan {
  streamId: string;
  label: string;
  steps: string;
  progress: number;
  status: "queued" | "running" | "complete" | "budget-capped";
}
