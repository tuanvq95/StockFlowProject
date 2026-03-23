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
} from "lucide-react";
import { dashboardService } from "../../services/dashboardService";
import type { DashboardData } from "../../types/dashboard";
import styles from "./Dashboard.module.css";

// „Ÿ„Ÿ Stat card „Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  accent: string;
}

function StatCard({ icon, label, value, sub, iconBg, iconColor, accent }: StatCardProps) {
  return (
    <div className={styles.card} style={{ borderLeftColor: accent }}>
      <div className={styles.cardIcon} style={{ background: iconBg, color: iconColor }}>
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

// „Ÿ„Ÿ Custom tooltip for area chart „Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ
function AreaTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className={styles.tooltipRow}>
          <span>{p.name === "import_qty" ? "Import" : "Export"}</span>
          <strong>{p.value.toLocaleString()} units</strong>
        </p>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      <p className={styles.tooltipRow}>
        <span>Stock</span>
        <strong>{payload[0].value.toLocaleString()} units</strong>
      </p>
    </div>
  );
}

// Bar colors cycle for top products
const BAR_COLORS = [
  "#6366f1", "#22c55e", "#f97316", "#3b82f6",
  "#a855f7", "#14b8a6", "#ef4444", "#eab308",
];

// „Ÿ„Ÿ Main page „Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ„Ÿ
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // load() only mutates state from outside the effect (event handler)
  const load = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  // effect only calls setState inside async callbacks, never synchronously
  useEffect(() => {
    let active = true;
    dashboardService
      .get()
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setError("Failed to load dashboard data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const { summary, daily_activity = [], top_products = [] } = data ?? {
    summary: {
      total_products: 0,
      total_stock_units: 0,
      total_stock_value: 0,
      low_stock_count: 0,
      imports_this_month: 0,
      exports_this_month: 0,
    },
    daily_activity: [],
    top_products: [],
  };

  // Show only last 15 date labels to avoid X-axis clutter
  const tickInterval = Math.floor(daily_activity.length / 6) || 4;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
        <button className={styles.refreshBtn} onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={15} className={loading ? styles.spinning : ""} />
          Refresh
        </button>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {/* „Ÿ„Ÿ Stat cards „Ÿ„Ÿ */}
      <div className={styles.cards}>
        <StatCard
          icon={<Package size={20} />}
          label="Total Products"
          value={summary.total_products.toLocaleString()}
          sub="distinct SKUs"
          iconBg="#eef2ff" iconColor="#6366f1" accent="#6366f1"
        />
        <StatCard
          icon={<Layers size={20} />}
          label="Total Stock Units"
          value={summary.total_stock_units.toLocaleString()}
          sub="units across all products"
          iconBg="#dbeafe" iconColor="#3b82f6" accent="#3b82f6"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="Total Stock Value"
          value={`$${summary.total_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="at current prices"
          iconBg="#dcfce7" iconColor="#16a34a" accent="#16a34a"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Low Stock"
          value={summary.low_stock_count.toLocaleString()}
          sub="products with stock < 10"
          iconBg="#fef9c3" iconColor="#ca8a04" accent="#f59e0b"
        />
        <StatCard
          icon={<PackagePlus size={20} />}
          label="Imports This Month"
          value={summary.imports_this_month.toLocaleString()}
          sub="import transactions"
          iconBg="#d1fae5" iconColor="#059669" accent="#10b981"
        />
        <StatCard
          icon={<PackageMinus size={20} />}
          label="Exports This Month"
          value={summary.exports_this_month.toLocaleString()}
          sub="export transactions"
          iconBg="#ffedd5" iconColor="#ea580c" accent="#f97316"
        />
      </div>

      {/* „Ÿ„Ÿ Charts row „Ÿ„Ÿ */}
      <div className={styles.charts}>
        {/* Area chart: daily import/export */}
        <div className={styles.chartBox}>
          <p className={styles.chartTitle}>Import / Export Activity <span className={styles.chartSub}>(last 30 days, units)</span></p>
          {loading ? (
            <div className={styles.chartPlaceholder}>Loadingc</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={daily_activity} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradImport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                  tickFormatter={(v: string) => v.slice(5).replace("-", "/")}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  allowDecimals={false}
                />
                <Tooltip content={<AreaTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => (
                    <span style={{ fontSize: 12, color: "#475569" }}>
                      {v === "import_qty" ? "Import" : "Export"}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="import_qty"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#gradImport)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="export_qty"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#gradExport)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart: top products by stock */}
        <div className={styles.chartBox}>
          <p className={styles.chartTitle}>Top Products <span className={styles.chartSub}>(by stock)</span></p>
          {loading ? (
            <div className={styles.chartPlaceholder}>Loadingc</div>
          ) : top_products.length === 0 ? (
            <div className={styles.chartPlaceholder}>No products yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={top_products}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 11) + "..." : v}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="stock" radius={[0, 5, 5, 0]}>
                  {top_products.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* „Ÿ„Ÿ Amount chart (import/export value) „Ÿ„Ÿ */}
      <div className={styles.chartBoxWide}>
        <p className={styles.chartTitle}>Import / Export Value <span className={styles.chartSub}>(last 30 days, $)</span></p>
        {loading ? (
          <div className={styles.chartPlaceholder}>Loadingc</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily_activity} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradImportAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExportAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
                tickFormatter={(v: string) => v.slice(5).replace("-", "/")}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                formatter={(v, name) => [
                  `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name === "import_amount" ? "Import" : "Export",
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    {v === "import_amount" ? "Import ($)" : "Export ($)"}
                  </span>
                )}
              />
              <Area type="monotone" dataKey="import_amount" stroke="#22c55e" strokeWidth={2} fill="url(#gradImportAmt)" dot={false} />
              <Area type="monotone" dataKey="export_amount" stroke="#f97316" strokeWidth={2} fill="url(#gradExportAmt)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
