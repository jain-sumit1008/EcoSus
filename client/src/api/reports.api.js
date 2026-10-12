import client from "./client.js";

export const getSummary = (params) => client.get("/reports/summary", { params }).then((res) => res.data);

export async function exportCsv(params) {
  const response = await client.get("/reports/export", { params, responseType: "blob" });
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ecopulse-${params.dataset || "export"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
