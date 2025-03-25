"use client";

import Navbar from "@/components/Navbar";

const consumer = () => {
return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
    {/* Navbar */}
    <Navbar links={[{ label: "", href: "" }]} />
    </div>
    );
}

export default consumer;