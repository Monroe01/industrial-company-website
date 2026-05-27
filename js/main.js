(function () {

  /* ── 数字滚动动画 ── */
  function animateCount(el, end, duration) {
    var start = 0;
    var inc   = end / (duration / (1000 / 60));
    var timer = setInterval(function () {
      start += inc;
      if (start >= end) { start = end; clearInterval(timer); }
      el.textContent = Math.floor(start).toLocaleString();
    }, duration / 60);
  }

  var counted = false;
  function checkCount() {
    if (counted) return;
    var stats = document.querySelector('.hero-stats');
    if (!stats) return;
    if (stats.getBoundingClientRect().top < window.innerHeight) {
      counted = true;
      document.querySelectorAll('.hero-stats [data-end]').forEach(function (wrap) {
        animateCount(wrap.querySelector('.count'), parseInt(wrap.getAttribute('data-end'), 10), 1200);
      });
    }
  }
  window.addEventListener('scroll', checkCount);
  checkCount();

  /* ── 解决方案选项卡 ── */
  document.querySelectorAll('.sol-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.sol-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.sol-panels > div').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.getElementById(tab.getAttribute('data-panel'));
      if (panel) panel.classList.add('active');
    });
  });

  /* ── 回到顶部 ── */
  var topBtn = document.getElementById('backTop');
  window.addEventListener('scroll', function () {
    if (topBtn) topBtn.classList.toggle('show', window.scrollY > 600);
  });
  if (topBtn) {
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 平滑锚点跳转 ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 50, behavior: 'smooth' });
      }
    });
  });

})();
