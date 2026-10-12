/** A differentiation claim with evidence */
export interface DifferentiationClaim {
  id: string;
  claim: string;
  evidence: string;
  category: string;
}

/** A decision log entry */
export interface DecisionLogEntry {
  id: string;
  decision: string;
  rationale: string;
  type: "inclusion" | "exclusion" | "trade-off";
  createdAt: string;
}

/** Full positioning state */
export interface PositioningData {
  thesis: string;
  claims: DifferentiationClaim[];
  decisionLog: DecisionLogEntry[];
  updatedAt: string;
}
