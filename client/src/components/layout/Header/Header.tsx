import { Link, NavLink } from "react-router-dom";
import { LogOut, LogIn, User } from "lucide-react";
import { ROUTES } from "../../../constants/routes";
import { useAuthContext } from "../../../contexts/useAuthContext";
import styles from "./Header.module.css";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthContext();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link to={ROUTES.HOME}>MyApp</Link>
      </div>
      <nav className={styles.nav}>
        <NavLink
          to={ROUTES.HOME}
          className={({ isActive }) => (isActive ? styles.active : "")}
        >
        </NavLink>
      </nav>
      <div className={styles.actions}>
        {isAuthenticated ? (
          <>
            <span className={styles.username}>
              <User size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {user?.name}
            </span>
            <button onClick={logout} className={styles.btn}>
              <LogOut size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Logout
            </button>
          </>
        ) : (
          <Link to={ROUTES.LOGIN} className={styles.btn}>
            <LogIn size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
