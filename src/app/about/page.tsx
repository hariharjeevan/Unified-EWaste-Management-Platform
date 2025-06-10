//About Page
"use client";

import Image from "next/image";
import Link from "next/link"
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaLinkedin, FaGithubSquare } from "react-icons/fa";
import GradientText from "@/components/GradText";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
      {/* Navbar */}
      <Navbar links={[{ label: "", href: "", tooltip: "" }]} />
      <div className="bg-gray-100 min-h-screen flex flex-col items-center pt-16 ml-2 mr-2">
        <h2 className="text-3xl font-bold text-black mt-6">About Us</h2>
        <p className="text-lg text-gray-700 text-center max-w-2xl mt-4">
          Introducing <code>Aventra</code>, the innovative team behind UEMP.
        </p>
        <p className="text-gray-700 text-center max-w-2xl mt-4">&quot;Our mission is to revolutionize e-waste management by creating a seamless, transparent, and efficient platform for manufacturers, recyclers, and consumers.&quot;</p>
        <div className="flex flex-col mb-4 sm:flex-row gap-4 w-full justify-center items-center px-2">
          <div className="mt-6 bg-white shadow-lg rounded-lg p-4 flex flex-col items-center w-full max-w-xs">
            <Image src="/team/ASJ.png"
              alt="Team"
              width={200}
              height={200}
              priority
            />
            <GradientText
              colors={["#000000", "#000000", "#f39340", "#000000", "#000000"]}
              animationSpeed={4}
              showBorder={false}
              className="custom-class font-semibold mt-4 mb-2 text-xl text-black text-center"
            >Armaan Samir Jena
            </GradientText>
            <div className="flex flex-row gap-2 items-center justify-center text-black text-2xl">
              <Link href="https://www.linkedin.com/in/jena-armaan" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="transition-transform duration-300 hover:scale-105 hover:text-[#f39340]" />
              </Link>
              <Link href="https://github.com/jenaarmaan" target="_blank" rel="noopener noreferrer">
                <FaGithubSquare className="transition-transform duration-300 hover:scale-105 hover:text-[#f39340]" />
              </Link>
            </div>
          </div>
          <div className="mt-6 bg-white shadow-lg rounded-lg p-4 flex flex-col items-center w-full max-w-xs">
            <Image
              src="/team/AHR.png"
              alt="Team"
              width={200}
              height={200}
              priority
            />
            <GradientText
              colors={["#000000", "#000000", "#eeb537", "#000000", "#000000"]}
              animationSpeed={4}
              showBorder={false}
              className="custom-class font-semibold mt-4 mb-2 text-xl text-black text-center"
            >Arya H R
            </GradientText>
            <div className="flex flex-row gap-2 items-center justify-center text-black text-2xl">
              <Link href="https://www.linkedin.com/in/arya-gowda-138488298" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="transition-transform duration-300 hover:scale-105 hover:text-[#eeb537]" />
              </Link>
              <Link href="https://github.com/Arya-1-HR" target="_blank" rel="noopener noreferrer">
                <FaGithubSquare className="transition-transform duration-300 hover:scale-105 hover:text-[#eeb537]" />
              </Link>
            </div>
          </div>
          <div className="mt-6 bg-white shadow-lg rounded-lg p-4 flex flex-col items-center w-full max-w-xs">
            <Image
              src="/team/HJ1.png"
              alt="Team"
              width={200}
              height={200}
              priority
            />
            <GradientText
              colors={["#000000", "#000000", "#ffdf3b", "#000000", "#000000"]}
              animationSpeed={4}
              showBorder={false}
              className="custom-class font-semibold mt-4 mb-2 text-xl text-black text-center"
            >
              Harihar Jeevan
            </GradientText>
            <div className="flex flex-row gap-2 items-center justify-center text-black text-2xl">
              <Link href="https://in.linkedin.com/in/harihar-jeevan-2730572bb" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="transition-transform duration-300 hover:scale-110 hover:text-[#ffdf3b]" />
              </Link>
              <Link href="https://github.com/hariharjeevan" target="_blank" rel="noopener noreferrer">
                <FaGithubSquare className="transition-transform duration-300 hover:scale-105 hover:text-[#ffdf3b]" />
              </Link>
            </div>
          </div>
          <div className="mt-6 bg-white shadow-lg rounded-lg p-4 flex flex-col items-center w-full max-w-xs">
            <Image
              src="/team/PR.png"
              alt="Team"
              width={200}
              height={200}
              priority
            />
            <GradientText
              colors={["#000000", "#000000", "#91d3ed", "#000000", "#000000"]}
              animationSpeed={4}
              showBorder={false}
              className="custom-class font-semibold mt-4 mb-2 text-xl text-black text-center"
            >Parinith R
            </GradientText>
            <div className="flex flex-row gap-2 items-center justify-center text-black text-2xl">
              <Link href="https://www.linkedin.com/in/parinith-r-848871335" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="transition-transform duration-300 hover:scale-105 hover:text-[#91d3ed]" />
              </Link>
              <Link href="https://github.com/parinith-png" target="_blank" rel="noopener noreferrer">
                <FaGithubSquare className="transition-transform duration-300 hover:scale-105 hover:text-[#91d3ed]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;
