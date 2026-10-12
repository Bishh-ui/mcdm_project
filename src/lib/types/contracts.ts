/** Signal types that feed into TOPSIS criteria */
export type SignalType =
  | "clickstream"
  | "session-analytics"
  | "heatmaps"
  | "sales"
  | "returns"
  | "campaign-metadata";

/** A data contract definition */
export interface DataContract {
  id: string;
  signalType: SignalType;
  version: number;
  schema: JsonSchemaField[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** A field in the JSON schema */
export interface JsonSchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description: string;
}

/** Validation result for a single record */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  record: Record<string, unknown>;
}

/** Full validation run result */
export interface ContractValidationRun {
  contractId: string;
  signalType: SignalType;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: Array<{ record: number; errors: string[] }>;
  runAt: string;
}

export const SIGNAL_TYPES: Record<SignalType, { label: string; color: string }> = {
  clickstream: { label: "Clickstream", color: "#35d0ff" },
  "session-analytics": { label: "Session Analytics", color: "#8af26b" },
  heatmaps: { label: "Heatmaps", color: "#ffbe5b" },
  sales: { label: "Sales", color: "#f472b6" },
  returns: { label: "Returns", color: "#a78bfa" },
  "campaign-metadata": { label: "Campaign Metadata", color: "#fb923c" },
};

/** Validate a record against a contract schema */
export function validateRecord(
  record: Record<string, unknown>,
  schema: JsonSchemaField[]
): ValidationResult {
  const errors: string[] = [];

  for (const field of schema) {
    const value = record[field.name];

    if (field.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${field.name}`);
      continue;
    }

    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== field.type) {
        errors.push(
          `Field "${field.name}" expected ${field.type}, got ${actualType}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, record };
}

/** Validate an array of records against a contract */
export function validateDataset(
  records: Record<string, unknown>[],
  schema: JsonSchemaField[]
): ContractValidationRun {
  const results = records.map((r) => validateRecord(r, schema));
  const invalidResults = results
    .map((r, i) => ({ record: i, errors: r.errors }))
    .filter((r) => r.errors.length > 0);

  return {
    contractId: "",
    signalType: "clickstream",
    totalRecords: records.length,
    validRecords: results.filter((r) => r.valid).length,
    invalidRecords: invalidResults.length,
    errors: invalidResults,
    runAt: new Date().toISOString(),
  };
}
