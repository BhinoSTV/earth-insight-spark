declare module "geojson" {
  export interface GeoJsonObject {
    type: string;
    bbox?: number[];
  }

  export interface Feature<P = Record<string, unknown>> extends GeoJsonObject {
    id?: string | number;
    properties: P | null;
  }
}
