const BASE_URL = "http://localhost:8000/auth";

export const setToken = (token) => {
  localStorage.setItem("access_token", token);
};

export const getToken = () => {
  return localStorage.getItem("access_token ");
};

export const logout = () => {
  localStorage.removeItem("access_token");
};

export const register = async (userData) => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error("Registration failed");
  return response.json();
};
