(function () {

  /* ── 工具函数 ── */
  function $(id) { return document.getElementById(id); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function uid()   { return Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

  /* ── localStorage（文章 / 解决方案 / 新闻仍使用本地存储） ── */
  var DB = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('cms_' + k) || '[]'); } catch (e) { return []; } },
    set: function (k, v) { localStorage.setItem('cms_' + k, JSON.stringify(v)); }
  };

  /* ── Toast 提示 ── */
  window.showToast = function (msg, type) {
    var el = document.createElement('div');
    el.className = 'toast-item ' + (type || 'success');
    el.textContent = msg;
    $('toast').appendChild(el);
    setTimeout(function () { el.remove(); }, 3000);
  };

  /* ── 登录 / 退出 ── */
  window.doLogin = function () {
    var u = $('loginUser').value.trim();
    var p = $('loginPass').value.trim();
    if (u === 'admin' && p === '123456') {
      $('loginPage').classList.add('hidden');
      $('adminLayout').classList.remove('hidden');
      $('userLabel').textContent  = u;
      $('userAvatar').textContent = u[0].toUpperCase();
      refreshDashboard();
    } else {
      showToast('用户名或密码错误', 'error');
    }
  };
  window.doLogout = function () {
    $('adminLayout').classList.add('hidden');
    $('loginPage').classList.remove('hidden');
  };

  /* ── 页面导航 ── */
  var pageTitles = { dashboard: '控制台', articles: '文章管理', products: '产品管理', solutions: '解决方案', news: '新闻资讯' };
  window.showPage = function (name) {
    document.querySelectorAll('.page-section').forEach(function (s) { s.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    var pg = $('pg-' + name);
    if (pg) pg.classList.add('active');
    var nav = document.querySelector('.nav-item[onclick*="' + name + '"]');
    if (nav) nav.classList.add('active');
    $('topTitle').textContent = pageTitles[name] || name;
    $('topBread').textContent = '首页 / ' + (pageTitles[name] || name);
    if (name === 'dashboard') refreshDashboard();
    if (name === 'articles')  renderArticles();
    if (name === 'products')  renderProducts();
    if (name === 'solutions') renderSolutions();
    if (name === 'news')      renderNews();
  };

  /* ── 弹窗 ── */
  window.closeModal = function (id) { $(id).classList.remove('open'); };
  document.querySelectorAll('.modal-overlay').forEach(function (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); });
  });

  /* ── 图片上传预览 ── */
  window.triggerUpload = function (id) { $(id).click(); };
  window.previewImage  = function (input, previewId) {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = $(previewId);
      img.src = e.target.result;
      img.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  };

  /* ── 删除确认弹窗 ── */
  var _confirmCb = null;
  function confirmDelete(msg, cb) {
    $('confirmMsg').textContent = msg;
    _confirmCb = cb;
    $('confirmModal').classList.add('open');
  }
  $('confirmOkBtn').addEventListener('click', function () {
    if (_confirmCb) { _confirmCb(); _confirmCb = null; }
    closeModal('confirmModal');
  });

  /* ── 状态徽章 ── */
  function statusBadge(s) {
    var cls = (s === '已发布' || s === '上架') ? 'badge-green' : 'badge-gray';
    return '<span class="badge ' + cls + '">' + s + '</span>';
  }

  /* ════════════════════════════════════════
     文章管理
  ════════════════════════════════════════ */
  window.openArticleForm = function (id) {
    $('articleId').value = id || '';
    $('articleModalTitle').textContent = id ? '编辑文章' : '新增文章';
    $('articleImgPreview').classList.add('hidden');
    if (id) {
      var item = DB.get('articles').find(function (a) { return a.id === id; });
      if (!item) return;
      $('articleTitle').value   = item.title;
      $('articleCat').value     = item.cat;
      $('articleSummary').value = item.summary;
      $('articleContent').value = item.content;
      $('articleDate').value    = item.date;
      $('articleStatus').value  = item.status;
      if (item.img) { $('articleImgPreview').src = item.img; $('articleImgPreview').classList.remove('hidden'); }
    } else {
      ['articleTitle', 'articleSummary', 'articleContent'].forEach(function (f) { $(f).value = ''; });
      $('articleCat').value = ''; $('articleStatus').value = '已发布'; $('articleDate').value = today();
    }
    $('articleModal').classList.add('open');
  };

  window.saveArticle = function () {
    var title   = $('articleTitle').value.trim();
    var cat     = $('articleCat').value;
    var content = $('articleContent').value.trim();
    if (!title)   { showToast('请填写文章标题', 'error'); return; }
    if (!cat)     { showToast('请选择文章分类', 'error'); return; }
    if (!content) { showToast('请填写正文内容', 'error'); return; }
    var id   = $('articleId').value;
    var img  = $('articleImgPreview').classList.contains('hidden') ? '' : $('articleImgPreview').src;
    var list = DB.get('articles');
    var record = { id: id || uid(), title: title, cat: cat, summary: $('articleSummary').value.trim(), content: content, date: $('articleDate').value || today(), status: $('articleStatus').value, img: img };
    if (id) {
      var idx = list.findIndex(function (a) { return a.id === id; });
      if (idx > -1) list[idx] = record;
    } else {
      list.unshift(record);
    }
    DB.set('articles', list);
    closeModal('articleModal');
    renderArticles();
    refreshDashboard();
    showToast(id ? '文章已更新' : '文章已发布');
  };

  window.deleteArticle = function (id) {
    confirmDelete('确定要删除这篇文章吗？', function () {
      DB.set('articles', DB.get('articles').filter(function (a) { return a.id !== id; }));
      renderArticles();
      refreshDashboard();
      showToast('已删除');
    });
  };

  function renderArticles() {
    var list  = DB.get('articles');
    var tbody = $('articlesTbody');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>暂无文章，点击"新增文章"开始添加</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (a) {
      return '<tr>' +
        '<td><strong class="text-truncate" style="display:block;max-width:200px;">' + a.title + '</strong></td>' +
        '<td><span class="badge badge-blue">' + a.cat + '</span></td>' +
        '<td><span class="text-muted text-truncate" style="display:block;">' + (a.summary || '—') + '</span></td>' +
        '<td>' + a.date + '</td>' +
        '<td>' + statusBadge(a.status) + '</td>' +
        '<td><div class="td-actions">' +
          '<button class="btn btn-ghost btn-sm" onclick="openArticleForm(\'' + a.id + '\')">编辑</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteArticle(\'' + a.id + '\')">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  /* ════════════════════════════════════════
     产品管理（数据来自 Flask API / product.db）
  ════════════════════════════════════════ */
  window.openProductForm = function (id) {
    $('productId').value = id || '';
    $('productModalTitle').textContent = id ? '编辑产品' : '新增产品';
    $('productImgPreview').classList.add('hidden');
    ['productName', 'productDesc', 'productSpec', 'productMaterial', 'productDetail'].forEach(function (f) { $(f).value = ''; });
    $('productCat').value = ''; $('productStatus').value = '上架';
    if (id) {
      fetch('/api/products/' + id)
        .then(function (r) { return r.json(); })
        .then(function (item) {
          $('productName').value     = item.name;
          $('productCat').value      = item.cat;
          $('productDesc').value     = item.desc;
          $('productSpec').value     = item.spec     || '';
          $('productMaterial').value = item.material || '';
          $('productStatus').value   = item.status;
          $('productDetail').value   = item.detail   || '';
          if (item.img) { $('productImgPreview').src = item.img; $('productImgPreview').classList.remove('hidden'); }
          $('productModal').classList.add('open');
        })
        .catch(function () { showToast('加载产品失败', 'error'); });
    } else {
      $('productModal').classList.add('open');
    }
  };

  window.saveProduct = function () {
    var name = $('productName').value.trim();
    var cat  = $('productCat').value;
    var desc = $('productDesc').value.trim();
    if (!name) { showToast('请填写产品名称', 'error'); return; }
    if (!cat)  { showToast('请选择产品分类', 'error'); return; }
    if (!desc) { showToast('请填写产品描述', 'error'); return; }
    var id  = $('productId').value;
    var img = $('productImgPreview').classList.contains('hidden') ? '' : $('productImgPreview').src;
    var record = { name: name, cat: cat, desc: desc, spec: $('productSpec').value.trim(), material: $('productMaterial').value.trim(), status: $('productStatus').value, detail: $('productDetail').value.trim(), img: img };
    fetch(id ? '/api/products/' + id : '/api/products', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function () {
        closeModal('productModal');
        renderProducts();
        refreshDashboard();
        showToast(id ? '产品已更新' : '产品已添加');
      })
      .catch(function () { showToast('保存失败，请检查服务是否运行', 'error'); });
  };

  window.deleteProduct = function (id) {
    confirmDelete('确定要删除这个产品吗？', function () {
      fetch('/api/products/' + id, { method: 'DELETE' })
        .then(function (r) { if (!r.ok) throw new Error(); })
        .then(function () { renderProducts(); refreshDashboard(); showToast('已删除'); })
        .catch(function () { showToast('删除失败', 'error'); });
    });
  };

  function renderProducts() {
    var tbody = $('productsTbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">加载中…</td></tr>';
    fetch('/api/products')
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (!list.length) {
          tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>暂无产品，点击"新增产品"开始添加</p></div></td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (p) {
          return '<tr>' +
            '<td><strong>' + p.name + '</strong></td>' +
            '<td><span class="badge badge-green">' + p.cat + '</span></td>' +
            '<td><span class="text-muted text-truncate" style="display:block;">' + p.desc + '</span></td>' +
            '<td>' + (p.spec || '—') + '</td>' +
            '<td>' + statusBadge(p.status) + '</td>' +
            '<td><div class="td-actions">' +
              '<button class="btn btn-ghost btn-sm" onclick="openProductForm(\'' + p.id + '\')">编辑</button>' +
              '<button class="btn btn-danger btn-sm" onclick="deleteProduct(\'' + p.id + '\')">删除</button>' +
            '</div></td>' +
          '</tr>';
        }).join('');
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>⚠️ 无法连接服务，请先运行 server.py</p></div></td></tr>';
      });
  }

  /* ════════════════════════════════════════
     解决方案管理
  ════════════════════════════════════════ */
  window.openSolutionForm = function (id) {
    $('solutionId').value = id || '';
    $('solutionModalTitle').textContent = id ? '编辑解决方案' : '新增解决方案';
    $('solutionImgPreview').classList.add('hidden');
    if (id) {
      var item = DB.get('solutions').find(function (s) { return s.id === id; });
      if (!item) return;
      $('solutionName').value       = item.name;
      $('solutionIndustry').value   = item.industry;
      $('solutionDesc').value       = item.desc;
      $('solutionHighlights').value = item.highlights;
      $('solutionTags').value       = item.tags;
      $('solutionStatus').value     = item.status;
      if (item.img) { $('solutionImgPreview').src = item.img; $('solutionImgPreview').classList.remove('hidden'); }
    } else {
      ['solutionName', 'solutionDesc', 'solutionHighlights', 'solutionTags'].forEach(function (f) { $(f).value = ''; });
      $('solutionIndustry').value = ''; $('solutionStatus').value = '已发布';
    }
    $('solutionModal').classList.add('open');
  };

  window.saveSolution = function () {
    var name     = $('solutionName').value.trim();
    var industry = $('solutionIndustry').value;
    var desc     = $('solutionDesc').value.trim();
    if (!name)     { showToast('请填写方案名称', 'error'); return; }
    if (!industry) { showToast('请选择适用行业', 'error'); return; }
    if (!desc)     { showToast('请填写方案描述', 'error'); return; }
    var id   = $('solutionId').value;
    var img  = $('solutionImgPreview').classList.contains('hidden') ? '' : $('solutionImgPreview').src;
    var list = DB.get('solutions');
    var record = { id: id || uid(), name: name, industry: industry, desc: desc, highlights: $('solutionHighlights').value.trim(), tags: $('solutionTags').value.trim(), status: $('solutionStatus').value, img: img };
    if (id) {
      var idx = list.findIndex(function (s) { return s.id === id; });
      if (idx > -1) list[idx] = record;
    } else {
      list.unshift(record);
    }
    DB.set('solutions', list);
    closeModal('solutionModal');
    renderSolutions();
    refreshDashboard();
    showToast(id ? '方案已更新' : '方案已添加');
  };

  window.deleteSolution = function (id) {
    confirmDelete('确定要删除这个解决方案吗？', function () {
      DB.set('solutions', DB.get('solutions').filter(function (s) { return s.id !== id; }));
      renderSolutions();
      refreshDashboard();
      showToast('已删除');
    });
  };

  function renderSolutions() {
    var list  = DB.get('solutions');
    var tbody = $('solutionsTbody');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>暂无解决方案</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (s) {
      var tagHtml = s.tags ? s.tags.split(',').map(function (t) { return '<span class="badge badge-purple" style="margin-right:4px;">' + t.trim() + '</span>'; }).join('') : '—';
      return '<tr>' +
        '<td><strong>' + s.name + '</strong></td>' +
        '<td><span class="badge badge-orange">' + s.industry + '</span></td>' +
        '<td><span class="text-muted text-truncate" style="display:block;">' + s.desc + '</span></td>' +
        '<td>' + tagHtml + '</td>' +
        '<td>' + statusBadge(s.status) + '</td>' +
        '<td><div class="td-actions">' +
          '<button class="btn btn-ghost btn-sm" onclick="openSolutionForm(\'' + s.id + '\')">编辑</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteSolution(\'' + s.id + '\')">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  /* ════════════════════════════════════════
     新闻资讯管理
  ════════════════════════════════════════ */
  window.openNewsForm = function (id) {
    $('newsId').value = id || '';
    $('newsModalTitle').textContent = id ? '编辑资讯' : '新增资讯';
    $('newsImgPreview').classList.add('hidden');
    if (id) {
      var item = DB.get('news').find(function (n) { return n.id === id; });
      if (!item) return;
      $('newsTitle').value   = item.title;
      $('newsCat').value     = item.cat;
      $('newsSummary').value = item.summary;
      $('newsContent').value = item.content;
      $('newsDate').value    = item.date;
      $('newsStatus').value  = item.status;
      if (item.img) { $('newsImgPreview').src = item.img; $('newsImgPreview').classList.remove('hidden'); }
    } else {
      ['newsTitle', 'newsSummary', 'newsContent'].forEach(function (f) { $(f).value = ''; });
      $('newsCat').value = ''; $('newsStatus').value = '已发布'; $('newsDate').value = today();
    }
    $('newsModal').classList.add('open');
  };

  window.saveNews = function () {
    var title   = $('newsTitle').value.trim();
    var cat     = $('newsCat').value;
    var content = $('newsContent').value.trim();
    if (!title)   { showToast('请填写资讯标题', 'error'); return; }
    if (!cat)     { showToast('请选择资讯分类', 'error'); return; }
    if (!content) { showToast('请填写正文内容', 'error'); return; }
    var id   = $('newsId').value;
    var img  = $('newsImgPreview').classList.contains('hidden') ? '' : $('newsImgPreview').src;
    var list = DB.get('news');
    var record = { id: id || uid(), title: title, cat: cat, summary: $('newsSummary').value.trim(), content: content, date: $('newsDate').value || today(), status: $('newsStatus').value, img: img };
    if (id) {
      var idx = list.findIndex(function (n) { return n.id === id; });
      if (idx > -1) list[idx] = record;
    } else {
      list.unshift(record);
    }
    DB.set('news', list);
    closeModal('newsModal');
    renderNews();
    refreshDashboard();
    showToast(id ? '资讯已更新' : '资讯已发布');
  };

  window.deleteNews = function (id) {
    confirmDelete('确定要删除这条资讯吗？', function () {
      DB.set('news', DB.get('news').filter(function (n) { return n.id !== id; }));
      renderNews();
      refreshDashboard();
      showToast('已删除');
    });
  };

  function renderNews() {
    var list  = DB.get('news');
    var tbody = $('newsTbody');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>暂无资讯</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (n) {
      return '<tr>' +
        '<td><strong class="text-truncate" style="display:block;max-width:200px;">' + n.title + '</strong></td>' +
        '<td><span class="badge badge-orange">' + n.cat + '</span></td>' +
        '<td><span class="text-muted text-truncate" style="display:block;">' + (n.summary || '—') + '</span></td>' +
        '<td>' + n.date + '</td>' +
        '<td>' + statusBadge(n.status) + '</td>' +
        '<td><div class="td-actions">' +
          '<button class="btn btn-ghost btn-sm" onclick="openNewsForm(\'' + n.id + '\')">编辑</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteNews(\'' + n.id + '\')">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  /* ════════════════════════════════════════
     控制台总览
  ════════════════════════════════════════ */
  function refreshDashboard() {
    var articles  = DB.get('articles');
    var solutions = DB.get('solutions');
    var news      = DB.get('news');
    $('dashArticleCount').textContent = articles.length;
    $('dashSolCount').textContent     = solutions.length;
    $('dashNewsCount').textContent    = news.length;
    fetch('/api/products')
      .then(function (r) { return r.json(); })
      .then(function (list) { $('dashProductCount').textContent = list.length; })
      .catch(function () { $('dashProductCount').textContent = '—'; });

    var ra = $('dashRecentArticles');
    ra.innerHTML = articles.length
      ? '<div style="display:flex;flex-direction:column;gap:12px;">' + articles.slice(0, 5).map(function (a) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:13px;color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;">' + a.title + '</span>' +
            '<span class="badge badge-blue" style="flex-shrink:0;">' + a.cat + '</span></div>';
        }).join('') + '</div>'
      : '<div class="empty-state"><p>暂无文章</p></div>';

    var rn = $('dashRecentNews');
    rn.innerHTML = news.length
      ? '<div style="display:flex;flex-direction:column;gap:12px;">' + news.slice(0, 5).map(function (n) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:13px;color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;">' + n.title + '</span>' +
            '<span style="font-size:12px;color:#64748b;flex-shrink:0;">' + n.date + '</span></div>';
        }).join('') + '</div>'
      : '<div class="empty-state"><p>暂无资讯</p></div>';
  }

  /* ── 键盘快捷键 ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
    }
    if (e.key === 'Enter' && !$('loginPage').classList.contains('hidden')) doLogin();
  });

  refreshDashboard();
})();
