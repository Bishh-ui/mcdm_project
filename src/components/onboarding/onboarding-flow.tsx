"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has completed onboarding
    if (typeof window !== "undefined") {
      const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
      return !hasCompletedOnboarding;
    }
    return false;
  });

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to MCDM Commerce Optimizer",
      description:
        "Make data-driven product ranking decisions using multi-criteria decision analysis.",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            This platform helps you rank products using TOPSIS (Technique for Order
            of Preference by Similarity to Ideal Solution) with full transparency
            and governance.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium mb-1">Multi-Criteria Ranking</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rank products across multiple business dimensions
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🔬</div>
              <h4 className="font-medium mb-1">A/B Testing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test ranking strategies and measure impact
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🤖</div>
              <h4 className="font-medium mb-1">AI Insights</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get explanations and optimization suggestions
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="font-medium mb-1">Full Governance</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Audit trail and approval workflows built-in
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "criteria",
      title: "Define Your Criteria",
      description:
        "Start by defining the criteria that matter for your product rankings.",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Criteria are the dimensions you&apos;ll use to evaluate products. Examples:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
              <span className="font-semibold">Conversion Rate</span> — How often visitors buy this
                product
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <strong>Revenue Per Visitor</strong> — Average revenue generated
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <strong>Customer Rating</strong> — Product review score
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <strong>Inventory Level</strong> — Stock availability
              </div>
            </li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Tip:</strong> Start with 3-5 criteria. You can always add
              more later.
            </p>
          </div>
        </div>
      ),
      action: {
        label: "Go to Criteria Manager",
        href: "/dashboard/criteria",
      },
    },
    {
      id: "connectors",
      title: "Connect Your Data Sources",
      description: "Link your e-commerce platform and analytics tools.",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Connect data sources to automatically populate criterion values:
          </p>
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
                🛍️
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Shopify</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Product catalog, orders, inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                📊
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Google Analytics 4</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Conversion events, user behavior
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded flex items-center justify-center">
                🗄️
              </div>
              <div className="flex-1">
                <h4 className="font-medium">BigQuery</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Custom data warehouse queries
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: "Connect Data Sources",
        href: "/dashboard/connectors",
      },
    },
    {
      id: "topsis",
      title: "Run Your First Ranking",
      description: "Use TOPSIS to rank products based on your criteria.",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Once you have criteria and data, you can run TOPSIS to get ranked
            results:
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium">Input Decision Matrix</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Products × criteria with scores
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium">Configure Policy</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Normalization method, tie-break rules
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium">Get Ranked Results</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full breakdown with scores and explanations
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: "Go to TOPSIS Runner",
        href: "/dashboard/topsis/run",
      },
    },
    {
      id: "experiments",
      title: "Test & Measure Impact",
      description: "Create experiments to validate your ranking strategies.",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Run A/B tests to measure the impact of TOPSIS-optimized rankings:
          </p>
          <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium mb-2">Experiment Workflow</h4>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. Create experiment with control vs treatment variants</li>
              <li>2. Deploy to a percentage of traffic</li>
              <li>3. Measure conversion rate, revenue, and other KPIs</li>
              <li>4. Declare winner when statistically significant</li>
              <li>5. Roll out winning variant to 100% of users</li>
            </ol>
          </div>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-900 dark:text-green-100">
              ✨ <strong>Pro Tip:</strong> Start with 10-20% traffic allocation to
              minimize risk.
            </p>
          </div>
        </div>
      ),
      action: {
        label: "Create Experiment",
        href: "/dashboard/experiments/new",
      },
    },
  ];

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleComplete() {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
    onComplete?.();
  }

  function handleSkip() {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
    onSkip?.();
  }

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 relative">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Skip tour
        </button>

        {/* Content */}
        <div className="mt-4">
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">
              Step {currentStep + 1} of {steps.length}
            </div>
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
          </div>

          <div className="mb-8">{step.content}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="secondary"
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-blue-500"
                      : index < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {step.action && (
                <Button
                  onClick={() => {
                    if (step.action?.href) {
                      window.location.href = step.action.href;
                    }
                    step.action?.onClick?.();
                    handleComplete();
                  }}
                  variant="secondary"
                >
                  {step.action.label}
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
