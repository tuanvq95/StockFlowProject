import { useTranslation } from "react-i18next";
import styles from "./LanguageSwitcher.module.css";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith("vi") ? "vi" : "en";

  const toggle = () => {
    const next = current === "vi" ? "en" : "vi";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <button className={styles.switcher} onClick={toggle} title="Switch language">
      <span className={current === "vi" ? styles.active : styles.inactive}>VI</span>
      <span className={styles.sep}>/</span>
      <span className={current === "en" ? styles.active : styles.inactive}>EN</span>
    </button>
  );
}
