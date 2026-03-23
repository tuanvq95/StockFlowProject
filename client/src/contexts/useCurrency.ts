import { useContext } from "react";
import { CurrencyContext } from "./currencyContextDef";

export function useCurrency() {
  return useContext(CurrencyContext);
}
