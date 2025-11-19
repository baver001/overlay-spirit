export function currencyFormat(cents: number, currency = "USD") {
  const value = cents / 100;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
  }).format(value);
}

