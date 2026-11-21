const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const initials = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const riskBadge = (risk) => {
    if (risk === "Safe") return `<span class="badge badge-green"><i class="fa-solid fa-check"></i> Safe</span>`;
    if (risk === "Medium Risk") return `<span class="badge badge-amber"><i class="fa-solid fa-triangle-exclamation"></i> Medium Risk</span>`;
    return `<span class="badge badge-red"><i class="fa-solid fa-skull-crossbones"></i> High Risk</span>`;
  };

  const catColor = (cat) => {
    const map = { Invoice: "blue", HR: "purple", Support: "green", Sales: "amber", Complaint: "red", Meeting: "blue", Legal: "purple", Finance: "green", Spam: "red" };
    return map[cat] || "gray";
  };

  const escapeHtml = (value) => $("<div>").text(value ?? "").html();
  const safeHttpUrl = (value) => {
    if (!value || typeof value !== "string") return null;
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch {
      return null;
    }
  };
  function updateLoggedInUserUI(profile) {

  if (!profile)
    return;

  const fullName = profile.fullName || "User";
  const roleName = profile.roleName || "";

  $("#loggedInUserName").text(fullName);
  $("#loggedInUserRole").text(roleName);

  $("#dashboardUserName").text(fullName);

  $("#loggedInUserAvatar").text(
    initials(fullName)
  );
}

const pageRoutes = {"dashboard": "index.html", "inbox": "inbox.html", "threat": "threats.html", "classification": "classification.html", "sentiment": "sentiment.html", "reply": "reply.html", "attachments": "attachments.html", "search": "search.html", "organization": "organization.html", "license": "license.html", "settings": "settings.html"};
/* ==========================================================================
   AI Emailer — Theme Toggle (Light / Dark)
   Persists choice in localStorage so it survives a page refresh.
   ========================================================================== */
