import api from "../api/axios";

export async function login(
  username: string,
  password: string
) {

  const response = await api.post(
    "accounts/login/",
    {
      username,
      password,
    }
  );

  return response.data;

}

export async function getMe() {
  const response = await api.get("accounts/me/");
  return response.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const response = await api.post("accounts/change-password/", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
}