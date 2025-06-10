//Footer Component
import { BsGithub } from "react-icons/bs";
import Star from "@/icons/star-solid.svg";

const Footer = () => {
  return (
    <footer className="bg-[#000500] text-white p-6 text-center w-full">
      <p className="text-sm md:text-base">&copy; 2025 UEMP. All rights reserved.</p>
      <div className="flex justify-center items-center mt-4 space-x-4">
        {/* GitHub Button */}

      </div>
      <div className="flex justify-center items-center mt-2 space-x-2">
        <Star className="w-4 h-4" />
        <a
          href="https://github.com/hariharjeevan/Unified-EWaste-Management-Platform/stargazers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs md:text-sm font-semibold hover:underline flex items-center"
        >
          Star us on
        </a>
        <button
          onClick={() =>
        window.open(
          "https://github.com/hariharjeevan/Unified-EWaste-Management-Platform.git",
          "_blank"
        )
          }
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all"
        >
          <BsGithub className="text-2xl" />
          <span className="text-sm md:text-base font-semibold">GitHub</span>
        </button>
      </div>
      <p className="text-xs md:text-sm mt-4">
        Built with ❤️ by Aventra.
      </p>
    </footer>
  );
};

export default Footer;