//InforCad.tsx

import { MdBusiness, MdEmail } from "react-icons/md";
import { FaPerson } from "react-icons/fa6";
import SplitText from "@/components/SplitText";
import AdminDashboard from "@/components/AdminDashboard";
import { useState } from "react";

interface InfoCardProps {
  name: string;
  organization: string;
  email: string;
}

export default function InfoCard({ name, organization, email }: InfoCardProps) {
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  return (
    <div className="w-full max-w-xl mt-6 text-center bg-white rounded-xl shadow-lg px-6 py-5 border border-blue-100">
      <SplitText
        text="Manufacturer Dashboard"
        className="text-2xl font-semibold text-center text-black"
        delay={50}
        animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
        animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
        easing="easeOutCubic"
        threshold={0.2}
        rootMargin="-50px"
      />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
        <div className="flex flex-col items-start gap-3 w-full">
          <div className="flex items-center gap-2 text-gray-900 text-left font-medium min-h-[28px]">
            <FaPerson className="text-blue-600 w-6 h-6" />
            <span className="inline-block w-60 h-5">
              {name ? (
                <span className="block truncate">{name}</span>
              ) : (
                <span className="block w-full h-full bg-blue-100 rounded animate-pulse" />
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-900 text-left font-medium min-h-[28px]">
            <MdBusiness className="text-blue-600 w-6 h-6" />
            <span className="inline-block w-60 h-5">
              {organization ? (
                <span className="block truncate">{organization}</span>
              ) : (
                <span className="block w-full h-full bg-blue-100 rounded animate-pulse" />
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-900 text-left font-medium min-h-[28px]">
            <MdEmail className="text-blue-600 w-6 h-6" />
            <span className="inline-block w-60 h-5">
              {email ? (
                <span className="block truncate">{email}</span>
              ) : (
                <span className="block w-full h-full bg-blue-100 rounded animate-pulse" />
              )}
            </span>
          </div>
        </div>
        <div className="w-full flex justify-center sm:justify-end">
          <button
            onClick={() => setShowAdminDashboard(true)}
            className="mt-4 sm:mt-0 bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200"
          >
            Open Admin Dashboard
          </button>
        </div>
      </div>
      {showAdminDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-4 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAdminDashboard(false)}
            >
              &times;
            </button>
            <AdminDashboard />
          </div>
        </div>
      )}
    </div>
  );
}