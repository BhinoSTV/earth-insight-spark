import { useCallback, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_COMPUTE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_AHP_COMPUTE_URL) ||
  "/api/ahp/compute/";

type Step = "criteria" | "pairs" | "processing" | "results";

type PairValue = { min: string; max: string };

type PairDefinition = {
  key: string;
  left: string;
  right: string;
  leftIndex: number;
  rightIndex: number;
};

type AHPMatrixResult = {
  matrix: number[][];
  weights: number[];
  cr: number;
};

type AHPComputationResponse = {
  duration: number;
  average_cr: number;
  average_weights: number[];
  valid_results: AHPMatrixResult[];
  error?: string;
};

type AHPComputePayload = {
  criteria_names: string[];
  bounds: Array<{
    left_index: number;
    right_index: number;
    min: number;
    max: number;
  }>;
};

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "-";

const AhpCalculator = () => {
  const { tokens } = useAuth();

  const [step, setStep] = useState<Step>("criteria");
  const [criteriaInput, setCriteriaInput] = useState("");
  const [criteria, setCriteria] = useState<string[]>([]);
  const [pairValues, setPairValues] = useState<Record<string, PairValue>>({});
  const [lastPayload, setLastPayload] = useState<AHPComputePayload | null>(null);
  const [results, setResults] = useState<AHPComputationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pairDefinitions = useMemo<PairDefinition[]>(() => {
    const defs: PairDefinition[] = [];
    criteria.forEach((left, leftIndex) => {
      for (let rightIndex = leftIndex + 1; rightIndex < criteria.length; rightIndex += 1) {
        const right = criteria[rightIndex];
        defs.push({
          key: `${leftIndex}-${rightIndex}`,
          left,
          right,
          leftIndex,
          rightIndex,
        });
      }
    });
    return defs;
  }, [criteria]);

  const handleCriteriaSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = criteriaInput
      .split(",")
      .map((name) => name.trim())
      .filter((name) => Boolean(name));

    if (parsed.length < 2) {
      setError("Please provide at least two criteria to compare.");
      return;
    }

    const initialPairs: Record<string, PairValue> = {};
    parsed.forEach((_, leftIndex) => {
      for (let rightIndex = leftIndex + 1; rightIndex < parsed.length; rightIndex += 1) {
        initialPairs[`${leftIndex}-${rightIndex}`] = { min: "", max: "" };
      }
    });

    setError(null);
    setResults(null);
    setLastPayload(null);
    setCriteria(parsed);
    setPairValues(initialPairs);
    setStep("pairs");
  };

  const handlePairValueChange = (
    key: string,
    field: keyof PairValue,
    value: string
  ) => {
    setPairValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const compute = useCallback(
    async (payload: AHPComputePayload) => {
      setIsSubmitting(true);
      setError(null);
      setStep("processing");

      try {
        if (!tokens?.access) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        const response = await fetch(DEFAULT_COMPUTE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        let data: AHPComputationResponse | { detail?: string; error?: string } | null = null;

        try {
          data = (await response.json()) as
            | AHPComputationResponse
            | { detail?: string; error?: string };
        } catch (parseError) {
          // If the backend sends back HTML (e.g. 502), surface a friendlier message.
          data = null;
        }

        if (!response.ok || (data && "error" in data && data.error)) {
          const apiError =
            (data && "error" in data && data.error) ||
            (data && "detail" in data && data.detail) ||
            null;

          throw new Error(apiError || "Unable to compute AHP matrices.");
        }

        setResults(data as AHPComputationResponse);
        setStep("results");
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to compute the AHP matrices. Please try again.";
        setError(message);
        setStep("pairs");
      } finally {
        setIsSubmitting(false);
      }
    },
    [tokens?.access]
  );

  const handlePairsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    for (const definition of pairDefinitions) {
      const values = pairValues[definition.key];
      if (!values?.min || !values?.max) {
        setError("Please provide both minimum and maximum values for each criteria pair.");
        return;
      }

      const minValue = Number(values.min);
      const maxValue = Number(values.max);

      if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
        setError("All pairwise inputs must be numeric.");
        return;
      }

      if (minValue > maxValue) {
        setError("Each minimum value must be less than or equal to its maximum value.");
        return;
      }
    }

    const payload: AHPComputePayload = {
      criteria_names: criteria,
      bounds: pairDefinitions.map(({ leftIndex, rightIndex, key }) => {
        const values = pairValues[key];
        return {
          left_index: leftIndex,
          right_index: rightIndex,
          min: Number(values.min),
          max: Number(values.max),
        };
      }),
    };

    setLastPayload(payload);
    await compute(payload);
  };

  const handleRegenerate = async () => {
    if (!lastPayload || isSubmitting) {
      return;
    }

    await compute(lastPayload);
  };

  const handleRestart = () => {
    setCriteriaInput("");
    setCriteria([]);
    setPairValues({});
    setLastPayload(null);
    setResults(null);
    setError(null);
    setStep("criteria");
  };

  const zeroCR = results?.valid_results.filter((result) => result.cr === 0) ?? [];
  const lowCR =
    results?.valid_results.filter((result) => result.cr > 0 && result.cr <= 0.1) ?? [];
  const highCR =
    results?.valid_results.filter((result) => result.cr && result.cr > 0.1) ?? [];

  const renderResultsTable = (title: string, entries: AHPMatrixResult[]) => {
    if (!entries.length) {
      return null;
    }

    return (
      <div key={title} className="space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Matrix</TableHead>
                <TableHead className="text-center">Weights</TableHead>
                <TableHead className="text-center">CR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={`${title}-${index}`}>
                  <TableCell>
                    <div className="overflow-x-auto">
                      <Table className="min-w-max border text-xs">
                        <TableBody>
                          {entry.matrix.map((row, rowIndex) => (
                            <TableRow key={`row-${rowIndex}`}>
                              {row.map((value, columnIndex) => (
                                <TableCell key={`cell-${columnIndex}`} className="border px-1 py-0.5">
                                  {formatNumber(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {entry.weights.map((weight) => formatNumber(weight)).join(", ")}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {formatNumber(entry.cr)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adaptive AHP Calculator</CardTitle>
        <CardDescription>
          Guide teams through Analytic Hierarchy Process comparisons with dynamic bounds and
          categorized results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === "criteria" ? (
          <form onSubmit={handleCriteriaSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="criteriaNames">Enter Criteria Names (comma-separated)</Label>
              <Input
                id="criteriaNames"
                value={criteriaInput}
                onChange={(event) => setCriteriaInput(event.target.value)}
                placeholder="e.g., Price, Quality, Durability"
                required
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Next
            </Button>
          </form>
        ) : null}

        {step === "pairs" ? (
          <form onSubmit={handlePairsSubmit} className="space-y-6">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] text-center">Criteria Pair</TableHead>
                    <TableHead className="text-center">Min Value</TableHead>
                    <TableHead className="text-center">Max Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairDefinitions.map(({ key, left, right }) => (
                    <TableRow key={key}>
                      <TableCell className="text-center font-medium">
                        {left} - {right}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={pairValues[key]?.min ?? ""}
                          onChange={(event) =>
                            handlePairValueChange(key, "min", event.target.value)
                          }
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={pairValues[key]?.max ?? ""}
                          onChange={(event) =>
                            handlePairValueChange(key, "max", event.target.value)
                          }
                          required
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setStep("criteria")}>
                Back
              </Button>
              <Button type="submit" className="sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Generate Matrices"}
              </Button>
            </div>
          </form>
        ) : null}

        {step === "processing" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="font-medium">Processing your AHP computation...</p>
            <p className="text-sm text-muted-foreground">
              This may take a few seconds depending on the number of matrices generated.
            </p>
          </div>
        ) : null}

        {step === "results" && results ? (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-semibold">
                Results (completed in {formatNumber(results.duration)}s)
              </h2>
              <p className="text-sm text-muted-foreground">
                Average CR: {formatNumber(results.average_cr)} — Weights: {" "}
                {results.average_weights.map((weight) => formatNumber(weight)).join(", ")}
              </p>
            </div>

        <div className="space-y-8">
          {renderResultsTable("Matrices with CR = 0", zeroCR)}
          {renderResultsTable("Matrices with 0 < CR ≤ 0.1", lowCR)}
          {renderResultsTable("Matrices with CR > 0.1", highCR)}
          {!zeroCR.length && !lowCR.length && !highCR.length ? (
            <p className="text-center text-sm text-muted-foreground">
              The computation completed without returning any valid matrices.
            </p>
          ) : null}
        </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleRegenerate} disabled={isSubmitting}>
                {isSubmitting ? "Regenerating..." : "Regenerate"}
              </Button>
              <Button variant="outline" onClick={handleRestart}>
                Restart
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default AhpCalculator;
