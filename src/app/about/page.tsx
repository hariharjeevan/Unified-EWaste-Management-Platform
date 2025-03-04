"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
      {/* Navbar */}
      <Navbar links={[{ label: "", href: "" }]} />
      <div className="bg-gray-100 min-h-screen flex flex-col items-center pt-16">
        <h2 className="text-3xl font-bold text-black mt-6">About Us</h2>
        <p className="text-lg text-gray-700 text-center max-w-2xl mt-4">
          Introducing Aventra, the innovative team behind UEMP.
        </p>
        <p className="text-gray-700 text-center max-w-2xl mt-4">"Our mission is to revolutionize e-waste management by creating a seamless, transparent, and efficient platform for manufacturers, recyclers, and consumers."</p>
        <div className="mt-6 bg-white shadow-lg rounded-lg p-4 items-center">
          <Image src="/team_member1.jpg" alt="Team Member 1" width={200} height={200} className="rounded-full" />
          <h3 className="mt-4 text-xl font-semibold text-black text-center">Aventra</h3>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
