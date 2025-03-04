"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { FaUserCircle } from "react-icons/fa";
import { RiLogoutBoxFill } from "react-icons/ri";

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
      <div className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2">
          <FaUserCircle size={28} />
        </button>

        {menuOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg">
            <p className="block px-4 py-2 text-gray-700">{user ? `Welcome, ${user.email}` : "Not signed in"}</p>
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-gray-200"
              >
                <RiLogoutBoxFill className="mr-2" /> Logout
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
          <Link key={link.href} href={link.href} className="text-lg hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
