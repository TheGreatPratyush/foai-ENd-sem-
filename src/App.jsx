import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler
} from "chart.js";
import ISSSection from "./components/ISSSection";
import NewsSection from "./components/NewsSection";
import ChartsSection from "./components/ChartsSection";
import Chatbot from "./components/Chatbot";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export const NEWS_CATS = ["Space", "NASA", "Rocket", "Satellite", "Astronomy"];
export const CACHE_TTL = 15 * 60 * 1000;

export const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [tab, setTab] = useState("iss");

  // ISS state
  const [iss, setIss] = useState(null);
  const [positions, setPositions] = useState([]);
  const [speeds, setSpeeds] = useState([]);
  const [speedTimes, setSpeedTimes] = useState([]);
  const [astronauts, setAstronauts] = useState([]);
  const [issLoading, setIssLoading] = useState(true);

  // News state
  const [news, setNews] = useState([]);
  const [catNews, setCatNews] = useState({});
  const [newsCat, setNewsCat] = useState("Space");
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const fetchISS = useCallback(async (manual = false) => {
    try {
      const { data } = await axios.get("https://api.wheretheiss.at/v1/satellites/25544");
      const { latitude: lat, longitude: lng, velocity, altitude, timestamp } = data;
      setPositions(prev => {
        const updated = [...prev, { lat, lng, time: timestamp }].slice(-15);
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = haversine(last.lat, last.lng, lat, lng);
          const dt = (timestamp - last.time) / 3600;
          const spd = dt > 0 ? Math.round(dist / dt) : Math.round(velocity);
          if (spd > 100 && spd < 50000) {
            setSpeeds(s => [...s, spd].slice(-30));
            setSpeedTimes(t => [...t, new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })].slice(-30));
          }
        }
        return updated;
      });
      setIss(data);
      setIssLoading(false);
      if (manual) toast.success("ISS data refreshed!");
    } catch {
      setIssLoading(false);
      if (manual) toast.error("ISS fetch failed");
    }
  }, []);

  const fetchAstronauts = async () => {
    try {
      const { data } = await axios.get("https://corsproxy.io/?url=http://api.open-notify.org/astros.json");
      setAstronauts(data.people || []);
    } catch {
      setAstronauts([]);
    }
  };

  const fetchNews = useCallback(async (cat = "Space", force = false) => {
    const key = `news_${cat}`;
    if (!force) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setNews(data);
            setCatNews(p => ({ ...p, [cat]: data }));
            return;
          }
        }
      } catch { /* ignore */ }
    }
    setNewsLoading(true);
    setNewsError(null);
    try {
      const { data } = await axios.get(`https://api.spaceflightnewsapi.net/v4/articles/?limit=10&search=${cat.toLowerCase()}`);
      const articles = data.results || [];
      setNews(articles);
      setCatNews(p => ({ ...p, [cat]: articles }));
      localStorage.setItem(key, JSON.stringify({ data: articles, ts: Date.now() }));
      if (force) toast.success("News refreshed!");
    } catch {
      setNewsError("Failed to load news. Please try again.");
      toast.error("News fetch failed");
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchISS();
    fetchAstronauts();
    fetchNews("Space");
    // Preload all categories for chart
    NEWS_CATS.forEach((cat, i) => {
      setTimeout(() => {
        const key = `news_${cat}`;
        const cached = localStorage.getItem(key);
        if (!cached) fetchNews(cat);
        else {
          try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < CACHE_TTL) setCatNews(p => ({ ...p, [cat]: data }));
          } catch { /* ignore */ }
        }
      }, i * 1000);
    });
    const iv = setInterval(fetchISS, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { fetchNews(newsCat); }, [newsCat]);

  const toggleDark = () => {
    setDark(d => {
      toast.success(`${d ? "Light" : "Dark"} mode activated!`);
      return !d;
    });
  };

  const navBtn = (t, label) => (
    <button key={t} onClick={() => setTab(t)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
        : dark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-gray-600 hover:bg-gray-100"
        }`}>{label}</button>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-right" toastOptions={{
        style: { background: dark ? "#1e293b" : "#fff", color: dark ? "#fff" : "#111", border: dark ? "1px solid #334155" : "1px solid #e2e8f0", borderRadius: "12px" }
      }} />

      {/* NAVBAR */}
      <nav className={`sticky top-0 z-[1000] px-4 md:px-6 py-3 border-b flex items-center justify-between backdrop-blur-md ${dark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse">🛸</span>
          <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            SPACE DASHBOARD
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-1">
            {navBtn("iss", "🌍 ISS Tracker")}
            {navBtn("news", "📰 News")}
            {navBtn("charts", "📊 Charts")}
          </div>
          <button onClick={toggleDark}
            className={`p-2 rounded-full text-lg transition-all hover:scale-110 ${dark ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-100 hover:bg-gray-200"}`}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <div className={`md:hidden flex gap-2 px-4 py-2 border-b overflow-x-auto ${dark ? "border-slate-800" : "border-gray-200"}`}>
        {[["iss", "🌍 ISS"], ["news", "📰 News"], ["charts", "📊 Charts"]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${tab === t ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-400" : "bg-gray-200 text-gray-600"}`}>
            {l}
          </button>
        ))}
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {tab === "iss" && (
          <ISSSection dark={dark} iss={iss} positions={positions} astronauts={astronauts}
            issLoading={issLoading} onRefresh={() => fetchISS(true)} />
        )}
        {tab === "news" && (
          <NewsSection dark={dark} news={news} newsLoading={newsLoading} newsError={newsError}
            newsCat={newsCat} setNewsCat={setNewsCat} onRefresh={() => fetchNews(newsCat, true)} cats={NEWS_CATS} />
        )}
        {tab === "charts" && (
          <ChartsSection dark={dark} speeds={speeds} speedTimes={speedTimes} catNews={catNews} cats={NEWS_CATS} />
        )}
      </main>

      <Chatbot dark={dark} iss={iss} astronauts={astronauts} news={news} />
    </div>
  );
}
