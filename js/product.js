/* ── 分类渐变色（产品列表页和详情页共用） ── */
var CAT_GRADIENTS = {
  '锡银铜焊片': 'linear-gradient(135deg,#0a84d6,#0369a1)',
  '金锡焊片':   'linear-gradient(135deg,#d97706,#b45309)',
  '锡铋焊片':   'linear-gradient(135deg,#7c3aed,#6d28d9)',
  '锡铅焊片':   'linear-gradient(135deg,#475569,#334155)',
  '锡铜焊片':   'linear-gradient(135deg,#ea580c,#c2410c)',
  '高温焊片':   'linear-gradient(135deg,#16a34a,#15803d)'
};

/* ── 回到顶部（两个页面共用） ── */
(function () {
  var topBtn = document.getElementById('backTop');
  if (!topBtn) return;
  window.addEventListener('scroll', function () {
    topBtn.classList.toggle('show', window.scrollY > 400);
  });
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ════════════════════════════════════════
   产品列表页 products.html
════════════════════════════════════════ */
(function () {
  var grid = document.getElementById('prodGrid');
  if (!grid) return; // 不在产品列表页则跳过

  var PRODUCTS = [];

  /* 渲染产品卡片 */
  function renderCards(cat) {
    var list = cat === '全部' ? PRODUCTS : PRODUCTS.filter(function (p) { return p.cat === cat; });
    if (!list.length) {
      grid.innerHTML = '<div class="no-result">该分类暂无产品</div>';
      return;
    }
    grid.innerHTML = list.map(function (p) {
      var imgHtml = p.img
        ? '<img src="' + p.img + '" alt="' + p.name + '">'
        : '<div class="pc-img-placeholder">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">' +
              '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
              '<circle cx="8.5" cy="8.5" r="1.5"/>' +
              '<polyline points="21 15 16 10 5 21"/>' +
            '</svg>' +
            '<span>' + p.cat + '</span>' +
          '</div>';
      var bgStyle  = p.img ? '' : 'style="background:' + p.gradient + ';"';
      var specsHtml = p.specs.map(function (s) { return '<span class="pc-spec">' + s + '</span>'; }).join('');
      return '<div class="pc-card" onclick="location.href=\'product-detail.html?id=' + p.id + '\'">' +
        '<div class="pc-img" ' + bgStyle + '>' + imgHtml + '<span class="pc-cat">' + p.cat + '</span></div>' +
        '<div class="pc-info"><h3>' + p.name + '</h3><p>' + p.desc + '</p><div class="pc-specs">' + specsHtml + '</div></div>' +
        '<div class="pc-footer"><span class="more">查看详情</span><span class="consult">立即咨询</span></div>' +
      '</div>';
    }).join('');
  }

  /* 分类筛选按钮 */
  document.getElementById('catFilter').addEventListener('click', function (e) {
    var btn = e.target.closest('.cat-btn');
    if (!btn) return;
    document.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderCards(btn.dataset.cat);
  });

  /* 从 API 加载产品 */
  var initCat = new URLSearchParams(location.search).get('cat') || '全部';
  grid.innerHTML = '<div class="no-result">加载中…</div>';

  fetch('/api/products?status=上架')
    .then(function (r) { return r.json(); })
    .then(function (raw) {
      PRODUCTS = raw.map(function (p) {
        var specs = [];
        if (p.material) specs.push(p.material);
        if (p.spec) specs.push(p.spec);
        return {
          id: p.id, cat: p.cat, name: p.name, desc: p.desc,
          specs: specs, img: p.img || '',
          gradient: CAT_GRADIENTS[p.cat] || 'linear-gradient(135deg,#0a84d6,#0369a1)'
        };
      });
      if (initCat !== '全部') {
        var btn = document.querySelector('.cat-btn[data-cat="' + initCat + '"]');
        if (btn) {
          document.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        }
      }
      renderCards(initCat);
    })
    .catch(function () {
      grid.innerHTML = '<div class="no-result">⚠️ 无法加载产品，请确认 server.py 正在运行</div>';
    });
})();

/* ════════════════════════════════════════
   产品详情页 product-detail.html
════════════════════════════════════════ */
(function () {
  var nameEl = document.getElementById('diName');
  if (!nameEl) return; // 不在详情页则跳过

  /* 把 API 原始数据映射成详情页需要的格式 */
  function mapProduct(p, allList) {
    var specs  = [];
    var params = [];
    if (p.material) { specs.push(p.material); params.push(['合金成分', p.material]); }
    if (p.spec)     { specs.push(p.spec);     params.push(['规格尺寸', p.spec]);     }
    if (p.detail)   { params.push(['详情说明', p.detail]); }
    var related = (allList || [])
      .filter(function (r) { return r.cat === p.cat && r.id !== p.id; })
      .slice(0, 4)
      .map(function (r) { return r.id; });
    return {
      id: p.id, cat: p.cat, name: p.name, desc: p.desc,
      specs: specs, img: p.img || '',
      gradient: CAT_GRADIENTS[p.cat] || 'linear-gradient(135deg,#0a84d6,#0369a1)',
      params: params, apps: [], related: related
    };
  }

  /* 渲染详情页 */
  function renderDetail(product, mapped) {
    document.title = product.name + ' - 福摩索';
    document.getElementById('bcCat').textContent  = product.cat;
    document.getElementById('bcName').textContent = product.name;
    document.getElementById('diCat').textContent  = product.cat;
    document.getElementById('diName').textContent = product.name;
    document.getElementById('diDesc').textContent = product.desc;

    /* 主图 */
    var mainImgEl = document.getElementById('mainImg');
    if (product.img) {
      mainImgEl.innerHTML = '<img src="' + product.img + '" alt="' + product.name + '">';
    } else {
      mainImgEl.style.background = product.gradient;
      document.getElementById('mainImgLabel').textContent = product.cat;
    }

    /* 快速参数 */
    var quickItems = [
      { v: product.params[0] ? product.params[0][1] : '—', k: product.params[0] ? product.params[0][0] : '' },
      { v: product.params[1] ? product.params[1][1] : '—', k: product.params[1] ? product.params[1][0] : '' },
      { v: product.specs[0]  || '—', k: '材质' }
    ];
    document.getElementById('diQuickSpecs').innerHTML = quickItems.map(function (i) {
      return '<div class="di-spec-item"><div class="sv">' + i.v + '</div><div class="sk">' + i.k + '</div></div>';
    }).join('');

    /* 标签 */
    document.getElementById('diTags').innerHTML = product.specs.map(function (s) {
      return '<span class="di-tag">' + s + '</span>';
    }).join('');

    /* 参数表格 */
    var specTable = document.getElementById('specTable');
    specTable.innerHTML = product.params.length
      ? product.params.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('')
      : '<tr><td colspan="2" style="text-align:center;color:#aaa;padding:24px;">暂无参数信息</td></tr>';

    /* 应用领域 */
    document.getElementById('appGrid').innerHTML =
      '<p style="color:#aaa;text-align:center;padding:24px;grid-column:1/-1;">暂无应用领域信息</p>';

    /* 相关产品 */
    var relList = product.related.map(function (rid) {
      return mapped.find(function (p) { return String(p.id) === String(rid); });
    }).filter(Boolean);
    var relatedGrid = document.getElementById('relatedGrid');
    relatedGrid.innerHTML = relList.length
      ? relList.map(function (p) {
          return '<div class="rel-card" onclick="location.href=\'product-detail.html?id=' + p.id + '\'">' +
            '<div class="rel-img" style="background:' + p.gradient + ';">' + p.cat + '</div>' +
            '<div class="rel-info">' +
              '<h4>' + p.name + '</h4>' +
              '<p>' + p.specs.slice(0, 2).join(' · ') + '</p>' +
              '<span class="rel-more">查看详情</span>' +
            '</div>' +
          '</div>';
        }).join('')
      : '<p style="color:#aaa;text-align:center;padding:24px;grid-column:1/-1;">暂无相关产品</p>';
  }

  /* 从 API 加载 */
  var id = new URLSearchParams(location.search).get('id');

  fetch('/api/products?status=上架')
    .then(function (r) { return r.json(); })
    .then(function (raw) {
      var mapped  = raw.map(function (p) { return mapProduct(p, raw); });
      var product = mapped.find(function (p) { return String(p.id) === String(id); });
      if (!product) { nameEl.textContent = '产品不存在'; return; }
      renderDetail(product, mapped);
    })
    .catch(function () {
      nameEl.textContent = '⚠️ 无法加载产品，请确认 server.py 正在运行';
    });

  /* 选项卡切换 */
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
})();
