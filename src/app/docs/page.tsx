//Documentation Page
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlobCursor from '@/components/BlobCursor';
import GitHubEmbed from "@/components/GitHubEmbed";
import Image from "next/image";
import EnlargedImageModal from "@/components/EnlargedImageModal";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const DocsPage = () => {
  const router = useRouter();
  const logos = [
    { src: "/documentation/logos/next_js.png", width: 100, height: 80 },
    { src: "/documentation/logos/React.png", width: 70, height: 80 },
    { src: "/documentation/logos/firebase.png", width: 100, height: 80 },
    { src: "/documentation/logos/Gemini.png", width: 100, height: 70 },
    { src: "/documentation/logos/Google_Maps.png", width: 70, height: 70 },
    { src: "/documentation/logos/Typescript.png", width: 60, height: 70 },
    { src: "/documentation/logos/Tailwind_CSS.png", width: 120, height: 80 },
    { src: "/documentation/logos/Vercel.png", width: 100, height: 80 },
    { src: "/documentation/logos/electron.png", width: 70, height: 70 },
  ];

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const openModal = (url: string) => setImageUrl(url);
  const closeModal = () => setImageUrl(null);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
      {/* Navbar */}
      <Navbar links={[{ label: "About", href: "/about", tooltip: "About the team behind UEMP" }]} />
      {/* Blob Cursor (disabled on small screens) */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden sm:block">
        <BlobCursor
          blobType="circle"
          fillColor="#3cb16d"
          trailCount={3}
          sizes={[40, 110, 60]}
          innerSizes={[20, 35, 25]}
          innerColor="rgba(255,255,255,0.8)"
          opacities={[0.6, 0.6, 0.6]}
          shadowColor="rgba(0,0,0,0.75)"
          shadowBlur={5}
          shadowOffsetX={10}
          shadowOffsetY={10}
          filterStdDeviation={30}
          useFilter={true}
          fastDuration={0.1}
          slowDuration={0.5}
          zIndex={0}
        />
      </div>
      <main className="flex flex-col items-center px-2 sm:px-4 md:px-8 py-4 z-40">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#000500] mb-2 text-center">Documentation</h1>
        <p className="text-base sm:text-lg text-gray-700 max-w-4xl text-center mb-4">
          Welcome to the Unified E-Waste Management Platform (UEMP) documentation.
          This page provides an overview of the platform&apos;s features and the roles of Manufacturers,
          Recyclers, Consumers, and Government organizations.
        </p>

        {/* Overview Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 text-justify">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            UEMP is a platform designed to streamline e-waste management by connecting manufacturers,
            recyclers, consumers, and government organizations. It promotes responsible recycling,
            lifecycle tracking of electronic products, and sustainability.
          </p>
          <p className="text-gray-700 mb-4">
            The platform uses QR codes to track products from manufacturing to recycling, ensuring
            transparency and accountability at every stage.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4 text-center">Core Technologies Used</h2>
          <div className="relative w-full">
            {/* Scroll Buttons */}
            <button
              onClick={() => scroll("left")}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-white text-black shadow-md rounded-full p-2 z-10 hidden sm:flex"
              aria-label="Scroll Left"
            >
              <FaChevronLeft />
            </button>
            <div
              ref={containerRef}
              className="flex overflow-x-auto gap-4 sm:gap-6 px-2 sm:px-10 scroll-smooth"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {logos.map((logo, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 flex items-center justify-center transition duration-300"
                  style={{
                    width: Math.max(logo.width + 20, 80),
                    height: Math.max(logo.height + 20, 60),
                  }}
                >
                  <Image
                    src={logo.src}
                    alt={`Tech Logo ${idx + 1}`}
                    width={logo.width}
                    height={logo.height}
                    className="object-contain max-w-full max-h-full"
                    loading="lazy"
                    unoptimized
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => scroll("right")}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-white text-black shadow-md rounded-full p-2 z-10 hidden sm:flex"
              aria-label="Scroll Right"
            >
              <FaChevronRight />
            </button>
          </div>
        </section>

        {/* Web/Desktop App Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 text-justify">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Web & Desktop App (Electron)</h2>
          <p className="text-gray-700 mb-4">
            The Unified E-Waste Management Platform (UEMP) is available as both a modern web application and a downloadable desktop app. The desktop version is packaged using
            <strong>
              <Image
                src="/documentation/logos/electron_logo.png"
                alt="Electron Logo"
                width={130}
                height={130}
                className="pl-2 inline-block mr-1 align-text-bottom"
                unoptimized
              />
            </strong>, allowing users to install and use the platform on Windows without needing a browser.
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>
              <strong>Web App:</strong> Access the platform from any device with a browser at-
              <a href="https://unified-e-waste-management-platform.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline justify-center flex break-all">https://unified-e-waste-management-platform.vercel.app</a>.
            </li>
            <li>
              <strong>Desktop App:</strong> Download and install the Electron-powered app on Windows for a easier user experience.
              <a href="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/releases/download/v0.1.0/UEMP.Setup.0.1.0.exe" className="justify-center flex">
                <Image
                  src="/documentation/download_win.png"
                  alt="Download Button"
                  width={160}
                  height={80}
                  className="w-40 h-auto"
                  unoptimized
                />
              </a>
            </li>
            <li>
              <strong>Unified Experience:</strong> Both versions offer the same features and user interface, ensuring a seamless experience whether you use the web or desktop app.
            </li>
          </ul>
          <p className="text-gray-700 mb-4">
            The Electron app wraps the web platform using a lightweight browser window, as shown in the code below:
          </p>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/main/electron/main.ts"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/main/electron/main.ts"
            initialLines={20}
          />
        </section>

        {/* Login Page Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 text-justify">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Login Page</h2>
          <p className="text-gray-700 mb-4">
            The Login Page allows users to authenticate themselves and access their accounts securely. It supports both logging in with existing credentials (email/password) and signing up for new accounts, while also providing demo login options for testing.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Key Functionalities</h2>
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mt-4 mb-4">Technical Details</h2>
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
          <h3 className="text-lg sm:text-xl font-semibold text-[#000500] mb-2">Try Demo Login</h3>
          <p className="text-gray-700 mb-4">
            The demo login buttons allow users to quickly test the login process for different user roles. Each button triggers a different login scenario, simulating how users from different roles would log in.
          </p>
          <div className="flex items-center justify-center mt-6">
            <video
              src={"/documentation/videos/login.mp4"}
              controls
              loop
              muted
              className="rounded-lg max-w-full max-h-[70vh] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* QR Registration Demo */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">QR based Product Registration Demo</h2>
          <p className="text-gray-700 mb-4 text-justify">
            The Consumer Register Page allows users to register a product by scanning a QR code. Depending on their authentication state, users are redirected to their consumer dashboard or prompted to log in. This ensures a seamless flow between QR scanning, login, and product registration.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Key Functionalities</h2>
          <ul className="list-disc list-inside text-black">
            <li>
              <strong>QR Code Handling:</strong> Detects the <code>qr</code> query parameter from the URL to identify the product being registered.
            </li>
            <li>Each <code>productId</code> is unique and the <code>serial numbers</code> are the instances of the <code>productId</code> as illustrated below:</li>
          </ul>
          <div className="flex flex-col items-center justify-center text-black mb-4">
            <Image
              src="/documentation/Product Instance.png"
              alt="Product Instance"
              width={400}
              height={400}
              className="mt-4 mb-4 shadow-md max-w-full w-full sm:max-w-lg cursor-pointer hover:scale-105 transition-all"
              unoptimized
              onClick={() => openModal("/documentation/Product Instance.png")}
            />
            <p>Each qr code contains the: </p>
            <ul className="list-disc list-inside text-black">
              <li>Manufacturer UID</li>
              <li>Product ID</li>
              <li>Serial Number</li>
            </ul>
            <p>of that product as displayed below.</p>
            <code className="text-center mt-2 bg-gray-100 break-all block p-2 rounded">
              https://unified-e-waste-management-platform.vercel.app/consumer/register?qr=/register?qr=$[<strong>user.uid</strong>]|$[<strong>productId</strong>]|$[<strong>productDetails.serialNumber</strong>]
            </code>
          </div>
          <ul className="list-disc list-inside text-black">
            <li>
              <strong>Authentication-Aware Redirection:</strong> Redirects the user based on their login status:
              <ul className="list-disc list-inside ml-6">
                <li><strong>Authenticated:</strong> Redirects to <code>/consumer/[uid]?qr=[value]</code>.</li>
                <li><strong>Unauthenticated:</strong> Redirects to <code>/login?qr=[value]</code>.</li>
                <li><strong>Missing QR:</strong> Redirects to <code>/consumer</code>.</li>
              </ul>
            </li>
          </ul>
          <h3 className="text-lg sm:text-xl font-semibold text-[#000500] mb-2 mt-2">Demo Flow</h3>
          <p className="text-gray-700 mb-4">
            The video below illustrates the consumer QR-based registration flow, showing how users are redirected based on authentication status.
          </p>
          <div className="flex items-center justify-center mt-6">
            <video
              src={"/documentation/videos/QRScanDemo.mp4"}
              controls
              loop
              muted
              className="rounded-lg max-w-full max-h-[70vh] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mt-4 mb-4">Technical Details</h2>
          <p className="text-gray-700 mb-4">
            This page uses Firebase Authentication and Next.js navigation utilities to ensure secure and intelligent redirect behavior:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li>
              <strong>Firebase Auth Listener:</strong> <code>onAuthStateChanged()</code> is used to observe the user&apos;s authentication state in real-time.
            </li>
            <li>
              <strong>Next.js Routing:</strong> <code>useRouter()</code> and <code>router.replace()</code> handle dynamic redirection without page reloads.
            </li>
            <li>
              <strong>Query Extraction:</strong> <code>useSearchParams()</code> is used to read the <code>qr</code> code from the URL.
            </li>
          </ul>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/feature/recycler/src/app/consumer/register/page.tsx"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/feature/recycler/src/app/consumer/register/page.tsx"
            initialLines={25}
          />
        </section>

        {/* Manufacturer Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Manufacturer</h2>
          <p className="text-gray-700 mb-4">
            Manufacturers play a key role in the platform by generating QR codes for their products and tracking their lifecycle.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
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
              <strong>Bulk Product Uploads:</strong> Manufacturers can upload products for QR generation in bulk through a &quot;.csv&quot; file.
            </li>
            <li>
              <strong>Certification from government:</strong> Manufacturers can apply for certifiation from government organizations directly from the dashboard.
            </li>
            <li>
              <strong>Admin Dashboard:</strong> Improved admin dashboard for role based access control to employees.
            </li>
          </ul>
          <div className="flex items-center justify-center mt-4 cursor-pointer">
            <video
              src={"/documentation/videos/manufacturer.mp4"}
              controls
              loop
              muted
              className="rounded-lg max-w-full max-h-[70vh] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* Recycler Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Recycler</h2>
          <p className="text-gray-700 mb-4">
            Recyclers are responsible for processing e-waste and ensuring proper recycling practices.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
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
          <div className="flex items-center justify-center mt-4 cursor-pointer">
            <video
              src={"/documentation/videos/recycler.mp4"}
              controls
              loop
              muted
              className="rounded-lg max-w-full max-h-[70vh] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-black text-justify mt-4">Recyclers can obtain information about manufacturers such as <code className="mx-1">Manufacturer UID</code> and <code className="mx-1">Product ID
          </code> from Manufacturer Details page as shown below: </p>
          <div className="flex items-center justify-center mt-4 cursor-pointer">
            <video
              src={"/documentation/videos/Manufacturer Details.mp4"}
              controls
              loop
              muted
              className="rounded-lg max-w-full max-h-[70vh] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* Consumer Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Consumer</h2>
          <p className="text-gray-700 mb-4">
            Consumers can use the platform to recycle their electronic products responsibly.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
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
          <div className="flex items-center justify-center mt-4 cursor-pointer">
            <video
              src={"/documentation/videos/consumer.mp4"}
              controls
              loop
              muted
              className="rounded-lg max-w-full max-h-[70vh] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* Government Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Government</h2>
          <p className="text-gray-700 mb-4">
            Government organizations can use the platform to oversee e-waste management and enforce regulations.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">Technical Details</h2>
          <GitHubEmbed
            githubBlobUrl="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/blob/main/src/app/government/page.tsx"
            rawUrl="https://raw.githubusercontent.com/hariharjeevan/Unified-EWaste-Management-Platform/main/src/app/government/page.tsx"
            initialLines={25}
          />
          <p className="text-gray-700 mb-1">
            Government organizations can certify manufacturers and recyclers for their authenticity.
          </p>
          <p className="text-gray-700 text-xl ">Future Scope:</p>
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
          <div className="flex items-center justify-center mt-4 cursor-pointer">
            <video
              src={"/documentation/videos/government.mp4"}
              controls
              loop
              muted
              className="rounded-lg max-w-full max-h-[70vh] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <EnlargedImageModal imageUrl={imageUrl} onClose={closeModal} />
        </section>

        {/* About the Team Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4">About the Team</h2>
            <p className="text-gray-700 mb-4">
              The Unified E-Waste Management Platform is developed by a passionate team dedicated to promoting sustainability and responsible e-waste management.
            </p>
            <button
              onClick={() => router.push("/about")}
              className="bg-red-500 text-white px-8 py-3 rounded-full shadow-lg font-semibold text-lg transition-transform duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Meet the Team
            </button>
          </div>
        </section>

        {/* Credits Section */}
        <section className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 text-center md:text-justify">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000500] mb-4 text-center">Credits</h2>
          <p className="text-gray-700 mb-4 text-left">
            We would like to acknowledge the following:
          </p>
          <ul className="list-disc list-outside text-gray-700 mb-4 text-left mx-auto max-w-2xl ml-5">
            <li>
              <a href="https://react-icons.github.io/react-icons/"><strong className="text-blue-600 underline">React Icons</strong></a> for iconography.
            </li>
            <li>
              <a href="https://www.reactbits.dev/"><strong className="text-blue-600 underline">React Bits</strong></a> for the animated UI components.
            </li>
            <li>
              Images from freepik:
              <ul className="list-disc list-inside">
                <li>
                  <a href="https://www.freepik.com/free-vector/people-asking-questions-concept-illustration_209068651.htm#fromView=search&page=1&position=3&uuid=1ae9929c-19f2-4e92-8c4f-a1ababf55e61&query=Question" className="text-blue-600 underline">Why Choose UEMP</a>
                </li>
                <li>
                  <a href="https://www.freepik.com/free-vector/think-outside-box-concept-illustration_38321975.htm#fromView=search&page=1&position=4&uuid=437cc60c-0b26-4610-975c-1cebff08549e&query=out+of+the+box+idea" className="text-blue-600 underline">Our Mission</a>
                </li>
              </ul>
            </li>
          </ul>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default DocsPage;
