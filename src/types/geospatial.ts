import type * as Leaflet from "leaflet";
import type { Chart, ChartConfiguration } from "chart.js";

export type LeafletModule = typeof Leaflet;

export type ChartConstructor = new (
  context: CanvasRenderingContext2D | HTMLCanvasElement,
  config: ChartConfiguration
) => Chart;

export type GeoRaster = Record<string, unknown>;

export type ParseGeoraster = (data: ArrayBuffer) => Promise<GeoRaster>;

export type GeoRasterLayerInstance = Leaflet.Layer & {
  getBounds?: () => Leaflet.LatLngBoundsExpression;
};

export type GeoRasterLayerConstructor = new (options: {
  georaster: GeoRaster;
}) => GeoRasterLayerInstance;
