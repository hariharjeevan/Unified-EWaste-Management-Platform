//GitHub Code Snippet Embed Component
"use client";
import React, { useState, useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/atom-one-dark.css";
import { IoIosCloseCircle } from "react-icons/io";

hljs.registerLanguage("typescript", typescript);

interface GitHubEmbedProps {
  githubBlobUrl: string;
  rawUrl: string;
  initialLines?: number;
  style?: string;
  type?: string;
  showBorder?: 'on' | 'off';
  showLineNumbers?: 'on' | 'off';
  showFileMeta?: 'on' | 'off';
  showFullPath?: 'on' | 'off';
  showCopy?: 'on' | 'off';
}

const GitHubEmbed: React.FC<GitHubEmbedProps> = ({
  githubBlobUrl,
  rawUrl,
  initialLines = 10,
  style = 'atom-one-dark',
  type = 'code',
  showBorder = 'on',
  showLineNumbers = 'on',
  showFileMeta = 'on',
  showFullPath = 'on',
  showCopy = 'on',
}) => {
  const [highlightedSnippet, setHighlightedSnippet] = useState<string>("Loading...");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch the snippet to highlight it
  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const res = await fetch(rawUrl);
        const text = await res.text();
        const preview = text.split('\n').slice(0, initialLines).join('\n');
        const highlighted = hljs.highlight(preview, { language: "typescript" }).value;
        setHighlightedSnippet(highlighted);
      } catch (err) {
        setHighlightedSnippet("// Failed to load snippet");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSnippet();
  }, [rawUrl, initialLines]);

  // Show the full code in the modal
  useEffect(() => {
    if (isModalOpen && containerRef.current) {
      const encoded = encodeURIComponent(githubBlobUrl);
      const script = document.createElement("script");
      const embedUrl = `https://emgithub.com/embed-v2.js?target=${encoded}&style=${style}&type=${type}&showBorder=${showBorder}&showLineNumbers=${showLineNumbers}&showFileMeta=${showFileMeta}&showFullPath=${showFullPath}&showCopy=${showCopy}`;
      script.src = embedUrl;
      script.async = true;
      containerRef.current.innerHTML = ''; // Clear container
      containerRef.current.appendChild(script);
    }
  }, [
    isModalOpen,
    githubBlobUrl,
    style,
    type,
    showBorder,
    showLineNumbers,
    showFileMeta,
    showFullPath,
    showCopy,
  ]);
  

  // Modal for showing full code
  const Modal = () => (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-black">Full Code</h2>
          <button
            className="text-black font-bold"
            onClick={() => setIsModalOpen(false)}
          >
            <IoIosCloseCircle size={25} />
          </button>
        </div>

        <div ref={containerRef} className="overflow-auto max-h-96" />
      </div>
    </div>
  );

  return (
    <div>
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center text-white">
            <span>Loading...</span>
          </div>
        ) : (
          <pre className="hljs p-4 overflow-x-auto rounded bg-[#282c34] text-white" style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
            <code dangerouslySetInnerHTML={{ __html: highlightedSnippet }} />
          </pre>
        )}
      </div>
      <div className="flex justify-end mt-2">
          <button
            onClick={() => setIsModalOpen(true)} // Open modal on click
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            {isModalOpen ? "Close Full Code" : "Reveal Full Code"}
          </button>
        </div>

      {isModalOpen && <Modal />} {/* Conditionally render the modal */}
    </div>
  );
};

export default GitHubEmbed;
