import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Chart, type ChartConfiguration } from "chart.js";
import "chart.js/auto";
import * as Leaflet from "leaflet";
import type { LatLngBoundsExpression, Layer, Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, GeoJsonObject } from "../../types/geojson";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import { Loader2, Menu, X } from "lucide-react";

type LayerConfig = {
  showMonthlyChart?: boolean;
  legend?: string;
};

const RAW_LAYER_CONFIG: Record<string, LayerConfig> = {
  GW_Recharge: { showMonthlyChart: true, legend: "GW Recharge - m/s" },
  River_Discharge: { showMonthlyChart: true, legend: "River Discharge - cu. m/s" },
  Subbasin: { showMonthlyChart: false, legend: "Subbasin" },
  River: { showMonthlyChart: true, legend: "River Discharge - cu. m/s" },
};

const COLOR_STOPS: Array<{ stop: number; color: [number, number, number] }> = [
  { stop: 0, color: [37, 99, 235] },
  { stop: 0.5, color: [34, 197, 94] },
  { stop: 1, color: [220, 38, 38] },
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const interpolateColor = (
  start: [number, number, number],
  end: [number, number, number],
  ratio: number
) =>
  start.map((component, index) =>
    Math.round(component + (end[index] - component) * ratio)
  ) as [number, number, number];

const createColorInterpolator = (minimum: number, maximum: number) => {
  const safeMin = Number.isFinite(minimum) ? minimum : 0;
  const safeMax = Number.isFinite(maximum) && maximum !== minimum ? maximum : safeMin + 1;

  return (value: number) => {
    if (!Number.isFinite(value)) {
      return null;
    }

    const ratio = clamp((value - safeMin) / (safeMax - safeMin), 0, 1);

    for (let index = 0; index < COLOR_STOPS.length - 1; index += 1) {
      const current = COLOR_STOPS[index];
      const next = COLOR_STOPS[index + 1];

      if (ratio >= current.stop && ratio <= next.stop) {
        const rangeRatio =
          (ratio - current.stop) / (next.stop - current.stop || 1);
        const [red, green, blue] = interpolateColor(
          current.color,
          next.color,
          rangeRatio
        );
        return `rgba(${red}, ${green}, ${blue}, 0.82)`;
      }
    }

    const [red, green, blue] = COLOR_STOPS[COLOR_STOPS.length - 1].color;
    return `rgba(${red}, ${green}, ${blue}, 0.82)`;
  };
};

const extractNoDataValues = (georaster: Awaited<ReturnType<typeof parseGeoraster>>) => {
  const candidates = new Set<number>();

  const potentialKeys: Array<keyof typeof georaster> = [
    "noDataValue",
    "nodataValue",
    "nodata_value",
    "NODATA_value",
  ];

  for (const key of potentialKeys) {
    const rawValue = georaster[key];
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      candidates.add(rawValue);
    }
  }

  const metadata = georaster.metadata as Record<string, unknown> | undefined;
  if (metadata) {
    const metaNoData =
      (metadata["NODATA_value"] ?? metadata["nodata"] ?? metadata["NODATA"]) as
        | number
        | null
        | undefined;
    if (typeof metaNoData === "number" && Number.isFinite(metaNoData)) {
      candidates.add(metaNoData);
    }
  }

  return candidates;
};

const extractValueRange = (georaster: Awaited<ReturnType<typeof parseGeoraster>>) => {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;

  const pushCandidate = (value: number) => {
    if (Number.isFinite(value)) {
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
  };

  const mins = Array.isArray(georaster.mins) ? georaster.mins : [];
  const maxs = Array.isArray(georaster.maxs) ? georaster.maxs : [];

  mins.forEach((candidate) => {
    if (typeof candidate === "number") {
      pushCandidate(candidate);
    }
  });

  maxs.forEach((candidate) => {
    if (typeof candidate === "number") {
      pushCandidate(candidate);
    }
  });

  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
    const rasters = Array.isArray(georaster.rasters) ? georaster.rasters : [];
    for (const band of rasters) {
      if (!Array.isArray(band)) {
        continue;
      }

      for (const value of band) {
        if (typeof value === "number" && Number.isFinite(value)) {
          pushCandidate(value);
        }
      }
    }
  }

  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
    return { minimum: 0, maximum: 1 };
  }

  if (minimum === maximum) {
    return { minimum, maximum: minimum + 1 };
  }

  return { minimum, maximum };
};

