/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, ChevronRight, Hash, Archive, Clock, Search, ExternalLink, Github, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Post {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  tags: string[];
}

// --- Sample Data ---

const POSTS: Post[] = [
  {
    id: '1',
    title: 'go 库之 patrickmn/go-cache',
    date: '2023-11-20',
    excerpt: '在 Go 项目中，经常需要用到缓存。patrickmn/go-cache 是一个在内存中存储键值对的缓存库，类似于 Memcached...',
    category: 'Backend',
    tags: ['Go', 'Cache', 'Library']
  },
  {
    id: '2',
    title: '如何让 Windows 的 Git Bash 可以使用 make',
    date: '2023-10-15',
    excerpt: '在 Windows 上进行开发时，有时会用到 make 命令，但 Git Bash 默认不包含它。可以通过安装 MinGW 工具包来解决...',
    category: 'Tools',
    tags: ['Windows', 'Git Bash', 'Make']
  },
  {
    id: '3',
    title: 'docker-certbot-dnspod 使用 Docker 申请、续期免费证书',
    date: '2023-09-08',
    excerpt: '使用 Docker 容器化部署 Certbot，结合 DNSPod 的 API 自动验证域名所有权，轻松实现证书自动续期...',
    category: 'DevOps',
    tags: ['Docker', 'HTTPS', 'Certbot']
  },
  {
    id: '4',
    title: 'JavaScript 解构赋值的深度实践',
    date: '2023-08-22',
    excerpt: '解构赋值是 ES6 引入的一项强大特性。本文将深入探讨对象、数组解构的高级用法，以及在函数参数中的巧妙应用...',
    category: 'Frontend',
    tags: ['JavaScript', 'ES6', 'React']
  },
  {
    id: '5',
    title: 'SSHFS Mac 挂载 Centos 远程文件系统',
    date: '2023-07-12',
    excerpt: '在 Mac 上使用 SSHFS 可以像操作本地磁盘一样操作远程 Centos 服务器上的文件，极大地提高了开发效率...',
    category: 'Tools',
    tags: ['SSH', 'Mac', 'Linux']
  }
];

const CATEGORIES = ['Backend', 'Frontend', 'Tools', 'DevOps', 'Thoughts'];
const ARCHIVES = ['2023 (12)', '2022 (24)', '2021 (18)', '2020 (15)'];

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">花</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-900">花生牛奶's blog</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">首页</a>
            <a href="#" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">归档</a>
            <a href="#" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">友链</a>
            <a href="#" className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">关于</a>
            <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
              <Search size={20} />
            </button>
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
              <a href="#" className="block text-lg font-medium text-zinc-900">首页</a>
              <a href="#" className="block text-lg font-medium text-zinc-900">归档</a>
              <a href="#" className="block text-lg font-medium text-zinc-900">友链</a>
              <a href="#" className="block text-lg font-medium text-zinc-900">关于</a>
              <div className="pt-4 border-t border-zinc-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="搜索文章..." 
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

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
      {post.title}
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

const Sidebar = () => (
  <aside className="space-y-10">
    {/* Profile Card */}
    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
      <div className="w-16 h-16 bg-zinc-200 rounded-full mb-4 mx-auto overflow-hidden">
        {/* Placeholder for avatar */}
        <div className="w-full h-full flex items-center justify-center text-zinc-400">
          <Github size={32} />
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-bold text-zinc-900">花生牛奶</h3>
        <p className="text-sm text-zinc-500 mt-1">兴趣爱好广泛，分享自己的思考</p>
      </div>
      <div className="flex justify-center space-x-4 mt-6">
        <a href="#" className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"><Github size={20} /></a>
        <a href="#" className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"><Twitter size={20} /></a>
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
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">RSS</a>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} 花生牛奶. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
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

            <div className="pt-12">
              <button className="flex items-center space-x-2 text-zinc-400 hover:text-zinc-900 font-bold transition-colors group">
                <span>View All Archives</span>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
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
}
