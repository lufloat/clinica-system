import api from "../api/axios";

export type PermissionMap = Record<string, string[]>;

export type Role = {
  id: number;
  name: string;
  description: string;
  is_admin: boolean;
  is_system: boolean;
  permissions: PermissionMap;
  employee_count: number;
};

export type RoleInput = {
  name: string;
  description?: string;
  is_admin?: boolean;
  permissions?: PermissionMap;
};

export type ModuleDef = { key: string; label: string };
export type ActionDef = { key: string; label: string };

export async function getRoles(): Promise<Role[]> {
  const response = await api.get("accounts/roles/");
  return response.data;
}

export async function createRole(data: RoleInput) {
  const response = await api.post("accounts/roles/", data);
  return response.data;
}

export async function updateRole(id: number, data: RoleInput) {
  const response = await api.put(`accounts/roles/${id}/`, data);
  return response.data;
}

export async function deleteRole(id: number) {
  await api.delete(`accounts/roles/${id}/`);
}

export async function getPermissionCatalog(): Promise<{
  modules: ModuleDef[];
  actions: ActionDef[];
}> {
  const response = await api.get("accounts/permission-catalog/");
  return response.data;
}
