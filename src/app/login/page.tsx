//Login Page

"use client";
import { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/firebaseConfig";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Suspense } from "react";

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
  const functions = getFunctions();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectToPage = useCallback((userType: string, userId: string) => {
    const qr = searchParams.get("qr");
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
        if (qr) {
          router.push(`/consumer/${userId}?qr=${encodeURIComponent(qr)}`);
        } else {
          router.push(`/consumer/${userId}`);
        }
        break;
      case "Government":
        router.push("/government");
        break;
      default:
        setError("Invalid user type. Please contact support.");
    }
  }, [router, searchParams]);

  useEffect(() => {
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
  }, [redirectToPage]);

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

        // Generate orgID based on organization name + random 6-character alphanumeric string
        const orgBase = organization
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .substring(0, 6);
        const randomPart = Math.random().toString(36).substring(2, 8);
        const orgID = `${orgBase}${randomPart}`;

        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          userType,
          role: "admin",
          organization: userType === "Consumer" ? "" : organization,
          orgID: userType === "Consumer" ? "" : orgID,
        });

        if (userType !== "Consumer") {
          await setDoc(doc(db, "organizations", orgID), {
            name: organization,
            type: userType,
            adminId: user.uid,
            createdAt: serverTimestamp(),
            employeeIds: [],
          });

          // Set admin custom claim for this user for this org
          const setUserOrgAdmin = httpsCallable(functions, "setUserOrgAdmin");
          await setUserOrgAdmin({ uid: user.uid, orgID });
          await auth.currentUser?.getIdToken(true);
        }
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
    setIsLoading(true);
    signInWithEmailAndPassword(auth, userEmail, userPassword)
      .then((userCredential) => {
        const user = userCredential.user;
        redirectToPage(userType, user.uid);
      })
      .catch((error) => {
        console.error("Error logging in with demo account:", error);
        setError("Failed to log in as demo user.");
      })
      .finally(() => {
        setIsLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar links={[{ label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" }, { label: "About", href: "/about", tooltip: "About the team behind UEMP" }]} />
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-green-100 to-green-100 py-8 mb-8 shadow-inner">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-700 mb-4">
            Unified E-Waste Management Platform
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-6">
            Join us in making E-waste recycling smarter, safer, and more transparent for everyone—manufacturers, recyclers, consumers, and government!
          </p>
            <div className="flex flex-wrap justify-center gap-2">
            <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-full font-semibold text-sm">Track Products</span>
            <span className="bg-green-200 text-green-900 px-2 py-1 rounded-full font-semibold text-sm">Recycle Responsibly</span>
            <span className="bg-yellow-200 text-yellow-900 px-2 py-1 rounded-full font-semibold text-sm">Earn Rewards</span>
            <span className="bg-red-200 text-red-900 px-2 py-1 rounded-full font-semibold text-sm">Government Oversight</span>
            </div>
          <div
            className="w-full flex justify-center mt-5"
          >
            <button
              className="w-full max-w-2xl px-6 py-3 bg-green-600 text-white rounded-full font-semibold shadow hover:bg-green-700 transition text-center text-lg block focus:outline-none"
              tabIndex={0}
              style={{ letterSpacing: "0.02em" }}
              onClick={() => {
                const loginSection = document.getElementById("login-section");
                if (loginSection) {
                  loginSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Login below
            </button>
          </div>
        </div>
      </section>
      <div id="login-section" className="flex flex-col items-center justify-center min-h-screen px-4">
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
                <Spinner size={25} color="white" />
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
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 
            focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 w-full sm:w-1/2 md:w-1/3"
            disabled={isLoading}
            style={{ minHeight: "52px" }}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}