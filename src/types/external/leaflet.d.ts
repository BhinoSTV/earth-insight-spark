declare module "leaflet" {
  export type LatLngExpression = [number, number];
  export type LatLngBoundsExpression = unknown;

  export interface GeoJsonObject {
    type: string;
    bbox?: number[];
  }

  export interface Feature<P = Record<string, unknown>> extends GeoJsonObject {
    id?: string | number;
    properties: P | null;
  }

  export interface Layer {
    addTo(map: Map): Layer;
    remove(): void;
  }

  export interface PopupLayer extends Layer {
    bindPopup(html: string): PopupLayer;
    on(event: string, handler: () => void): PopupLayer;
    getBounds?(): LatLngBoundsExpression;
  }

  export interface Map {
    setView(center: LatLngExpression, zoom: number): Map;
    remove(): void;
    fitBounds(bounds: LatLngBoundsExpression, options?: Record<string, unknown>): Map;
    invalidateSize(options?: Record<string, unknown>): Map;
    removeLayer(layer: Layer): Map;
  }

  export type TileLayer = Layer;

  export interface GeoJSONOptions {
    onEachFeature?: (feature: Feature | null, layer: PopupLayer) => void;
  }

  export type GeoJSONLayer = PopupLayer;

  export interface LeafletModule {
    map(element: HTMLElement): Map;
    tileLayer(template: string, options?: Record<string, unknown>): TileLayer;
    geoJSON(data: GeoJsonObject, options?: GeoJSONOptions): GeoJSONLayer;
  }

  export function map(element: HTMLElement): Map;
  export function tileLayer(template: string, options?: Record<string, unknown>): TileLayer;
  export function geoJSON(data: GeoJsonObject, options?: GeoJSONOptions): GeoJSONLayer;
}
