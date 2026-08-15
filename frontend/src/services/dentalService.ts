import api from "../api/axios";
import type { DentalChart, ToothRecord } from "../pages/Odontograma/dental.types";

/** Odontograma do paciente. O backend cria um vazio no primeiro acesso. */
export async function getChartByPatient(patientId: number): Promise<DentalChart> {
  const response = await api.get(`dental/charts/por-paciente/${patientId}/`);
  return response.data;
}

export async function createToothRecord(
  data: Omit<ToothRecord, "id" | "created_at">
): Promise<ToothRecord> {
  const response = await api.post("dental/tooth-records/", data);
  return response.data;
}

export async function deleteToothRecord(id: number) {
  await api.delete(`dental/tooth-records/${id}/`);
}

export async function updateChartNotes(chartId: number, notes: string) {
  const response = await api.patch(`dental/charts/${chartId}/`, { notes });
  return response.data;
}
