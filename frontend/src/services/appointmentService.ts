import api from "../api/axios";
import type { Appointment } from "../pages/Appointments/appointment.types";
/** `vertical` vazio = todas as áreas juntas (só o administrador geral). */
export async function getAppointments(vertical?: string) {
  const response = await api.get("appointments/", {
    params: vertical ? { vertical } : {},
  });
  return response.data;
}

export async function createAppointment(data: Appointment) {
  const response = await api.post("appointments/", data);
  return response.data;
}

export async function updateAppointment(id: number, data: Appointment) {
  const response = await api.put(`appointments/${id}/`, data);
  return response.data;
}

export async function deleteAppointment(id: number) {
  await api.delete(`appointments/${id}/`);
}

export async function finalizeAppointment(id: number) {
    const response = await api.patch(`appointments/${id}/finalize/`);
    return response.data;
}

export async function cancelAppointment(id: number) {
    const response = await api.patch(`appointments/${id}/cancel/`);
    return response.data;
}
