import { api } from "../services/api";

/**
 * Calls GET /products/export, receives the .xlsx binary from the server,
 * and triggers a browser file download.
 */
export async function exportProductsToExcel(): Promise<void> {
  const res = await api.get("/api/v1/products/export", { responseType: "blob" });

  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
