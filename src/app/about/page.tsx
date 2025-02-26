"use client";

import Image from "next/image";

const Navbar = () => {
  return (
    <nav className="w-full bg-[#000500] text-white p-4 flex justify-center items-center shadow-md fixed top-0 left-0 right-0 z-10">
      <a href="/" className="text-2xl font-bold">UEMP</a>
    </nav>
  );
};

const AboutUs = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center pt-16">
      <Navbar />
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
  );
};

export default AboutUs;
