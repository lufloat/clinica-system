import api from "../api/axios";
import type { Patient } from "../pages/Patients/patient.types";

export async function getPatients() {
  const response = await api.get("patients/");
  return response.data;
}

export async function createPatient(data: Patient) {
  const response = await api.post("patients/", data);
  return response.data;
}

export async function updatePatient(id: number, data: Patient) {
  const response = await api.put(`patients/${id}/`, data);
  return response.data;
}

export async function deletePatient(id: number) {
  await api.delete(`patients/${id}/`);
}