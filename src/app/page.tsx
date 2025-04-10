//UEMP Home Page
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { FaIndustry, FaRecycle, FaLandmark } from "react-icons/fa6";
import { BsPersonWorkspace } from "react-icons/bs";
import { auth, db } from "@/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Mona_Sans } from 'next/font/google';
import { useDencrypt } from "use-dencrypt-effect";
import Image from "next/image";
import Head from "next/head";

const monaSansB = Mona_Sans({
  subsets: ['latin'],
  weight: '800',
  display: 'swap',
});

const monaSansN = Mona_Sans({
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
});

const Home = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [value, setValue] = useDencrypt({ chars: "tnemeganaMetsaWE" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserType(userData.userType);
          setUserId(currentUser.uid);
          console.log("User ID:", userId);

        }
      }
    });
    {
      const loop = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        setValue("E-Waste Management");
      };
      loop();

      return () => {
        unsubscribe();
      };
    };
  }, [setValue, userId]);

  const handleLinkClick = (requiredUserType: string, href: string) => {
    if (!userType || !userId) {
      router.push("/login");
      return;
    }

    if (userType === requiredUserType) {
      if (requiredUserType === "Consumer") {
        router.push(`/consumer/${userId}`);
      } else {
        router.push(href);
      }
    } else {
      setError(`You must be logged in as a ${requiredUserType} to access this page.`);
    }
  };

  return (
    <div className={`${monaSansN.className} relative min-h-screen flex flex-col bg-[#f5f3f4]`}>
      <Navbar links={[{ label: "Docs", href: "/docs", tooltip:"Refer to the website's documentation" }, { label: "About", href: "/about", tooltip:"About the team behind UEMP" }]} />
      <Head>
        <title>Unified E-Waste Management Platform</title>
        <meta name="description" content="A digital platform dedicated to optimizing the lifecycle of electronic products, promoting sustainable recycling practices, and minimizing environmental impact." />

        {/* Open Graph tags */}
        <meta property="og:title" content="Unified E-Waste Management Platform" />
        <meta property="og:description" content="A digital platform dedicated to optimizing the lifecycle of electronic products, promoting sustainable recycling practices, and minimizing environmental impact." />
        <meta property="og:image" content="https://unified-e-waste-management-platform.vercel.app/screenshot.png" />
        <meta property="og:url" content="https://unified-e-waste-management-platform.vercel.app" />
        <meta property="og:type" content="website" />

        {/* Twitter card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Unified E-Waste Management Platform" />
        <meta name="twitter:description" content="A digital platform dedicated to optimizing the lifecycle of electronic products, promoting sustainable recycling practices, and minimizing environmental impact." />
        <meta name="twitter:image" content="https://unified-e-waste-management-platform.vercel.app/screenshot.png" />
      </Head>

      <main className="p-0 flex flex-col items-center flex-grow w-full">

        {/* Hero Section */}
        <div className="hero">
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-xl p-8 shadow-lg m-0 md:m-4 w-full md:w-auto">
            <h1 className={`${monaSansB.className} font-sans`}>
              <p className="text-center text-[#071D10] text-3xl md:text-4xl mb-1 relative z-10">
                <span className="block md:inline">Unified</span>
                <br className="hidden md:block" />
                <span className="inline-block min-h-[2em] md:inline min-h-[2em] w-full md:w-auto">
                  {value && window.innerWidth >= 768 ? (
                    <span style={{ visibility: value ? "visible" : "hidden", display: "inline-block", width: "auto", whiteSpace: "nowrap", overflow: "hidden", padding: "0 0 0 0" }}>{value}</span>
                  ) : (
                    "E-Waste Management"
                  )}
                </span>
                <br className="hidden md:block" />
                <span className="block md:inline">Platform</span>
              </p>
            </h1>
            <h2 className={`${monaSansB.className} font-sans text-lg md:text-xl text-center text-[#2F2F2F] mb-8`}>
              &quot;Bringing accountability into perspective&quot;
            </h2>
            <div className="max-w-4xl text-center mb-2 flex flex-col items-center justify-center relative z-10">
              <div className="w-full md:w-2/3">
                <p className="text-sm md:text-xl mb-6 font-semibold relative z-10">
                  Every year, millions of tons of e-waste are discarded. Our platform helps recover valuable materials and protect our planet through efficient recycling.
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                className="
          relative px-6 py-3 md:px-8 md:py-4 text-lg md:text-xl font-bold rounded-full shadow-md transition-all 
          bg-white text-green-700 border-2 border-green-700 hover:shadow-lg hover:scale-105 
          before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent 
          before:via-green-700 before:to-transparent before:opacity-10 before:animate-glow mb-8
          "
                onClick={() => {
                  document.getElementById("links-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Why Choose UEMP Section */}
        <div className="bg-[#ffffff] p-8 w-full flex flex-col items-center relative z-10">
          <div className="w-full">
            <h2 className="text-3xl font-bold text-[#000500] mb-4 text-center">
              Why Choose UEMP?
            </h2>
            <p className="text-lg text-[#000500] mb-4 leading-relaxed text-center">
              By choosing UEMP, you contribute to reducing toxic pollution, minimizing mining activities, and lowering carbon emissions.
            </p>
            <p className="text-lg text-[#000500] mb-4 leading-relaxed text-center">
              Our platform ensures transparency by tracking electronic products from creation to disposal. QR codes enable responsible recycling and disposal.
            </p>
            <div className="flex justify-center mb-4">
              <Image
                src="/question.png"
                alt="Why Choose UEMP"
                width="400"
                height="400"
              />
            </div>
            <p className="text-lg text-[#000500] mb-4 leading-relaxed text-center">
              We connect manufacturers, recyclers, consumers and government organizations to create a seamless and efficient e-waste management system.
            </p>
          </div>
        </div>

        {/* Our Mission Section */}
        <div className="bg-[#f5f3f4] p-8 w-full flex flex-col md:flex-row items-center relative z-10">
          <div className="md:w-2/3 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#000500] mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-[#000500] mb-4 leading-relaxed">
              UEMP is committed to reducing electronic waste and promoting sustainable practices in the electronics industry.
            </p>
            <p className="text-lg text-[#000500] mb-4 leading-relaxed">
              Join us in our mission to create a cleaner, greener planet by responsibly managing electronic waste. Together, we can make a difference.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <Image
              src="/idea.png"
              alt="Our Mission"
              width="500"
              height="500"
            />
          </div>
        </div>

        {/* Links Section */}
        <div id="links-section" className="w-full max-w-4xl relative mt-4 z-10 px-4">
          <h1 className={`${monaSansB.className} font-sans`}>
            <p className="text-2xl text-green-500 mt-4 relative z-10">Choose your role:</p>
          </h1>
          {error && <p className="bg-black p-1 text-red-500 font-[Consolas]">{error}</p>}

          {/* Buttons for smaller screens (2 in a row) */}
          <div className="mt-4 grid grid-cols-2 gap-4 md:hidden">
            <button
              onClick={() => handleLinkClick("Manufacturer", "/manufacturer")}
              className="bg-blue-500 p-6 w-full rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]"
            >
              <div className="flex justify-center mb-2">
                <FaIndustry size={50} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-sm font-bold text-[#ffffff] border border-dashed mb-3 px-2">
                Manufacturer
              </h2>
            </button>
            <button
              onClick={() => handleLinkClick("Recycler", "/recycler")}
              className="bg-green-500 p-6 w-full rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]"
            >
              <div className="flex justify-center mb-2">
                <FaRecycle size={50} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-sm font-bold text-[#ffffff] border border-dashed mb-3 px-2">
                Recycler
              </h2>
            </button>
            <button
              onClick={() => handleLinkClick("Consumer", "/consumer")}
              className="bg-yellow-500 p-6 w-full rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]"
            >
              <div className="flex justify-center mb-2">
                <BsPersonWorkspace size={50} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-sm font-bold text-[#ffffff] border border-dashed mb-3 px-2">
                Consumer
              </h2>
            </button>
            <button
              onClick={() => handleLinkClick("Government", "/government")}
              className="bg-red-500 p-6 w-full rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]"
            >
              <div className="flex justify-center mb-2">
                <FaLandmark size={50} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-sm font-bold text-[#ffffff] border border-dashed mb-3 px-2">
                Government
              </h2>
            </button>
          </div>

          {/* Buttons for larger screens (3 in a row) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl relative mt-8 z-10">
            {/* These buttons will be hidden on small screens */}
            <button
              onClick={() => handleLinkClick("Manufacturer", "/manufacturer")}
              className="bg-blue-500 p-8 w-[280px] rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500] md:block hidden"
            >
              <div className="flex justify-center mb-2">
                <FaIndustry size={60} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-2xl font-bold text-[#ffffff] border-2 border-dashed mb-5">Manufacturer</h2>
              <p className="text-lg text-[#ffffff]">Generate QR codes for your products and ensure responsible recycling.</p>
            </button>
            <button
              onClick={() => handleLinkClick("Recycler", "/recycler")}
              className="bg-green-500 p-8 w-[280px] rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500] md:block hidden"
            >
              <div className="flex justify-center mb-2">
                <FaRecycle size={60} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-2xl font-bold text-[#ffffff] border-2 border-dashed mb-5">Recycler</h2>
              <p className="text-lg text-[#ffffff]">Register your recycling facility and join our network of responsible recyclers.</p>
            </button>
            <button
              onClick={() => handleLinkClick("Consumer", "/consumer")}
              className="bg-yellow-500 p-8 w-[280px] rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500] md:block hidden"
            >
              <div className="flex justify-center mb-2">
                <BsPersonWorkspace size={60} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-2xl font-bold text-[#ffffff] border-2 border-dashed mb-5">Consumer</h2>
              <p className="text-lg text-[#ffffff]">Find ways to recycle your electronic products responsibly and easily.</p>
            </button>
          </div>

          {/* Buttons for larger screens (only the Government button) */}
          <div className="hidden md:flex justify-center mt-6 mb-6">
            <button
              onClick={() => handleLinkClick("Government", "/government")}
              className="bg-red-500 p-8 w-[280px] rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]"
            >
              <div className="flex justify-center mb-2">
                <FaLandmark size={60} className="font-bold text-[#ffffff]" />
              </div>
              <h2 className="text-2xl font-bold text-[#ffffff] border-2 border-dashed mb-5">Government</h2>
              <p className="text-lg text-[#ffffff]">
                Support e-waste regulations, oversee recycling initiatives, and promote sustainability.
              </p>
            </button>
          </div>
          <div><Chatbot /></div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;