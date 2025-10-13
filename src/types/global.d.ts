import type { Chart } from "chart.js";
import type { GeoRaster } from "georaster";
import type GeoRasterLayer from "georaster-layer-for-leaflet";

export interface GeoRasterBundle {
  parseGeoraster(data: ArrayBuffer): Promise<GeoRaster>;
  GeoRasterLayer: typeof GeoRasterLayer;
}

declare global {
  interface Window {
    Chart?: typeof Chart;
    GeoRasterLayer?: typeof GeoRasterLayer;
    georaster?: GeoRaster;
    geoRasterBundle?: GeoRasterBundle;
  }
}

export {};
