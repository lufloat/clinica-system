import api from "../api/axios";

import type { Office } from "../pages/Offices/office.types";

export async function getOffices() {
  const response = await api.get("offices/");
  return response.data;
}

export async function createOffice(data: Office) {
  const response = await api.post("offices/", data);
  return response.data;
}

export async function updateOffice(id: number, data: Office) {
  const response = await api.put(`offices/${id}/`, data);
  return response.data;
}

export async function deleteOffice(id: number) {
  await api.delete(`offices/${id}/`);
}