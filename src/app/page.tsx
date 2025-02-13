import Link from "next/link";

const Home = () => {
    return (
        <main className="p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Welcome to UEMP</h1>
            <p className="text-xl text-center">Choose your role to get started.</p>
            <br />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/login" className="bg-yellow-500 p-6 rounded-lg text-center shadow-md">
                    <h2 className="text-xl font-bold">Manufacturer</h2>
                    <p>Generate QR codes for products.</p>
                </Link>
                <Link href="/recycler" className="bg-green-500 p-6 rounded-lg text-center shadow-md">
                    <h2 className="text-xl font-bold">Recycler</h2>
                    <p>Register your recycling facility.</p>
                </Link>
                <Link href="/consumer" className="bg-blue-500 p-6 rounded-lg text-center shadow-md">
                    <h2 className="text-xl font-bold">Consumer</h2>
                    <p>Find ways to recycle products.</p>
                </Link>
            </div>
        </main>
    );
};

export default Home;
