import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const issIcon = new L.DivIcon({
  html: '<div style="font-size:32px;line-height:1;filter:drop-shadow(0 0 10px #3b82f6);animation:pulse 2s infinite">🛸</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "",
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
}

function StatCard({ label, value, sub, color, dark }) {
  return (
    <div className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${dark ? "bg-slate-900 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
      <p className={`text-xl md:text-2xl font-mono font-bold ${color}`}>{value}</p>
      <p className="text-xs font-semibold mt-1 opacity-60 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs opacity-40 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ISSSection({ dark, iss, positions, astronauts, issLoading, onRefresh }) {
  const [mapKey] = useState(() => Date.now());
  const card = `rounded-2xl shadow-xl border ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`;
  const divider = `border-b ${dark ? "border-slate-700" : "border-gray-100"}`;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* MAP */}
        <div className={`lg:col-span-2 ${card} overflow-hidden`}>
          <div className={`px-5 py-4 flex justify-between items-center ${divider}`}>
            <div>
              <h2 className="font-bold text-lg">🌍 ISS Live Tracking</h2>
              <p className="text-xs opacity-50 mt-0.5">
                Auto-refreshes every 15s &nbsp;•&nbsp; {positions.length}/15 positions tracked
              </p>
            </div>
            <button id="iss-refresh-btn" onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30">
              ↻ Refresh
            </button>
          </div>
          <div className="h-[420px]">
            {issLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm opacity-50 animate-pulse">Acquiring ISS signal...</p>
              </div>
            ) : iss ? (
              <MapContainer key={mapKey} center={[iss.latitude, iss.longitude]} zoom={3}
                style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url={dark
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                />
                <RecenterMap lat={iss.latitude} lng={iss.longitude} />
                <Marker position={[iss.latitude, iss.longitude]} icon={issIcon}>
                  <Popup>
                    <div style={{ fontFamily: "monospace", minWidth: 180 }}>
                      <b>🛸 International Space Station</b><br />
                      <span style={{ color: "#3b82f6" }}>Lat:</span> {iss.latitude?.toFixed(4)}°<br />
                      <span style={{ color: "#8b5cf6" }}>Lon:</span> {iss.longitude?.toFixed(4)}°<br />
                      <span style={{ color: "#10b981" }}>Speed:</span> {iss.velocity?.toFixed(0)} km/h<br />
                      <span style={{ color: "#f59e0b" }}>Alt:</span> {iss.altitude?.toFixed(0)} km
                    </div>
                  </Popup>
                </Marker>
                {positions.length > 1 && (
                  <Polyline
                    positions={positions.map(p => [p.lat, p.lng])}
                    color="#3b82f6" weight={3} dashArray="6,4" opacity={0.8}
                  />
                )}
              </MapContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <p className="text-red-400 text-sm">Failed to load ISS data</p>
                <button onClick={onRefresh} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">Retry</button>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* Telemetry */}
          <div className={`${card} p-5`}>
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Live Telemetry</h3>
            {issLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-14 rounded-xl ${dark ? "bg-slate-700" : "bg-gray-200"}`} />)}
              </div>
            ) : iss ? (
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Latitude" value={`${iss.latitude?.toFixed(3)}°`} color="text-blue-400" dark={dark} />
                <StatCard label="Longitude" value={`${iss.longitude?.toFixed(3)}°`} color="text-purple-400" dark={dark} />
                <StatCard label="Speed" value={`${Math.round(iss.velocity)}`} sub="km/h" color="text-green-400" dark={dark} />
                <StatCard label="Altitude" value={`${iss.altitude?.toFixed(0)}`} sub="km" color="text-amber-400" dark={dark} />
                <div className={`col-span-2 p-4 rounded-xl border text-center ${dark ? "bg-slate-900 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
                  <p className="text-xl font-bold text-cyan-400 font-mono">{positions.length} / 15</p>
                  <p className="text-xs opacity-60 font-semibold mt-1 uppercase tracking-wider">Path Points</p>
                </div>
              </div>
            ) : (
              <p className="text-sm opacity-40 text-center py-6">No data</p>
            )}
          </div>

          {/* Astronauts */}
          <div className={`${card} p-5`}>
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">👨‍🚀 People in Space</h3>
              <span className="text-2xl font-black text-blue-400">{astronauts.length}</span>
            </div>
            <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {astronauts.length === 0 ? (
                <li className="text-sm opacity-40 text-center py-4 animate-pulse">Loading crew...</li>
              ) : astronauts.map((a, i) => (
                <li key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${dark ? "hover:bg-slate-700" : "hover:bg-gray-50"} transition`}>
                  <span className="flex items-center gap-2">
                    <span>👨‍🚀</span>
                    <span className={dark ? "text-slate-200" : "text-gray-800"}>{a.name}</span>
                  </span>
                  {a.craft && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dark ? "bg-blue-900/60 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                      {a.craft}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
