export const MACRO_INDICATORS = {
  GDP: {
    seriesId: "GDP",
    name: "Gross Domestic Product",
    category: "output",
    frequency: "quarterly",
    units: "Billions of Dollars",
  },
  GDP_GROWTH: {
    seriesId: "A191RL1Q225SBEA",
    name: "Real GDP Growth Rate",
    category: "output",
    frequency: "quarterly",
    units: "Percent",
  },
  CPI: {
    seriesId: "CPIAUCSL",
    name: "Consumer Price Index",
    category: "inflation",
    frequency: "monthly",
    units: "Index 1982-1984=100",
  },
  UNEMPLOYMENT: {
    seriesId: "UNRATE",
    name: "Unemployment Rate",
    category: "employment",
    frequency: "monthly",
    units: "Percent",
  },
  FED_FUNDS: {
    seriesId: "FEDFUNDS",
    name: "Federal Funds Rate",
    category: "monetary_policy",
    frequency: "monthly",
    units: "Percent",
  },
} as const;

export type IndicatorKey = keyof typeof MACRO_INDICATORS;
export type Indicator = (typeof MACRO_INDICATORS)[IndicatorKey];
