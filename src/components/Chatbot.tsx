"use client";

import { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State to toggle chatbot visibility
  const chatbotRef = useRef<HTMLDivElement>(null); // Ref for the chatbot container

  const handleSend = async () => {
    if (!input.trim()) return;

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

  // Close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating SVG Icon */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-green-900 text-white rounded-full shadow-lg hover:bg-green-700 transition-all z-50 cursor-pointer"
      >
        <Image src="/ChatBot.svg" alt="Chat Icon" width="65" height="65" />
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div
          ref={chatbotRef} // Attach the ref to the chatbot container
          className="fixed bottom-16 right-4 w-96 bg-white rounded-xl shadow-lg p-6 border border-gray-300 z-50"
        >
          <h2 className="text-lg font-semibold mb-4 text-green-700">
            UEMP Assistant
          </h2>

          <div className="h-64 overflow-y-auto mb-4 border rounded-lg p-4 bg-gray-50 text-sm">
            {messages.length === 0 && (
              <p className="text-gray-400">
                Ask anything about the UEMP platform...
              </p>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-2 p-3 rounded-lg w-fit max-w-[80%] whitespace-pre-wrap ${msg.sender === "user"
                    ? "bg-green-600 text-white self-end ml-auto"
                    : "bg-gray-200 text-black"
                  }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown> {/* Renders markdown */}
              </div>
            ))}

            {loading && (
              <div className="text-gray-500 italic mt-2">Thinking...</div>
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