const normalizeLayerKey = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");

const LAYER_CONFIG_LOOKUP = Object.entries(RAW_LAYER_CONFIG).reduce(
  (accumulator, [key, value]) => {
    const normalizedKey = normalizeLayerKey(key);
    accumulator.set(key, value);
    accumulator.set(normalizedKey, value);
    return accumulator;
  },
  new Map<string, LayerConfig>()
);

const getLayerConfig = (layerName: string): LayerConfig => {
  const normalizedName = normalizeLayerKey(layerName);
  return (
    LAYER_CONFIG_LOOKUP.get(layerName) ??
    LAYER_CONFIG_LOOKUP.get(normalizedName) ?? {}
  );
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const normalizePropertyKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

const deriveMonthlySeries = (properties: Record<string, unknown>): number[] | null => {
  const remainingEntries = Object.entries(properties).map(([key, value]) => ({
    key,
    normalized: normalizePropertyKey(key),
    value,
  }));

  const consumedIndexes = new Set<number>();
  let matchedCount = 0;
  const values = MONTHS.map((month) => {
    const normalizedMonth = normalizePropertyKey(month);
    const normalizedAbbreviation = normalizePropertyKey(month.slice(0, 3));

    const matchIndex = remainingEntries.findIndex(({ normalized }, index) => {
      if (consumedIndexes.has(index)) {
        return false;
      }

      return (
        normalized === normalizedMonth ||
        normalized === normalizedAbbreviation ||
        normalized.endsWith(normalizedMonth) ||
        normalized.endsWith(normalizedAbbreviation) ||
        normalized.includes(normalizedMonth) ||
        normalized.includes(normalizedAbbreviation)
      );
    });

    if (matchIndex === -1) {
      return 0;
    }

    consumedIndexes.add(matchIndex);
    matchedCount += 1;
    const rawValue = remainingEntries[matchIndex]?.value;

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return rawValue;
    }

    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  });

  return matchedCount >= 3 ? values : null;
};

const METRIC_KEY_MATCHERS = [
  "metric",
  "metrics",
  "unit",
  "units",
  "measurement",
  "measure",
  "valueunit",
  "unitofmeasure",
  "unitmeasure",
];

const deriveLegendLabel = (
  layerName: string,
  properties: Record<string, unknown>,
  config: LayerConfig
) => {
  const configuredLegend = config.legend?.trim();
  if (configuredLegend) {
    return configuredLegend;
  }

  for (const [key, rawValue] of Object.entries(properties)) {
    const normalizedKey = normalizePropertyKey(key);
    const matchesMetricKey =
      METRIC_KEY_MATCHERS.includes(normalizedKey) ||
      normalizedKey.endsWith("metric") ||
      normalizedKey.endsWith("metrics") ||
      normalizedKey.endsWith("unit") ||
      normalizedKey.endsWith("units");

    if (!matchesMetricKey) {
      continue;
    }

    if (typeof rawValue === "string" && rawValue.trim()) {
      return `${layerName} - ${rawValue.trim()}`;
    }
  }

  return `${layerName} (Monthly values)`;
};

const buildRasterLayer = (
  georaster: Awaited<ReturnType<typeof parseGeoraster>>
) => {
  const noDataValues = extractNoDataValues(georaster);
  const { minimum, maximum } = extractValueRange(georaster);
  const colorInterpolator = createColorInterpolator(minimum, maximum);

  const rasterLayer = new GeoRasterLayer({
    georaster,
    resolution: 256,
    pixelValuesToColorFn: (values) => {
      const value = Array.isArray(values) ? values[0] : undefined;
      if (typeof value !== "number" || Number.isNaN(value)) {
        return null;
      }

      if (noDataValues.has(value)) {
        return null;
      }

      return colorInterpolator(value) ?? null;
    },
  });

  if (typeof rasterLayer.setOpacity === "function") {
    rasterLayer.setOpacity(0.78);
  }

  return rasterLayer;
};

