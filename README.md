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
- Gunicorn（生产环境）
- Nginx（生产环境反向代理）

### 安装依赖

```bash
pip install flask gunicorn
```

---

## 生产环境部署

### 1. 上传项目文件

将项目文件上传至服务器，例如放置在 `/var/www/company-site/`。

### 2. 使用 Gunicorn 启动服务

```bash
cd /var/www/company-site
gunicorn -w 4 -b 127.0.0.1:8080 server:app
```

参数说明：
- `-w 4`：启动 4 个工作进程（可根据服务器 CPU 核数调整）
- `-b 127.0.0.1:8080`：监听本地 8080 端口，由 Nginx 做反向代理

如需后台持续运行，建议配合 `systemd` 管理服务进程。

### 3. 配置 Nginx 反向代理

在 Nginx 配置文件（如 `/etc/nginx/sites-available/company-site`）中添加：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /pictures/ {
        alias /var/www/company-site/pictures/;
    }

    location /img/ {
        alias /var/www/company-site/img/;
    }
}
```

替换 `your-domain.com` 为公司实际域名，然后重载 Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. 访问网站

部署完成后，通过公司域名访问：

- 前台官网：`https://your-domain.com`
- 后台管理：`https://your-domain.com/admin/`

---

## 后台管理

访问地址：**https://your-domain.com/admin/**

> ⚠️ 正式上线前，请务必修改默认账号密码（见下方「安全配置」章节）。

默认账号（仅供初次部署测试使用）：
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

## 安全配置

正式上线前，请完成以下安全设置：

- **修改后台密码**：在 `admin/index.html` 中搜索默认密码 `123456` 并替换为强密码
- **配置 HTTPS**：使用 Let's Encrypt 为域名申请免费 SSL 证书，并在 Nginx 中配置 443 端口
- **限制后台访问**：可在 Nginx 中为 `/admin/` 路径添加 IP 白名单，仅允许公司内网访问

---

## 注意事项

- 产品图片以 Base64 格式存储在 SQLite 数据库中，上传大量高清图片会使 `db/product.db` 文件增大，建议定期备份
- SQLite 适合中小规模访问量；如日访问量较高，建议迁移至 MySQL 或 PostgreSQL
- 部署后如需更新网站内容，重新上传对应文件后重载 Gunicorn 进程即可
