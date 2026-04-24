import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Menu, X, ChevronRight, Hash, Archive, Clock, Search, ExternalLink, Github, ArrowLeft, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Post {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  tags: string[];
  slug: string;
}

// --- Sample Data ---

const POSTS: Post[] = [
  {
    id: '1',
    title: 'Hermes Agent 子 Agent 架构与 API Key 配置',
    date: '2026-04-22',
    excerpt: '深入解析 Hermes Agent 中子 Agent 的启动机制、API Key 的三条获取路径（直接 base_url、provider 名称、继承父 Agent），以及 profile 配置的常见陷阱和最佳实践。',
    category: 'AI Agent',
    tags: ['AI', 'Agent', 'Python'],
    slug: 'hermes-agent-subagent',
  },
  {
    id: '2',
    title: 'go 库之 patrickmn/go-cache',
    date: '2023-11-20',
    excerpt: '在 Go 项目中，经常需要用到缓存。patrickmn/go-cache 是一个在内存中存储键值对的缓存库，类似于 Memcached...',
    category: 'Backend',
    tags: ['Go', 'Cache', 'Library'],
    slug: '',
  },
  {
    id: '3',
    title: '如何让 Windows 的 Git Bash 可以使用 make',
    date: '2023-10-15',
    excerpt: '在 Windows 上进行开发时，有时会用到 make 命令，但 Git Bash 默认不包含它。可以通过安装 MinGW 工具包来解决...',
    category: 'Tools',
    tags: ['Windows', 'Git Bash', 'Make'],
    slug: '',
  },
];

const CATEGORIES = ['AI Agent', 'Backend', 'Frontend', 'Tools', 'DevOps', 'Thoughts'];
const ARCHIVES = ['2026 (1)', '2025 (12)', '2024 (24)', '2023 (18)'];

// --- Navbar ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">花</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-zinc-900">花生牛奶's blog</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">首页</Link>
            <Link to="/" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">归档</Link>
            <Link to="/" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">友链</Link>
            <Link to="/" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">关于</Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-100 bg-white overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>首页</Link>
              <Link to="/" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>归档</Link>
              <Link to="/" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>友链</Link>
              <Link to="/" className="block text-lg font-medium text-zinc-900" onClick={() => setIsOpen(false)}>关于</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Post Item ---

const PostItem: React.FC<{ post: Post }> = ({ post }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="group py-8 border-b border-zinc-100 last:border-0"
  >
    <div className="flex items-center space-x-3 text-sm text-zinc-400 mb-2">
      <Clock size={14} />
      <span>{post.date}</span>
      <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
      <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">{post.category}</span>
    </div>
    <h2 className="text-2xl font-bold text-zinc-900 mb-3 group-hover:text-zinc-600 transition-colors cursor-pointer">
      <Link to={post.slug ? `/blog/${post.slug}` : '/'}>{post.title}</Link>
    </h2>
    <p className="text-zinc-600 leading-relaxed mb-4 line-clamp-2">
      {post.excerpt}
    </p>
    <div className="flex flex-wrap gap-2">
      {post.tags.map(tag => (
        <span key={tag} className="inline-flex items-center px-2 py-1 bg-zinc-50 text-zinc-500 text-[11px] font-medium rounded-md border border-zinc-100">
          <Hash size={10} className="mr-1" />
          {tag}
        </span>
      ))}
    </div>
  </motion.article>
);

// --- Sidebar ---

