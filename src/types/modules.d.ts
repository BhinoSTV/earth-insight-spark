import type { Feature, GeoJsonObject } from "./geojson";

declare module "leaflet" {
  export type LatLngTuple = [number, number];
  export type LatLngExpression = LatLngTuple;
  export type LatLngBoundsLiteral = [LatLngTuple, LatLngTuple];
  export type LatLngBoundsExpression = LatLngBoundsLiteral;

  export interface GridLayerOptions {
    [key: string]: unknown;
  }

  export class Layer {
    addTo(map: Map): this;
    remove(): this;
  }

  export class Map {
    constructor(element: HTMLElement | string, options?: Record<string, unknown>);
    setView(center: LatLngExpression, zoom: number): this;
    remove(): void;
    fitBounds(bounds: LatLngBoundsExpression, options?: Record<string, unknown>): this;
    invalidateSize(options?: Record<string, unknown>): this;
    removeLayer(layer: Layer): this;
  }

  export class TileLayer extends Layer {}

  export interface GeoJSONOptions {
    onEachFeature?: (feature: Feature | null, layer: Layer) => void;
  }

  export class GeoJSON extends Layer {
    getBounds(): LatLngBoundsExpression;
  }

  export function map(element: HTMLElement | string, options?: Record<string, unknown>): Map;
  export function tileLayer(urlTemplate: string, options?: Record<string, unknown>): TileLayer;
  export function geoJSON(data: GeoJsonObject, options?: GeoJSONOptions): GeoJSON;

  export { GeoJSON as GeoJSONClass };

  const L: {
    map: typeof map;
    tileLayer: typeof tileLayer;
    geoJSON: typeof geoJSON;
  };

  export default L;
}

declare module "georaster" {
  export type GeoRaster = {
    height?: number;
    width?: number;
    noDataValue?: number | null;
    pixelHeight?: number;
    pixelWidth?: number;
    projection?: string;
    rasters?: number[][];
    [key: string]: unknown;
  };

  export default function parseGeoraster(data: ArrayBuffer): Promise<GeoRaster>;
}

declare module "georaster-layer-for-leaflet" {
  import type { GeoRaster } from "georaster";
  import type { GridLayerOptions, LatLngBoundsExpression, Layer } from "leaflet";

  export interface GeoRasterLayerOptions extends GridLayerOptions {
    georaster: GeoRaster;
  }

  export default class GeoRasterLayer extends Layer {
    constructor(options: GeoRasterLayerOptions);
    getBounds(): LatLngBoundsExpression;
  }
}