$(async function () {
  const STORAGE_KEY = "ai-emailer-theme";
  const $root = $(document.documentElement);
  const $icon = $("#themeToggle i");

  function applyIcon(theme) {
    $icon.attr("class", theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon");
    $("#themeToggle").attr("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }

  // Sync icon with whatever the pre-paint script already set
  applyIcon($root.attr("data-theme") || "light");

  $("#themeToggle").on("click", function () {
    const current = $root.attr("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    $root.attr("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    applyIcon(next);
    $(document).trigger("aiemailer:themechange", [next]);
  });
});

// Insert the shared shell synchronously before page ready callbacks run.
const pageName = document.body.dataset.page;
const pageContent = document.querySelector('#content');
if (pageContent) {
  const shell = document.createElement('div');
  shell.className = 'app';
  shell.innerHTML = "<aside aria-label=\"Workspace navigation\" class=\"sidebar\" id=\"appSidebar\">\n<button aria-label=\"Close navigation\" class=\"icon-btn sidebar-close\" id=\"sidebarClose\" type=\"button\"><i aria-hidden=\"true\" class=\"fa-solid fa-xmark\"></i></button>\n<div class=\"brand\">\n<div class=\"brand-icon\"><img src=\"icon/logo.svg\" alt=\"\" width=\"36\" height=\"36\"></div>\n<div class=\"brand-text\">\n<span class=\"brand-name\">AI Emailer</span>\n<span class=\"brand-tag\">Email workspace</span>\n</div>\n</div>\n<nav aria-label=\"Main\" class=\"nav\">\n<a aria-current=\"page\" class=\"nav-item active\" data-page=\"dashboard\" href=\"#\"><i class=\"fa-solid fa-chart-pie\"></i><span>Dashboard</span></a>\n<a class=\"nav-item\" data-page=\"inbox\" href=\"#\"><i class=\"fa-solid fa-inbox\"></i><span>Inbox</span></a>\n<a class=\"nav-item\" data-page=\"threat\" href=\"#\"><i class=\"fa-solid fa-shield-halved\"></i><span>Threat Detection</span></a>\n<a class=\"nav-item\" data-page=\"classification\" href=\"#\"><i class=\"fa-solid fa-tags\"></i><span>Classification</span></a>\n<a class=\"nav-item\" data-page=\"sentiment\" href=\"#\"><i class=\"fa-solid fa-face-smile\"></i><span>Sentiment Analysis</span></a>\n<a class=\"nav-item\" data-page=\"reply\" href=\"#\"><i class=\"fa-solid fa-reply-all\"></i><span>AI Reply Generator</span></a>\n<a class=\"nav-item\" data-page=\"attachments\" href=\"#\"><i class=\"fa-solid fa-paperclip\"></i><span>Attachment Analyzer</span></a>\n<a class=\"nav-item\" data-page=\"search\" href=\"#\"><i class=\"fa-solid fa-magnifying-glass\"></i><span>Smart Search</span></a>\n<a class=\"nav-item\" data-page=\"organization\" href=\"#\"><i class=\"fa-solid fa-building\"></i><span>Organization</span></a>\n<a class=\"nav-item\" data-page=\"license\" href=\"#\"><i class=\"fa-solid fa-key\"></i><span>License</span></a>\n<a class=\"nav-item\" data-page=\"settings\" href=\"#\"><i class=\"fa-solid fa-gear\"></i><span>Settings</span></a>\n</nav>\n<div class=\"sidebar-footer\">\n<a class=\"nav-item logout\" href=\"login.html\"><i class=\"fa-solid fa-arrow-right-from-bracket\"></i><span>Logout</span></a>\n</div>\n</aside><div aria-hidden=\"true\" class=\"sidebar-backdrop\" id=\"sidebarBackdrop\"></div>";
  const main = document.createElement('div');
  main.className = 'main';
  main.innerHTML = "<header class=\"topbar\">\n<button aria-controls=\"appSidebar\" aria-expanded=\"false\" aria-label=\"Open navigation\" class=\"icon-btn menu-toggle\" id=\"menuToggle\" type=\"button\"><i aria-hidden=\"true\" class=\"fa-solid fa-bars\"></i></button>\n<div class=\"search-box\">\n<i class=\"fa-solid fa-magnifying-glass\"></i>\n<input aria-label=\"Search emails\" placeholder=\"Search emails\" type=\"text\"/>\n</div>\n<div class=\"topbar-right\">\n<button aria-label=\"Toggle theme\" class=\"icon-btn\" id=\"themeToggle\" title=\"Toggle theme\"><i class=\"fa-solid fa-moon\"></i></button>\n<button aria-label=\"Notifications\" class=\"icon-btn\"><i class=\"fa-regular fa-bell\"></i><span class=\"dot\"></span></button>\n<button aria-label=\"Messages\" class=\"icon-btn\"><i class=\"fa-regular fa-envelope\"></i></button>\n<div class=\"divider-v\"></div>\n<div class=\"user-chip\">\n<div class=\"avatar\" id=\"loggedInUserAvatar\">--</div>\n<div class=\"user-meta\">\n<span class=\"user-name\" id=\"loggedInUserName\">\n            Loading...\n        </span>\n<span class=\"user-role\" id=\"loggedInUserRole\">\n            Loading...\n        </span>\n</div>\n<i class=\"fa-solid fa-chevron-down\"></i>\n</div>\n</div>\n</header>";
  pageContent.before(shell);
  main.append(pageContent);
  shell.append(main);
  shell.querySelectorAll('[data-page]').forEach(link => {
    link.href = pageRoutes[link.dataset.page];
    link.classList.toggle('active', link.dataset.page === pageName);
    link.removeAttribute('aria-current');
    if (link.dataset.page === pageName) link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('[data-goto]').forEach(link => { link.href = pageRoutes[link.dataset.goto]; });
}
function goTo(page) { if (pageRoutes[page]) window.location.href = pageRoutes[page]; }
  function updateChartTheme() {
    if (!window.Chart) return;
    const styles = getComputedStyle(document.documentElement);
    const color = name => styles.getPropertyValue(name).trim();
    const accent = color("--primary-dark");
    const categories = [accent, color("--chart-2"), color("--chart-3"), color("--chart-4"), color("--chart-5")];
    for (const id of ["activityChart", "categoryChart", "sentimentChart"]) {
      const chart = Chart.getChart(id);
      if (!chart) continue;
      chart.options.color = color("--text-mid");
      if (chart.options.plugins.legend?.labels) chart.options.plugins.legend.labels.color = color("--text-mid");
      for (const axis of Object.values(chart.options.scales || {})) {
        axis.ticks.color = color("--text-muted");
        axis.grid.color = color("--border");
        axis.border.color = color("--border");
      }
      if (id === "activityChart") {
        chart.data.datasets[0].borderColor = accent;
        chart.data.datasets[0].backgroundColor = color("--primary-light");
        chart.data.datasets[1].borderColor = color("--danger");
        chart.data.datasets[1].backgroundColor = color("--danger-bg");
      } else if (id === "categoryChart") {
        chart.data.datasets[0].backgroundColor = categories;
        $("#categoryLegend .dot").each((index, dot) => { dot.style.backgroundColor = categories[index]; });
      } else {
        chart.data.datasets.forEach((dataset, index) => {
          dataset.backgroundColor = [color("--success"), color("--chart-2"), color("--danger")][index];
        });
      }
      chart.options.animation = reducedMotion.matches ? false : { duration: 180 };
      chart.update("none");
    }
  }
  $(document).on("aiemailer:themechange", updateChartTheme);
  reducedMotion.addEventListener("change", updateChartTheme);


$(async function () {
  if (!pageContent) return;
  /* ---------------- NAVIGATION ---------------- */
  const mobileNavigation = window.matchMedia("(max-width: 760px)");

  if (window.Chart && reducedMotion.matches) Chart.defaults.animation = false;
  const samplePages = {
    dashboard: "Dashboard figures and email activity are examples.",
    inbox: "Messages are examples. Summaries are generated from the selected sample email.",
    threat: "Threat scores and messages are examples, not live security monitoring.",
    classification: "Categories and messages are examples.",
    sentiment: "Sentiment scores and charts are examples.",
    reply: "Messages are examples. Reply drafts are generated from the selected sample email.",
    search: "Search runs on sample messages.",
    license: "License details and usage figures are examples."
  };

  function setNavigationOpen(open, restoreFocus = false) {
    open = open && mobileNavigation.matches;
    $(".sidebar").toggleClass("open", open);
    $("#sidebarBackdrop").toggleClass("is-visible", open);
    $("body").toggleClass("nav-open", open);
    $("#menuToggle").attr("aria-expanded", String(open));
    document.querySelector(".main").inert = open;
    document.querySelector(".sidebar").inert = mobileNavigation.matches && !open;
    if (open) $("#sidebarClose").trigger("focus");
    else if (restoreFocus) $("#menuToggle").trigger("focus");
  }
  $("#menuToggle").on("click", () => setNavigationOpen(true));
  $("#sidebarClose, #sidebarBackdrop").on("click", () => setNavigationOpen(false, true));
  mobileNavigation.addEventListener("change", () => {
    const focusWasInSidebar = document.querySelector(".sidebar").contains(document.activeElement);
    setNavigationOpen(false, mobileNavigation.matches && focusWasInSidebar);
  });
  setNavigationOpen(false);

  // Keep keyboard focus inside the active drawer or dialog.
  $(document).on("keydown", function (event) {
    const $surface = $(".attachment-modal.is-open").last().length
      ? $(".attachment-modal.is-open").last() : $(".sidebar.open");
    if (!$surface.length) return;
    if (event.key === "Escape" && $surface.hasClass("sidebar")) {
      setNavigationOpen(false, true);
      return;
    }
    if (event.key !== "Tab") return;
    const $focusable = $surface.find('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]').filter(":visible");
    const first = $focusable[0], last = $focusable[$focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !$surface[0].contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !$surface[0].contains(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  });


  $('#demoNotice').prop('hidden', !samplePages[pageName]);
  $('#demoNoticeText').text(samplePages[pageName] || '');
  if (await appAccess.ready && pageName !== 'settings') {
    apiFetch('/api/user/me').then(updateLoggedInUserUI).catch(() => {
      $('#loggedInUserName').text('Account');
      $('#loggedInUserRole').text('Profile unavailable');
    });
  }
  /* ---------------- LOGOUT ---------------- */
  $(".logout").on("click", async function (event) {
    event.preventDefault();
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Local sign-out still completes if the session has expired or the server is unavailable.
    } finally {
      clearToken();
      window.location.href = "login.html";
    }
  });


});

