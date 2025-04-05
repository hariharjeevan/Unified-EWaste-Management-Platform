"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";

const DocsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
      
      {/* Navbar */}
      <Navbar links={[{ label: "", href: "" }]} />

      <main className="flex flex-col items-center p-8">
        <h1 className="text-4xl font-bold text-[#000500] mb-6">Documentation</h1>
        <p className="text-lg text-gray-700 max-w-4xl text-center mb-8">
          Welcome to the Unified E-Waste Management Platform (UEMP) documentation. This page provides an overview of the platform&apos;s features and the roles of Manufacturers, Recyclers, Consumers, and Government organizations.
        </p>

        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            UEMP is a platform designed to streamline e-waste management by connecting manufacturers, recyclers, consumers, and government organizations. It promotes responsible recycling, lifecycle tracking of electronic products, and sustainability.
          </p>
          <p className="text-gray-700">
            The platform uses QR codes to track products from manufacturing to recycling, ensuring transparency and accountability at every stage.
          </p>
        </section>

        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Manufacturer</h2>
          <p className="text-gray-700 mb-4">
            Manufacturers play a key role in the platform by generating QR codes for their products and tracking their lifecycle.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>QR Code Generation:</strong> Manufacturers can generate unique QR codes for their products, embedding details like product type, recyclability, and material composition.
            </li>
            <li>
              <strong>Lifecycle Tracking:</strong> Track the product&apos;s journey from manufacturing to recycling, including resale and ownership transfers.
            </li>
            <li>
              <strong>Recycler Registration:</strong> Manufacturers with recycling capabilities can register as recyclers and specify their recycling specialization.
            </li>
          </ul>
            <div className="flex items-center justify-center mt-4">
              <Image
              src="/documentation/manufacturer.gif"
              alt="Manufacturer Dashboard"
              width={600}
              height={400}
              className="mt-4 shadow-md w-full max-w-lg h-auto"
              />
            </div>
        </section>

        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Recycler</h2>
          <p className="text-gray-700 mb-4">
            Recyclers are responsible for processing e-waste and ensuring proper recycling practices.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Facility Registration:</strong> Recyclers can register their facilities, specifying the types of e-waste they handle and their recycling processes.
            </li>
            <li>
              <strong>Service Integration:</strong> Recyclers can connect with consumers to accept direct drop-offs or schedule pickups.
            </li>
            <li>
              <strong>Product Management:</strong> Recyclers can manage products they receive and update their status in the system.
            </li>
          </ul>
        </section>

        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Consumer</h2>
          <p className="text-gray-700 mb-4">
            Consumers can use the platform to recycle their electronic products responsibly.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>QR Code Scanning:</strong> Consumers can scan QR codes on their products to view recycling instructions and locate nearby recyclers.
            </li>
            <li>
              <strong>Product Registration:</strong> Register products to track their recyclability and lifecycle.
            </li>
            <li>
              <strong>Recycling Options:</strong> Schedule recycling pickups or drop-offs with registered recyclers.
            </li>
          </ul>
        </section>

        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Government</h2>
          <p className="text-gray-700 mb-4">
            Government organizations can use the platform to oversee e-waste management and enforce regulations.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Data Analytics:</strong> Access data on e-waste recycling activities, including recycler performance and product lifecycle tracking.
            </li>
            <li>
              <strong>Policy Enforcement:</strong> Monitor compliance with e-waste regulations and promote sustainable practices.
            </li>
            <li>
              <strong>Public Awareness:</strong> Use the platform to educate the public about responsible e-waste management.
            </li>
          </ul>
        </section>

        <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>QR Code Implementation:</strong> QR codes embed product-specific information, including recyclability and material composition.
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

      <footer className="bg-[#000500] text-white p-4 text-center">
        <p>&copy; 2025 UEMP. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DocsPage;