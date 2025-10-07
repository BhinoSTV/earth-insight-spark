import type {
  ChartConstructor,
  GeoRasterLayerConstructor,
  LeafletModule,
  ParseGeoraster,
} from "@/types/geospatial";

export {};

declare global {
  interface Window {
    L?: LeafletModule;
    Chart?: ChartConstructor;
    parseGeoraster?: ParseGeoraster;
    GeoRasterLayer?: GeoRasterLayerConstructor;
  }
}
