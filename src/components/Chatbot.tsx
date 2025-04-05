"use client";

import { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { FaChevronDown } from "react-icons/fa";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const irrelevantKeywords = ["sports", "weather", "news", "politics", "movies", "entertainment"];

  const handleSend = async () => {
    if (!input.trim()) return;

    if (irrelevantKeywords.some(k => input.toLowerCase().includes(k))) {
      setMessages(prev => [...prev, { sender: "bot", text: "I'm here to help only with the UEMP platform." }]);
      return;
    }

    const newMessage: ChatMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const askGemini = httpsCallable(functions, "askGemini");
      const response = (await askGemini({ message: input })) as {
        data: { response: string };
      };

      const botMessage: ChatMessage = {
        sender: "bot",
        text: response.data.response,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error from Gemini:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show scroll down arrow when user scrolls up
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setShowScrollDown(!nearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Floating Icon */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-green-900 text-white rounded-full shadow-lg hover:bg-green-700 transition-all z-50 cursor-pointer"
      >
        <Image src="/ChatBot.svg" alt="Chat Icon" width="65" height="65" />
      </div>

      {/* Chatbot Panel */}
      {isOpen && (
        <div
          ref={chatbotRef}
          className="fixed bottom-20 right-4 w-[90%] max-w-md bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-300 z-50"
        >
          {/* Header with Gemini Branding */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-green-700">UEMP AI Assistant</h2>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Powered by</span>
              <span className="font-semibold text-gray-700">Gemini</span>
            </div>
          </div>

          <div
            ref={chatContainerRef}
            className="relative h-64 overflow-y-auto mb-4 border rounded-lg p-4 bg-gray-50 text-sm"
          >
            {messages.length === 0 && (
              <p className="text-gray-400">Ask anything about the UEMP platform...</p>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-2 p-3 rounded-lg w-fit max-w-[80%] whitespace-pre-wrap ${msg.sender === "user"
                  ? "bg-green-600 text-white self-end ml-auto"
                  : "bg-gray-200 text-black"
                  }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}

            {loading && (
              <div className="text-gray-500 italic mt-2">Thinking...</div>
            )}

            <div ref={bottomRef} />

            {/* Scroll-to-bottom Arrow */}
            {showScrollDown && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-2 right-2 p-2 bg-white border border-gray-300 rounded-full shadow hover:bg-gray-100"
                aria-label="Scroll to latest message"
              >
                <FaChevronDown className="text-green-600" />
              </button>
            )}
          </div>

          <div className="flex">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-grow px-4 py-2 border rounded-l-lg text-black text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-r-lg text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
