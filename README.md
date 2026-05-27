# 企业官网模板

一个基于 HTML + Flask + SQLite 的企业官网模板，包含前台展示和后台管理系统。

---

## 目录结构

```
项目根目录/
├── index.html            # 首页
├── products.html         # 产品中心列表页
├── product-detail.html   # 产品详情页
├── server.py             # Flask 后端服务
├── css/
│   ├── base.css          # 前台公共样式
│   └── admin.css         # 后台管理样式
├── db/
│   └── product.db        # SQLite 数据库（首次运行自动创建）
├── img/                  # 网站图标、Logo 等
├── pictures/             # 产品、新闻等图片素材
│   ├── product/
│   ├── news/
│   ├── help/
│   └── others/
└── admin/
    └── index.html        # 后台管理页面
```

---

## 环境要求

- Python 3.8 及以上
- Flask 3.x

### 安装 Flask

```bash
pip install flask
```

---

## 启动项目

在项目根目录下运行：

```bash
python3 server.py
```

启动成功后终端会显示：

```
✅ 数据库已就绪：.../db/product.db
🚀 服务启动：http://localhost:8080
```

然后在浏览器打开 **http://localhost:8080** 即可访问网站。

> ⚠️ 必须通过 `server.py` 启动，直接用浏览器打开 HTML 文件会导致产品数据无法加载。

---

## 后台管理

访问地址：**http://localhost:8080/admin/**

默认账号：
- 用户名：`admin`
- 密码：`123456`

### 添加产品

1. 登录后台，点击左侧「产品管理」
2. 点击「新增产品」
3. 填写以下字段：

| 字段 | 说明 | 是否必填 |
|------|------|----------|
| 产品名称 | 显示在卡片和详情页的标题 | ✅ |
| 产品分类 | 用于前台分类筛选 | ✅ |
| 产品描述 | 卡片摘要，控制在 2~3 句以内 | ✅ |
| 合金成分 | 如 `Sn96.5/Ag3/Cu0.5` | 可选 |
| 规格尺寸 | 如 `0.1mm × 5mm` | 可选 |
| 产品详情 | 详情页参数表格中展示的详细信息 | 可选 |
| 产品图片 | 上传后显示在卡片和详情页 | 可选 |
| 状态 | **上架**才会在前台显示，下架则隐藏 | ✅ |

4. 点击「保存产品」
5. 刷新前台产品页面即可看到新产品

---

## 自定义网站内容

### 修改公司名称 / 电话 / 地址

直接编辑以下文件中的对应文字：

- `index.html` — 首页内容
- `products.html` — 产品中心页头部和底部
- `product-detail.html` — 产品详情页头部和底部

搜索以下关键词快速定位：

```
福摩索          # 公司名称
400-000-0000   # 电话
info@company.com  # 邮箱
```

### 修改 Banner 图片

首页 Banner 图片在 `index.html` 中：

```html
<img src="pictures/others/你的图片.jpg" alt="Banner" class="hero-img">
```

将图片放入 `pictures/others/` 文件夹，然后修改 `src` 路径即可。

### 修改 Logo

替换 `img/logo.png` 文件（保持同名）。

### 修改样式颜色

主色调在 `css/base.css` 文件顶部的 CSS 变量中定义：

```css
:root {
  --blue: #0a84d6;       /* 主色 */
  --blue-dark: #0a6db8;  /* 深色 */
  ...
}
```

### 修改产品分类

产品分类在两处定义，需要同步修改：

1. **后台分类下拉菜单** — `admin/index.html`，搜索 `productCat`
2. **前台分类筛选按钮** — `products.html`，搜索 `cat-btn`

---

## API 接口

后台产品数据通过以下接口与前台交互：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 获取所有产品 |
| GET | `/api/products?status=上架` | 只获取上架产品 |
| GET | `/api/products/<id>` | 获取单个产品 |
| POST | `/api/products` | 新建产品 |
| PUT | `/api/products/<id>` | 更新产品 |
| DELETE | `/api/products/<id>` | 删除产品 |

---

## 注意事项

- 产品图片以 Base64 格式存储在 SQLite 数据库中，上传大量高清图片会使 `db/product.db` 文件增大
- `server.py` 为开发模式，正式上线建议使用 Gunicorn + Nginx 部署
- 后台账号密码目前为前端验证，正式使用前请在 `admin/index.html` 中修改默认密码
