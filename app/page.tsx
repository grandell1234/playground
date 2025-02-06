"use client";
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ApiResponse {
  generated_text: string;
  parameters: {
    batch_size: number;
    length: number;
    nsamples: number;
    prompt: string;
    run_name: string;
    temperature: number;
    top_p: number;
  };
}

type Message = {
  role: "user" | "assistant";
  content: string;
  parameters?: ApiResponse["parameters"];
  error?: boolean;
};

const PlaygroundApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [userInput, setUserInput] = useState("");
  const [temperature, setTemperature] = useState(1);
  const [topP, setTopP] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0]);
        }
      })
      .catch((error) => console.error("Error fetching models:", error));
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || !selectedModel || isLoading) return;

    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);

    try {
      const response = await fetch("http://localhost:4850/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userInput,
          length: 200,
          temperature: temperature,
          top_p: topP,
          run_name: selectedModel,
        }),
      });

      const data: ApiResponse = await response.json();

      const messages = data.generated_text
        .split("\n")
        .filter((msg) => msg.trim());

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: messages.join("\n"),
          parameters: data.parameters,
        },
      ]);
      setUserInput("");
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error generating the response.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar */}
      <div
        className={`relative transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0"} bg-gray-950 border-r border-gray-800`}
      >
        <div className="p-4">
          <div className="text-xl font-bold">Playground</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col group">
        <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4">
          {/* ... header content ... */}
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.role === "assistant" ? "pl-4" : "pr-4"}`}
            >
              <div
                className={`p-3 rounded ${
                  message.role === "assistant"
                    ? message.error
                      ? "bg-red-900"
                      : "bg-gray-800"
                    : "bg-blue-600"
                }`}
              >
                <div className="flex justify-between items-start">
                  <strong>
                    {message.role === "assistant" ? "Assistant" : "You"}
                  </strong>
                  {message.parameters && (
                    <div className="text-xs text-gray-400">
                      <span>temp: {message.parameters.temperature}</span>
                      <span className="ml-2">
                        top_p: {message.parameters.top_p}
                      </span>
                    </div>
                  )}
                </div>
                <div className="whitespace-pre-wrap mt-2">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 items-center bg-gray-800 rounded p-2"
          >
            <span>User</span>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter user message..."
              className="flex-1 bg-transparent outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 px-4 py-1 rounded"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 bg-gray-950 p-4 border-l border-gray-800">
        <div className="space-y-6">
          <div>
            <label className="block mb-2">Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full bg-gray-800">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800">
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block mb-2">Temperature: {temperature}</label>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              max={2}
              step={0.01}
              className="w-full bg-gray-300"
            />
          </div>

          <div>
            <label className="block mb-2">Top P: {topP}</label>
            <Slider
              value={[topP]}
              onValueChange={([value]) => setTopP(value)}
              max={1}
              step={0.01}
              className="w-full bg-gray-300"
            />
          </div>

          <button 
            onClick={() => {
              setMessages([]);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear Conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundApp;
