import { createContext } from "react";

export interface CurrencyContextValue {
  fmt: (vndAmount: number) => string;
  fmtUsd: (usdAmount: number) => string;
  usdToVnd: number;
  updateRate: (rate: number) => Promise<void>;
  loading: boolean;
}

export const CurrencyContext = createContext<CurrencyContextValue>({
  fmt: (n) => n.toLocaleString("vi-VN") + "₫",
  fmtUsd: (n) =>
    "$" +
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  usdToVnd: 25500,
  updateRate: async () => {},
  loading: false,
});
