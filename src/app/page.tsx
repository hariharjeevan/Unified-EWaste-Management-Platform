"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { FaIndustry, FaRecycle } from "react-icons/fa6";
import { BsPersonWorkspace } from "react-icons/bs";
import Image from "next/image";

const Home = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#f5f3f4]">
      <Navbar links={[{ label: "About Us", href: "/about" }]} />
      <div className="absolute top-16 right-0 w-1/3 h-auto z-0 pointer-events-none">
        <div className="relative w-full h-full">
          <Image
            src="/Cleaning Earth Environment.svg"
            alt="E-Waste Management"
            layout="fill"
            objectFit="contain"
            className="rounded-lg shadow-md"
          />
        </div>
      </div>
      <main className="p-6 flex flex-col items-center flex-grow">
        <div className="max-w-4xl text-center mb-2 flex flex-col items-center justify-center relative z-10">
          <div className="md:w-2/3">
            <h1 className="text-4xl font-extrabold text-green-500 mb-6 relative z-10">
              Unified E-Waste Management Platform
            </h1>
            <p className="text-lg text-[#000500] mb-6 font-semibold relative z-10">
              Every year, millions of tons of e-waste are discarded. Our platform helps recover valuable materials and protect our planet through efficient recycling.
            </p>
          </div>
        </div>
        <div className="bg-[#ffffff] shadow-md rounded-lg p-8 max-w-4xl mb-6 relative z-10">
          <h2 className="text-3xl font-bold text-[#000500] mb-6 border-b-2 border-green-500 pb-2">Why Choose UEMP?</h2>
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

        <h2 
          className="text-3xl font-bold text-[#000500] mb-8 border-b-2 border-green-500 pb-2 cursor-pointer transition-transform transform hover:scale-105 relative z-10"
          onClick={() => {
            document.getElementById('links-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Get Started
        </h2>
        <div id="links-section" className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl relative z-10">
          <Link
            href="/login"
            className="bg-blue-500 p-8 rounded-lg text-center shadow-md border-2 border-dashed transition-transform transform hover:scale-105 border border-[#000500]"
          >
            <div className="flex justify-center mb-2">
              <FaIndustry size={60} className="font-bold text-[#ffffff]" />
            </div>
            <h2 className="text-2xl font-bold text-[#ffffff] border-2 border-dashed mb-5">Manufacturer</h2>
            <p className="text-lg text-[#ffffff]">Generate QR codes for your products and ensure responsible recycling.</p>
          </Link>
          <Link
            href="/recycler"
            className="bg-green-500 p-8 rounded-lg text-center shadow-md border-2 border-dashed transition-transform transform hover:scale-105 border border-[#000500]"
          >
            <div className="flex justify-center mb-2">
              <FaRecycle size={60} className="font-bold text-[#ffffff]" />
            </div>
            <h2 className="text-2xl font-bold text-[#ffffff] border-2 border-dashed mb-5">Recycler</h2>
            <p className="text-lg text-[#ffffff]">Register your recycling facility and join our network of responsible recyclers.</p>
          </Link>
          <Link
            href="/consumer"
            className="bg-yellow-500 p-8 rounded-lg text-center shadow-md border-2 border-dashed transition-transform transform hover:scale-105 border border-[#000500]"
          >
            <div className="flex justify-center mb-2">
              <BsPersonWorkspace size={60} className="font-bold text-[#ffffff]" />
            </div>
            <h2 className="text-2xl font-bold text-[#ffffff] border-2 border-dashed mb-5">Consumer</h2>
            <p className="text-lg text-[#ffffff]">Find ways to recycle your electronic products responsibly and easily.</p>
          </Link>
        </div>

        <div className="bg-[#ffffff] shadow-lg rounded-lg p-8 max-w-4xl mt-12 relative z-10">
          <h2 className="text-3xl font-bold text-[#000500] mb-6 border-b-2 border-green-500 pb-2">Our Mission</h2>
          <p className="text-lg text-[#000500] mb-4 leading-relaxed">
            UEMP is committed to reducing electronic waste and promoting sustainable practices in the electronics industry.
          </p>
          <p className="text-lg text-[#000500] mb-4 leading-relaxed">
            Join us in our mission to create a cleaner, greener planet by responsibly managing electronic waste. Together, we can make a difference.
          </p>
        </div>
      </main>

      <footer className="bg-[#000500] text-white p-4 text-center mt-12">
        <p>&copy; 2025 UEMP. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;