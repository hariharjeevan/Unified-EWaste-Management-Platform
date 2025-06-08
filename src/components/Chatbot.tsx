//Chatbot Component
"use client";

import { useState, useRef, useEffect } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { app } from "@/firebaseConfig";
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
  const functions = getFunctions(app, "asia-east2");
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
        className="fixed bottom-4 right-4 bg-gradient-to-br from-green-700 to-green-500 text-white rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 z-50 cursor-pointer border-4 border-white"
        style={{ boxShadow: "0 8px 32px 0 rgba(34,197,94,0.25)" }}
      >
        <Image src="/ChatBot.svg" alt="Chat Icon" width="65" height="65" />
      </div>

      {/* Chatbot Panel */}
      {isOpen && (
        <div
          ref={chatbotRef}
          className="fixed bottom-4 right-2 w-[80vw] max-w-md sm:bottom-24 sm:right-4 sm:w-[95vw] bg-white rounded-2xl shadow-2xl border border-green-200 z-50 flex flex-col"
          style={{ boxShadow: "0 8px 32px 0 rgba(34,197,94,0.25)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-green-600 to-green-400 rounded-t-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image src="/ChatBot.svg" alt="Chat Icon" width={32} height={32} className="sm:w-9 sm:h-9" />
              <h2 className="text-base sm:text-lg font-bold text-white drop-shadow">UEMP AI Assistant</h2>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-white/80">
              <span>Powered by</span>
              <span className="font-semibold text-white">Gemini</span>
            </div>
          </div>

          {/* Chat Area */}
          <div
            ref={chatContainerRef}
            className="relative h-60 sm:h-72 overflow-y-auto px-2 py-2 sm:px-4 sm:py-3 bg-green-50"
          >
            {/* Existing chat rendering code */}
            {messages.length === 0 && (
              <p className="text-gray-400 text-center mt-8">Ask anything about the UEMP platform...</p>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[90vw] sm:max-w-[80%] shadow
                  ${msg.sender === "user"
                      ? "bg-gradient-to-br from-green-600 to-green-400 text-white rounded-br-none"
                      : "bg-white border border-green-200 text-green-900 rounded-bl-none"
                    }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <div className="my-2 flex justify-start">
                <div className="p-3 rounded-2xl max-w-[90vw] sm:max-w-[80%] shadow bg-white border border-green-200 text-green-900 rounded-bl-none flex items-center gap-2">
                  <span className="inline-block w-5 h-5 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></span>
                  <span>...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />

            {/* Scroll-to-bottom Arrow */}
            {showScrollDown && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-2 right-2 p-2 bg-white border border-green-300 rounded-full shadow hover:bg-green-100"
                aria-label="Scroll to latest message"
              >
                <FaChevronDown className="text-green-600" />
              </button>
            )}
          </div>

          {/* Input Area */}
          <div className="flex items-center border-t border-green-100 bg-white px-2 py-2 sm:px-4 sm:py-3 rounded-b-2xl">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-grow px-2 py-2 sm:px-4 border border-green-200 rounded-l-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-gradient-to-br from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 text-white px-3 py-2 sm:px-5 rounded-r-xl text-sm font-semibold shadow transition-all duration-200 disabled:opacity-60 border-green"
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
