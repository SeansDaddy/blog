# Android WebView 应用开发

## 概述

用 Android Studio 开发 + WebView 组件加载网页，快速构建 Android App。适合已有后端 API 或移动端网页的场景，无需深入学习 Android 原生 UI 开发。

## 架构

```
手机端                         服务器端
┌──────────────────┐          ┌──────────────────┐
│ Android App      │  HTTP   │ 后端服务           │
│ ┌──────────────┐ │  请求   │ ┌──────────────┐ │
│ │   WebView    │ │───────→│ │  FastAPI     │ │
│ │  (加载网页)   │ │←───────│ │  /api/...    │ │
│ └──────────────┘ │  JSON   │ └──────────────┘ │
└──────────────────┘          └──────────────────┘
```

WebView 是 Android 内置的网页浏览器组件，可像浏览器一样加载 URL，但以全屏 App 形式呈现，没有地址栏。

## 开发步骤

### 1. 创建 Android Studio 项目

- 新建 → Empty Views Activity（不用 Compose，用 XML 布局）
- 填写项目名、包名

### 2. 布局文件加 WebView

`res/layout/activity_main.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<WebView
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/webview"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### 3. Activity 加载网页

`MainActivity.kt`：

```kotlin
package com.example.myapp

import android.webkit.WebView
import android.webkit.WebViewClient
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView = findViewById<WebView>(R.id.webview)

        // 让链接在 WebView 内打开，不跳系统浏览器
        webView.webViewClient = WebViewClient()

        // 加载目标网页
        webView.loadUrl("http://你的服务器IP:端口")

        // 如果网页需要 JS，开启
        webView.settings.javaScriptEnabled = true
    }
}
```

### 4. 加网络权限

`AndroidManifest.xml`，manifest 内加：

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

application 内加：

```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

`android:usesCleartextTraffic="true"` 允许加载 HTTP 网址（HTTPS 可不填）。

### 5. 打包 APK

Android Studio 菜单：Build → Generate Signed Bundle / APK → APK → 选择密钥或新建 → 完成

APK 生成在 `app/build/outputs/apk/debug/` 目录，传到手机安装。

## 适用场景

- ✅ 后端 API 已存在，前端用网页实现
- ✅ 需要快速出 Android App 原型
- ✅ 跨平台需求（同一后端可为 App、Web、小程序共用）
- ✅ 需要热更新（改网页内容用户下次打开就是新版）

## 局限性

- ❌ 界面不如原生精致
- ❌ 调用硬件功能（摄像头、蓝牙等）需要额外桥接
- ❌ 部分国产手机 WebView 兼容性差异
