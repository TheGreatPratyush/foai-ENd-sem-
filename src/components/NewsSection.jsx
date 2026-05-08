import { useState, useMemo } from "react";

function NewsCard({ article, dark }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={`flex flex-col rounded-2xl shadow-xl overflow-hidden border h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
      {!imgErr && article.image_url ? (
        <img
          src={article.image_url}
          alt={article.title}
          className="h-48 w-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="h-48 flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900 text-5xl">
          🚀
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-1 gap-2">
          <span className={`text-xs font-bold uppercase truncate max-w-[60%] ${dark ? "text-blue-400" : "text-blue-600"}`}>
            {article.news_site || "Unknown"}
          </span>
          <span className="text-xs opacity-40 flex-shrink-0">
            {new Date(article.published_at).toLocaleDateString()}
          </span>
        </div>
        {article.author && (
          <p className={`text-xs mb-2 truncate ${dark ? "text-slate-500" : "text-gray-400"}`}>
            By {article.author}
          </p>
        )}
        <h3 className={`font-bold text-sm leading-snug mb-2 line-clamp-2 ${dark ? "text-white" : "text-gray-900"}`}>
          {article.title}
        </h3>
        <p className={`text-xs flex-grow line-clamp-3 mb-4 leading-relaxed ${dark ? "text-slate-400" : "text-gray-500"}`}>
          {article.summary}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          Read More →
        </a>
      </div>
    </div>
  );
}

function SkeletonCard({ dark }) {
  const bg = dark ? "bg-slate-700" : "bg-gray-200";
  return (
    <div className={`rounded-2xl overflow-hidden border animate-pulse ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
      <div className={`h-48 ${bg}`} />
      <div className="p-4 space-y-3">
        <div className={`h-3 rounded w-1/3 ${bg}`} />
        <div className={`h-4 rounded w-full ${bg}`} />
        <div className={`h-4 rounded w-5/6 ${bg}`} />
        <div className={`h-3 rounded w-full ${bg}`} />
        <div className={`h-3 rounded w-3/4 ${bg}`} />
        <div className={`h-9 rounded-xl ${bg} mt-2`} />
      </div>
    </div>
  );
}

export default function NewsSection({ dark, news, newsLoading, newsError, newsCat, setNewsCat, onRefresh, cats }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");

  const filtered = useMemo(() => {
    let f = news.filter(a =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.summary?.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "date") f = [...f].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    else f = [...f].sort((a, b) => (a.news_site || "").localeCompare(b.news_site || ""));
    return f;
  }, [news, search, sort]);

  const card = `rounded-2xl shadow-xl border ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`;
  const input = `px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 transition ${dark ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"}`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className={`${card} p-4`}>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            id="news-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search articles..."
            className={`flex-1 ${input}`}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className={`md:w-44 ${input}`}
          >
            <option value="date">Sort by Date</option>
            <option value="source">Sort by Source</option>
          </select>
          <button
            id="news-refresh-btn"
            onClick={onRefresh}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {cats.map(cat => (
            <button
              key={cat}
              onClick={() => setNewsCat(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${newsCat === cat
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results info */}
      {!newsLoading && !newsError && (
        <p className="text-sm opacity-50 px-1">
          Showing <b>{filtered.length}</b> articles · Category: <b>{newsCat}</b>
          {search && <> · Filtered by: <b>"{search}"</b></>}
        </p>
      )}

      {/* Grid */}
      {newsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} dark={dark} />)}
        </div>
      ) : newsError ? (
        <div className={`${card} p-10 text-center`}>
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-red-400 mb-5 font-medium">{newsError}</p>
          <button
            onClick={onRefresh}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
          >
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <p className="text-5xl mb-4">🔭</p>
          <p className="opacity-50 text-sm">No articles found{search ? ` for "${search}"` : ""}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article, i) => (
            <NewsCard key={article.id || i} article={article} dark={dark} />
          ))}
        </div>
      )}
    </div>
  );
}
