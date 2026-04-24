import { useState } from 'react'
import { Search, Menu, X } from 'lucide-react'

const allTags = ['PHP', 'Centos', 'MySQL', 'Docker', '架构', 'Nginx', 'Git', 'Shell', 'Java', '面试', '随笔']

const articles = [
  {
    id: 1,
    title: 'React Server Components 深入理解',
    excerpt: '探索 RSC 的核心概念、工作原理以及它如何改变我们构建 React 应用的方式。',
    date: '2026-04-20',
    readTime: '8 min',
    tags: ['React', '前端'],
    cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
  },
  {
    id: 2,
    title: 'TypeScript 5.0 装饰器完全指南',
    excerpt: '深入解析 TypeScript 5.0 中装饰器的语法变化、运行机制以及在实际项目中的最佳实践。',
    date: '2026-04-18',
    readTime: '12 min',
    tags: ['TypeScript', '前端'],
    cover: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
  },
  {
    id: 3,
    title: 'Node.js 性能优化实战',
    excerpt: '从内存管理、异步IO、集群架构等多个维度，讲解如何打造高性能的 Node.js 应用。',
    date: '2026-04-15',
    readTime: '15 min',
    tags: ['Node.js', '后端'],
    cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
  },
  {
    id: 4,
    title: 'Docker 与 Kubernetes 实践指南',
    excerpt: '容器化时代的必备技能：从 Docker 基础到 K8s 集群管理，一站式掌握云原生部署。',
    date: '2026-04-10',
    readTime: '10 min',
    tags: ['Docker', '云原生'],
    cover: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=400&fit=crop',
  },
  {
    id: 5,
    title: '前端性能优化完全指南',
    excerpt: '从 Core Web Vitals 到加载策略，深入探讨现代前端性能优化的核心技巧。',
    date: '2026-04-05',
    readTime: '20 min',
    tags: ['前端', '性能优化'],
    cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
  },
  {
    id: 6,
    title: 'Git 工作流完全指南',
    excerpt: '深入理解 Git Flow、GitHub Flow 和 Trunk-Based Development，选择适合团队的协作模式。',
    date: '2026-04-01',
    readTime: '10 min',
    tags: ['Git', '工程化'],
    cover: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=400&fit=crop',
  },
]

const recentComments = [
  { user: '张三', text: '写得很好，终于理解了 RSC 的原理！' },
  { user: '李四', text: '求助：Docker 启动失败是什么问题？' },
  { user: '王五', text: '感谢分享，已经用上了这个配置' },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const filteredArticles = articles.filter(article =>
    selectedTags.length === 0 || article.tags.some(tag => selectedTags.includes(tag))
  )

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900">
            花生牛奶
          </a>

          {/* 桌面端菜单 */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">首页</a>
            <a href="/categories" className="text-sm text-gray-600 hover:text-gray-900">分类</a>
            <a href="/archives" className="text-sm text-gray-600 hover:text-gray-900">归档</a>
            <a href="/friends" className="text-sm text-gray-600 hover:text-gray-900">友链</a>
            <a href="/about" className="text-sm text-gray-600 hover:text-gray-900">关于</a>
            <a href="/projects" className="text-sm text-gray-600 hover:text-gray-900">开源项目</a>
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-1 text-gray-500 hover:text-gray-700">
              <Search size={18} />
            </button>
          </nav>

          {/* 移动端菜单按钮 */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* 移动端菜单 */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4">
            <nav className="flex flex-col gap-3">
              <a href="/" className="text-sm text-gray-600">首页</a>
              <a href="/categories" className="text-sm text-gray-600">分类</a>
              <a href="/archives" className="text-sm text-gray-600">归档</a>
              <a href="/friends" className="text-sm text-gray-600">友链</a>
              <a href="/about" className="text-sm text-gray-600">关于</a>
              <a href="/projects" className="text-sm text-gray-600">开源项目</a>
            </nav>
          </div>
        )}

        {/* 搜索框 */}
        {searchOpen && (
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="max-w-6xl mx-auto">
              <input
                type="text"
                placeholder="搜索文章..."
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 左侧文章列表 */}
          <div className="flex-1">
            {/* 文章列表 */}
            <div className="space-y-10">
              {filteredArticles.map((article) => (
                <article key={article.id} className="border-b border-gray-100 pb-10">
                  <img
                    src={article.cover}
                    alt={article.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-gray-600">
                    <a href={`/blog/${article.id}`}>{article.title}</a>
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{article.excerpt}</p>
                  <div className="flex gap-2 mb-3">
                    {article.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a href={`/blog/${article.id}`} className="text-sm text-blue-500 hover:text-blue-600">
                    - 阅读全文 -
                  </a>
                </article>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12 text-gray-400">没有找到匹配的文章</div>
            )}

            {/* 分页 */}
            <div className="flex justify-center gap-2 mt-10">
              <span className="px-3 py-1 text-sm bg-gray-900 text-white rounded">1</span>
              <a href="/?page=2" className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">2</a>
              <a href="/?page=2" className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">下一页</a>
            </div>
          </div>

          {/* 右侧侧边栏 */}
          <aside className="w-64 flex-shrink-0 space-y-8">
            {/* 最新文章 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                最新文章
              </h3>
              <ul className="space-y-3">
                {articles.slice(0, 8).map(article => (
                  <li key={article.id}>
                    <a href={`/blog/${article.id}`} className="text-sm text-gray-600 hover:text-gray-900 line-clamp-2">
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* 最近回复 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                最近回复
              </h3>
              <ul className="space-y-3">
                {recentComments.map((comment, idx) => (
                  <li key={idx} className="text-sm">
                    <a href="#comment" className="text-blue-500 hover:text-blue-600">{comment.user}</a>
                    <span className="text-gray-400">: </span>
                    <span className="text-gray-500 line-clamp-2">{comment.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 标签 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <a
                    key={tag}
                    href={`/?tag=${tag}`}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>

            {/* 其它 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                其它
              </h3>
              <ul className="space-y-2">
                <li><a href="/rss.xml" className="text-sm text-gray-500 hover:text-gray-700">文章 RSS</a></li>
                <li><a href="/comments/rss" className="text-sm text-gray-500 hover:text-gray-700">评论 RSS</a></li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* 底部 */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              <a href="/" className="hover:text-gray-600">花生牛奶</a>
              <span className="mx-2">·</span>
              <a href="https://typecho.org" target="_blank" rel="noopener" className="hover:text-gray-600">Typecho</a>
            </p>
            <p className="text-xs text-gray-400">闽ICP备xxxxxx号</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
