/**
 * CSV Export Utilities
 * Convert data to CSV format for download
 */

export interface CSVExportOptions {
  filename?: string;
  headers?: string[];
  delimiter?: string;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVExportOptions = {}
): string {
  if (data.length === 0) return "";

  const delimiter = options.delimiter || ",";
  const headers = options.headers || Object.keys(data[0]);

  // Escape CSV values
  const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Escape quotes and wrap in quotes if contains delimiter, newline, or quote
    if (str.includes(delimiter) || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV
  const headerRow = headers.map(escapeValue).join(delimiter);
  const dataRows = data.map((row) =>
    headers.map((header) => escapeValue(row[header])).join(delimiter)
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(
  data: Array<Record<string, unknown>>,
  filename: string = "export.csv",
  options: CSVExportOptions = {}
): void {
  const csv = arrayToCSV(data, options);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
 * Export TOPSIS results to CSV
 */
export function exportTopsisResultsCSV(
  rankings: Array<{
    alternative: { id: string; name: string };
    rank: number;
    score: number;
  }>,
  filename: string = "topsis-results.csv"
): void {
  const data = rankings.map((r) => ({
    Rank: r.rank,
    Product: r.alternative.name,
    "Product ID": r.alternative.id,
    "Closeness Score": r.score.toFixed(4),
  }));

  downloadCSV(data, filename);
}

/**
 * Export experiment results to CSV
 */
export function exportExperimentResultsCSV(
  experimentName: string,
  variants: Array<{
    name: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    revenuePerVisitor: number;
  }>,
  filename?: string
): void {
  const data = variants.map((v) => ({
    Variant: v.name,
    Visitors: v.visitors,
    Conversions: v.conversions,
    "Conversion Rate": `${(v.conversionRate * 100).toFixed(2)}%`,
    Revenue: `$${v.revenue.toFixed(2)}`,
    "Revenue Per Visitor": `$${v.revenuePerVisitor.toFixed(2)}`,
  }));

  const finalFilename =
    filename || `experiment-${experimentName.toLowerCase().replace(/\s+/g, "-")}.csv`;
  downloadCSV(data, finalFilename);
}

/**
 * Export criteria to CSV
 */
export function exportCriteriaCSV(
  criteria: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    weight: number;
    description?: string;
  }>,
  filename: string = "criteria.csv"
): void {
  const data = criteria.map((c) => ({
    ID: c.id,
    Name: c.name,
    Category: c.category,
    Type: c.type,
    Weight: c.weight.toFixed(3),
    Description: c.description || "",
  }));

  downloadCSV(data, filename);
}

/**
 * Export audit log to CSV
 */
export function exportAuditLogCSV(
  entries: Array<{
    id: string;
    timestamp: Date;
    userId: string;
    action: string;
    resource: string;
    details?: string;
  }>,
  filename: string = "audit-log.csv"
): void {
  const data = entries.map((e) => ({
    Timestamp: e.timestamp.toISOString(),
    User: e.userId,
    Action: e.action,
    Resource: e.resource,
    Details: e.details || "",
  }));

  downloadCSV(data, filename);
}
