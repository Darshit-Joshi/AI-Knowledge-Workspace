export const resetPassword = (
  token,
  new_password
) =>
  api.post("/auth/reset-password", {
    token,
    new_password,
  });


export const loginUser = async (data) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const registerUser = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
}

export const forgotPassword = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
}

export const googleLogin = async (token) => {
  const res = await api.post("/auth/google/login", { token });
  return res.data;
}
export const get_me = async (token) => {
  const res = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}
