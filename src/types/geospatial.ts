import type { Chart, ChartConfiguration } from "chart.js";
import type { Feature, GeoJsonObject } from "./geojson";

export type ChartConstructor = new (
  context: CanvasRenderingContext2D | HTMLCanvasElement,
  config: ChartConfiguration
) => Chart;

export type LeafletLatLng = [number, number];

export type LeafletBounds = unknown;

export interface LeafletLayer {
  addTo(map: LeafletMap): LeafletLayer;
  remove(): void;
}

export interface LeafletPopupLayer extends LeafletLayer {
  bindPopup(html: string): LeafletPopupLayer;
  on(event: string, handler: () => void): LeafletPopupLayer;
  getBounds?(): LeafletBounds;
}

export interface LeafletMap {
  setView(center: LeafletLatLng, zoom: number): LeafletMap;
  remove(): void;
  fitBounds(bounds: LeafletBounds, options?: Record<string, unknown>): LeafletMap;
  invalidateSize(options?: Record<string, unknown>): LeafletMap;
  removeLayer(layer: LeafletLayer): LeafletMap;
}

export interface LeafletGeoJsonOptions {
  onEachFeature?: (feature: Feature | null, layer: LeafletPopupLayer) => void;
}

export interface LeafletModule {
  map(element: HTMLElement, options?: Record<string, unknown>): LeafletMap;
  tileLayer(template: string, options?: Record<string, unknown>): LeafletLayer;
  geoJSON(data: GeoJsonObject, options?: LeafletGeoJsonOptions): LeafletPopupLayer;
}

export type GeoRaster = Record<string, unknown>;

export type ParseGeoraster = (data: ArrayBuffer) => Promise<GeoRaster>;

export interface GeoRasterLayerInstance extends LeafletLayer {
  getBounds?: () => LeafletBounds;
}

export type GeoRasterLayerConstructor = new (options: {
  georaster: GeoRaster;
}) => GeoRasterLayerInstance;
