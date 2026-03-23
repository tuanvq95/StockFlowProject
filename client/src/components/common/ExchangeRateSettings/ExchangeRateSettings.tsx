import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../contexts/useCurrency";
import styles from "./ExchangeRateSettings.module.css";

export default function ExchangeRateSettings() {
  const { t } = useTranslation();
  const { usdToVnd, updateRate } = useCurrency();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleOpen = () => {
    setInput(String(usdToVnd));
    setMsg(null);
    setOpen(true);
  };

  const handleSave = async () => {
    const rate = parseFloat(input);
    if (!rate || rate <= 0) return;
    setSaving(true);
    setMsg(null);
    try {
      await updateRate(rate);
      setMsg({ ok: true, text: t("currency.updateSuccess") });
      setTimeout(() => setOpen(false), 800);
    } catch {
      setMsg({ ok: false, text: t("currency.updateError") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        className={styles.trigger}
        onClick={handleOpen}
        title={t("currency.rate")}
      >
        <Settings2 size={15} />
      </button>

      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
            <p className={styles.title}>{t("currency.rate")}</p>
            <p className={styles.hint}>
              {t("currency.currentRate", {
                rate: usdToVnd.toLocaleString("vi-VN"),
              })}
            </p>
            <div className={styles.inputRow}>
              <span className={styles.prefix}>1 USD =</span>
              <input
                className={styles.input}
                type="number"
                min="1"
                step="100"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
              <span className={styles.suffix}>VNĐ</span>
            </div>
            {msg && (
              <p className={msg.ok ? styles.success : styles.error}>
                {msg.text}
              </p>
            )}
            <div className={styles.actions}>
              <button
                className={styles.btnCancel}
                onClick={() => setOpen(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                className={styles.btnSave}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t("currency.updating") : t("currency.updateRate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
