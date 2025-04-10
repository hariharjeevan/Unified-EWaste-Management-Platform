//Image Dialog Component
import React from 'react';
import { IoIosCloseCircle } from 'react-icons/io';
import Image from 'next/image';

interface EnlargedImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const EnlargedImageModal: React.FC<EnlargedImageModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-8 max-w-4xl max-h-[80vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <IoIosCloseCircle size={25} />
        </button>
        <Image
          src={imageUrl}
          alt="Enlarged Image"
          width={800}
          height={600}
          className="rounded-lg"
          unoptimized
        />
      </div>
    </div>
  );
};

export default EnlargedImageModal;
