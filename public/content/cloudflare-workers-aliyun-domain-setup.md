# 零成本搭一个「中国可访问」的网站：阿里云域名 + Cloudflare Workers + GitHub

**日期：** 2026-05-05
**分类：** 基础设施
**标签：** #Cloudflare #域名 #Workers #部署

---

最近把手头一个静态网站的部署架构梳理了一遍，用的是**阿里云买的域名 + Cloudflare Workers 做前端 + GitHub 管代码**。没有服务器，没有备案，国内访问速度也不错。写篇文章记录一下，供有类似需求的人参考。

## 为什么是这套组合

一开始想过几种方案：

- **GitHub Pages**：免费，但国内访问速度感人，还经常抽风
- **Vercel**：体验很好，但国内偶发性访问受限
- **阿里云 ECS**：需要备案，懒得弄
- **Cloudflare Pages**：体验接近 Vercel，全球 CDN，但很多人不知道它还有个更灵活的兄弟——**Cloudflare Workers**

最后选了这套方案的核心原因：

> **Cloudflare Workers 可以做纯前端托管，和 GitHub 代码仓联动，push 代码自动部署，而且国内访问走的是 Cloudflare 边缘节点，速度不差。**

## 整体架构

三个组件各司其职：

```
用户请求
    ↓
阿里云域名（DNS 解析）
    ↓
Cloudflare Workers（边缘节点，托管前端文件）
    ↓
GitHub 代码仓（源代码，push 触发自动部署）
```

- **域名**：在阿里云买的，负责 DNS 解析
- **Workers**：实际托管网站文件的地方，全球边缘节点，国内访问走的是 Cloudflare 在亚太的节点
- **代码仓**：GitHub，push 代码自动触发 Workers 重新部署

## 第一步：买域名，做 DNS 解析

阿里云万网买域名，流程不说了，买完之后在阿里云控制台把 DNS 服务器改成 Cloudflare 的：

```
阿里云 → 域名控制台 → 找到你的域名 → DNS 修改
```

把原来的阿里云 DNS 服务器删掉，替换成 Cloudflare 给的两个 NS：

```
ram.ns.cloudflare.com
meadow.ns.cloudflare.com
```

NS 变更全球传播需要几分钟到48小时，之后你的域名就归 Cloudflare 管了。

## 第二步：在 Cloudflare 添加域名

登录 [dash.cloudflare.com](https://dash.cloudflare.com)，点击「Add a Domain」，输入你的域名，按引导完成添加。

这一步 Cloudflare 会验证域名的所有权，方式有两种：
1. **DNS 验证**：在阿里云 DNS 里加一条 TXT 记录
2. **文件验证**：上传一个 HTML 文件到阿里云解析的临时地址

DNS 验证更简单，推荐用这种方式。

## 第三步：创建 Cloudflare Workers 项目

这一步有两种做法：

**方式 A：Cloudflare Pages（更简单）**

适合纯静态网站。Cloudflare Pages 直接连接 GitHub 仓库，push 代码自动部署，连 CI 都帮你做好了。

设置好之后，Cloudflare 会给你一个 `项目名.pages.dev` 的免费域名。如果不想绑定自定义域名，直接用这个也行。

**方式 B：Cloudflare Workers + Wrangler（更灵活）**

如果要做一些定制化的事情，比如SSR、API 代理、或者像我这样需要直接控制部署行为，可以用 Wrangler CLI：

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy dist --project-name=你的项目名
```

`dist` 是你的构建产物目录。部署完成后，访问 `项目名.workers.dev`。

之后在 GitHub 仓库的 Settings → Webhooks 里添加 Cloudflare 的 webhook，或者直接在 Cloudflare Dashboard 里连接 GitHub，push 代码就能触发自动部署了。

## 第四步：绑定自定义域名（可选）

如果你买的是阿里云域名，想要用自己的域名访问，而不是 Cloudflare 给的 `.workers.dev`，可以在 Cloudflare Workers 的「Triggers」里添加自定义域名：

```
Workers & Pages → 你的项目 → Triggers → Custom Domains → Add Domain
```

输入你的子域名（比如 `blog.yourdomain.com`），Cloudflare 会自动在 DNS 里创建必要的记录，你不需要在阿里云手动配置。Let's Encrypt 证书也是 Cloudflare 自动申请和续期的。

> **注意：** 如果你的域名是主域名（比如 `yourdomain.com`，不是子域名），Cloudflare 可能会要求 DNS 已经托管在 Cloudflare。确认一下阿里云的 NS 变更是否已经生效。

## 关于国内访问速度

这是很多人关心的问题。结论是：**对于静态网站，Cloudflare 的速度在国内是可以接受的**。

原因是 Cloudflare 在亚太地区有多个边缘节点（香港、新加坡、日本等），国内用户访问走的是这些节点，不是美国的节点。加上 Cloudflare 自己的 Anycast 加速，延迟通常在 100-200ms 之间，比 GitHub Pages 和某些境外 CDN 要稳定得多。

当然，如果你要做需要和中国大陆服务器大量交互的网站，还是老老实实用国内机房靠谱。

## 踩过的几个坑

**1. Error 522：源站连接超时**

Workers 部署完之后访问报 522，是因为 Workers 还在部署中，或者自定义域名配置有问题。等待一分钟通常会自动恢复。

**2. 域名「此域已经在使用」**

添加自定义域名时报这个错，是因为阿里云那边已经有一条 CNAME 记录指向同一个地址，和 Cloudflare 的自定义域名冲突了。去阿里云 DNS 设置里删掉那条记录就好。

**3. NS 变更后网站暂时离线**

改 DNS 服务器之后，全球传播需要时间，期间网站可能间歇性不可用。这是正常的，通常几小时内恢复，最长不超过48小时。

## 总结

| 组件 | 作用 | 费用 |
|------|------|------|
| 阿里云域名 | DNS 解析 | ~¥40/年 |
| Cloudflare Workers | 前端托管、边缘计算 | 免费（25个 Workers） |
| GitHub 代码仓 | 源代码管理、自动部署触发 | 免费 |

三个人加起来，零服务器成本，零备案，适合不想折腾但又想网站国内可访问的个人开发者。

---

*有问题可以在 GitHub 提 Issue，或者直接在小宇宙播客里讨论。*
