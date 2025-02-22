import Link from "next/link";

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
            {/* Navbar */}
            <nav className="bg-[#000500] text-white p-4 flex justify-between items-center shadow-md">
                <h1 className="text-2xl font-bold">UEMP</h1>
                <Link href="/about" className="text-lg hover:underline">About Us</Link>
            </nav>

            <main className="p-6 flex flex-col items-center flex-grow">
                <div className="max-w-4xl text-center">
                    <h1 className="text-4xl font-extrabold text-green-500 mb-4">Unified E-Waste Management Platform</h1>
                    <p className="text-lg text-[#000500] mb-6 font-semibold">
                        Millions of tons of e-waste are discarded yearly. Recycling recovers materials and protects the planet.
                    </p>
                </div>
                
                <div className="bg-[#f5f3f4] shadow-md rounded-lg p-6 max-w-4xl mb-6">
                    <h2 className="text-2xl font-bold text-[#000500] mb-4">Why Choose UEMP?</h2>
                    <p className="text-lg text-[#000500] mb-2">
                        Prevents toxic pollution, reduces mining, and lowers carbon emissions.
                    </p>
                    <p className="text-lg text-[#000500]">
                        UEMP ensures transparency by tracking electronic products. QR codes enable responsible disposal.
                    </p>
                </div>
                
                <h2 className="text-2xl font-bold text-[#000500] mb-6">Get Started</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    <Link href="/login" className="bg-blue-500 p-6 rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]">
                        <h2 className="text-xl font-bold text-[#000500]">Manufacturer</h2>
                        <p className="text-[#000500]">Generate QR codes for products.</p>
                    </Link>
                    <Link href="/recycler" className="bg-green-500 p-6 rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]">
                        <h2 className="text-xl font-bold text-[#000500]">Recycler</h2>
                        <p className="text-[#000500]">Register your recycling facility.</p>
                    </Link>
                    <Link href="/consumer" className="bg-yellow-500 p-6 rounded-lg text-center shadow-md transition-transform transform hover:scale-105 border border-[#000500]">
                        <h2 className="text-xl font-bold text-[#000500]">Consumer</h2>
                        <p className="text-[#000500]">Find ways to recycle products.</p>
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#000500] text-white p-4 text-center mt-6">
                <p>&copy; 2025 UEMP. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
