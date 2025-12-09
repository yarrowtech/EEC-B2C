import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export default function ChatBox() {
    const socket = useMemo(() => io(import.meta.env.VITE_API_URL), []);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [seenPopupMsg, setSeenPopupMsg] = useState(null);

    const user = JSON.parse(localStorage.getItem("user"));

    async function loadChat() {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        setMessages(res.data);
    }

    async function send() {
        if (!input.trim()) return;

        await axios.post(
            `${import.meta.env.VITE_API_URL}/api/chat`,
            { message: input },
            { headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` } }
        );

        socket.emit("send_message", {
            from: user.id,
            name: user.name,
            message: input,
            createdAt: new Date().toISOString(),
            tempId: Date.now() + Math.random(),
            seenBy: [],
        });

        setInput("");
    }

    async function markRead() {
        await axios.post(
            `${import.meta.env.VITE_API_URL}/api/chat/read`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` } }
        );

        socket.emit("message_read", { userId: user.id });
    }

    // ⭐ DELETE A SINGLE MESSAGE (ADMIN ONLY)
    async function deleteMessage(id) {
        const msg = messages.find(m => m._id === id);

        // 🔥 Only delete when double tick (✓✓)
        const seenCount = msg?.seenBy?.length || 0;
        if (seenCount === 0) {
            alert("Cannot delete message until it is seen (double tick).");
            return;
        }

        // Backend delete request
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/chat/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
        });

        // 🔥 Update both sender & receiver UI
        setMessages(prev =>
            prev.map(m =>
                m._id === id
                    ? {
                        ...m,
                        message: "This message was deleted by admin",
                        deleted: true
                    }
                    : m
            )
        );
    }



    // ⭐ CLEAR ALL CHAT (ADMIN ONLY)
    async function clearChat() {
        if (!window.confirm("Are you sure you want to clear the entire chat?")) return;

        await axios.delete(`${import.meta.env.VITE_API_URL}/api/chat`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` }
        });
        setMessages([]);
    }

    useEffect(() => {
        loadChat();
        markRead();

        socket.emit("join", "global-room");

        const msgHandler = (data) => {
            data.tempId = data.tempId || Date.now();
            setMessages((prev) => [...prev, data]);
        };

        const readHandler = ({ userId }) => {
            setMessages((prev) =>
                prev.map((m) => {
                    if (!m.seenBy) m.seenBy = [];
                    if (!m.seenBy.includes(userId)) m.seenBy.push(userId);
                    return { ...m };
                })
            );
        };

        socket.on("receive_message", msgHandler);
        socket.on("update_read", readHandler);

        return () => {
            socket.off("receive_message", msgHandler);
            socket.off("update_read", readHandler);
        };
    }, []);

    function getTickStatus(msg) {
        if (msg.from !== user.id) return null;

        const seenCount = msg.seenBy?.length || 0;

        if (seenCount === 0) return <span>✓</span>;
        if (seenCount > 0) return <span className="text-blue-500 font-bold">✓✓</span>;
    }

    function SeenPopup() {
        if (!seenPopupMsg) return null;

        const seenList = seenPopupMsg.seenByUsers || seenPopupMsg.seenBy || [];

        return (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-5 w-80">
                    <h3 className="text-lg font-semibold mb-3">Seen by</h3>

                    {seenList.length === 0 ? (
                        <p className="text-sm text-slate-500">No one has seen this yet</p>
                    ) : (
                        <ul className="space-y-2">
                            {seenList.map((u) => (
                                <li
                                    key={u._id || u.id}
                                    className="p-2 bg-slate-100 rounded-lg text-sm font-medium"
                                >
                                    {u.name || "Unknown User"}
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg"
                        onClick={() => setSeenPopupMsg(null)}
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[550px] max-w-3xl mx-auto">

            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl shadow-lg flex justify-between items-center">

                <div>
                    <h2 className="text-lg font-semibold tracking-wide">Group Chat</h2>
                    <p className="text-[12px] opacity-80">Chat with all teachers & admin</p>
                </div>

                {/* ⭐ CLEAR CHAT BUTTON (ADMIN ONLY) */}
                {user.role === "admin" && (
                    <button
                        onClick={clearChat}
                        className="px-3 py-1 text-xs bg-red-600 rounded-lg shadow text-white hover:bg-red-700"
                    >
                        Clear Chat
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-200 border-x border-b rounded-b-2xl shadow-inner">

                {messages.map((msg, i) => {
                    const mine = msg.from === user.id;

                    return (
                        <div
                            key={msg._id || msg.tempId || i}
                            className={`flex mb-3 ${mine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`
                                    relative
                                    max-w-[75%] px-4 py-2 rounded-2xl shadow backdrop-blur-md
                                    ${mine
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"}
                                `}
                            >

                                {!mine && (
                                    <div className="text-[11px] font-semibold text-blue-600 mb-1">
                                        {msg.name || "User"}
                                    </div>
                                )}

                                {/* <div className="leading-relaxed text-sm">{msg.message}</div> */}
                                <div
                                    className={`leading-relaxed text-sm ${msg.deleted ? "italic text-slate-500" : ""
                                        }`}
                                >
                                    {msg.message}
                                </div>



                                <div className="flex items-center justify-between mt-1">

                                    <span
                                        className={`text-[10px] opacity-80 ${mine ? "text-white" : "text-slate-500"}`}
                                    >
                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                    </span>

                                    {mine && (
                                        <span className="ml-2">{getTickStatus(msg)}</span>
                                    )}

                                    {/* ⭐ DELETE MESSAGE BUTTON (ADMIN ONLY) */}
                                    {user.role === "admin" && (
                                        <button
                                            onClick={() => deleteMessage(msg._id)}
                                            className="ml-2 text-red-500 font-bold text-lg"
                                            title="Delete message"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

            </div>

            {/* INPUT FIELD */}
            <div className="mt-3 flex items-center gap-2 p-3 bg-white rounded-xl shadow-lg border">
                <input
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    placeholder="Type a message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />

                <button
                    onClick={send}
                    className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                    Send
                </button>
            </div>

            <SeenPopup />
        </div>
    );
}
