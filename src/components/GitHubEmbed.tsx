"use client";
import React, { useState, useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/atom-one-dark.css";

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
  const [showFull, setShowFull] = useState(false);
  const [highlightedSnippet, setHighlightedSnippet] = useState<string>("Loading...");
  const containerRef = useRef<HTMLDivElement>(null);

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
      }
    };
    fetchSnippet();
  }, [rawUrl, initialLines]);

  useEffect(() => {
    if (showFull && containerRef.current) {
      const encoded = encodeURIComponent(githubBlobUrl);
      const script = document.createElement("script");
      const embedUrl = `https://emgithub.com/embed-v2.js?target=${encoded}&style=${style}&type=${type}&showBorder=${showBorder}&showLineNumbers=${showLineNumbers}&showFileMeta=${showFileMeta}&showFullPath=${showFullPath}&showCopy=${showCopy}`;
      script.src = embedUrl;
      script.async = true;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }
  }, [showFull, githubBlobUrl]);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowFull(prev => !prev)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {showFull ? "Hide Full Code" : "Reveal Full Code"}
        </button>
      </div>

      {!showFull ? (
        <pre className="hljs p-4 overflow-x-auto rounded bg-[#282c34] text-white" style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
          <code dangerouslySetInnerHTML={{ __html: highlightedSnippet }} />
        </pre>
      ) : (
        <div ref={containerRef} />
      )}
    </div>
  );
};

export default GitHubEmbed;
