import api from "../api/axios";

export type DoctorDTO = {
  name: string;
  crm: string;
  specialty: string;
  phone: string;
  email: string;
};

export async function getDoctors() {
  const response = await api.get("doctors/");
  return response.data;
}

export async function createDoctor(data: DoctorDTO) {
  const response = await api.post("doctors/", data);
  return response.data;
}

export async function updateDoctor(
  id: number,
  data: DoctorDTO
) {
  const response = await api.put(`doctors/${id}/`, data);
  return response.data;
}

export async function deleteDoctor(id: number) {
  const response = await api.delete(`doctors/${id}/`);
  return response.data;
}