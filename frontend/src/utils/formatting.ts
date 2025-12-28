export function currencyFormat(value: number | undefined | null, currencyCode: string): string {
  // Handle undefined/null values
  if (value === undefined || value === null || isNaN(value)) {
    value = 0;
  }
  
  const symbolMap: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "Fr.",
    CAD: "C$",
  };
  const symbol = symbolMap[currencyCode] || currencyCode;
  return `${symbol} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

