import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ScanLine,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../contexts/CurrencyContext";
import { orderService } from "../../services/orderService";
import type { Order, OrderStatus } from "../../types/order";
import { ORDER_STATUS_NEXT } from "../../types/order";
import { ROUTES } from "../../constants/routes";
import styles from "./OrderScan.module.css";

// ── Status step config ─────────────────────────────────────────
const STEP_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  PACKING: 1,
  DELIVERING: 2,
  COMPLETED: 3,
  CANCELLED: -1,
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: styles.badgePending,
  PACKING: styles.badgePacking,
  DELIVERING: styles.badgeDelivering,
  COMPLETED: styles.badgeCompleted,
  CANCELLED: styles.badgeCancelled,
};

export default function OrderScanPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  // Dynamic steps using translations
  const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: "PENDING", label: t("order.statusPending"), icon: <Package size={18} /> },
    { status: "PACKING", label: t("order.statusPacking"), icon: <Package size={18} /> },
    { status: "DELIVERING", label: t("order.statusDelivering"), icon: <Truck size={18} /> },
    { status: "COMPLETED", label: t("order.statusCompleted"), icon: <CheckCircle size={18} /> },
  ];

  const NEXT_BTN: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PACKING: { label: t("order.statusPacking"), className: styles.btnPacking, icon: <Package size={15} /> },
    DELIVERING: { label: t("order.statusDelivering"), className: styles.btnDelivering, icon: <Truck size={15} /> },
    COMPLETED: { label: t("order.statusCompleted"), className: styles.btnCompleted, icon: <CheckCircle size={15} /> },
    CANCELLED: { label: t("order.cancelOrder"), className: styles.btnCancelled, icon: <XCircle size={15} /> },
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<OrderStatus | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  const loadByCode = useCallback(async (c: string) => {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const o = await orderService.getByCode(c);
      setOrder(o);
    } catch {
      setError(t("order.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (code) {
      loadByCode(code);
    }
  }, [code, loadByCode]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = scanInput.trim();
    if (!trimmed) return;
    // The QR value is a URL: extract the last path segment as order code
    const parts = trimmed.split("/");
    const extracted = parts[parts.length - 1];
    setScanInput("");
    setScannerActive(false);
    navigate(ROUTES.ORDER_SCAN.replace(":code", extracted));
  };

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(status);
    setUpdateError(null);
    try {
      const updated = await orderService.updateStatus(order.id, status);
      setOrder(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setUpdateError(msg ?? t("common.error"));
    } finally {
      setUpdating(null);
    }
  };

  const nextStatuses = order ? (ORDER_STATUS_NEXT[order.status] ?? []) : [];
  const currentStepIdx = order ? STEP_INDEX[order.status] : -1;

  const qrValue = order
    ? `${window.location.origin}/orders/scan/${order.order_code}`
    : "";

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.btnBack}
          onClick={() => navigate(ROUTES.ORDER)}
        >
          <ArrowLeft size={16} /> {t("order.backToList")}
        </button>
        <h1>{t("order.orderDetail")}</h1>
        <button
          className={styles.btnScan}
          onClick={() => {
            setScannerActive(true);
            setTimeout(() => scanInputRef.current?.focus(), 100);
          }}
        >
          <ScanLine size={16} /> {t("order.scan")}
        </button>
      </div>

      {/* QR Scanner panel */}
      {scannerActive && (
        <div className={styles.scanPanel}>
          <p className={styles.scanHint}>
            <ScanLine size={14} /> {t("order.scanTitle")}
          </p>
          <form className={styles.scanForm} onSubmit={handleScanSubmit}>
            <input
              ref={scanInputRef}
              className={styles.scanInput}
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder={t("order.scanPlaceholder")}
              autoFocus
            />
            <button type="submit" className={styles.btnScanSubmit}>
              {t("order.lookup")}
            </button>
            <button
              type="button"
              className={styles.btnScanCancel}
              onClick={() => setScannerActive(false)}
            >
              {t("common.cancel")}
            </button>
          </form>
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className={styles.centerMsg}>
          <RefreshCw size={20} className={styles.spin} /> {t("common.loading")}
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorBox}>
          <XCircle size={18} /> {error}
        </div>
      )}

      {!loading && !error && !order && !code && (
        <div className={styles.emptyState}>
          <ScanLine size={48} className={styles.emptyIcon} />
          <p>{t("order.scanTitle")}</p>
        </div>
      )}

      {order && (
        <div className={styles.content}>
          {/* Status stepper */}
          {order.status !== "CANCELLED" ? (
            <div className={styles.stepper}>
              {STEPS.map((step, idx) => (
                <div
                  key={step.status}
                  className={`${styles.step} ${
                    idx < currentStepIdx
                      ? styles.stepDone
                      : idx === currentStepIdx
                        ? styles.stepActive
                        : styles.stepPending
                  }`}
                >
                  <div className={styles.stepCircle}>{step.icon}</div>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`${styles.stepLine} ${idx < currentStepIdx ? styles.stepLineDone : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.cancelledBanner}>
            <XCircle size={20} /> {t("order.statusCancelled")}
            </div>
          )}

          <div className={styles.cards}>
            {/* Order info card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span>{t("order.orderDetail")}</span>
                <span
                  className={`${styles.badge} ${STATUS_COLORS[order.status]}`}
                >
                  {t(({ PENDING: "order.statusPending", PACKING: "order.statusPacking", DELIVERING: "order.statusDelivering", COMPLETED: "order.statusCompleted", CANCELLED: "order.statusCancelled" } as const)[order.status])}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span>{t("order.code")}</span>
                  <strong className={styles.code}>{order.order_code}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("order.customer")}</span>
                  <strong>{order.customer_name}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("order.phone")}</span>
                  <strong>{order.customer_phone}</strong>
                </div>
                {order.note && (
                  <div className={styles.infoRow}>
                    <span>{t("order.note")}</span>
                    <strong>{order.note}</strong>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span>{t("order.date")}</span>
                  <strong>
                    {new Date(order.created_at).toLocaleString("vi-VN")}
                  </strong>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("common.update")}</span>
                  <strong>
                    {new Date(order.updated_at).toLocaleString("vi-VN")}
                  </strong>
                </div>
              </div>

              {/* QR code toggle */}
              <button
                className={styles.btnShowQr}
                onClick={() => setShowQr((v) => !v)}
              >
                <QrCode size={14} /> {showQr ? t("common.close") : t("order.viewQR")}
              </button>
              {showQr && (
                <div className={styles.inlineQr}>
                  <QRCodeSVG
                    value={qrValue}
                    size={160}
                    level="H"
                    includeMargin
                  />
                  <p className={styles.qrHint}>{t("order.qrInstruction")}</p>
                </div>
              )}
            </div>

            {/* Items card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span>{t("order.items")} ({order.items?.length ?? 0})</span>
              </div>
              <div className={styles.itemsTableWrap}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t("order.product")}</th>
                      <th>{t("order.qty")}</th>
                      <th>{t("order.unitPrice")}</th>
                      <th>{t("warehouse.subtotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items ?? []).map((item, i) => (
                      <tr key={item.id}>
                        <td>{i + 1}</td>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{fmt(item.unit_price)}</td>
                        <td className={styles.subtotal}>
                          {fmt(item.quantity * item.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className={styles.totalLabel}>
                        {t("order.total")}
                      </td>
                      <td className={styles.totalValue}>
                        {fmt(order.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div className={styles.actionPanel}>
              <p className={styles.actionTitle}>{t("order.updateStatus")}</p>
              {updateError && <p className={styles.error}>{updateError}</p>}
              <div className={styles.actionBtns}>
                {nextStatuses.map((s) => {
                  const cfg = NEXT_BTN[s];
                  if (!cfg) return null;
                  return (
                    <button
                      key={s}
                      className={`${styles.statusBtn} ${cfg.className}`}
                      onClick={() => handleUpdateStatus(s)}
                      disabled={updating !== null}
                    >
                      {updating === s ? (
                        <RefreshCw size={15} className={styles.spin} />
                      ) : (
                        cfg.icon
                      )}
                      {updating === s ? t("common.saving") : `${t("order.updateStatus")} ${cfg.label}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
