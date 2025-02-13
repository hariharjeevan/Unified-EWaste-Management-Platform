"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <Link href="/">
                <Image src="/logo.png" alt="UEMP Logo" width={100} height={40} />
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
                {isOpen ? <X size={30} /> : <Menu size={30} />}
            </button>
            <ul className={`md:flex md:space-x-6 absolute md:static top-14 left-0 w-full md:w-auto bg-blue-600 ${isOpen ? "block" : "hidden"}`}>
                <li><Link href="/login">Manufacturer</Link></li>
                <li><Link href="/recycler">Recycler</Link></li>
                <li><Link href="/consumer">Consumer</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar;
