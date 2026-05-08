import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function Chatbot({ dark, iss, astronauts, news }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chatMsgs") || "[]"); }
    catch { return []; }
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const TOKEN = import.meta.env.VITE_AI_TOKEN;

  useEffect(() => {
    localStorage.setItem("chatMsgs", JSON.stringify(msgs.slice(-30)));
  }, [msgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const buildContext = () => {
    let ctx = "=== DASHBOARD DATA (use ONLY this to answer) ===\n";
    if (iss) {
      ctx += `ISS LOCATION: Latitude=${iss.latitude?.toFixed(4)}°, Longitude=${iss.longitude?.toFixed(4)}°\n`;
      ctx += `ISS SPEED: ${iss.velocity?.toFixed(0)} km/h\n`;
      ctx += `ISS ALTITUDE: ${iss.altitude?.toFixed(0)} km above Earth\n`;
    } else {
      ctx += "ISS: Data not yet loaded\n";
    }
    ctx += `PEOPLE IN SPACE: ${astronauts.length} people\n`;
    if (astronauts.length > 0) ctx += `CREW: ${astronauts.map(a => `${a.name}${a.craft ? ` (${a.craft})` : ""}`).join(", ")}\n`;
    ctx += `NEWS ARTICLES LOADED: ${news.length}\n`;
    if (news.length > 0) {
      ctx += "RECENT NEWS:\n";
      news.slice(0, 8).forEach((a, i) => {
        ctx += `  ${i + 1}. "${a.title}" — Source: ${a.news_site || "Unknown"}, Date: ${new Date(a.published_at).toLocaleDateString()}\n`;
      });
    }
    ctx += "=== END OF DASHBOARD DATA ===\n";
    return ctx;
  };

  const send = async () => {
    if (!input.trim() || typing) return;
    const question = input.trim();
    setMsgs(m => [...m, { r: "user", c: question }]);
    setInput("");
    setTyping(true);
    try {
      const ctx = buildContext();
      const prompt = `<s>[INST] You are a Space Dashboard AI assistant. You MUST ONLY answer questions using the dashboard data provided below. Do NOT use any outside knowledge. If the answer is not in the data, say exactly: "I don't have that information in the current dashboard data."\n\n${ctx}\nUser question: ${question} [/INST]`;

      const HF_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
      const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
      const body = JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 300, temperature: 0.3, return_full_text: false }
      });

      let data;
      // In dev mode, use Vite proxy to avoid CORS. In production, try direct then CORS proxy.
      const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const urls = isDev
        ? ["/api/hf/models/mistralai/Mistral-7B-Instruct-v0.2"]
        : [
            HF_URL,
            `https://corsproxy.io/?${HF_URL}`,
          ];

      let lastErr;
      for (const url of urls) {
        try {
          const res = await fetch(url, { method: "POST", headers, body });
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            if (errBody.error?.includes("loading")) {
              setMsgs(m => [...m, { r: "bot", c: "⏳ Mistral-7B is loading on HuggingFace. Please wait ~30s and try again." }]);
              setTyping(false);
              return;
            }
            lastErr = new Error(`HTTP ${res.status}: ${JSON.stringify(errBody)}`);
            continue;
          }
          data = await res.json();
          break;
        } catch (e) {
          lastErr = e;
          continue;
        }
      }

      if (!data) throw lastErr || new Error("All endpoints failed");
      let reply = data[0]?.generated_text?.trim() || data?.generated_text?.trim() || "No response generated.";
      if (reply.includes("[/INST]")) reply = reply.split("[/INST]").pop()?.trim() || reply;
      setMsgs(m => [...m, { r: "bot", c: reply }]);
    } catch (err) {
      console.error("Chatbot error:", err);
      const errMsg = TOKEN && TOKEN !== "your_huggingface_token_here"
        ? `Error reaching Mistral-7B. The model may be loading — try again in 20s.`
        : "⚠️ Add your HuggingFace token to the .env file as VITE_AI_TOKEN.";
      setMsgs(m => [...m, { r: "bot", c: errMsg }]);
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    setMsgs([]);
    localStorage.removeItem("chatMsgs");
    toast.success("Chat history cleared!");
  };

  const bg = dark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)";
  const border = dark ? "border-slate-700" : "border-gray-200";

  return (
    <>
      {/* FAB */}
      <button
        id="chatbot-fab"
        onClick={() => setOpen(o => !o)}
        title="Open AI Chatbot"
        className="fixed bottom-6 right-6 z-[2000] w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className={`fixed bottom-24 right-6 z-[2000] w-80 md:w-96 rounded-2xl shadow-2xl border ${border} flex flex-col overflow-hidden`}
          style={{ height: 520, background: bg, backdropFilter: "blur(24px)" }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${border} bg-gradient-to-r from-blue-600/10 to-purple-600/10`}>
            <div>
              <p className={`font-bold text-sm ${dark ? "text-white" : "text-gray-900"}`}>🛸 Space AI Assistant</p>
              <p className="text-xs opacity-50">Mistral-7B · Dashboard data only</p>
            </div>
            <button
              onClick={clearChat}
              className="text-xs text-red-400 border border-red-400/30 px-2 py-1 rounded-lg hover:border-red-400 hover:bg-red-400/10 transition"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 && (
              <div className="text-center mt-10 space-y-2">
                <p className="text-4xl">🛸</p>
                <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-gray-600"}`}>
                  Ask me about the ISS!
                </p>
                <div className="space-y-1.5 text-left mt-4">
                  {[
                    "Where is the ISS right now?",
                    "How fast is the ISS moving?",
                    "Who is in space currently?",
                    "What are the latest space news?",
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition ${dark ? "border-slate-700 hover:bg-slate-800 text-slate-400" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.r === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.r === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : dark ? "bg-slate-700 text-slate-100 rounded-bl-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {m.c}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${dark ? "bg-slate-700" : "bg-gray-100"}`}>
                  <span className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className={`p-3 border-t ${border} flex gap-2`}>
            <input
              id="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about ISS or space news…"
              className={`flex-1 px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition ${dark ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"}`}
            />
            <button
              id="chatbot-send"
              onClick={send}
              disabled={typing || !input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
