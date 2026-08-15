import api from "../api/axios";

export type Employee = {
  id: number;
  name: string;
  username: string;
  email: string;
  role_id: number | null;
  role_name: string | null;
  /** profissional vinculado — preenchido, o acesso é restrito à agenda dele */
  doctor_id: number | null;
  doctor_name: string | null;
  is_active: boolean;
  must_change_password: boolean;
  last_login: string | null;
  last_login_ip: string | null;
  created_at: string;
};

export type EmployeeInput = {
  name: string;
  email: string;
  username?: string;
  password?: string;
  role_id?: number | null;
  doctor_id?: number | null;
  is_active: boolean;
};

export async function getEmployees(): Promise<Employee[]> {
  const response = await api.get("accounts/employees/");
  return response.data;
}

export async function createEmployee(data: EmployeeInput) {
  const response = await api.post("accounts/employees/", data);
  return response.data;
}

export async function updateEmployee(id: number, data: EmployeeInput) {
  const response = await api.put(`accounts/employees/${id}/`, data);
  return response.data;
}

export async function deleteEmployee(id: number) {
  await api.delete(`accounts/employees/${id}/`);
}
