"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { RiLogoutBoxFill, RiAccountPinCircleFill } from "react-icons/ri";
import { IoLogIn } from "react-icons/io5";

interface NavbarProps {
  links?: { label: string; href: string }[];
}

const Navbar = ({ links = [] }: NavbarProps) => {
  const [user, setUser] = useState(auth.currentUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <nav className="bg-[#000500] text-white p-4 flex justify-between items-center shadow-md relative">
      {/* Left: User Menu */}
      <div className="relative hover:text-green-400">
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2">
          <RiAccountPinCircleFill size={40} />
        </button>

        {menuOpen && (
          <div className="absolute left-0 mt-1 w-48 bg-white text-black shadow-lg rounded-lg border border-gray-200">
            <p className="block px-4 py-2 text-gray-700 border-b border-gray-200">
              {user ? `Welcome, ${user.email}` : "Not signed in"}
            </p>
            {user ? (
              <button
          onClick={handleLogout}
          className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors duration-200"
              >
          <RiLogoutBoxFill size={25} className="mr-2" /> Logout
              </button>
            ) : (
                <button
                onClick={() => router.push("/login")}
                className="flex items-center w-full text-left px-4 py-2 text-green-600 hover:bg-gray-100 transition-colors duration-200"
                >
                <IoLogIn size={28} className="mr-2" /> Login
                </button>
            )}
              </div>
            )}
          </div>
          

      {/* Center: Logo */}
      <h1 className="text-2xl font-bold">
        <Link href="/">UEMP</Link>
      </h1>
      {/* Right: Navigation Links */}
      <div className="flex space-x-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-lg hover:text-green-400 transition-colors duration-300">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
