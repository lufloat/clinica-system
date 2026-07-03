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

export async function register(data: any) {

  const response = await api.post(
    "accounts/register/",
    data
  );

  return response.data;

}