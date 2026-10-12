import { Card } from "@/components/ui/card";

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  params?: Array<{ name: string; type: string; required: boolean; description: string }>;
  response?: string;
}

const apiEndpoints: APIEndpoint[] = [
  {
    method: "POST",
    path: "/api/topsis/run",
    description: "Execute TOPSIS ranking on provided alternatives and criteria",
    auth: true,
    params: [
      { name: "criteria", type: "Criterion[]", required: true, description: "Array of criteria with weights" },
      { name: "alternatives", type: "Alternative[]", required: true, description: "Array of alternatives to rank" },
      { name: "policy", type: "TopsisPolicy", required: true, description: "TOPSIS configuration policy" },
    ],
    response: "{ rankings: Ranking[], steps: CalculationSteps }",
  },
  {
    method: "POST",
    path: "/api/topsis/sensitivity",
    description: "Run sensitivity analysis on weight perturbations",
    auth: true,
    params: [
      { name: "criteria", type: "Criterion[]", required: true, description: "Array of criteria" },
      { name: "alternatives", type: "Alternative[]", required: true, description: "Array of alternatives" },
      { name: "perturbations", type: "number[]", required: true, description: "Weight adjustment percentages" },
    ],
    response: "{ results: SensitivityResult[] }",
  },
  {
    method: "POST",
    path: "/api/experiments/create",
    description: "Create a new A/B experiment",
    auth: true,
    params: [
      { name: "name", type: "string", required: true, description: "Experiment name" },
      { name: "hypothesis", type: "string", required: true, description: "Hypothesis being tested" },
      { name: "variants", type: "Variant[]", required: true, description: "Experiment variants" },
      { name: "trafficAllocation", type: "number", required: true, description: "Percentage of traffic (0-100)" },
    ],
    response: "{ experimentId: string, status: string }",
  },
  {
    method: "POST",
    path: "/api/experiments/assign",
    description: "Assign user to experiment variant",
    auth: false,
    params: [
      { name: "experimentId", type: "string", required: true, description: "Experiment ID" },
      { name: "userId", type: "string", required: true, description: "User identifier" },
    ],
    response: "{ variantId: string, experimentId: string }",
  },
  {
    method: "POST",
    path: "/api/experiments/rank",
    description: "Get ranked products based on user's experiment assignment",
    auth: false,
    params: [
      { name: "experimentId", type: "string", required: true, description: "Experiment ID" },
      { name: "userId", type: "string", required: true, description: "User identifier" },
      { name: "products", type: "Alternative[]", required: true, description: "Products to rank" },
    ],
    response: "{ ranking: Alternative[], variant: VariantInfo }",
  },
  {
    method: "GET",
    path: "/api/experiments/[id]",
    description: "Get experiment details",
    auth: true,
    response: "{ experiment: Experiment }",
  },
  {
    method: "PATCH",
    path: "/api/experiments/[id]",
    description: "Update experiment status (start, pause, complete)",
    auth: true,
    params: [
      { name: "status", type: "string", required: true, description: "New status: running, paused, completed" },
      { name: "winnerId", type: "string", required: false, description: "Winner variant ID (for completed)" },
    ],
    response: "{ success: boolean }",
  },
  {
    method: "GET",
    path: "/api/experiments/[id]/results",
    description: "Get experiment results with statistical analysis",
    auth: true,
    response: "{ variants: VariantResults[], statistics: Statistics }",
  },
  {
    method: "POST",
    path: "/api/ai/explain",
    description: "Generate natural language explanation of TOPSIS ranking",
    auth: true,
    params: [
      { name: "rankings", type: "Ranking[]", required: true, description: "TOPSIS rankings to explain" },
      { name: "criteria", type: "Criterion[]", required: true, description: "Criteria used" },
      { name: "type", type: "string", required: false, description: "Explanation type: full, comparison, bottleneck" },
    ],
    response: "{ explanation: string }",
  },
  {
    method: "POST",
    path: "/api/ai/hypotheses",
    description: "Generate optimization hypotheses using AI",
    auth: true,
    params: [
      { name: "rankings", type: "Ranking[]", required: true, description: "Current rankings" },
      { name: "criteria", type: "Criterion[]", required: true, description: "Criteria" },
    ],
    response: "{ hypotheses: Hypothesis[] }",
  },
  {
    method: "POST",
    path: "/api/ai/chat",
    description: "Conversational analytics interface",
    auth: true,
    params: [
      { name: "message", type: "string", required: true, description: "User question" },
      { name: "context", type: "object", required: true, description: "Decision context (rankings, criteria)" },
    ],
    response: "{ response: string, suggestions: string[] }",
  },
  {
    method: "POST",
    path: "/api/ai/weights",
    description: "Get AI-suggested weight adjustments",
    auth: true,
    params: [
      { name: "criteria", type: "Criterion[]", required: true, description: "Current criteria" },
      { name: "historicalData", type: "object", required: false, description: "Historical experiment data" },
    ],
    response: "{ suggestions: WeightSuggestion[] }",
  },
  {
    method: "GET",
    path: "/api/shopify/products",
    description: "Fetch Shopify products",
    auth: true,
    response: "{ products: ShopifyProduct[] }",
  },
  {
    method: "GET",
    path: "/api/shopify/orders",
    description: "Fetch Shopify orders",
    auth: true,
    response: "{ orders: ShopifyOrder[] }",
  },
  {
    method: "POST",
    path: "/api/shopify/sync",
    description: "Sync Shopify data and compute product signals",
    auth: true,
    response: "{ signals: ProductSignal[], summary: SyncSummary }",
  },
  {
    method: "GET",
    path: "/api/ga4/events",
    description: "Query GA4 e-commerce events from BigQuery",
    auth: true,
    params: [
      { name: "days", type: "number", required: false, description: "Number of days to query (default: 30)" },
    ],
    response: "{ events: GA4Event[] }",
  },
  {
    method: "GET",
    path: "/api/ga4/products",
    description: "Query GA4 product-level performance",
    auth: true,
    params: [
      { name: "days", type: "number", required: false, description: "Number of days to query (default: 30)" },
    ],
    response: "{ products: ProductPerformance[] }",
  },
  {
    method: "GET",
    path: "/api/ga4/funnel",
    description: "Query GA4 conversion funnel data",
    auth: true,
    params: [
      { name: "days", type: "number", required: false, description: "Number of days to query (default: 30)" },
    ],
    response: "{ funnel: FunnelStep[] }",
  },
];

