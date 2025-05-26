interface InfoCardProps {
  name: string;
  organization: string;
  email: string;
}

export default function InfoCard({ name, organization, email }: InfoCardProps) {
  return (
    <div className="mt-2 text-center bg-white rounded-lg shadow px-4 py-2 max-w-lg w-full">
      <h2 className="text-xl text-black font-semibold mt-4">Manufacturer Dashboard</h2>
      <p className="text-gray-800 font-medium">
        <span className="text-blue-600">Name:</span> {name}
      </p>
      <p className="text-gray-800 font-medium">
        <span className="text-blue-600">Organization:</span> {organization}
      </p>
      <p className="text-gray-800 font-medium">
        <span className="text-blue-600">Email:</span> {email}
      </p>
    </div>
  );
}
