import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../contexts/useAuthContext";
import { ROUTES } from "../../constants/routes";
import styles from "./Login.module.css";

export default function Login() {
  const { login, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError(t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("login.title")}</h1>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label className={styles.label} htmlFor="email">
            {t("login.email")}
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <label className={styles.label} htmlFor="password">
            {t("login.password")}
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
        <p className={styles.footer}>
          {t("login.noAccount")}{" "}
          <Link to={ROUTES.HOME} className={styles.link}>
            {t("login.contactAdmin")}
          </Link>
        </p>
      </div>
    </div>
  );
}

