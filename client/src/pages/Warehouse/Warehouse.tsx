import { useEffect, useState, useCallback, type FormEvent } from "react";
import {
  PackagePlus,
  PackageMinus,
  FileDown,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { warehouseService } from "../../services/warehouseService";
import { productService } from "../../services/productService";
import type {
  WarehouseTransaction,
  CreateItemRequest,
  TxType,
  WPagedResult,
} from "../../types/warehouse";
import type { Product } from "../../types/product";
import styles from "./Warehouse.module.css";

const PAGE_SIZE = 10;
const emptyItem = (): CreateItemRequest => ({ product_id: 0, quantity: 1, unit_price: 0 });
const emptyForm = () => ({ note: "", items: [emptyItem()] });

export default function WarehousePage() {
  const [result, setResult] = useState<WPagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"" | "IMPORT" | "EXPORT">("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<TxType>("IMPORT");
  const [createForm, setCreateForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [viewTx, setViewTx] = useState<WarehouseTransaction | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Load products once on mount for the create form dropdown
  useEffect(() => {
    productService.getAll().then(setProducts);
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    warehouseService
      .getPaged({ page, page_size: PAGE_SIZE, type: typeFilter || undefined })
      .then((r) => setResult(r))
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ── Create modal ──────────────────────────────────────────────
  const openCreate = (type: TxType) => {
    setCreateType(type);
    setCreateForm(emptyForm());
    setSubmitError(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setSubmitError(null);
  };

  const addItem = () =>
    setCreateForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));

  const removeItem = (i: number) =>
    setCreateForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const selectProduct = (i: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === i
          ? { ...item, product_id: productId, unit_price: product?.price ?? item.unit_price }
          : item
      ),
    }));
  };

  const updateItem = (i: number, field: keyof CreateItemRequest, value: number) =>
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
    }));

  const createTotal = createForm.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (createForm.items.some((i) => i.product_id === 0)) {
      setSubmitError("Please select a product for all rows.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await warehouseService.create({
        type: createType,
        note: createForm.note,
        items: createForm.items,
      });
      closeCreate();
      fetchList();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(msg ?? "Failed to save transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Detail modal ──────────────────────────────────────────────
  const openDetail = async (id: number) => {
    setShowDetail(true);
    setViewTx(null);
    setDetailError(null);
    setViewLoading(true);
    try {
      const tx = await warehouseService.getById(id);
      setViewTx(tx);
    } catch {
      setDetailError("Failed to load transaction.");
    } finally {
      setViewLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setViewTx(null);
  };

  // ── Derived ───────────────────────────────────────────────────
  const transactions = result?.items ?? [];
  const totalPages = result?.total_pages ?? 1;
  const total = result?.total ?? 0;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <h1>Warehouse</h1>
        <div className={styles.toolbar}>
          <button className={styles.btnImport} onClick={() => openCreate("IMPORT")}>
            <PackagePlus size={16} /> New Import
          </button>
          <button className={styles.btnExportTx} onClick={() => openCreate("EXPORT")}>
            <PackageMinus size={16} /> New Export
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        {(["", "IMPORT", "EXPORT"] as const).map((t) => (
          <button
            key={t}
            className={`${styles.chip}${typeFilter === t ? ` ${styles.chipActive}` : ""}`}
            onClick={() => { setTypeFilter(t); setPage(1); }}
          >
            {t === "" ? "All" : t === "IMPORT" ? "Import" : "Export"}
          </button>
        ))}
        <span className={styles.resultCount}>
          {total} transaction{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Note</th>
              <th>Items</th>
              <th>Total ($)</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className={styles.empty}>Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className={styles.empty}>No transactions yet.</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>#{tx.id}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        tx.type === "IMPORT" ? styles.badgeImport : styles.badgeExport
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className={styles.noteCell}>{tx.note || "?"}</td>
                  <td>{tx.item_count}</td>
                  <td>${tx.total_amount.toFixed(2)}</td>
                  <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnView}
                        onClick={() => openDetail(tx.id)}
                        title="View detail"
                      >
                        <Eye size={14} />
                      </button>
                      {tx.type === "EXPORT" && (
                        <button
                          className={styles.btnInvoice}
                          onClick={() => warehouseService.downloadInvoice(tx.id)}
                          title="Download invoice"
                        >
                          <FileDown size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
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
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className={styles.pageEllipsis}>...</span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn}${p === page ? ` ${styles.pageBtnActive}` : ""}`}
                  onClick={() => setPage(p as number)}
                  disabled={loading}
                >
                  {p}
                </button>
              )
            )}
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <ChevronRight size={16} />
          </button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className={styles.overlay} onClick={closeCreate}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {createType === "IMPORT" ? (
                  <><PackagePlus size={18} /> New Import</>
                ) : (
                  <><PackageMinus size={18} /> New Export</>
                )}
              </h2>
              <button className={styles.modalClose} onClick={closeCreate}>
                <X size={18} />
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Note</label>
                <input
                  value={createForm.note}
                  onChange={(e) => setCreateForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Optional note..."
                />
              </div>

              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <span>Products</span>
                  <button type="button" className={styles.btnAddItem} onClick={addItem}>
                    + Add row
                  </button>
                </div>
                <div className={styles.itemColLabels}>
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Unit price ($)</span>
                  <span />
                </div>
                {createForm.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <select
                      value={item.product_id || ""}
                      onChange={(e) => selectProduct(i, Number(e.target.value))}
                      required
                    >
                      <option value="">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className={styles.btnRemoveItem}
                      onClick={() => removeItem(i)}
                      disabled={createForm.items.length === 1}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                Total: <strong>${createTotal.toFixed(2)}</strong>
              </div>

              {submitError && <p className={styles.error}>{submitError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={closeCreate}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={createType === "IMPORT" ? styles.btnSubmitImport : styles.btnSubmitExport}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : `Save ${createType === "IMPORT" ? "Import" : "Export"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {showDetail && (
        <div className={styles.overlay} onClick={closeDetail}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Transaction #{viewTx?.id ?? "…"}</h2>
              <button className={styles.modalClose} onClick={closeDetail}>
                <X size={18} />
              </button>
            </div>

            {viewLoading ? (
              <p className={styles.empty}>Loading…</p>
            ) : detailError ? (
              <p className={styles.error}>{detailError}</p>
            ) : viewTx ? (
              <>
                <div className={styles.detailMeta}>
                  <span
                    className={`${styles.badge} ${
                      viewTx.type === "IMPORT" ? styles.badgeImport : styles.badgeExport
                    }`}
                  >
                    {viewTx.type}
                  </span>
                  <span className={styles.detailDate}>
                    {new Date(viewTx.created_at).toLocaleString()}
                  </span>
                  {viewTx.note && (
                    <span className={styles.detailNote}>{viewTx.note}</span>
                  )}
                </div>

                <div className={styles.detailTableWrap}>
                  <table className={`${styles.table} ${styles.detailTable}`}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit price ($)</th>
                        <th>Subtotal ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewTx.items ?? []).map((item, i) => (
                        <tr key={item.id}>
                          <td>{i + 1}</td>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>${item.unit_price.toFixed(2)}</td>
                          <td>${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className={styles.totalLabel}>Total</td>
                        <td className={styles.totalValue}>
                          ${viewTx.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className={styles.modalActions}>
                  {viewTx.type === "EXPORT" && (
                    <button
                      className={styles.btnInvoiceLarge}
                      onClick={() => warehouseService.downloadInvoice(viewTx.id)}
                    >
                      <FileDown size={15} /> Download Invoice
                    </button>
                  )}
                  <button className={styles.btnCancel} onClick={closeDetail}>
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
