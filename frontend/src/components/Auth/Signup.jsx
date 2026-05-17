import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { signupUser, loginUser } from "../../services/auth.api"; // Import API

const Signup = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Add error state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Create User in DB
      await signupUser(username, email, password);

      // 2. Auto-Login after successful signup
      const data = await loginUser(email, password);
      login(data);
      
    } catch (err) {
      setError(err.message); // Show real error (e.g. "Email already exists")
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      
      <input
        placeholder="Username"
        className="p-2 rounded bg-gray-800 text-white"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="email"
        placeholder="Email"
        className="p-2 rounded bg-gray-800 text-white"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="p-2 rounded bg-gray-800 text-white"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button className="bg-yellow-500 text-black py-2 rounded font-semibold hover:bg-yellow-400">
        Signup
      </button>
    </form>
  );
};

export default Signup;