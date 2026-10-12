"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { useAudit } from "@/lib/hooks/use-audit";
import { generateId } from "@/lib/id";
import {
  SIGNAL_TYPES,
  validateDataset,
  type DataContract,
  type SignalType,
  type JsonSchemaField,
  type ContractValidationRun,
} from "@/lib/types/contracts";

const signalOptions = Object.entries(SIGNAL_TYPES).map(([value, { label }]) => ({
  value,
  label,
}));

const fieldTypeOptions = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "array", label: "Array" },
  { value: "object", label: "Object" },
];

export function ContractsManager() {
  const [contracts, setContracts] = useFirestoreState<DataContract[]>(
    "mcdm:contracts",
    []
  );
  const logAudit = useAudit();
  const [editingContract, setEditingContract] = useState<{
    signalType: SignalType;
    description: string;
    schema: JsonSchemaField[];
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ContractValidationRun | null>(null);
  const [newField, setNewField] = useState<JsonSchemaField>({
    name: "",
    type: "string",
    required: true,
    description: "",
  });

  const handleSave = () => {
    if (!editingContract) return;
    const now = new Date().toISOString();

    if (editingId) {
      const previous = contracts.find((c) => c.id === editingId);
      setContracts(
        contracts.map((c) =>
          c.id === editingId
            ? { ...c, ...editingContract, version: c.version + 1, updatedAt: now }
            : c
        )
      );
      logAudit("update", "data_contract", editingId, previous as unknown as Record<string, unknown> | null, editingContract as unknown as Record<string, unknown>);
    } else {
      const newContract = {
        id: generateId(),
        ...editingContract,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      setContracts([...contracts, newContract]);
      logAudit("create", "data_contract", newContract.id, null, editingContract as unknown as Record<string, unknown>);
    }
    setEditingContract(null);
    setEditingId(null);
  };

  const addField = () => {
    if (!editingContract || !newField.name.trim()) return;
    setEditingContract({
      ...editingContract,
      schema: [...editingContract.schema, { ...newField }],
    });
    setNewField({ name: "", type: "string", required: true, description: "" });
  };

  const removeField = (index: number) => {
    if (!editingContract) return;
    setEditingContract({
      ...editingContract,
      schema: editingContract.schema.filter((_, i) => i !== index),
    });
  };

  const handleValidate = (contract: DataContract, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const records = Array.isArray(data) ? data : [data];
        const result = validateDataset(records, contract.schema);
        result.contractId = contract.id;
        result.signalType = contract.signalType;
        setValidationResult(result);
      } catch {
        setValidationResult({
          contractId: contract.id,
          signalType: contract.signalType,
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          errors: [{ record: 0, errors: ["Invalid JSON file"] }],
          runAt: new Date().toISOString(),
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setEditingContract({ signalType: "clickstream", description: "", schema: [] });
            setEditingId(null);
          }}
        >
          + New Contract
        </Button>
      </div>

      {/* Editor */}
      {editingContract && (
        <Card>
          <CardHeader
            title={editingId ? "Edit Contract" : "New Data Contract"}
            actions={
              <Button variant="ghost" size="sm" onClick={() => { setEditingContract(null); setEditingId(null); }}>
                Cancel
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="contract-signal"
              label="Signal Type"
              value={editingContract.signalType}
              onChange={(e) => setEditingContract({ ...editingContract, signalType: e.target.value as SignalType })}
              options={signalOptions}
            />
            <Input
              id="contract-desc"
              label="Description"
              value={editingContract.description}
              onChange={(e) => setEditingContract({ ...editingContract, description: e.target.value })}
              placeholder="What data does this contract validate?"
            />
          </div>

          {/* Schema fields */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-[var(--muted)]">Schema Fields</p>
            {editingContract.schema.length > 0 && (
              <div className="mb-3 space-y-1">
                {editingContract.schema.map((field, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-sm font-medium text-white">{field.name}</span>
                    <Badge variant="cyan">{field.type}</Badge>
                    {field.required && <Badge variant="amber">required</Badge>}
                    <span className="flex-1 text-xs text-[var(--muted)]">{field.description}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeField(i)}>✕</Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add field form */}
            <div className="grid gap-2 sm:grid-cols-5">
              <Input
                id="field-name"
                placeholder="Field name"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              />
              <Select
                id="field-type"
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value as JsonSchemaField["type"] })}
                options={fieldTypeOptions}
              />
              <Select
                id="field-required"
                value={newField.required ? "true" : "false"}
                onChange={(e) => setNewField({ ...newField, required: e.target.value === "true" })}
                options={[
                  { value: "true", label: "Required" },
                  { value: "false", label: "Optional" },
                ]}
              />
              <Input
                id="field-desc"
                placeholder="Description"
                value={newField.description}
                onChange={(e) => setNewField({ ...newField, description: e.target.value })}
              />
              <Button size="sm" onClick={addField}>Add</Button>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleSave} disabled={editingContract.schema.length === 0}>
              {editingId ? "Update" : "Create"} Contract
            </Button>
          </div>
        </Card>
      )}

      {/* Contracts list */}
      {contracts.map((contract) => (
        <Card key={contract.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="cyan">{SIGNAL_TYPES[contract.signalType].label}</Badge>
                <Badge variant="neutral">v{contract.version}</Badge>
                <span className="text-sm font-medium text-white">
                  {contract.schema.length} fields
                </span>
              </div>
              {contract.description && (
                <p className="mt-1 text-xs text-[var(--muted)]">{contract.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {contract.schema.map((f) => (
                  <span key={f.name} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[var(--muted)]">
                    {f.name}: {f.type}{f.required ? "*" : ""}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10">
                  Validate
                </span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => handleValidate(contract, e)}
                />
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingId(contract.id);
                  setEditingContract({
                    signalType: contract.signalType,
                    description: contract.description,
                    schema: contract.schema,
                  });
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logAudit("delete", "data_contract", contract.id, contract as unknown as Record<string, unknown>, null);
                  setContracts(contracts.filter((c) => c.id !== contract.id));
                }}
              >
                ✕
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Validation result */}
      {validationResult && (
        <Card className={validationResult.invalidRecords === 0 ? "border-lime-400/30" : "border-amber-400/30"}>
          <CardHeader
            tag="Validation Result"
            tagColor={validationResult.invalidRecords === 0 ? "text-lime-200/90" : "text-amber-200/90"}
            title={validationResult.invalidRecords === 0 ? "All Records Valid ✓" : `${validationResult.invalidRecords} Invalid Records`}
            description={`${validationResult.validRecords}/${validationResult.totalRecords} records passed validation`}
          />
          {validationResult.errors.length > 0 && (
            <div className="space-y-1">
              {validationResult.errors.slice(0, 10).map((err, i) => (
                <div key={i} className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2">
                  <p className="text-xs font-medium text-red-300">Record #{err.record + 1}</p>
                  {err.errors.map((e, j) => (
                    <p key={j} className="text-xs text-red-200/80">• {e}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {contracts.length === 0 && !editingContract && (
        <Card className="py-16 text-center">
          <p className="text-lg text-[var(--muted)]">No data contracts defined</p>
          <p className="mt-2 text-sm text-[var(--muted)]/60">
            Define schemas for each signal type to validate incoming data before it feeds into TOPSIS.
          </p>
        </Card>
      )}
    </div>
  );
}
