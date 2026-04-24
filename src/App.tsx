import { useState } from 'react'
import { Search, Sun, Moon, Rss } from 'lucide-react'

const allTags = ['React', 'TypeScript', 'Node.js', '前端', '后端', '云原生', '工具', '性能优化', 'JavaScript']

const articles = [
  {
    id: 1,
    title: 'React Server Components 深入理解',
    excerpt: '探索 RSC 的核心概念、工作原理以及它如何改变我们构建 React 应用的方式。',
    cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    date: '2026-04-20',
    readTime: '8 min read',
    tags: ['React', '前端'],
    featured: true,
  },
  {
    id: 2,
    title: 'TypeScript 5.0 装饰器完全指南',
    excerpt: '深入解析 TypeScript 5.0 中装饰器的语法变化、运行机制以及在实际项目中的最佳实践。',
    cover: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
    date: '2026-04-18',
    readTime: '12 min read',
    tags: ['TypeScript', '前端'],
  },
  {
    id: 3,
    title: 'Node.js 性能优化实战',
    excerpt: '从内存管理、异步IO、集群架构等多个维度，讲解如何打造高性能的 Node.js 应用。',
    cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
    date: '2026-04-15',
    readTime: '15 min read',
    tags: ['Node.js', '后端'],
  },
  {
    id: 4,
    title: 'Docker 与 Kubernetes 实践指南',
    excerpt: '容器化时代的必备技能：从 Docker 基础到 K8s 集群管理，一站式掌握云原生部署。',
    cover: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=400&fit=crop',
    date: '2026-04-10',
    readTime: '10 min read',
    tags: ['云原生', '工具'],
  },
  {
    id: 5,
    title: '前端性能优化完全指南',
    excerpt: '从 Core Web Vitals 到加载策略，深入探讨现代前端性能优化的核心技巧。',
    cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    date: '2026-04-05',
    readTime: '20 min read',
    tags: ['性能优化', '前端'],
  },
  {
    id: 6,
    title: 'JavaScript 异步编程详解',
    excerpt: '从 Callback 到 Promise 再到 Async/Await，全面理解 JavaScript 异步编程的演进历程。',
    cover: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop',
    date: '2026-04-01',
    readTime: '12 min read',
    tags: ['JavaScript', '前端'],
  },
]

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'oldest'>('newest')
  const [visibleCount, setVisibleCount] = useState(6)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const filteredArticles = articles.filter(article =>
    selectedTags.length === 0 || article.tags.some(tag => selectedTags.includes(tag))
  )

  const featuredArticle = filteredArticles.find(a => a.featured) || filteredArticles[0]
  const regularArticles = filteredArticles.filter(a => a.id !== featuredArticle?.id).slice(0, visibleCount - 1)

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* 导航栏 */}
      <header className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold">花生牛奶</a>
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(!searchOpen)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              <Search size={18} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* 搜索栏 */}
      {searchOpen && (
        <div className={`border-b ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
              <Search size={18} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
              <input type="text" placeholder="搜索文章..." className="flex-1 bg-transparent outline-none text-sm" autoFocus />
            </div>
          </div>
        </div>
      )}

      {/* 主内容 */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-bold mb-2">技术分享与个人思考</h1>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            探索现代前端技术、后端架构与云原生实践
          </p>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <Rss size={14} /> RSS 订阅
          </a>
        </div>

        {/* 筛选和排序 */}
        <div className={`flex flex-col md:flex-row md:items-start md:justify-between mb-8 pb-6 border-b gap-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-xs font-medium mr-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>标签:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button onClick={() => setSelectedTags([])} className="text-xs px-3 py-1.5 text-blue-400 hover:text-blue-300">清除</button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`text-xs px-2 py-1.5 rounded border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} focus:outline-none`}
            >
              <option value="newest">最新</option>
              <option value="popular">最热</option>
              <option value="oldest">最早</option>
            </select>
          </div>
        </div>

        {/* 精选文章 */}
        {featuredArticle && (
          <section className="mb-10">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>精选文章</h2>
            <article className={`rounded-xl overflow-hidden mb-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="aspect-video w-full overflow-hidden">
                <img src={featuredArticle.cover} alt={featuredArticle.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 md:p-8">
                <div className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{featuredArticle.date} · {featuredArticle.readTime}</div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 hover:text-blue-400 cursor-pointer">{featuredArticle.title}</h3>
                <p className={`text-sm mb-4 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{featuredArticle.excerpt}</p>
                <div className="flex gap-2">
                  {featuredArticle.tags.map((tag) => (
                    <span key={tag} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          </section>
        )}

        {/* 文章列表 */}
        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>全部文章</h2>
          <div className="space-y-8">
            {regularArticles.map((article) => (
              <article key={article.id} className={`flex gap-6 pb-8 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="w-32 h-24 md:w-48 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={article.cover} alt={article.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{article.date} · {article.readTime}</div>
                  <h3 className="text-lg font-bold mb-2 hover:text-blue-400 cursor-pointer">{article.title}</h3>
                  <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{article.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
          {regularArticles.length === 0 && <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>没有找到匹配的文章</div>}
        </section>
      </main>

      {/* 底部 */}
      <footer className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} mt-16`}>
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <div className="text-xl font-bold mb-1">花生牛奶</div>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>全栈工程师 · 技术分享</p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}>GitHub</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}>Twitter</a>
            <a href="/rss" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}><Rss size={18} /></a>
          </div>
          <div className={`pt-8 border-t text-xs ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'}`}>© 2026 花生牛奶</div>
        </div>
      </footer>
    </div>
  )
}

export default App
