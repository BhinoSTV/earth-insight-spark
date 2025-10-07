declare module "chart.js" {
  export type ChartDataset = {
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  };

  export type ChartConfiguration = {
    type: string;
    data: {
      labels: string[];
      datasets: ChartDataset[];
    };
    options?: Record<string, unknown>;
  };

  export class Chart {
    constructor(
      context: CanvasRenderingContext2D | HTMLCanvasElement,
      configuration: ChartConfiguration
    );

    destroy(): void;
  }

  export { Chart as default };
}
