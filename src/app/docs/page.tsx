//Documentation Page
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GitHubEmbed from "@/components/GitHubEmbed";
import Image from "next/image";
import EnlargedImageModal from "@/components/EnlargedImageModal";

const DocsPage = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const openModal = (url: string) => {
    setImageUrl(url);
  };

  const closeModal = () => {
    setImageUrl(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">

      {/* Navbar */}
      <Navbar links={[{ label: "", href: "", tooltip: "" }]} />

      <main className="flex flex-col items-center p-8">
        <h1 className="text-4xl font-bold text-[#000500] mb-2">Documentation</h1>
        <p className="text-lg text-gray-700 max-w-4xl text-center mb-4">
          Welcome to the Unified E-Waste Management Platform (UEMP) documentation.
          This page provides an overview of the platform&apos;s features and the roles of Manufacturers,
          Recyclers, Consumers, and Government organizations.
        </p>

        {/* Overview Section */}
        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8 text-justify">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            UEMP is a platform designed to streamline e-waste management by connecting manufacturers,
            recyclers, consumers, and government organizations. It promotes responsible recycling,
            lifecycle tracking of electronic products, and sustainability.
          </p>
          <p className="text-gray-700">
            The platform uses QR codes to track products from manufacturing to recycling, ensuring
            transparency and accountability at every stage.
          </p>
        </section>

        {/* Login Page Section */}
        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8 text-justify">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Login Page</h2>

          {/* Description of the Login Page */}
          <p className="text-gray-700 mb-4">
            The Login Page allows users to authenticate themselves and access their accounts securely. It supports both logging in with existing credentials (email/password) and signing up for new accounts, while also providing demo login options for testing.
          </p>

          <h2 className="text-2xl font-bold text-[#000500] mb-4">Key Functionalities</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Email Authentication:</strong> Users can log in with their registered email and password.
            </li>
            <li>
              <strong>Sign Up:</strong> New users can create an account by providing their details, including name, email, password, and user type.
            </li>
            <li>
              <strong>Password Reset:</strong> Users who forget their password can request a reset link sent to their registered email address.
            </li>
            <li>
              <strong>Demo Logins:</strong> Users can log in as demo users (e.g., Manufacturer, Recycler, Consumer, Government) with predefined credentials to test the platform.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-[#000500] mt-4 mb-4">Technical Details</h2>
          <p className="text-gray-700 mb-4">
            The Login Page is built to provide a seamless and secure user experience. Below are the technical aspects of the page:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li>
              <strong>User Role Management:</strong> User roles (Manufacturer, Recycler, Consumer, Government) are captured during sign-up, and users are redirected to different dashboards based on their role.
            </li>
            <li>
              <strong>Demo Login:</strong> Predefined demo credentials are used to simulate logins for testing various user types.
            </li>
          </ul>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/main/src/app/login/page.tsx"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/refs/heads/main/src/app/login/page.tsx"
            initialLines={25}
          />
          <h3 className="text-xl font-semibold text-[#000500] mb-2">Try Demo Login</h3>
          <p className="text-gray-700 mb-4">
            The demo login buttons allow users to quickly test the login process for different user roles. Each button triggers a different login scenario, simulating how users from different roles would log in.
          </p>

          <div className="flex items-center justify-center mt-6">
            <Image
              src="/documentation/login.gif"
              alt="Login Page Demo"
              width={600}
              height={400}
              className="mt-4 shadow-md w-full max-w-lg h-auto cursor-pointer hover:brightness-75 transition-all"
              unoptimized
              onClick={() => openModal("/documentation/login.gif")}
            />
          </div>
          <EnlargedImageModal imageUrl={imageUrl} onClose={closeModal} />
        </section>


        {/* Manufacturer Section */}
        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Manufacturer</h2>
          <p className="text-gray-700 mb-4">
            Manufacturers play a key role in the platform by generating QR codes for their products and tracking their lifecycle.
          </p>
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/main/src/app/manufacturer/page.tsx"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/main/src/app/manufacturer/page.tsx"
            initialLines={25}
          />

          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>QR Code Generation:</strong> Manufacturers can generate unique QR codes for their products,
              embedding details like product type, recyclability, and material composition.
            </li>
            <li>
              <strong>Lifecycle Tracking:</strong> Track the product&apos;s journey from manufacturing to recycling,
              including resale and ownership transfers.
            </li>
            <li>
              <strong>Recycler Registration:</strong> Manufacturers with recycling capabilities can register
              as recyclers and specify their recycling specialization.
            </li>
          </ul>
          <div className="flex items-center justify-center mt-4 hover:cursor-pointer 
          transition-transform transform hover:scale-105">
            <Image
              src="/documentation/manufacturer.gif"
              alt="Manufacturer Dashboard"
              width={600}
              height={400}
              className="mt-4 shadow-md w-full max-w-lg h-auto cursor-pointer 
              hover:brightness-75 transition-all"
              unoptimized
              onClick={() => openModal("/documentation/manufacturer.gif")}
            />
          </div>
          <EnlargedImageModal imageUrl={imageUrl} onClose={closeModal} />
        </section>

        {/* Recycler Section */}
        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Recycler</h2>
          <p className="text-gray-700 mb-4">
            Recyclers are responsible for processing e-waste and ensuring proper recycling practices.
          </p>
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/main/src/app/recycler/page.tsx"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/refs/heads/main/src/app/recycler/page.tsx"
            initialLines={25}
          />
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Facility Registration:</strong> Recyclers can register their facilities,
              specifying the types of e-waste they handle and their recycling processes.
            </li>
            <li>
              <strong>Service Integration:</strong> Recyclers can connect with consumers
              to accept direct drop-offs or schedule pickups.
            </li>
            <li>
              <strong>Product Management:</strong> Recyclers can manage products they receive
              and update their status in the system.
            </li>
          </ul>
          <div className="flex items-center justify-center mt-4 hover:cursor-pointer 
          transition-transform transform hover:scale-105">
            <Image
              src="/documentation/recycler.gif"
              alt="Manufacturer Dashboard"
              width={600}
              height={400}
              className="mt-4 shadow-md w-full max-w-lg h-auto cursor-pointer 
              hover:brightness-75 transition-all"
              unoptimized
              onClick={() => openModal("/documentation/recycler.gif")}
            />
          </div>
          <EnlargedImageModal imageUrl={imageUrl} onClose={closeModal} />
        </section>

        {/* Consumer Section */}
        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Consumer</h2>
          <p className="text-gray-700 mb-4">
            Consumers can use the platform to recycle their electronic products responsibly.
          </p>
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/main/src/app/consumer/%5Buid%5D/page.tsx"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/refs/heads/main/src/app/consumer/%5Buid%5D/page.tsx"
            initialLines={25}
          />
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>QR Code Scanning:</strong> Consumers can scan QR codes on their products
              to view recycling instructions and locate nearby recyclers.
            </li>
            <li>
              <strong>Product Registration:</strong> Register products to track their recyclability and lifecycle.
            </li>
            <li>
              <strong>Recycling Options:</strong> Schedule recycling pickups or drop-offs with registered recyclers.
            </li>
          </ul>
          <div className="flex items-center justify-center mt-4 hover:cursor-pointer 
          transition-transform transform hover:scale-105">
            <Image
              src="/documentation/consumer.gif"
              alt="Manufacturer Dashboard"
              width={600}
              height={400}
              className="mt-4 shadow-md w-full max-w-lg h-auto cursor-pointer 
              hover:brightness-75 transition-all"
              unoptimized
              onClick={() => openModal("/documentation/consumer.gif")}
            />
          </div>
          <EnlargedImageModal imageUrl={imageUrl} onClose={closeModal} />
        </section>

        {/* Governement Section */}
        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Government</h2>
          <p className="text-gray-700 mb-4">
            Government organizations can use the platform to oversee e-waste management and enforce regulations.
          </p>
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/main/src/app/government/page.tsx"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/refs/heads/main/src/app/government/page.tsx"
            initialLines={25}
          />
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Data Analytics:</strong> Access data on e-waste recycling activities,
              including recycler performance and product lifecycle tracking.
            </li>
            <li>
              <strong>Policy Enforcement:</strong> Monitor compliance with e-waste regulations
              and promote sustainable practices.
            </li>
            <li>
              <strong>Public Awareness:</strong> Use the platform to educate the public about
              responsible e-waste management.
            </li>
          </ul>
        </section>

        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>QR Code Implementation:</strong> QR codes embed product-specific information,
              including recyclability and material composition.
            </li>
            <li>
              <strong>Database:</strong> A centralized database stores product, manufacturer, recycler, and lifecycle data.
            </li>
            <li>
              <strong>UI Design:</strong> The platform features an intuitive design with separate dashboards for each role.
            </li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DocsPage;