import axios from "axios";

// Em produção o frontend e a API ficam no mesmo domínio, atrás do mesmo
// proxy: basta o caminho relativo. O endereço absoluto só serve em
// desenvolvimento, onde o Vite (5173) e o Django (8000) estão em portas
// diferentes. O valor é fixado no build — veja VITE_API_URL no Dockerfile.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Sessão expirada: um token velho/inválido fazia as telas quebrarem em branco.
// Em 401, descarta a sessão e volta para o login — exceto quando o próprio
// login/registro respondeu 401 (aí quem trata é a tela, mostrando a mensagem).
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url: string = error.config?.url ?? "";
        const isAuthCall = url.includes("accounts/login");

        if (status === 401 && !isAuthCall) {
            localStorage.removeItem("token");
            localStorage.removeItem("refresh");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