type LayerRecord = {
  id?: number;
  name: string;
  layer_type?: string | null;
  description?: string | null;
  source_archive?: string | null;
  geojson_file?: string | null;
  geojson_url?: string | null;
  raster_file?: string | null;
  raster_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

const CLEAR_LAYER_VALUE = "__clear_layer__";
type PopupLayer = Layer & {
  bindPopup(content: string): PopupLayer;
  on(event: string, handler: () => void): PopupLayer;
  getBounds?(): LatLngBoundsExpression;
};

const GeoHissViewer = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const currentLayerRef = useRef<Layer | null>(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [layers, setLayers] = useState<LayerRecord[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>("");
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let frameHandle: number | null = null;

    const initialize = async () => {
      try {
        setIsLoading(true);

        if (mapInstanceRef.current || isCancelled) {
          return;
        }

        const container = mapContainerRef.current;
        if (!container) {
          frameHandle = window.requestAnimationFrame(initialize);
          return;
        }

        const map = Leaflet.map(container).setView([18.2, 120.6], 10);
        Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        if (isCancelled) {
          map.remove();
          return;
        }

        mapInstanceRef.current = map;
        setMapReady(true);
        setError(null);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to initialize the Geo-HISS viewer.";
        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    frameHandle = window.requestAnimationFrame(initialize);

    return () => {
      isCancelled = true;
      if (frameHandle !== null) {
        window.cancelAnimationFrame(frameHandle);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      currentLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 768) {
        return;
      }

      const panel = panelRef.current;
      const toggle = toggleButtonRef.current;
      const target = event.target as Node | null;

      if (!panel || !toggle || !target) {
        return;
      }

      if (!panel.contains(target) && !toggle.contains(target)) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPanelOpen]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    let isCancelled = false;

    const fetchLayers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/layers/");
        if (!response.ok) {
          throw new Error("Unable to load available layers.");
        }

        const data = (await response.json()) as unknown;
        if (!Array.isArray(data)) {
          throw new Error("The layers endpoint returned an unexpected response.");
        }

        if (isCancelled) {
          return;
        }

        const normalizedLayers = data.reduce<LayerRecord[]>((acc, entry) => {
          if (typeof entry !== "object" || entry === null) {
            return acc;
          }

          const rawName = (entry as { name?: unknown }).name;
          if (typeof rawName !== "string") {
            return acc;
          }

          const trimmedName = rawName.trim();
          if (!trimmedName) {
            return acc;
          }

          acc.push({ ...(entry as LayerRecord), name: trimmedName });
          return acc;
        }, []);

        setLayers(normalizedLayers);
        setError(null);
      } catch (fetchError) {
        if (isCancelled) {
          return;
        }
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load available layers.";
        setError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchLayers();

    return () => {
      isCancelled = true;
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    const invalidate = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", invalidate);

    return () => {
      window.removeEventListener("resize", invalidate);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    const timeout = window.setTimeout(() => {
      map.invalidateSize();
    }, 320);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isPanelOpen, layers.length]);

  const removeCurrentLayer = useCallback(() => {
    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    const layer = currentLayerRef.current;
    if (layer) {
      map.removeLayer(layer);
      currentLayerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!selectedLayer) {
      return;
    }

    const exists = layers.some((layer) => layer.name === selectedLayer);
    if (!exists) {
      setSelectedLayer("");
      removeCurrentLayer();
    }
  }, [layers, removeCurrentLayer, selectedLayer]);

  const changeLayer = useCallback(
    async (layerName: string) => {
      if (layerName === CLEAR_LAYER_VALUE || !layerName) {
        setSelectedLayer("");
        removeCurrentLayer();
        setError(null);
        return;
      }

      setSelectedLayer(layerName);

      const map = mapInstanceRef.current;
      const layerDefinition = layers.find((item) => item.name === layerName);

      if (!map || !layerDefinition) {
        return;
      }

      removeCurrentLayer();
      setIsLoading(true);
      setError(null);

      const config = getLayerConfig(layerName);
      const normalizedType = (layerDefinition.layer_type || "").toLowerCase();
      const derivedType = normalizedType
        ? normalizedType
        : layerDefinition.geojson_file || layerDefinition.geojson_url
          ? "vector"
          : layerDefinition.raster_file || layerDefinition.raster_url
            ? "raster"
            : "";

      try {
        if (derivedType === "vector" && (layerDefinition.geojson_file || layerDefinition.geojson_url)) {
          const geojsonUrl = layerDefinition.geojson_file || layerDefinition.geojson_url || "";
          const response = await fetch(geojsonUrl);
          if (!response.ok) {
            throw new Error("Unable to load the selected vector layer.");
          }

          const geojson = (await response.json()) as GeoJsonObject;

          const vectorLayer = Leaflet.geoJSON(geojson, {
            onEachFeature(feature: Feature | null, featureLayer: Layer) {
              const properties = (feature?.properties ?? {}) as Record<string, unknown>;
              const monthlySeries = deriveMonthlySeries(properties);
              const shouldRenderMonthlyChart =
                monthlySeries !== null && config.showMonthlyChart !== false;

              if (shouldRenderMonthlyChart && monthlySeries) {
                const legendLabel = deriveLegendLabel(layerName, properties, config);
                const chartId = `chart-${Math.random().toString(36).slice(2)}`;
                let chartInstance: Chart | null = null;
                const popupLayer = featureLayer as PopupLayer;

                popupLayer.bindPopup(
                  `<div style="width:320px;height:260px;"><canvas id="${chartId}"></canvas></div>`
                );

                popupLayer.on("popupopen", () => {
                  const canvas = document.getElementById(chartId) as HTMLCanvasElement | null;
                  if (!canvas) {
                    return;
                  }

                  const chartConfig: ChartConfiguration<"line", number[], string> = {
                    type: "line",
                    data: {
                      labels: MONTHS,
                      datasets: [
                        {
                          label: legendLabel,
                          data: monthlySeries,
                          borderColor: "rgba(54, 162, 235, 1)",
                          backgroundColor: "rgba(54, 162, 235, 0.15)",
                          tension: 0.3,
                          borderWidth: 2,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                        },
                      ],
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true },
                        title: {
                          display: true,
                          text: `${layerName} (${String(
                            properties["Subbasin"] ?? properties["SUB"] ?? "Feature"
                          )})`,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: legendLabel },
                        },
                        x: {
                          title: { display: true, text: "Month" },
                        },
                      },
                    },
                  };

                  chartInstance = new Chart(canvas, chartConfig);
                });

                popupLayer.on("popupclose", () => {
                  chartInstance?.destroy();
                  chartInstance = null;
                });
              } else {
                const rows = Object.entries(properties)
                  .map(([key, value]) => {
                    const displayValue =
                      value === null || value === undefined ? "" : String(value);
                    return `<tr><td style="font-weight:600;padding-right:8px;">${key}</td><td>${displayValue}</td></tr>`;
                  })
                  .join("") ||
                  '<tr><td colspan="2" style="padding:4px 0;">No attributes available.</td></tr>';

                const popupLayer = featureLayer as PopupLayer;
                popupLayer.bindPopup(
                  `<div style="max-width:360px;max-height:260px;overflow:auto"><h4 style="font-weight:600;margin-bottom:8px;">${
                    layerName
                  }</h4><table style="width:100%;font-size:12px;">${rows}</table></div>`
                );
              }
            },
          });

          vectorLayer.addTo(map);
          currentLayerRef.current = vectorLayer;

          try {
            const padding: [number, number] = [20, 20];
            map.fitBounds(vectorLayer.getBounds(), { padding });
          } catch (boundsError) {
            console.warn("Unable to compute bounds for the selected layer.", boundsError);
          }
        } else if (derivedType === "raster" && (layerDefinition.raster_file || layerDefinition.raster_url)) {
          const rasterUrl = layerDefinition.raster_file || layerDefinition.raster_url || "";
          const response = await fetch(rasterUrl);
          if (!response.ok) {
            throw new Error("Unable to load the selected raster layer.");
          }

          const arrayBuffer = await response.arrayBuffer();
          const georaster = await parseGeoraster(arrayBuffer);
          const rasterLayer = buildRasterLayer(georaster);
          rasterLayer.addTo(map);
          currentLayerRef.current = rasterLayer;

          try {
            if (typeof rasterLayer.getBounds === "function") {
              map.fitBounds(rasterLayer.getBounds());
            }
          } catch (boundsError) {
            console.warn("Unable to compute bounds for the raster layer.", boundsError);
          }
        } else {
          throw new Error("The selected layer does not have an associated data source.");
        }

        setError(null);

        if (window.innerWidth < 768) {
          setIsPanelOpen(false);
        }
      } catch (layerError) {
        removeCurrentLayer();
        const message =
          layerError instanceof Error
            ? layerError.message
            : "Unable to display the selected layer.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [layers, removeCurrentLayer]
  );

  const handleLayerChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      void changeLayer(event.target.value);
    },
    [changeLayer]
  );

  const activeLayer = selectedLayer
    ? layers.find((layer) => layer.name === selectedLayer)
    : null;

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load Geo-HISS data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="relative w-full min-h-[500px] overflow-hidden rounded-lg border border-border bg-muted/20">
        <Button
          ref={toggleButtonRef}
          variant="secondary"
          size="icon"
          className="absolute right-4 top-4 z-30 h-10 w-10 md:hidden"
          onClick={() => setIsPanelOpen((prev) => !prev)}
        >
          {isPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle layer panel</span>
        </Button>

        <div className="pointer-events-none absolute left-4 top-4 z-30 hidden w-64 flex-col gap-2 md:flex">
          <Label className="pointer-events-auto text-xs uppercase tracking-wide text-muted-foreground">
            Active layer
          </Label>
          <Select
            value={selectedLayer || undefined}
            onValueChange={(value) => {
              void changeLayer(value);
            }}
            disabled={!layers.length || !mapReady}
          >
            <SelectTrigger className="pointer-events-auto h-10 w-full bg-background/95 text-left text-sm shadow">
              <SelectValue placeholder="Select a layer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_LAYER_VALUE} disabled={!selectedLayer}>
                Clear selection
              </SelectItem>
              {layers.map((layer) => (
                <SelectItem key={layer.name} value={layer.name}>
                  {layer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          ref={panelRef}
          className={cn(
            "absolute left-4 right-4 top-20 z-20 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow transition-all duration-300",
            "hidden md:static md:top-auto md:block md:h-auto md:w-96 md:max-w-none md:overflow-visible md:p-4 md:shadow-sm",
            isPanelOpen ? "block translate-y-0 opacity-100" : "-translate-y-4 opacity-0 md:opacity-100 md:translate-y-0"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Layer Selector</h2>
              <p className="text-sm text-muted-foreground">
                Choose a dataset to overlay on the Geo-HISS map.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsPanelOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close layer panel</span>
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="layerSelect">Select layer</Label>
              <select
                id="layerSelect"
                value={selectedLayer}
                onChange={handleLayerChange}
                disabled={!layers.length || !mapReady}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">-- Select Layer --</option>
                {layers.map((layer) => (
                  <option key={layer.name} value={layer.name}>
                    {layer.name}
                  </option>
                ))}
              </select>
            </div>

            {!layers.length && mapReady && !isLoading ? (
              <p className="text-sm text-muted-foreground">
                No layers are available yet. Add data in the admin to get started.
              </p>
            ) : null}

            {activeLayer ? (
              <div className="space-y-3 rounded-md border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">{activeLayer.name}</span>
                  {activeLayer.layer_type ? (
                    <span className="uppercase tracking-wide text-xs text-muted-foreground/80">
                      {activeLayer.layer_type.toUpperCase()}
                    </span>
                  ) : null}
                </div>
                {activeLayer.description ? <p>{activeLayer.description}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {activeLayer.geojson_file ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={activeLayer.geojson_file} target="_blank" rel="noreferrer">
                        Download GeoJSON
                      </a>
                    </Button>
                  ) : null}
                  {activeLayer.raster_file ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={activeLayer.raster_file} target="_blank" rel="noreferrer">
                        Download Raster
                      </a>
                    </Button>
                  ) : null}
                  {activeLayer.source_archive ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={activeLayer.source_archive} target="_blank" rel="noreferrer">
                        Source Archive
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div ref={mapContainerRef} className="absolute inset-0 z-10" />

        {isLoading ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GeoHissViewer;
