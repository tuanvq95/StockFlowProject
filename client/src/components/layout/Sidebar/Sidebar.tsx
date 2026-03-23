import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Warehouse, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../constants/routes";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { t } = useTranslation();

  const navItems = [
    { labelKey: "nav.dashboard", to: ROUTES.HOME, icon: <LayoutDashboard size={18} /> },
    { labelKey: "nav.products", to: ROUTES.PRODUCT, icon: <Package size={18} /> },
    { labelKey: "nav.warehouse", to: ROUTES.WAREHOUSE, icon: <Warehouse size={18} /> },
    { labelKey: "nav.orders", to: ROUTES.ORDER, icon: <ShoppingCart size={18} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul className={styles.list}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ""}`
                }
              >
                {item.icon} <span>{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}