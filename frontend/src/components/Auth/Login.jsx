import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../services/auth.api";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginUser(email, password);
      login(data);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <input
        type="email"
        placeholder="Email"
        className="p-2 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="p-2 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        className="bg-yellow-500 text-black py-2 rounded font-semibold hover:bg-yellow-400 transition"
      >
        Login
      </button>
    </form>
  );
};

export default Login;
