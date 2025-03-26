"use client";

import Navbar from "@/components/Navbar";
import { IoConstructSharp } from "react-icons/io5";

const government = () => {
    return (
        <div className="relative min-h-screen flex flex-col bg-[#f5f3f4] overflow-x-hidden">
            <Navbar links={[{ label: "About Us", href: "/about" }]} />
            <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f5f3f4] p-4">
                <div className="flex justify-center mb-2">
                    <IoConstructSharp size={60} className="font-bold text-[#000000]" />
                </div>
                <h1 className="text-black font-bold text-[28px] text-center">Currently under development</h1>
            </div>

            <footer className="bg-[#000500] text-white p-4 text-center mt-12 w-full">
                <p>&copy; 2025 UEMP. All rights reserved.</p>
            </footer>
        </div>
    )
}

export default government;