const Sidebar = () => (
  <aside className="space-y-10">
    {/* Profile Card */}
    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
      <div className="w-16 h-16 bg-zinc-200 rounded-full mb-4 mx-auto overflow-hidden flex items-center justify-center text-zinc-400">
        <User size={32} />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-zinc-900">花生牛奶</h3>
        <p className="text-sm text-zinc-500 mt-1">记录思考，分享成长</p>
      </div>
      <div className="flex justify-center space-x-4 mt-6">
        <a href="https://github.com" target="_blank" rel="noopener" className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <Github size={20} />
        </a>
      </div>
    </div>

    {/* Categories */}
    <div>
      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center">
        <ChevronRight size={16} className="mr-1 text-zinc-400" />
        Categories
      </h3>
      <ul className="space-y-2">
        {CATEGORIES.map(cat => (
          <li key={cat}>
            <a href="#" className="flex justify-between items-center text-zinc-600 hover:text-zinc-900 py-1 transition-colors group">
              <span className="text-sm">{cat}</span>
              <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">12</span>
            </a>
          </li>
        ))}
      </ul>
    </div>

    {/* Archives */}
    <div>
      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center">
        <Archive size={16} className="mr-2 text-zinc-400" />
        Archives
      </h3>
      <ul className="space-y-2">
        {ARCHIVES.map(item => (
          <li key={item}>
            <a href="#" className="text-sm text-zinc-600 hover:text-zinc-900 block py-1 transition-colors">{item}</a>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

// --- Footer ---

const Footer = () => (
  <footer className="border-t border-zinc-100 bg-zinc-50 py-12 mt-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">花</span>
            </div>
            <span className="text-lg font-semibold text-zinc-900">花生牛奶's blog</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm">
            记录思考，分享成长。保持热爱，持续输出。
          </p>
        </div>
        <div className="flex flex-col md:items-end space-y-4">
          <div className="flex space-x-6">
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">关于</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">友链</a>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} 花生牛奶. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

// --- Article Detail Page ---

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const found = POSTS.find(p => p.slug === slug);
    setPost(found || null);

    if (slug) {
      fetch(`/content/${slug}.md`)
        .then(r => r.text())
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(() => {
          setContent('文章加载失败');
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-400">加载中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">文章不存在</h1>
        <Link to="/" className="text-blue-500 hover:text-blue-600">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-900 mb-8 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          返回首页
        </Link>

        {/* Article header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-3 text-sm text-zinc-400 mb-4">
            <Calendar size={14} />
            <span>{post.date}</span>
            <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
            <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">{post.category}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-1 bg-zinc-50 text-zinc-500 text-[11px] font-medium rounded-md border border-zinc-100">
                <Hash size={10} className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </motion.header>

        {/* Article content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-zinc max-w-none"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({children}) => <h1 className="text-3xl font-bold text-zinc-900 mt-10 mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-bold text-zinc-900 mt-8 mb-3">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-bold text-zinc-900 mt-6 mb-2">{children}</h3>,
              p: ({children}) => <p className="text-zinc-600 leading-relaxed mb-4">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside text-zinc-600 mb-4 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside text-zinc-600 mb-4 space-y-1">{children}</ol>,
              li: ({children}) => <li className="text-zinc-600">{children}</li>,
              code: ({className, children}) => {
                const isInline = !className;
                if (isInline) {
                  return <code className="px-1 py-0.5 bg-zinc-100 text-zinc-800 text-sm rounded font-mono">{children}</code>;
                }
                return <code className="block p-4 bg-zinc-900 text-zinc-100 text-sm rounded-lg font-mono overflow-x-auto mb-4">{children}</code>;
              },
              pre: ({children}) => <pre className="mb-4">{children}</pre>,
              a: ({href, children}) => <a href={href} className="text-blue-500 hover:text-blue-600 underline" target="_blank" rel="noopener">{children}</a>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-zinc-200 pl-4 italic text-zinc-500 mb-4">{children}</blockquote>,
              strong: ({children}) => <strong className="font-bold text-zinc-900">{children}</strong>,
              hr: () => <hr className="border-zinc-200 my-8" />,
              table: ({children}) => <table className="w-full border-collapse mb-4">{children}</table>,
              th: ({children}) => <th className="border border-zinc-200 px-3 py-2 text-left text-sm font-bold text-zinc-900 bg-zinc-50">{children}</th>,
              td: ({children}) => <td className="border border-zinc-200 px-3 py-2 text-sm text-zinc-600">{children}</td>,
            }}
          >
            {content}
          </ReactMarkdown>
        </motion.article>
      </main>
      <Footer />
    </div>
  );
};

// --- Home Page ---

const HomePage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <Navbar />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-4">
          <header className="mb-12">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 mb-4"
            >
              最新文章
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-zinc-500"
            >
              记录思考，分享成长
            </motion.p>
          </header>

          <div className="space-y-2">
            {POSTS.map(post => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 lg:pt-32">
          <Sidebar />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

// --- App ---

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blog/:slug" element={<ArticleDetail />} />
    </Routes>
  );
}
