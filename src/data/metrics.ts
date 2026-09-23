export interface CityMetrics {
  happiness: number;
  trust: number;
  economy: number;
  equality: number;
  safety: number;
  environment: number;
}

export const initialMetrics: CityMetrics = {
  happiness: 60,
  trust: 60,
  economy: 60,
  equality: 60,
  safety: 60,
  environment: 60,
};

export const metricIcons: Record<keyof CityMetrics, string> = {
  happiness: "😊",
  trust: "🤝",
  economy: "💰",
  equality: "⚖️",
  safety: "🛡️",
  environment: "🌳",
};
