import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { configService } from "../services/configService";
import { CurrencyContext } from "./currencyContextDef";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [usdToVnd, setUsdToVnd] = useState(25500);
  const [loading, setLoading] = useState(true);

  const fetchRate = useCallback(async () => {
    try {
      const data = await configService.getExchangeRate();
      setUsdToVnd(data.usd_to_vnd_rate);
    } catch {
      // keep default 25500 on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  const updateRate = async (rate: number) => {
    await configService.updateExchangeRate(rate);
    setUsdToVnd(rate);
  };

  const fmt = useCallback(
    (vndAmount: number): string => {
      const lang = i18n.language.startsWith("vi") ? "vi" : "en";
      if (lang === "vi") {
        return (
          vndAmount.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "₫"
        );
      }
      // Convert VND → USD
      const usd = usdToVnd > 0 ? vndAmount / usdToVnd : 0;
      return (
        "$" +
        usd.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    },
    [i18n.language, usdToVnd],
  );

  const fmtUsd = useCallback(
    (usdAmount: number): string => {
      const lang = i18n.language.startsWith("vi") ? "vi" : "en";
      if (lang === "vi") {
        const vnd = usdAmount * usdToVnd;
        return vnd.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "₫";
      }
      return (
        "$" +
        usdAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    },
    [i18n.language, usdToVnd],
  );

  return (
    <CurrencyContext.Provider
      value={{ fmt, fmtUsd, usdToVnd, updateRate, loading }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
