import api from "./client";

export async function apiLogin({ emailOrPhone, password }) {
  const { data } = await api.post("/api/auth/login", { emailOrPhone, password });
  // persist
  localStorage.setItem("jwt", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function apiRegister({ name, email, phone, password }) {
  const { data } = await api.post("/api/auth/register", { name, email, phone, password });
  localStorage.setItem("jwt", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}
