import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  QrCode,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../contexts/useCurrency";
import { orderService } from "../../services/orderService";
import { productService } from "../../services/productService";
import type {
  Order,
  CreateOrderItemRequest,
  OrderStatus,
  OrderPagedResult,
} from "../../types/order";
import { ORDER_STATUS_NEXT } from "../../types/order";
import type { Product } from "../../types/product";
import { ROUTES } from "../../constants/routes";
import styles from "./Order.module.css";

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: styles.badgePending,
  PACKING: styles.badgePacking,
  DELIVERING: styles.badgeDelivering,
  COMPLETED: styles.badgeCompleted,
  CANCELLED: styles.badgeCancelled,
};

const emptyItem = (): CreateOrderItemRequest => ({
  product_id: 0,
  product_name: "",
  quantity: 1,
  unit_price: 0,
});

export default function OrderPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { fmtUsd } = useCurrency();
  const [result, setResult] = useState<OrderPagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Products for dropdown
  const [products, setProducts] = useState<Product[]>([]);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    note: "",
    items: [emptyItem()],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // QR modal state
  const [qrOrder, setQrOrder] = useState<Order | null>(null);

  useEffect(() => {
    productService.getAll().then(setProducts);
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    orderService
      .getPaged({
        page,
        page_size: PAGE_SIZE,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      .then((r) => setResult(r))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ---------- Create helpers ----------
  const openCreate = () => {
    setForm({
      customer_name: "",
      customer_phone: "",
      note: "",
      items: [emptyItem()],
    });
    setSubmitError(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setSubmitError(null);
  };

  const addItem = () =>
    setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));

  const removeItem = (i: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const selectProduct = (i: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === i
          ? {
              ...item,
              product_id: productId,
              product_name: product?.name ?? "",
              unit_price: product?.price ?? item.unit_price,
            }
          : item,
      ),
    }));
  };

  const updateItem = (
    i: number,
    field: keyof CreateOrderItemRequest,
    value: number | string,
  ) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === i ? { ...item, [field]: value } : item,
      ),
    }));

  const total = form.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.items.some((i) => i.product_id === 0)) {
      setSubmitError("Vui lòng chọn sản phẩm cho tất cả các dòng.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const created = await orderService.create({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        note: form.note,
        items: form.items,
      });
      closeCreate();
      fetchList();
      setQrOrder(created);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setSubmitError(msg ?? t("order.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Search ----------
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // ---------- Pagination ----------
  const orders = result?.items ?? [];
  const totalPages = result?.total_pages ?? 1;
  const totalCount = result?.total ?? 0;

  const qrValue = qrOrder
    ? `${window.location.origin}/orders/scan/${qrOrder.order_code}`
    : "";

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1>{t("order.title")}</h1>
        <button className={styles.btnCreate} onClick={openCreate}>
          <ShoppingCart size={16} /> {t("order.add")}
        </button>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        {(
          [
            "",
            "PENDING",
            "PACKING",
            "DELIVERING",
            "COMPLETED",
            "CANCELLED",
          ] as const
        ).map((s) => (
          <button
            key={s}
            className={`${styles.chip}${statusFilter === s ? ` ${styles.chipActive}` : ""}`}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
          >
            {s === ""
              ? t("order.statusAll")
              : (() => {
                  const keys: Record<OrderStatus, string> = {
                    PENDING: "order.statusPending",
                    PACKING: "order.statusPacking",
                    DELIVERING: "order.statusDelivering",
                    COMPLETED: "order.statusCompleted",
                    CANCELLED: "order.statusCancelled",
                  };
                  return t(keys[s as OrderStatus]);
                })()}
          </button>
        ))}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("order.scanPlaceholder")}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.btnSearch}>
            <Search size={14} />
          </button>
        </form>
        <span className={styles.resultCount}>
          {totalCount} {t("order.title").toLowerCase()}
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("order.code")}</th>
              <th>{t("order.customer")}</th>
              <th>{t("order.phone")}</th>
              <th>{t("order.status")}</th>
              <th>{t("order.totalAmount")}</th>
              <th>{t("order.date")}</th>
              <th>{t("order.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  {t("common.loading")}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  {t("order.noData")}
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td className={styles.codeCell}>{o.order_code}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.customer_phone}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${STATUS_COLORS[o.status]}`}
                    >
                      {t(
                        (
                          {
                            PENDING: "order.statusPending",
                            PACKING: "order.statusPacking",
                            DELIVERING: "order.statusDelivering",
                            COMPLETED: "order.statusCompleted",
                            CANCELLED: "order.statusCancelled",
                          } as const
                        )[o.status],
                      )}
                    </span>
                  </td>
                  <td>{fmtUsd(o.total_amount)}</td>
                  <td>{new Date(o.created_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnView}
                        onClick={() =>
                          navigate(
                            ROUTES.ORDER_SCAN.replace(":code", o.order_code),
                          )
                        }
                        title={t("order.orderDetail")}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className={styles.btnQr}
                        onClick={() => setQrOrder(o)}
                        title={t("order.viewQR")}
                      >
                        <QrCode size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
            )
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className={styles.pageEllipsis}>
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn}${p === page ? ` ${styles.pageBtnActive}` : ""}`}
                  onClick={() => setPage(p as number)}
                  disabled={loading}
                >
                  {p}
                </button>
              ),
            )}
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <ChevronRight size={16} />
          </button>
          <span className={styles.pageInfo}>
            {t("common.page")} {page} {t("common.of")} {totalPages}
          </span>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.overlay} onClick={closeCreate}>
          <div
            className={`${styles.modal} ${styles.modalLarge}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>
                <ShoppingCart size={18} /> {t("order.createTitle")}
              </h2>
              <button className={styles.modalClose} onClick={closeCreate}>
                <X size={18} />
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>{t("order.customerName")}</label>
                  <input
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customer_name: e.target.value }))
                    }
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>{t("order.customerPhone")}</label>
                  <input
                    value={form.customer_phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customer_phone: e.target.value }))
                    }
                    placeholder="0901234567"
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>{t("order.note")}</label>
                <input
                  value={form.note}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <span>{t("order.items")}</span>
                  <button
                    type="button"
                    className={styles.btnAddItem}
                    onClick={addItem}
                  >
                    {t("order.addItem")}
                  </button>
                </div>
                <div className={styles.itemColLabels}>
                  <span>{t("order.product")}</span>
                  <span>{t("order.qty")}</span>
                  <span>{t("order.unitPrice")} ($)</span>
                  <span>{t("warehouse.subtotal")}</span>
                  <span />
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <select
                      value={item.product_id || ""}
                      onChange={(e) => selectProduct(i, Number(e.target.value))}
                      required
                    >
                      <option value="">{t("order.select")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(i, "quantity", Number(e.target.value))
                      }
                      required
                    />
                    <span
                      className={`${styles.unitPriceDisplay}${item.product_id ? " " + styles.unitPriceActive : ""}`}
                    >
                      {item.product_id ? fmtUsd(item.unit_price) : "—"}
                    </span>
                    <span className={styles.subtotal}>
                      {item.product_id
                        ? fmtUsd(item.quantity * item.unit_price)
                        : "—"}
                    </span>
                    <button
                      type="button"
                      className={styles.btnRemoveItem}
                      onClick={() => removeItem(i)}
                      disabled={form.items.length === 1}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                {t("order.total")} <strong>{fmtUsd(total)}</strong>
              </div>

              {submitError && <p className={styles.error}>{submitError}</p>}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeCreate}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={submitting}
                >
                  {submitting ? t("common.saving") : t("order.add") + " & QR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrOrder && (
        <div className={styles.overlay} onClick={() => setQrOrder(null)}>
          <div className={styles.qrModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <QrCode size={18} /> {t("order.qrCode")}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setQrOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.qrBody}>
              <div className={styles.qrBox}>
                <QRCodeSVG value={qrValue} size={220} level="H" includeMargin />
              </div>
              <div className={styles.qrInfo}>
                <div className={styles.qrInfoRow}>
                  <span>{t("order.code")}:</span>
                  <strong>{qrOrder.order_code}</strong>
                </div>
                <div className={styles.qrInfoRow}>
                  <span>{t("order.customer")}:</span>
                  <strong>{qrOrder.customer_name}</strong>
                </div>
                <div className={styles.qrInfoRow}>
                  <span>{t("order.phone")}:</span>
                  <strong>{qrOrder.customer_phone}</strong>
                </div>
                <div className={styles.qrInfoRow}>
                  <span>{t("order.status")}:</span>
                  <span
                    className={`${styles.badge} ${STATUS_COLORS[qrOrder.status]}`}
                  >
                    {t(
                      (
                        {
                          PENDING: "order.statusPending",
                          PACKING: "order.statusPacking",
                          DELIVERING: "order.statusDelivering",
                          COMPLETED: "order.statusCompleted",
                          CANCELLED: "order.statusCancelled",
                        } as const
                      )[qrOrder.status],
                    )}
                  </span>
                </div>
                <div className={styles.qrInfoRow}>
                  <span>{t("order.totalAmount")}:</span>
                  <strong>{fmtUsd(qrOrder.total_amount)}</strong>
                </div>
              </div>
            </div>

            <p className={styles.qrHint}>{t("order.qrInstruction")}</p>

            <div className={styles.modalActions}>
              <button
                className={styles.btnView}
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                onClick={() => {
                  navigate(
                    ROUTES.ORDER_SCAN.replace(":code", qrOrder.order_code),
                  );
                  setQrOrder(null);
                }}
              >
                <Eye size={14} /> {t("order.orderDetail")}
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => setQrOrder(null)}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status next flows not shown here — handled on ORDER_SCAN_NEXT */}
      {ORDER_STATUS_NEXT && null}
    </div>
  );
}
