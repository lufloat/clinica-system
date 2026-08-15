import api from "../api/axios";


/** `vertical` vazio = todas as áreas somadas (só o administrador geral). */
export async function getDashboard(vertical?: string) {

    const response = await api.get(
        "reports/dashboard/",
        {
            params: vertical ? { vertical } : {},
        }
    );

    return response.data;

}
