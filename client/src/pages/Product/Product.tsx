import { useEffect, useState, useCallback, type FormEvent } from "react";
import { Plus, Trash2, FileDown, Search, X, ChevronLeft, ChevronRight, Pencil, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../contexts/CurrencyContext";
import { productService } from "../../services/productService";
import type { Product, CreateProductRequest, PagedResult } from "../../types/product";
import { exportProductsToExcel } from "../../utils/exportExcel";
import styles from "./Product.module.css";

const PAGE_SIZE = 10;

const emptyForm: CreateProductRequest = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
};

const emptyFilter = { minPrice: "", maxPrice: "", minStock: "", maxStock: "" };

export default function ProductPage() {
  const { t } = useTranslation();
  const { fmtUsd } = useCurrency();
  const [result, setResult] = useState<PagedResult<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterInput, setFilterInput] = useState(emptyFilter);
  const [filter, setFilter] = useState(emptyFilter);
  const [showFilter, setShowFilter] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    productService
      .getPaged({
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        min_price: filter.minPrice ? Number(filter.minPrice) : undefined,
        max_price: filter.maxPrice ? Number(filter.maxPrice) : undefined,
        min_stock: filter.minStock ? Number(filter.minStock) : undefined,
        max_stock: filter.maxStock ? Number(filter.maxStock) : undefined,
      })
      .then((r) => setResult(r))
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounce search: only fire query 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Debounce price/stock filters
  useEffect(() => {
    const t = setTimeout(() => {
      setFilter(filterInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [filterInput]);

  const clearAll = () => {
    setSearchInput("");
    setFilterInput(emptyFilter);
    setSearch("");
    setFilter(emptyFilter);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("product.deleteConfirm"))) return;
    await productService.delete(id);
    fetchProducts();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await productService.create(form);
      setShowModal(false);
      setForm(emptyForm);
      setPage(1);
      fetchProducts();
    } catch {
      setError(t("product.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock });
    setError(null);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setError(null);
    setSubmitting(true);
    try {
      await productService.update(editingProduct.id, form);
      setEditingProduct(null);
      setForm(emptyForm);
      fetchProducts();
    } catch {
      setError(t("product.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProductsToExcel();
    } finally {
      setExporting(false);
    }
  };

  const set = (field: keyof CreateProductRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({
        ...prev,
        [field]: field === "price" || field === "stock" ? Number(e.target.value) : e.target.value,
      }));

  const products = result?.items ?? [];
  const totalPages = result?.total_pages ?? 1;
  const total = result?.total ?? 0;
  const hasRangeFilters = Boolean(
    filterInput.minPrice || filterInput.maxPrice || filterInput.minStock || filterInput.maxStock
  );
  const hasActiveFilters = Boolean(searchInput || hasRangeFilters);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>{t("product.title")}</h1>
        <div className={styles.toolbar}>
          <button
            className={styles.btnExport}
            onClick={handleExport}
            disabled={loading || exporting}
            title="Export to Excel"
          >
            <FileDown size={16} /> {exporting ? t("product.exporting") : t("product.exportExcel")}
          </button>
          <button className={styles.btnAdd} onClick={() => setShowModal(true)}>
            <Plus size={16} /> {t("product.add")}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBarWrapper}>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder={t("product.search")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className={styles.clearBtn} onClick={() => setSearchInput("")}>
                <X size={13} />
              </button>
            )}
          </div>
          <button
            className={`${styles.btnFilter}${showFilter || hasRangeFilters ? ` ${styles.btnFilterActive}` : ""}`}
            onClick={() => setShowFilter((s) => !s)}
          >
            <SlidersHorizontal size={14} /> {t("common.filter")}
            {hasRangeFilters && <span className={styles.filterDot} />}
          </button>
          {hasActiveFilters && (
            <button className={styles.clearAllBtn} onClick={clearAll}>
              <X size={13} /> {t("common.clear")}
            </button>
          )}
          <span className={styles.resultCount}>
            {t("product.resultCount", { count: total })}
          </span>
        </div>
        {showFilter && (
          <div className={styles.filterPanel}>
            <div className={styles.rangeGroup}>
              <span className={styles.rangeLabel}>{t("product.filterPrice")}</span>
              <input
                className={styles.rangeInput}
                type="number"
                placeholder={t("common.min")}
                min="0"
                step="0.01"
                value={filterInput.minPrice}
                onChange={(e) => setFilterInput((p) => ({ ...p, minPrice: e.target.value }))}
              />
              <span className={styles.rangeSep}>–</span>
              <input
                className={styles.rangeInput}
                type="number"
                placeholder={t("common.max")}
                min="0"
                step="0.01"
                value={filterInput.maxPrice}
                onChange={(e) => setFilterInput((p) => ({ ...p, maxPrice: e.target.value }))}
              />
            </div>
            <div className={styles.rangeGroup}>
              <span className={styles.rangeLabel}>{t("product.filterStock")}</span>
              <input
                className={styles.rangeInput}
                type="number"
                placeholder={t("common.min")}
                min="0"
                value={filterInput.minStock}
                onChange={(e) => setFilterInput((p) => ({ ...p, minStock: e.target.value }))}
              />
              <span className={styles.rangeSep}>–</span>
              <input
                className={styles.rangeInput}
                type="number"
                placeholder={t("common.max")}
                min="0"
                value={filterInput.maxStock}
                onChange={(e) => setFilterInput((p) => ({ ...p, maxStock: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>{t("product.name")}</th>
              <th>{t("product.description")}</th>
              <th>{t("product.price")}</th>
              <th>{t("product.stock")}</th>
              <th>{t("product.created")}</th>
              <th>{t("product.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.empty}>{t("common.loading")}</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  {search || filter.minPrice || filter.maxPrice || filter.minStock || filter.maxStock
                    ? t("product.noMatch")
                    : t("product.noData")}
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.description || "-"}</td>
                  <td>{fmtUsd(p.price)}</td>
                  <td>
                    <span className={`${styles.badge} ${p.stock === 0 ? styles.badgeLow : ""}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnEdit}
                        onClick={() => openEdit(p)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => handleDelete(p.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
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
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>...</span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
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

          <span className={styles.pageInfo}>
            {t("common.page")} {page} {t("common.of")} {totalPages}
          </span>
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("product.add")}</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="name">{t("product.nameLabel")}</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={set("name")}
                  required
                  placeholder={t("product.namePlaceholder")}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="description">{t("product.descriptionLabel")}</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={set("description")}
                  rows={3}
                  placeholder={t("product.descriptionPlaceholder")}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="price">{t("product.priceUsdLabel")}</label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={set("price")}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="stock">{t("product.stockLabel")}</label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={set("stock")}
                  />
                </div>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => { setShowModal(false); setForm(emptyForm); setError(null); }}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={submitting}>
                  {submitting ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className={styles.overlay} onClick={() => { setEditingProduct(null); setForm(emptyForm); setError(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("product.edit")}</h2>
            <form className={styles.form} onSubmit={handleUpdate}>
              <div className={styles.field}>
                <label htmlFor="edit-name">{t("product.nameLabel")}</label>
                <input
                  id="edit-name"
                  value={form.name}
                  onChange={set("name")}
                  required
                  placeholder={t("product.namePlaceholder")}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-description">{t("product.descriptionLabel")}</label>
                <textarea
                  id="edit-description"
                  value={form.description}
                  onChange={set("description")}
                  rows={3}
                  placeholder={t("product.descriptionPlaceholder")}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="edit-price">{t("product.priceUsdLabel")}</label>
                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={set("price")}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="edit-stock">{t("product.stockLabel")}</label>
                  <input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={set("stock")}
                  />
                </div>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => { setEditingProduct(null); setForm(emptyForm); setError(null); }}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={submitting}>
                  {submitting ? t("common.saving") : t("common.update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
