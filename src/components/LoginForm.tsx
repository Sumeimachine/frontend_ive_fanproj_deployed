import { useState } from "react";
import api from "../services/src/services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface LoginData {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

const LoginForm = () => {
  const [form, setForm] = useState<LoginData>({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await api.post<LoginResponse>("/Auth/login", form);

      login(res.data.token);

      navigate("/dashboard");
    } catch {
      setError("Invalid login credentials");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
      <h2>Login</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Login</button>
      </form>

      {error && <p>{error}</p>}
    </div>
  );
};

export default LoginForm;
