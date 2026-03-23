import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Package,
  Layers,
  DollarSign,
  AlertTriangle,
  PackagePlus,
  PackageMinus,
  RefreshCw,
  ShoppingCart,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Archive,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { dashboardService } from "../../services/dashboardService";
import { useCurrency } from "../../contexts/CurrencyContext";
import type { DashboardData } from "../../types/dashboard";
import styles from "./Dashboard.module.css";

// -- Helpers --
type Tab = "sales" | "inventory" | "warehouse";

const fmtDate = (d: string) => d.slice(5).replace("-", "/");

const BAR_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#ef4444",
  "#eab308",
];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  accent: string;
}
function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  accent,
}: StatCardProps) {
  return (
    <div className={styles.card} style={{ borderLeftColor: accent }}>
      <div
        className={styles.cardIcon}
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardLabel}>{label}</p>
        <p className={styles.cardValue}>{value}</p>
        {sub && <p className={styles.cardSub}>{sub}</p>}
      </div>
    </div>
  );
}

interface PeriodCardProps {
  title: string;
  orders: number;
  revenue: number;
  accent: string;
  icon: React.ReactNode;
  ordersUnit: string;
  fmt: (n: number) => string;
}
function PeriodCard({
  title,
  orders,
  revenue,
  accent,
  icon,
  ordersUnit,
  fmt,
}: PeriodCardProps) {
  return (
    <div className={styles.periodCard} style={{ borderTopColor: accent }}>
      <div className={styles.periodHeader}>
        <span className={styles.periodIcon} style={{ color: accent }}>
          {icon}
        </span>
        <span className={styles.periodTitle}>{title}</span>
      </div>
      <p className={styles.periodOrders}>
        <strong>{orders.toLocaleString("vi-VN")}</strong>
        <span> {ordersUnit}</span>
      </p>
      <p className={styles.periodRevenue} style={{ color: accent }}>
        {fmt(revenue)}
      </p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  valueFormatter?: (name: string, v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      {payload.map((p) => (
        <p
          key={p.name}
          style={{ color: p.color }}
          className={styles.tooltipRow}
        >
          <span>{p.name}</span>
          <strong>
            {valueFormatter
              ? valueFormatter(p.name, p.value)
              : p.value.toLocaleString("vi-VN")}
          </strong>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const [tab, setTab] = useState<Tab>("sales");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService
      .get()
      .then(setData)
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading)
    return <div className={styles.loader}>{t("common.loading")}</div>;
  if (error || !data)
    return <div className={styles.loader}>{error || t("common.error")}</div>;

  const { summary, sales, daily_activity, daily_sales, top_products } = data;

  const tabs: { key: Tab; label: string }[] = [
    { key: "sales", label: t("dashboard.tabSales") },
    { key: "inventory", label: t("dashboard.tabInventory") },
    { key: "warehouse", label: t("dashboard.tabWarehouse") },
  ];

  return (
    <div className={styles.page}>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        {tabs.map((tb) => (
          <button
            key={tb.key}
            className={`${styles.tabBtn} ${tab === tb.key ? styles.tabBtnActive : ""}`}
            onClick={() => setTab(tb.key)}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ?? Sales Tab ?? */}
      {tab === "sales" && (
        <div className={styles.section}>
          <div className={styles.periodGrid}>
            <PeriodCard
              title={t("dashboard.today")}
              orders={sales.today_orders}
              revenue={sales.today_revenue}
              accent="#6366f1"
              icon={<ShoppingCart size={18} />}
              ordersUnit={t("dashboard.orders")}
              fmt={fmt}
            />
            <PeriodCard
              title={t("dashboard.thisWeek")}
              orders={sales.week_orders}
              revenue={sales.week_revenue}
              accent="#22c55e"
              icon={<TrendingUp size={18} />}
              ordersUnit={t("dashboard.orders")}
              fmt={fmt}
            />
            <PeriodCard
              title={t("dashboard.thisMonth")}
              orders={sales.month_orders}
              revenue={sales.month_revenue}
              accent="#f97316"
              icon={<DollarSign size={18} />}
              ordersUnit={t("dashboard.orders")}
              fmt={fmt}
            />
          </div>

          <div className={styles.statusRow}>
            <span className={`${styles.statusChip} ${styles.chipPending}`}>
              <Clock size={13} /> {t("dashboard.statusPending")}:{" "}
              {sales.pending_orders}
            </span>
            <span className={`${styles.statusChip} ${styles.chipPacking}`}>
              <Archive size={13} /> {t("dashboard.statusPacking")}:{" "}
              {sales.packing_orders}
            </span>
            <span className={`${styles.statusChip} ${styles.chipDelivering}`}>
              <Truck size={13} /> {t("dashboard.statusDelivering")}:{" "}
              {sales.delivering_orders}
            </span>
            <span className={`${styles.statusChip} ${styles.chipCompleted}`}>
              <CheckCircle size={13} /> {t("dashboard.statusCompleted")}:{" "}
              {sales.completed_orders}
            </span>
            <span className={`${styles.statusChip} ${styles.chipCancelled}`}>
              <XCircle size={13} /> {t("dashboard.statusCancelled")}:{" "}
              {sales.cancelled_orders}
            </span>
          </div>

          <div className={styles.chartBox}>
            <h3 className={styles.chartTitle}>{t("dashboard.dailyRevenue")}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={daily_sales}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => fmt(v)}
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      valueFormatter={(name, v) =>
                        name === t("dashboard.revenue")
                          ? fmt(v)
                          : v.toLocaleString("vi-VN")
                      }
                    />
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name={t("dashboard.revenue")}
                  stroke="#6366f1"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="order_count"
                  name={t("dashboard.ordersLabel")}
                  stroke="#22c55e"
                  fill="none"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ?? Inventory Tab ?? */}
      {tab === "inventory" && (
        <div className={styles.section}>
          <div className={styles.cardGrid}>
            <StatCard
              icon={<Package size={20} />}
              label={t("dashboard.totalProducts")}
              value={summary.total_products.toLocaleString("vi-VN")}
              iconBg="#ede9fe"
              iconColor="#7c3aed"
              accent="#7c3aed"
            />
            <StatCard
              icon={<Layers size={20} />}
              label={t("dashboard.totalStock")}
              value={summary.total_stock_units.toLocaleString("vi-VN")}
              iconBg="#dcfce7"
              iconColor="#16a34a"
              accent="#16a34a"
            />
            <StatCard
              icon={<DollarSign size={20} />}
              label={t("dashboard.stockValue")}
              value={fmt(summary.total_stock_value)}
              iconBg="#fef9c3"
              iconColor="#ca8a04"
              accent="#ca8a04"
            />
            <StatCard
              icon={<AlertTriangle size={20} />}
              label={t("dashboard.lowStock")}
              value={summary.low_stock_count}
              iconBg="#fee2e2"
              iconColor="#dc2626"
              accent="#dc2626"
            />
            <StatCard
              icon={<AlertCircle size={20} />}
              label={t("dashboard.outOfStock")}
              value={summary.out_of_stock}
              iconBg="#fef2f2"
              iconColor="#ef4444"
              accent="#ef4444"
            />
          </div>

          <div className={styles.chartBox}>
            <h3 className={styles.chartTitle}>{t("dashboard.topByStock")}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={top_products} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  horizontal={false}
                />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      valueFormatter={(_, v) => v.toLocaleString("vi-VN")}
                    />
                  }
                />
                <Bar
                  dataKey="stock"
                  name={t("dashboard.totalStock")}
                  radius={[0, 4, 4, 0]}
                >
                  {top_products.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ?? Warehouse Tab ?? */}
      {tab === "warehouse" && (
        <div className={styles.section}>
          <div className={styles.cardGrid}>
            <StatCard
              icon={<PackagePlus size={20} />}
              label={t("dashboard.importsMonth")}
              value={summary.imports_this_month.toLocaleString("vi-VN")}
              iconBg="#dcfce7"
              iconColor="#16a34a"
              accent="#16a34a"
            />
            <StatCard
              icon={<PackageMinus size={20} />}
              label={t("dashboard.exportsMonth")}
              value={summary.exports_this_month.toLocaleString("vi-VN")}
              iconBg="#fef9c3"
              iconColor="#ca8a04"
              accent="#ca8a04"
            />
            <StatCard
              icon={<DollarSign size={20} />}
              label={t("dashboard.importValue")}
              value={fmt(summary.import_value_month)}
              iconBg="#ede9fe"
              iconColor="#7c3aed"
              accent="#7c3aed"
            />
            <StatCard
              icon={<RefreshCw size={20} />}
              label={t("dashboard.exportValue")}
              value={fmt(summary.export_value_month)}
              iconBg="#fee2e2"
              iconColor="#dc2626"
              accent="#dc2626"
            />
          </div>

          <div className={styles.chartBox}>
            <h3 className={styles.chartTitle}>
              {t("dashboard.dailyActivity")}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily_activity}>
                <defs>
                  <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="import_qty"
                  name={t("dashboard.importQty")}
                  stroke="#22c55e"
                  fill="url(#inGrad)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="export_qty"
                  name={t("dashboard.exportQty")}
                  stroke="#f97316"
                  fill="url(#outGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartBox}>
            <h3 className={styles.chartTitle}>{t("dashboard.dailyValue")}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily_activity}>
                <defs>
                  <linearGradient id="inValGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outValGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => fmt(v)}
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  content={<CustomTooltip valueFormatter={(_, v) => fmt(v)} />}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="import_amount"
                  name={t("dashboard.importAmount")}
                  stroke="#6366f1"
                  fill="url(#inValGrad)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="export_amount"
                  name={t("dashboard.exportAmount")}
                  stroke="#ec4899"
                  fill="url(#outValGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
