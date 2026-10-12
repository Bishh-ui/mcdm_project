/**
 * JSON Export Utilities
 * Convert data to JSON format for download
 */

export interface JSONExportOptions {
  filename?: string;
  pretty?: boolean;
  indent?: number;
}

/**
 * Download JSON file
 */
export function downloadJSON(
  data: Record<string, unknown> | Array<Record<string, unknown>>,
  filename: string = "export.json",
  options: JSONExportOptions = {}
): void {
  const { pretty = true, indent = 2 } = options;

  const json = pretty ? JSON.stringify(data, null, indent) : JSON.stringify(data);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");

  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export TOPSIS results to JSON
 */
export function exportTopsisResultsJSON(
  results: {
    rankings: Array<Record<string, unknown>>;
    criteria: Array<Record<string, unknown>>;
    policy: Record<string, unknown>;
    timestamp: Date;
  },
  filename: string = "topsis-results.json"
): void {
  const data = {
    ...results,
    timestamp: results.timestamp.toISOString(),
    exportedAt: new Date().toISOString(),
  };

  downloadJSON(data, filename);
}

/**
 * Export experiment to JSON
 */
export function exportExperimentJSON(
  experiment: Record<string, unknown> & { name: string },
  filename?: string
): void {
  const finalFilename =
    filename ||
    `experiment-${experiment.name.toLowerCase().replace(/\s+/g, "-")}.json`;

  downloadJSON(experiment, finalFilename);
}

/**
 * Export criteria to JSON
 */
export function exportCriteriaJSON(
  criteria: Array<Record<string, unknown>>,
  filename: string = "criteria.json"
): void {
  downloadJSON({ criteria, exportedAt: new Date().toISOString() }, filename);
}

/**
 * Export full decision snapshot to JSON
 */
export function exportDecisionSnapshotJSON(
  snapshot: {
    criteria: Array<Record<string, unknown>>;
    alternatives: Array<Record<string, unknown>>;
    rankings: Array<Record<string, unknown>>;
    policy: Record<string, unknown>;
    metadata: Record<string, unknown>;
  },
  filename: string = "decision-snapshot.json"
): void {
  const data = {
    ...snapshot,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  downloadJSON(data, filename);
}
