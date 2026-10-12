"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface Variant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number;
  isControl: boolean;
  rankingStrategy: "topsis" | "current" | "random" | "custom";
}

export function ExperimentBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [primaryMetric, setPrimaryMetric] = useState<"conversion_rate" | "revenue_per_visitor" | "average_order_value">("conversion_rate");
  const [trafficAllocation, setTrafficAllocation] = useState(100);
  const [baselineConversionRate, setBaselineConversionRate] = useState(0.05);
  const [minimumDetectableEffect, setMinimumDetectableEffect] = useState(0.1);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);

  const [variants, setVariants] = useState<Variant[]>([
    {
      id: "control",
      name: "Control",
      description: "Current product ranking",
      trafficAllocation: 50,
      isControl: true,
      rankingStrategy: "current",
    },
    {
      id: "treatment",
      name: "TOPSIS Optimized",
      description: "TOPSIS-ranked products",
      trafficAllocation: 50,
      isControl: false,
      rankingStrategy: "topsis",
    },
  ]);

  const handleAddVariant = () => {
    const newId = `variant_${variants.length + 1}`;
    setVariants([
      ...variants,
      {
        id: newId,
        name: `Variant ${variants.length + 1}`,
        description: "",
        trafficAllocation: 0,
        isControl: false,
        rankingStrategy: "topsis",
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 2) {
      setError("Must have at least 2 variants");
      return;
    }
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleVariantChange = (id: string, field: keyof Variant, value: string | number | boolean) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // Validate
      if (!name || !hypothesis) {
        throw new Error("Name and hypothesis are required");
      }

      const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
      if (Math.abs(totalAllocation - 100) > 0.01) {
        throw new Error(`Variant traffic allocations must sum to 100% (currently ${totalAllocation}%)`);
      }

      const controlCount = variants.filter((v) => v.isControl).length;
      if (controlCount !== 1) {
        throw new Error("Exactly one variant must be marked as control");
      }

      // Create experiment
      const response = await fetch("/api/experiments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          hypothesis,
          variants,
          primaryMetric,
          secondaryMetrics: [],
          trafficAllocation,
          minimumDetectableEffect,
          confidenceLevel,
          baselineConversionRate,
          userId: "current_user", // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create experiment");
      }

      const { experiment } = await response.json();
      router.push(`/dashboard/experiments/${experiment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create experiment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/50">
          <div className="text-red-500 text-sm">{error}</div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Experiment Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., TOPSIS vs Current Ranking"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Hypothesis</label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="e.g., TOPSIS-optimized product rankings will increase conversion rate by 10%"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Primary Metric</label>
              <Select
                value={primaryMetric}
                onChange={(e) => setPrimaryMetric(e.target.value as "conversion_rate" | "revenue_per_visitor" | "average_order_value")}
                options={[
                  { value: "conversion_rate", label: "Conversion Rate" },
                  { value: "revenue_per_visitor", label: "Revenue Per Visitor" },
                  { value: "average_order_value", label: "Average Order Value" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Traffic Allocation (%)</label>
              <Input
                type="number"
                value={trafficAllocation}
                onChange={(e) => setTrafficAllocation(Number(e.target.value))}
                min={1}
                max={100}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Variants</h3>
          <Button onClick={handleAddVariant} className="text-sm">
            Add Variant
          </Button>
        </div>

        <div className="space-y-4">
          {variants.map((variant) => (
            <Card key={variant.id} className="p-4 bg-gray-900/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <Input
                        value={variant.name}
                        onChange={(e) =>
                          handleVariantChange(variant.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Traffic Allocation (%)
                      </label>
                      <Input
                        type="number"
                        value={variant.trafficAllocation}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.id,
                            "trafficAllocation",
                            Number(e.target.value)
                          )
                        }
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <Input
                      value={variant.description}
                      onChange={(e) =>
                        handleVariantChange(variant.id, "description", e.target.value)
                      }
                      placeholder="Brief description of this variant"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Ranking Strategy
                      </label>
                      <Select
                        value={variant.rankingStrategy}
                        onChange={(e) =>
                          handleVariantChange(variant.id, "rankingStrategy", e.target.value)
                        }
                        disabled={variant.isControl}
                        options={[
                          { value: "current", label: "Current Order" },
                          { value: "topsis", label: "TOPSIS Optimized" },
                          { value: "random", label: "Random" },
                          { value: "custom", label: "Custom" },
                        ]}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-gray-400">
                        <input
                          type="checkbox"
                          checked={variant.isControl}
                          onChange={(e) =>
                            handleVariantChange(variant.id, "isControl", e.target.checked)
                          }
                          className="rounded"
                        />
                        Control Variant
                      </label>
                    </div>
                  </div>
                </div>

                {!variant.isControl && variants.length > 2 && (
                  <button
                    onClick={() => handleRemoveVariant(variant.id)}
                    className="ml-4 text-red-500 hover:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Statistical Configuration</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Baseline Conversion Rate
            </label>
            <Input
              type="number"
              value={baselineConversionRate}
              onChange={(e) => setBaselineConversionRate(Number(e.target.value))}
              step={0.01}
              min={0}
              max={1}
            />
            <div className="text-xs text-gray-500 mt-1">
              {(baselineConversionRate * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Minimum Detectable Effect
            </label>
            <Input
              type="number"
              value={minimumDetectableEffect}
              onChange={(e) => setMinimumDetectableEffect(Number(e.target.value))}
              step={0.01}
              min={0}
              max={1}
            />
            <div className="text-xs text-gray-500 mt-1">
              {(minimumDetectableEffect * 100).toFixed(0)}% relative change
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Confidence Level</label>
            <Select
              value={confidenceLevel.toString()}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              options={[
                { value: "0.90", label: "90%" },
                { value: "0.95", label: "95%" },
                { value: "0.99", label: "99%" },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          onClick={() => router.back()}
          className="bg-gray-800 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Experiment"}
        </Button>
      </div>
    </div>
  );
}
