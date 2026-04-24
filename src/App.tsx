import { useState } from 'react'
import { Menu, X, ArrowRight, Calendar, Tag } from 'lucide-react'

// 模拟文章数据
const articles = [
  {
    id: 1,
    title: 'React Server Components 深入理解',
    excerpt: '探索 RSC 的核心概念、工作原理以及它如何改变我们构建 React 应用的方式。',
    cover: 'https://picsum.photos/800/400?random=1',
    date: '2026-04-20',
    tags: ['React', '前端'],
    category: '技术'
  },
  {
    id: 2,
    title: 'TypeScript 5.0 装饰器完全指南',
    excerpt: '深入解析 TypeScript 5.0 中装饰器的语法变化、运行机制以及在实际项目中的最佳实践。',
    cover: 'https://picsum.photos/800/400?random=2',
    date: '2026-04-18',
    tags: ['TypeScript', '前端'],
    category: '技术'
  },
  {
    id: 3,
    title: 'Node.js 性能优化实战',
    excerpt: '从内存管理、异步IO、集群架构等多个维度，讲解如何打造高性能的 Node.js 应用。',
    cover: 'https://picsum.photos/800/400?random=3',
    date: '2026-04-15',
    tags: ['Node.js', '后端'],
    category: '技术'
  },
]

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            陈星的博客
          </a>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">首页</a>
            <a href="/articles" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">文章</a>
            <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">关于</a>
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-4">
            <a href="/" className="block text-gray-600 hover:text-gray-900 font-medium">首页</a>
            <a href="/articles" className="block text-gray-600 hover:text-gray-900 font-medium">文章</a>
            <a href="/about" className="block text-gray-600 hover:text-gray-900 font-medium">关于</a>
          </div>
        )}
      </header>

      {/* Hero 区域 */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
            技术分享与个人思考
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            你好，我是陈星
          </h1>

          <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-8">
            一名全栈工程师，专注于现代前端技术、后端架构与云原生实践。
            在这里分享技术见解、个人思考与项目经验。
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              阅读文章
              <ArrowRight size={18} />
            </a>
            <a
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              了解更多
            </a>
          </div>
        </div>
      </section>

      {/* 最新文章区域 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-gray-900">最新文章</h2>
          <a
            href="/articles"
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            查看全部
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              {/* 文章封面 */}
              <div className="aspect-[2/1] overflow-hidden bg-gray-100">
                <img
                  src={article.cover}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* 文章内容 */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Calendar size={12} />
                    {article.date}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 底部 */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 陈星的博客 · 使用 React + Tailwind CSS 构建
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                GitHub
              </a>
              <a href="mailto:chenxing@example.com" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                联系我
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
