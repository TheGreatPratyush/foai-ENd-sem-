import { Line, Doughnut } from "react-chartjs-2";

const CAT_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444"];

export default function ChartsSection({ dark, speeds, speedTimes, catNews, cats }) {
  const tc = dark ? "#94a3b8" : "#64748b";
  const gc = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const card = `rounded-2xl shadow-xl border ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`;
  const tt = { backgroundColor: dark?"#1e293b":"#fff", titleColor: dark?"#fff":"#111", bodyColor: tc, borderColor: dark?"#334155":"#e2e8f0", borderWidth:1 };

  const speedData = {
    labels: speedTimes,
    datasets:[{ label:"ISS Speed (km/h)", data:speeds, borderColor:"#3b82f6", backgroundColor:"rgba(59,130,246,0.12)", tension:0.4, fill:true, pointRadius:3, pointBackgroundColor:"#3b82f6", pointHoverRadius:6 }]
  };

  const catCounts = cats.map(c => (catNews[c]||[]).length);
  const hasData = catCounts.some(c => c > 0);

  const donutData = {
    labels: cats,
    datasets:[{ data: hasData ? catCounts : [1,1,1,1,1], backgroundColor:CAT_COLORS, borderWidth:3, borderColor: dark?"#1e293b":"#fff", hoverOffset:8 }]
  };

  const lineOpts = {
    responsive:true, maintainAspectRatio:false, animation:{duration:500},
    plugins:{ legend:{labels:{color:tc,font:{family:"Inter",size:12}}}, tooltip:{mode:"index",intersect:false,...tt} },
    scales:{ x:{ticks:{color:tc,maxTicksLimit:6,font:{size:11}},grid:{color:gc}}, y:{ticks:{color:tc,font:{size:11}},grid:{color:gc}} }
  };

  const donutOpts = {
    responsive:true, maintainAspectRatio:false, cutout:"65%",
    plugins:{
      legend:{position:"bottom",labels:{color:tc,font:{family:"Inter",size:12},padding:16,usePointStyle:true}},
      tooltip:{...tt,callbacks:{label:ctx=>hasData?` ${ctx.label}: ${ctx.parsed} articles`:` ${ctx.label}: loading...`}}
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Speed Chart */}
        <div className={`${card} p-6`}>
          <h2 className="font-bold text-lg mb-1">📈 ISS Speed History</h2>
          <p className="text-xs opacity-50 mb-5">Last 30 measurements via Haversine formula</p>
          <div className="h-72">
            {speeds.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                <p className="text-xs opacity-40 text-center">Collecting data…<br/>needs 2+ ISS pings (every 15s)</p>
              </div>
            ) : <Line data={speedData} options={lineOpts}/>}
          </div>
          {speeds.length > 0 && (
            <div className={`mt-4 grid grid-cols-3 gap-3 pt-4 border-t ${dark?"border-slate-700":"border-gray-100"}`}>
              {[
                {l:"Current",v:speeds[speeds.length-1],c:"text-blue-400"},
                {l:"Max",v:Math.max(...speeds),c:"text-red-400"},
                {l:"Min",v:Math.min(...speeds),c:"text-green-400"},
              ].map(s=>(
                <div key={s.l} className="text-center">
                  <p className={`text-lg font-bold font-mono ${s.c}`}>{s.v?.toLocaleString()}</p>
                  <p className="text-xs opacity-50 uppercase tracking-wider">{s.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* News Donut */}
        <div className={`${card} p-6`}>
          <h2 className="font-bold text-lg mb-1">🗞️ News by Category</h2>
          <p className="text-xs opacity-50 mb-5">Article distribution across search categories</p>
          <div className="h-72"><Doughnut data={donutData} options={donutOpts}/></div>
          {hasData && (
            <div className={`mt-4 grid grid-cols-2 gap-2 pt-4 border-t ${dark?"border-slate-700":"border-gray-100"}`}>
              {cats.map((cat,i)=>(
                <div key={cat} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor:CAT_COLORS[i]}}/>
                  <span className="text-xs opacity-60">{cat}</span>
                  <span className={`ml-auto text-xs font-bold ${dark?"text-slate-300":"text-gray-700"}`}>{(catNews[cat]||[]).length}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {icon:"📊",v:"Chart.js v4",l:"Chart Library"},
          {icon:"🗺️",v:"Leaflet.js",l:"Map Library"},
          {icon:"📐",v:"Haversine",l:"Speed Formula"},
          {icon:"🤖",v:"Mistral-7B",l:"AI Model"},
        ].map(info=>(
          <div key={info.l} className={`${card} p-4 text-center`}>
            <p className="text-2xl mb-1">{info.icon}</p>
            <p className={`font-bold text-sm ${dark?"text-white":"text-gray-900"}`}>{info.v}</p>
            <p className="text-xs opacity-40 mt-0.5">{info.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
