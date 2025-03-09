"use client";

import { useState, useEffect } from "react";
import { auth } from "@/firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const Login = () => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("firstVisit")) {
      localStorage.setItem("firstVisit", "true");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(false);
      
      if (currentUser && localStorage.getItem("firstVisit") !== "true") {
        router.push(`/Recyclerpage/${currentUser.uid}`);
      }
    });
  
    return () => unsubscribe();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User Logged In Successfully");
        router.push(`/Recyclerpage/${userCredential.user.uid}`);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User Registration Successful");
        
        setEmail("");
        setPassword("");
        
        setError("Signup successful! You can now log in.");
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
      {/* Navbar */}
      <Navbar links={[{ label: "About Us", href: "/about" }]} />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 pt-16">
        <div className="bg-white p-8 rounded-lg shadow-md w-96 mt-8">
          <h1 className="text-2xl font-bold mb-4 text-center text-green-700">
            {isLogin ? "Login" : "Sign Up"}
          </h1>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border p-2 rounded w-full text-black bg-white placeholder-gray-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border p-2 rounded w-full text-black bg-white placeholder-gray-500"
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </form>
          <p className="text-center text-black mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