export default function APIDocsPage() {
  function getMethodBadge(method: string): React.ReactNode {
    const className = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";
    switch (method) {
      case "GET":
        return <span className={`${className} bg-blue-500/10 text-blue-500 border-blue-500/30`}>{method}</span>;
      case "POST":
        return <span className={`${className} bg-green-500/10 text-green-500 border-green-500/30`}>{method}</span>;
      case "PATCH":
        return <span className={`${className} bg-yellow-500/10 text-yellow-500 border-yellow-500/30`}>{method}</span>;
      case "DELETE":
        return <span className={`${className} bg-red-500/10 text-red-500 border-red-500/30`}>{method}</span>;
      default:
        return <span className={`${className} bg-gray-500/10 text-gray-500 border-gray-500/30`}>{method}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          REST API endpoints for MCDM Commerce Optimizer
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Most endpoints require authentication. Include your Firebase Auth token in the
          Authorization header:
        </p>
        <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm overflow-x-auto">
          {`Authorization: Bearer <your-firebase-token>`}
        </pre>
      </Card>

      <div className="space-y-4">
        {apiEndpoints.map((endpoint, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getMethodBadge(endpoint.method)}
                <code className="text-sm font-mono">{endpoint.path}</code>
              </div>
              {endpoint.auth && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-500 border-purple-500/30">
                  🔒 Auth Required
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {endpoint.description}
            </p>

            {endpoint.params && endpoint.params.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Parameters</h4>
                <div className="space-y-2">
                  {endpoint.params.map((param, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm p-3 bg-gray-50 dark:bg-gray-800/50 rounded"
                    >
                      <code className="font-mono text-blue-600 dark:text-blue-400">
                        {param.name}
                      </code>
                      <span className="text-gray-500">:</span>
                      <code className="font-mono text-purple-600 dark:text-purple-400">
                        {param.type}
                      </code>
                      {param.required && (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-500 border-red-500/30">
                          required
                        </span>
                      )}
                      <span className="text-gray-600 dark:text-gray-400 flex-1">
                        {param.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endpoint.response && (
              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm overflow-x-auto">
                  {endpoint.response}
                </pre>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-semibold mb-2">Rate Limits</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          API requests are rate-limited to 100 requests per minute per user. Exceeding
          this limit will result in 429 (Too Many Requests) responses.
        </p>
      </Card>

      <Card className="p-6 bg-green-50 dark:bg-green-900/20">
        <h3 className="font-semibold mb-2">Support</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          For API support, contact{" "}
          <a href="mailto:api@mcdm-optimizer.com" className="text-blue-600 hover:underline">
            api@mcdm-optimizer.com
          </a>
        </p>
      </Card>
    </div>
  );
}
