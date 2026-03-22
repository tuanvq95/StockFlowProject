import { NavLink } from "react-router-dom";
import { Home, Package, Warehouse } from "lucide-react";
import { ROUTES } from "../../../constants/routes";
import styles from "./Sidebar.module.css";

const navItems = [
  { label: "Home",      to: ROUTES.HOME,      icon: <Home      size={18} /> },
  { label: "Product",   to: ROUTES.PRODUCT,   icon: <Package   size={18} /> },
  { label: "Warehouse", to: ROUTES.WAREHOUSE, icon: <Warehouse size={18} /> },
];

export default function Sidebar() {
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
                {item.icon} <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
