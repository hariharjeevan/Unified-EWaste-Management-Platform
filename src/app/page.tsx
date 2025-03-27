"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { FaIndustry, FaRecycle, FaLandmark } from "react-icons/fa6";
import { BsPersonWorkspace } from "react-icons/bs";
import { auth, db } from "@/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Mona_Sans } from 'next/font/google';
import { useDencrypt } from "use-dencrypt-effect";

const monaSans = Mona_Sans({
  subsets: ['latin'],
  weight: '800',
  display: 'swap',
});

const Home = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [value, setValue] = useDencrypt({ chars: "Mgeaentn W-Esta" });

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
    }
    );
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
  }, [setValue]);

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
    <div className="relative min-h-screen flex flex-col bg-[#f5f3f4]">
      <Navbar links={[{ label: "About Us", href: "/about" }]} />
      <div className="absolute top-16 right-0 w-1/3 h-auto z-0 pointer-events-none">
        {/* <div className="relative w-full h-full">
          <Image
            src="/Cleaning Earth Environment.svg"
            alt="E-Waste Management"
            fill
            style={{ objectFit: "contain" }}
            className="rounded-lg shadow-md"
          />

        </div> */}
      </div>
      <main className="p-6 flex flex-col items-center flex-grow">
        <h1 className={`${monaSans.className} font-sans`}>
          <p className=" sm:text-3xl text-center md:text-4xl text-green-500 mb-4 relative z-10">Unified {value} Platform</p>
        </h1>
        <div className="max-w-4xl text-center mb-2 flex flex-col items-center justify-center relative z-10">

          <div className="md:w-2/3">
            <p className="text-lg text-[#000500] mb-6 font-semibold relative z-10">
              Every year, millions of tons of e-waste are discarded. Our platform helps recover valuable materials and protect our planet through efficient recycling.
            </p>
          </div>
        </div>

        <button
          className="
            relative px-8 py-4 text-xl font-bold text-white rounded-full shadow-md transition-all 
            bg-gradient-to-r from-green-500 via-green-300 to-green-400 hover:shadow-lg hover:scale-105 
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent 
            before:via-white before:to-transparent before:opacity-20 before:animate-glow mb-4
            "
          onClick={() => {
            document.getElementById("links-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Get Started
        </button>

        <div className="bg-[#ffffff] shadow-md rounded-lg p-8 max-w-4xl mb-6 relative z-10">
          <h2 className="text-3xl font-bold text-[#000500] mb-4 border-b-2 border-green-500 pb-2">Why Choose UEMP?</h2>
          <p className="text-lg text-[#000500] mb-4 leading-relaxed">
            By choosing UEMP, you contribute to reducing toxic pollution, minimizing mining activities, and lowering carbon emissions.
          </p>
          <p className="text-lg text-[#000500] mb-4 leading-relaxed">
            Our platform ensures transparency by tracking electronic products from creation to disposal. QR codes enable responsible recycling and disposal.
          </p>
          <p className="text-lg text-[#000500] mb-4 leading-relaxed">
            We connect manufacturers, recyclers, and consumers to create a seamless and efficient e-waste management system.
          </p>
        </div>
        <div className="bg-[#ffffff] shadow-lg rounded-lg p-8 max-w-4xl mt-4 relative z-10">
          <h2 className="text-3xl font-bold text-[#000500] mb-4 border-b-2 border-green-500 pb-2">Our Mission</h2>
          <p className="text-lg text-[#000500] mb-4 leading-relaxed">
            UEMP is committed to reducing electronic waste and promoting sustainable practices in the electronics industry.
          </p>
          <p className="text-lg text-[#000500] mb-4 leading-relaxed">
            Join us in our mission to create a cleaner, greener planet by responsibly managing electronic waste. Together, we can make a difference.
          </p>
        </div>

        {/* Links Section */}
        <div id="links-section" className="w-full max-w-4xl relative mt-4 z-10">
          <h1 className={`${monaSans.className} font-sans`}>
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
          <div className="hidden md:flex justify-center mt-6">
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
        </div>

      </main>

      <footer className="bg-[#000500] text-white p-4 text-center mt-12">
        <p>&copy; 2025 UEMP. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;