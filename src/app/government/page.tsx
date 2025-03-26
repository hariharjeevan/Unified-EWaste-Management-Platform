"use client";

import Navbar from "@/components/Navbar";

const government = () => {
    return(<>
        <Navbar links={[{ label: "About Us", href: "/about" }]} />
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#f5f3f4] p-4">
            <h1 className="text-black font-bold text-[28px]">Still on Developing Phase</h1>
        </div>
        </>
    )
}

export default government;