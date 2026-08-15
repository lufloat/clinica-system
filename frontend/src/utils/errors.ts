import axios from "axios";

/**
 * O DRF responde erros de validação como { campo: ["mensagem", ...] }
 * e erros gerais como { detail: "mensagem" }.
 */
export function extractErrorMessage(error: unknown): string {

  if (!axios.isAxiosError(error) || !error.response) {
    return "Não foi possível conectar ao servidor.";
  }

  const data = error.response.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {

    if ("detail" in data) {
      return String(data.detail);
    }

    const messages = Object.values(data as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(String);

    if (messages.length > 0) {
      return messages.join("\n");
    }

  }

  return "Erro inesperado. Tente novamente.";
}
