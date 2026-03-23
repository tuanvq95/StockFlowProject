import { Link } from "react-router-dom";
import { LogOut, LogIn, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../constants/routes";
import { useAuthContext } from "../../../contexts/useAuthContext";
import { LanguageSwitcher, ExchangeRateSettings } from "../../common";
import styles from "./Header.module.css";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthContext();
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link to={ROUTES.HOME}>{t("header.brand")}</Link>
      </div>
      <div className={styles.actions}>
        <LanguageSwitcher />
        {isAuthenticated && <ExchangeRateSettings />}
        {isAuthenticated ? (
          <>
            <span className={styles.username}>
              <User size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {user?.name}
            </span>
            <button onClick={logout} className={styles.btn}>
              <LogOut size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {t("header.logout")}
            </button>
          </>
        ) : (
          <Link to={ROUTES.LOGIN} className={styles.btn}>
            <LogIn size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {t("header.login")}
          </Link>
        )}
      </div>
    </header>
  );
}