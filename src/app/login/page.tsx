//Login Page
"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebaseConfig";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [userType, setUserType] = useState("Manufacturer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const redirectToPage = (userType: string, uid: string) => {
      if (userType === "consumer") {
        router.push(`/consumer/${uid}`);
      } else if (userType === "recycler") {
        router.push(`/recycler/${uid}`);
      } else {
        setError("Unknown user type.");
      }
    };
  
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser: User | null) => {
        if (currentUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              redirectToPage(userData.userType, currentUser.uid);
            } else {
              setError("User data not found. Please sign up again.");
            }
          } catch (err) {
            console.error("Error fetching user data:", err);
            setError("Failed to fetch user data.");
          }
        }
      }
    );
  
    return () => unsubscribe();
  }, [router]);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      let user;
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        user = userCredential.user;
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          userType,
          organization: userType === "Consumer" ? "" : organization,
        });
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        redirectToPage(userData.userType, user.uid);
      } else {
        setError("No user data found. Please contact support.");
      }
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error("Authentication Error:", error);
        setError(error.message);
      } else {
        console.error("Unexpected Error:", error);
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error("Password Reset Error:", error);
        setError(error.message);
      } else {
        console.error("Unexpected Error:", error);
        setError("An error occurred. Please try again.");
      }
    }
  };

  // Function to handle demo login based on user type
  const handleDemoLogin = (userEmail: string, userPassword: string, userType: string) => {
    signInWithEmailAndPassword(auth, userEmail, userPassword)
      .then((userCredential) => {
        const user = userCredential.user;
        redirectToPage(userType, user.uid);
      })
      .catch((error) => {
        console.error("Error logging in with demo account:", error);
        setError("Failed to log in as demo user.");
      });
  };

  const handleDemoManufacturerLogin = () => {
    handleDemoLogin(
      process.env.NEXT_PUBLIC_DEMO_MANUFACTURER_EMAIL!,
      process.env.NEXT_PUBLIC_DEMO_MANUFACTURER_PASSWORD!,
      "Manufacturer"
    );
  };

  const handleDemoRecyclerLogin = () => {
    handleDemoLogin(
      process.env.NEXT_PUBLIC_DEMO_RECYCLER_EMAIL!,
      process.env.NEXT_PUBLIC_DEMO_RECYCLER_PASSWORD!,
      "Recycler"
    );
  };

  const handleDemoConsumerLogin = () => {
    handleDemoLogin(
      process.env.NEXT_PUBLIC_DEMO_CONSUMER_EMAIL!,
      process.env.NEXT_PUBLIC_DEMO_CONSUMER_PASSWORD!,
      "Consumer"
    );
  };

  const handleDemoGovernmentLogin = () => {
    handleDemoLogin(
      process.env.NEXT_PUBLIC_DEMO_GOVERNMENT_EMAIL!,
      process.env.NEXT_PUBLIC_DEMO_GOVERNMENT_PASSWORD!,
      "Government"
    );
  };

  const redirectToPage = (userType: string, userId: string) => {
    if (!userType) {
      setError("User type is undefined. Please try logging in again.");
      return;
    }

    switch (userType) {
      case "Manufacturer":
        router.push("/manufacturer");
        break;
      case "Recycler":
        router.push("/recycler");
        break;
      case "Consumer":
        router.push(`/consumer/${userId}`);
        break;
      case "Government":
        router.push("/government");
        break;
      default:
        setError("Invalid user type. Please contact support.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar links={[{ label: "Docs", href: "/docs", tooltip:"Refer to the website's documentation" }, { label: "About", href: "/about", tooltip:"About the team behind UEMP" }]} />
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mt-6">
          <h1 className="text-2xl font-bold mb-4 text-center text-green-700">
            {isLogin ? "Login" : "Sign Up"}
          </h1>

          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && <p className="text-green-500 text-center">{success}</p>}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border p-2 rounded w-full text-black bg-white placeholder-gray-500"
                />

                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  required
                  className="border p-2 rounded w-full text-black bg-white"
                >
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Recycler">Recycler</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Government">Government</option>
                </select>

                {userType !== "Consumer" && (
                  <input
                    type="text"
                    placeholder="Organization Name"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                    className="border p-2 rounded w-full text-black bg-white placeholder-gray-500"
                  />
                )}
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border p-2 rounded w-full text-black bg-white placeholder-gray-500"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Password" : "Create Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border p-2 rounded w-full text-black bg-white placeholder-gray-500 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </button>
            </div>

            {isLogin && (
              <p
                className="text-sm text-blue-500 cursor-pointer hover:underline text-center"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </p>
            )}

            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              ) : isLogin ? (
                "Login"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
          <p className="text-center text-black mt-4">
            {isLogin
              ? "Don't have an account yet? "
              : "Already have an account? "}
            <span
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>

        {/* Title for Demo Logins */}
        <h2 className="text-2xl font-bold text-center text-green-700 mt-8">
          Try our Demo Logins
        </h2>

        {/* Demo Login Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
          <button
            onClick={handleDemoManufacturerLogin}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 
            focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200 w-full sm:w-1/2 md:w-1/3"
          >
            Manufacturer Login
          </button>
          <button
            onClick={handleDemoRecyclerLogin}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 
            focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 w-full sm:w-1/2 md:w-1/3"
          >
            Recycler Login
          </button>
          <button
            onClick={handleDemoConsumerLogin}
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 
            focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-200 w-full sm:w-1/2 md:w-1/3"
          >
            Consumer Login
          </button>
          <button
            onClick={handleDemoGovernmentLogin}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 
            focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-200 w-full sm:w-1/2 md:w-1/3"
          >
            Government Login
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;