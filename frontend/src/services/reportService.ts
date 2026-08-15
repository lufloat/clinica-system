import api from "../api/axios";

/**
 * `doctor` vazio = todos os profissionais do escopo do usuário.
 * `vertical` vazio = todas as áreas somadas (só o administrador geral).
 */
export async function getReport(
  start: string,
  end: string,
  doctor?: number | "",
  vertical?: string
) {
  const response = await api.get("reports/summary/", {
    params: {
      start,
      end,
      ...(doctor ? { doctor } : {}),
      ...(vertical ? { vertical } : {}),
    },
  });
  return response.data;
}
