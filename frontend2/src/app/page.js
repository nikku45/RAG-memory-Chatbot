'use client'
import { useState, useRef } from "react";
import { Room } from "livekit-client";
import { Send, Users, MessageCircle } from "lucide-react";

export default function Home() {
  const [identity, setIdentity] = useState("");
  const [roomName, setRoomName] = useState("test-room");
  const [connected, setConnected] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const roomRef = useRef(null);

  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const TOKEN_SERVER = process.env.NEXT_PUBLIC_TOKEN_SERVER || process.env.NEXT_PUBLIC_BACKEND_TOKEN_SERVER || "http://localhost:8000";

  async function joinRoom() {
    if (!identity) return alert("Enter username/identity");
    // request token from backend
    const res = await fetch(`${TOKEN_SERVER}/token?identity=${encodeURIComponent(identity)}&room=${encodeURIComponent(roomName)}`);
    const data = await res.json();
    const token = data.token;
    const room = new Room();
    roomRef.current = room;

    // listen for data messages
    room.on("dataReceived", (payload, participant, kind, topic) => {
      try {
        const text = new TextDecoder().decode(payload);
        const parsed = JSON.parse(text);
        setMessages(m => [...m, { from: parsed.username || participant?.identity || "unknown", text: parsed.text || text }]);
        setIsTyping(false); // Stop typing animation when message received
      } catch (e) {
        const text = new TextDecoder().decode(payload);
        setMessages(m => [...m, { from: participant?.identity || "unknown", text }]);
        setIsTyping(false); // Stop typing animation when message received
      }
    });

    await room.connect(LIVEKIT_URL, token);
    setConnected(true);
  }

  async function sendMessage() {
    if (!roomRef.current || !msg.trim()) return;
    
    // Show typing animation
    setIsTyping(true);
    
    const payloadObj = { username: identity, text: msg };
    const json = JSON.stringify(payloadObj);
    const encoded = new TextEncoder().encode(json);
    // publish data to room (topic 'chat')
    await roomRef.current.localParticipant.publishData(encoded, { reliable: true, topic: "chat" });
    setMessages(m => [...m, { from: identity, text: msg }]);
    setMsg("");
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && connected) {
      sendMessage();
    } else if (e.key === 'Enter' && !connected) {
      joinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MessageCircle className="w-10 h-10 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-800">LiveKit Chat</h1>
            </div>
            <p className="text-gray-600">Connect and chat in real-time</p>
          </div>

          {!connected ? (
            /* Join Room Card */
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <div className="text-center mb-6">
                <Users className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800">Join a Room</h2>
                <p className="text-gray-500 mt-2">Enter your details to start chatting</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={identity}
                    onChange={e => setIdentity(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter room name"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-500"
                  />
                </div>
                
                <button
                  onClick={joinRoom}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Join Room
                </button>
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-indigo-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Room: {roomName}</h2>
                    <p className="text-indigo-200">Connected as {identity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Online</span>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="h-96 overflow-y-auto p-6 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.from === identity ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          m.from === identity
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 shadow-sm rounded-bl-none border'
                        }`}>
                          {m.from !== identity && (
                            <p className="text-xs font-medium text-gray-500 mb-1">{m.from}</p>
                          )}
                          <p className="text-sm">{m.text}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Animation */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-800 shadow-sm rounded-2xl rounded-bl-none border px-4 py-2 max-w-xs">
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">Agent is typing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!msg.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors duration-200"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}