export interface ChartData {
  dates: string[];
  netWorthData: number[];
  cashData: number[];
  investmentData: number[];
}

export interface DonutChartData {
  name: string;
  value: number;
}

export interface CashChartData {
  cashData: DonutChartData[];
  totalCash: number;
}

export interface InvestmentChartData {
  investData: DonutChartData[];
  totalInvest: number;
}

export interface CurrencyChartData {
  currencyData: DonutChartData[];
  totalAmount: number;
}

export interface PercentageHistory {
  dates: string[];
  percentages: number[];
}



