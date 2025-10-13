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
import L, { type LatLngBoundsExpression, type Layer, type Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, GeoJsonObject } from "../../types/geojson";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import { Loader2, Menu, X } from "lucide-react";

type LayerConfig = {
  showMonthlyChart: boolean;
  legend: string;
};

const RAW_LAYER_CONFIG: Record<string, LayerConfig> = {
  GW_Recharge: { showMonthlyChart: true, legend: "GW Recharge - m/s" },
  River_Discharge: { showMonthlyChart: true, legend: "River Discharge - cu. m/s" },
  Subbasin: { showMonthlyChart: false, legend: "Subbasin" },
  River: { showMonthlyChart: true, legend: "River Discharge - cu. m/s" },
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
    LAYER_CONFIG_LOOKUP.get(normalizedName) ?? {
      showMonthlyChart: false,
      legend: "Attributes",
    }
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

    const initialize = async () => {
      try {
        setIsLoading(true);
        if (!mapContainerRef.current) {
          throw new Error("Leaflet map container is unavailable.");
        }

        const map = L.map(mapContainerRef.current).setView([18.2, 120.6], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

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

    void initialize();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      currentLayerRef.current = null;
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

          const vectorLayer = L.geoJSON(geojson, {
            onEachFeature(feature: Feature | null, featureLayer: Layer) {
              const properties = (feature?.properties ?? {}) as Record<string, unknown>;
              const hasMonthlyValues = MONTHS.every(
                (month) => properties[month] !== undefined
              );

              if (config.showMonthlyChart && hasMonthlyValues) {
                const values = MONTHS.map((month) => {
                  const rawValue = properties[month];
                  if (typeof rawValue === "number") {
                    return rawValue;
                  }
                  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
                    const parsed = Number(rawValue);
                    return Number.isFinite(parsed) ? parsed : 0;
                  }
                  return 0;
                });

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

                  const chartConfig: ChartConfiguration = {
                    type: "line",
                    data: {
                      labels: MONTHS,
                      datasets: [
                        {
                          label: config.legend,
                          data: values,
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
                          title: { display: true, text: config.legend },
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
          const rasterLayer = new GeoRasterLayer({ georaster });
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
