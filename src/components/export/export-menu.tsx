"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  downloadCSV,
  exportTopsisResultsCSV,
  exportExperimentResultsCSV,
  exportCriteriaCSV,
  exportAuditLogCSV,
} from "@/lib/export/csv";
import {
  downloadJSON,
  exportTopsisResultsJSON,
  exportExperimentJSON,
  exportCriteriaJSON,
  exportDecisionSnapshotJSON,
} from "@/lib/export/json";

export interface ExportMenuProps {
  data: Record<string, unknown>;
  type: "topsis" | "experiment" | "criteria" | "audit" | "decision";
  filename?: string;
}

export function ExportMenu({ data, type, filename }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleExportCSV() {
    switch (type) {
      case "topsis":
        if ("rankings" in data && Array.isArray(data.rankings)) {
          exportTopsisResultsCSV(data.rankings, filename);
        }
        break;
      case "experiment":
        if ("name" in data && "variants" in data && typeof data.name === "string" && Array.isArray(data.variants)) {
          exportExperimentResultsCSV(data.name, data.variants, filename);
        }
        break;
      case "criteria":
        if (Array.isArray(data)) {
          exportCriteriaCSV(data, filename);
        }
        break;
      case "audit":
        if (Array.isArray(data)) {
          exportAuditLogCSV(data, filename);
        }
        break;
      case "decision":
        if ("rankings" in data && Array.isArray(data.rankings)) {
          exportTopsisResultsCSV(data.rankings, filename);
        }
        break;
      default:
        if (Array.isArray(data)) {
          downloadCSV(data, filename || "export.csv");
        }
    }
    setIsOpen(false);
  }

  function handleExportJSON() {
    switch (type) {
      case "topsis":
        if ("rankings" in data && "criteria" in data && "policy" in data && "timestamp" in data) {
          exportTopsisResultsJSON(data as {
            rankings: Array<Record<string, unknown>>;
            criteria: Array<Record<string, unknown>>;
            policy: Record<string, unknown>;
            timestamp: Date;
          }, filename);
        }
        break;
      case "experiment":
        if ("name" in data && typeof data.name === "string") {
          exportExperimentJSON(data as Record<string, unknown> & { name: string }, filename);
        }
        break;
      case "criteria":
        if (Array.isArray(data)) {
          exportCriteriaJSON(data, filename);
        }
        break;
      case "decision":
        if ("criteria" in data && "alternatives" in data && "rankings" in data && "policy" in data && "metadata" in data) {
          exportDecisionSnapshotJSON(data as {
            criteria: Array<Record<string, unknown>>;
            alternatives: Array<Record<string, unknown>>;
            rankings: Array<Record<string, unknown>>;
            policy: Record<string, unknown>;
            metadata: Record<string, unknown>;
          }, filename);
        }
        break;
      default:
        if (Array.isArray(data)) {
          downloadJSON(data, filename || "export.json");
        } else {
          downloadJSON(data, filename || "export.json");
        }
    }
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        className="gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 mt-2 w-48 p-2 z-20 shadow-lg">
            <div className="space-y-1">
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Export as JSON
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
