//Navbar Component
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { RiLogoutBoxFill } from "react-icons/ri";
import { FaRegUserCircle } from "react-icons/fa";
import { IoLogIn } from "react-icons/io5";
import { doc, getDoc } from "firebase/firestore";
import GradientText from "./GradText";

interface NavbarProps {
  links?: { label: string; href: string; tooltip: string }[];
}

const Navbar = ({ links = [] }: NavbarProps) => {
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState<{ name: string; organization: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as { name: string; organization: string });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Helper function to check if the tooltip will overflow the screen
  const getTooltipPosition = (event: React.MouseEvent) => {
    const tooltip = event.currentTarget.querySelector(".tooltip");
    if (!tooltip) return;

    const rect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    // If tooltip goes out of the screen, adjust its position
    if (rect.left < 0) {
      tooltip.classList.add("left-0");
      tooltip.classList.remove("left-1/2", "-translate-x-1/2");
    } else if (rect.right > windowWidth) {
      tooltip.classList.add("right-0");
      tooltip.classList.remove("left-1/2", "-translate-x-1/2");
    } else {
      tooltip.classList.remove("left-0", "right-0");
      tooltip.classList.add("left-1/2", "-translate-x-1/2");
    }
  };

  return (
    <nav className="bg-[#ffffff] text-[#000500] p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* Left: User Icon */}
      <div
        className="relative"
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => { }}
      >
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2">
          <FaRegUserCircle size={30} className="cursor-pointer hover:text-green-400 transition-colors duration-300" />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 mt-2 w-64 bg-white text-black shadow-lg rounded-lg border border-gray-200 z-50 p-4 transition-opacity duration-300 opacity-100"
          >
            <p className="block text-gray-700 border-b border-gray-200 pb-2 text-lg font-semibold">
              {userData?.name || "User"}
            </p>
            <p className="block text-gray-600 font-medium text-sm">{user?.email}</p>
            {userData?.organization && (
              <p className="block text-gray-500 text-sm font-medium mt-1 italic">{userData.organization}</p>
            )}

            <div className="mt-3 font-semibold">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors duration-200 rounded"
                >
                  <RiLogoutBoxFill size={25} className="mr-2" /> Logout
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center w-full text-left px-4 py-2 text-green-600 hover:bg-gray-100 transition-colors duration-200 rounded"
                >
                  <IoLogIn size={28} className="mr-2" /> Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center: Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <GradientText
            colors={["#000000", "#000000", "#3cb16d", "#000000", "#000000"]}
            animationSpeed={4}
            showBorder={false}
            className="custom-class"
          >
            <Link href="/" className="font-extrabold text-2xl pointer-events-auto select-auto">UEMP</Link>
          </GradientText>
      </div>

      {/* Right: Navigation Links */}
      <div className="hidden lg:flex items-center space-x-4">
        {links.map((link) => (
          <div
            className="relative group"
            key={link.href}
            onMouseEnter={getTooltipPosition}
            onMouseLeave={getTooltipPosition}
          >
            <Link
              href={link.href}
              className="text-lg font-medium hover:text-green-400 transition-colors duration-300"
            >
              {link.label}
            </Link>
            {/* Custom Tooltip */}
            <div
              className="absolute font-medium left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-white text-green-500 text-sm py-2 px-4 rounded-lg mt-2 shadow-xl tooltip"
            >
              {link.tooltip}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Menu Icon */}
      <button
        className="lg:hidden flex items-center space-x-2 p-2"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {/* Hamburger Icon */}
        <div className={`relative w-6 h-6 flex flex-col justify-between items-center transition-transform duration-300 ${mobileMenuOpen ? "transform rotate-45" : ""}`}>
          <div className={`w-6 h-1 bg-black transition-all duration-300 ${mobileMenuOpen ? "rotate-45" : ""}`}></div>
          <div className={`w-6 h-1 bg-black transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}></div>
          <div className={`w-6 h-1 bg-black transition-all duration-300 ${mobileMenuOpen ? "-rotate-45" : ""}`}></div>
        </div>
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-lg rounded-lg border p-4 mt-2 z-50">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-lg py-2 hover:text-green-400 transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
