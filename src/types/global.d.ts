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
    parseGeoRaster?: ParseGeoraster;
    georaster?: {
      parseGeoraster?: ParseGeoraster;
      parse?: ParseGeoraster;
      default?: ParseGeoraster;
      GeoRasterLayer?: GeoRasterLayerConstructor;
    };
    GeoRaster?: {
      parseGeoraster?: ParseGeoraster;
      parse?: ParseGeoraster;
      default?: ParseGeoraster;
      GeoRasterLayer?: GeoRasterLayerConstructor;
    };
    GeoRasterLayer?: GeoRasterLayerConstructor;
  }
}
