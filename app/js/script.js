/* ==========================================================================
   AI Emailer — App Logic (jQuery)
   ========================================================================== */
$(function () {

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

  /* ---------------- NAVIGATION ---------------- */
  function goTo(page) {
    $(".nav-item[data-page]").removeClass("active");
    $(`.nav-item[data-page="${page}"]`).addClass("active");
    $(".page").removeClass("active");
    $(`#page-${page}`).addClass("active");
    $(".sidebar").removeClass("open");
    $("#content").scrollTop(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $(".nav-item[data-page]").on("click", function (e) {
    e.preventDefault();
    goTo($(this).data("page"));
  });

  $(document).on("click", "[data-goto]", function (e) {
    e.preventDefault();
    goTo($(this).data("goto"));
  });

  /* ---------------- DASHBOARD: Recent Emails table ---------------- */
  function renderRecentEmails() {
    const rows = EMAILS.slice(0, 6).map(e => `
      <tr>
        <td><div class="sender-cell">
          <div class="mini-avatar">${initials(e.name)}</div>
          <div><strong>${e.name}</strong><span>${e.domain}</span></div>
        </div></td>
        <td>${e.subject}</td>
        <td><span class="badge badge-${catColor(e.category)}">${e.category}</span></td>
        <td>${riskBadge(e.risk)}</td>
        <td>${e.time}</td>
      </tr>`).join("");
    $("#recentEmailsBody").html(rows);
  }

  /* ---------------- DASHBOARD: Charts ---------------- */
  function renderDashboardCharts() {
    const ctx1 = document.getElementById("activityChart");
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          { label: "Incoming", data: [1200, 1900, 1700, 2100, 2400, 1400, 1100], borderColor: "#5B4FE9", backgroundColor: "rgba(91,79,233,.1)", fill: true, tension: .4, pointRadius: 0 },
          { label: "Threats", data: [40, 55, 38, 62, 70, 30, 25], borderColor: "#EF4444", backgroundColor: "rgba(239,68,68,.08)", fill: true, tension: .4, pointRadius: 0 },
        ],
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { boxWidth: 8, usePointStyle: true, font: { size: 11 } } } },
        scales: { y: { grid: { color: "#F0F0F5" } }, x: { grid: { display: false } } },
      },
    });

    const catData = [
      { label: "Support", value: 32, color: "#1FAE5B" },
      { label: "Sales", value: 22, color: "#F5A524" },
      { label: "Invoice", value: 18, color: "#3B82F6" },
      { label: "Spam", value: 15, color: "#EF4444" },
      { label: "Other", value: 13, color: "#8B5CF6" },
    ];
    const ctx2 = document.getElementById("categoryChart");
    new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: catData.map(d => d.label),
        datasets: [{ data: catData.map(d => d.value), backgroundColor: catData.map(d => d.color), borderWidth: 0 }],
      },
      options: { cutout: "72%", plugins: { legend: { display: false } } },
    });
    $("#categoryLegend").html(catData.map(d => `
      <li><span class="lg-left"><span class="dot" style="background:${d.color}"></span>${d.label}</span><strong>${d.value}%</strong></li>
    `).join(""));
  }

  /* ---------------- INBOX ---------------- */
  function renderInbox(filter = "all") {
    let list = EMAILS;
    if (filter === "unread") list = EMAILS.filter(e => e.id % 2 === 0);
    if (filter === "flagged") list = EMAILS.filter(e => e.risk !== "Safe");

    $("#inboxItems").html(list.map(e => `
      <div class="inbox-item" data-id="${e.id}">
        <div class="mini-avatar">${initials(e.name)}</div>
        <div class="inbox-item-body">
          <div class="inbox-item-top"><strong>${e.name}</strong><span>${e.time}</span></div>
          <div class="inbox-item-subj">${e.subject}</div>
          <div class="inbox-item-preview">${e.preview}</div>
          <div class="inbox-item-tags">
            <span class="badge badge-${catColor(e.category)}">${e.category}</span>
            ${e.risk !== "Safe" ? riskBadge(e.risk) : ""}
          </div>
        </div>
      </div>`).join(""));
  }

  $(document).on("click", "#inboxTabs .tab", function () {
    $("#inboxTabs .tab").removeClass("active");
    $(this).addClass("active");
    renderInbox($(this).data("filter"));
  });

  $(document).on("click", ".inbox-item", function () {
    $(".inbox-item").removeClass("selected");
    $(this).addClass("selected");
    const id = $(this).data("id");
    const e = EMAILS.find(x => x.id === id);
    $("#inboxDetail").html(`
      <p class="detail-subject">${e.subject}</p>
      <p class="detail-from">From: ${e.name.toLowerCase().replace(" ", ".")}@${e.domain} • ${e.time}</p>
      <div class="ai-summary-box">
        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> AI Summary</h4>
        <p>${e.preview} The AI has classified this as <strong>${e.category}</strong> with a <strong>${e.sentiment.toLowerCase()}</strong> tone and flagged it as <strong>${e.risk}</strong>.</p>
      </div>
      <div class="detail-meta-grid">
        <div class="detail-meta-item"><span>Priority</span><strong>${e.risk === "Safe" ? "Normal" : "High"}</strong></div>
        <div class="detail-meta-item"><span>Sentiment</span><strong>${e.sentiment}</strong></div>
        <div class="detail-meta-item"><span>Category</span><strong>${e.category}</strong></div>
        <div class="detail-meta-item"><span>Confidence</span><strong>${e.confidence}%</strong></div>
      </div>
      <ul class="action-list">
        <li><i class="fa-solid fa-circle-check"></i> Reply expected by end of day</li>
        <li><i class="fa-solid fa-circle-check"></i> No meeting time detected</li>
        <li><i class="fa-solid fa-circle-check"></i> ${e.risk === "Safe" ? "No threats found" : "Review before opening links/attachments"}</li>
      </ul>
    `);
  });

  /* ---------------- THREAT DETECTION ---------------- */
  function renderThreat() {
    $("#threatBody").html(EMAILS.map(e => `
      <tr>
        <td><div class="sender-cell"><div class="mini-avatar">${initials(e.name)}</div><div><strong>${e.name}</strong><span>${e.domain}</span></div></div></td>
        <td>${e.spf ? '<i class="fa-solid fa-circle-check" style="color:var(--success)"></i>' : '<i class="fa-solid fa-circle-xmark" style="color:var(--danger)"></i>'}</td>
        <td>${e.dkim ? '<i class="fa-solid fa-circle-check" style="color:var(--success)"></i>' : '<i class="fa-solid fa-circle-xmark" style="color:var(--danger)"></i>'}</td>
        <td>${e.dmarc ? '<i class="fa-solid fa-circle-check" style="color:var(--success)"></i>' : '<i class="fa-solid fa-circle-xmark" style="color:var(--danger)"></i>'}</td>
        <td>${riskBadge(e.risk)}</td>
        <td>${e.confidence}%</td>
      </tr>`).join(""));
  }

  /* ---------------- CLASSIFICATION ---------------- */
  function renderClassification() {
    $("#categoryGrid").html(CATEGORIES.map(c => `
      <div class="category-card">
        <div class="cat-icon badge-${c.color}" style="width:38px;height:38px;"><i class="fa-solid ${c.icon}"></i></div>
        <strong>${c.name}</strong>
        <span>${c.count.toLocaleString()} emails</span>
      </div>`).join(""));

    $("#classificationBody").html(EMAILS.map(e => `
      <tr>
        <td><div class="sender-cell"><div class="mini-avatar">${initials(e.name)}</div><div><strong>${e.name}</strong><span>${e.domain}</span></div></div></td>
        <td>${e.subject}</td>
        <td><span class="badge badge-${catColor(e.category)}">${e.category}</span></td>
        <td>${e.confidence}%</td>
      </tr>`).join(""));
  }

  /* ---------------- SENTIMENT ---------------- */
  function renderSentiment() {
    $("#sentimentStats").html(SENTIMENTS.map(s => `
      <div class="stat-card">
        <div class="stat-icon ${s.color}"><i class="fa-solid ${s.icon}"></i></div>
        <div class="stat-info"><span class="stat-label">${s.label}</span><span class="stat-value">${s.value}</span></div>
      </div>`).join(""));

    $("#sentimentBody").html(EMAILS.slice(0, 6).map(e => `
      <tr>
        <td><div class="sender-cell"><div class="mini-avatar">${initials(e.name)}</div><div><strong>${e.name}</strong><span>${e.domain}</span></div></div></td>
        <td><span class="badge badge-gray">${e.sentiment}</span></td>
      </tr>`).join(""));

    new Chart(document.getElementById("sentimentChart"), {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          { label: "Positive", data: [40, 45, 38, 50, 55, 30, 28], backgroundColor: "#1FAE5B" },
          { label: "Neutral", data: [30, 28, 35, 25, 22, 20, 18], backgroundColor: "#3B82F6" },
          { label: "Negative", data: [8, 10, 6, 12, 9, 5, 4], backgroundColor: "#EF4444" },
        ],
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { boxWidth: 8, usePointStyle: true, font: { size: 11 } } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: "#F0F0F5" } } },
      },
    });
  }

  /* ---------------- AI REPLY GENERATOR ---------------- */
  const REPLY_TEMPLATES = {
    Professional: "Hi Rahul,\n\nThanks for the follow-up. I've reviewed the pricing sheet and everything looks aligned with our earlier discussion. I'll have the signed copy sent over by Thursday, ahead of your Friday deadline.\n\nHappy to jump on a quick call if it helps close this out faster.\n\nBest regards,\nAditi",
    Friendly: "Hey Rahul!\n\nThanks so much for checking in :) I've gone through the pricing sheet and it looks good on our end. I'll get the signed copy to you by Thursday, so you're covered before Friday.\n\nLet me know if a quick call would help — happy to hop on one!\n\nCheers,\nAditi",
    Formal: "Dear Mr. Mehta,\n\nThank you for your correspondence regarding the Q3 vendor contract renewal. Please be advised that the pricing sheet has been reviewed and confirmed. The signed agreement will be forwarded to you by Thursday, prior to the stated deadline.\n\nShould a discussion be required, I remain available at your convenience.\n\nSincerely,\nAditi Kapoor",
    Custom: "Hi Rahul,\n\n[Add your custom opening here]\n\nRegarding the pricing sheet and signed copy — confirming both will be ready ahead of Friday. Let me know your preferred next step.\n\nRegards,\nAditi",
  };

  $(".tone-chip").on("click", function () {
    $(".tone-chip").removeClass("active");
    $(this).addClass("active");
  });

  $("#generateReplyBtn").on("click", function () {
    const tone = $(".tone-chip.active").data("tone");
    const $btn = $(this);
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Generating...');
    setTimeout(() => {
      $("#replyOutput").val(REPLY_TEMPLATES[tone]);
      $btn.prop("disabled", false).html('<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Reply');
    }, 700);
  });

  $("#copyReplyBtn").on("click", function () {
    const text = $("#replyOutput").val();
    navigator.clipboard?.writeText(text);
    const $btn = $(this);
    const original = $btn.html();
    $btn.html('<i class="fa-solid fa-check"></i> Copied');
    setTimeout(() => $btn.html(original), 1500);
  });

  /* ---------------- ATTACHMENT ANALYZER ---------------- */
  function renderAttachments() {
    $("#attachGrid").html(ATTACHMENTS.map(a => `
      <div class="attach-card">
        <div class="attach-top">
          <div class="attach-icon badge-${a.color}"><i class="fa-solid ${a.icon}"></i></div>
          <div><strong>${a.name}</strong><span>${a.type}</span></div>
        </div>
        <div class="attach-summary">${a.summary}</div>
      </div>`).join(""));
  }

  /* ---------------- SMART SEARCH ---------------- */
  function runSmartSearch(query) {
    if (!query) return;
    const q = query.toLowerCase();
    let results;
    if (q.includes("invoice")) results = EMAILS.filter(e => e.category === "Invoice");
    else if (q.includes("resignation")) results = EMAILS.filter(e => e.subject.toLowerCase().includes("resignation"));
    else if (q.includes("priority") || q.includes("reply")) results = EMAILS.filter(e => e.risk !== "Safe" || e.category === "Complaint");
    else results = EMAILS.filter(e => e.subject.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));

    $("#searchResultsCard").show();
    $("#searchResultsBody").html(
      results.length
        ? results.map(e => `
          <tr>
            <td><div class="sender-cell"><div class="mini-avatar">${initials(e.name)}</div><div><strong>${e.name}</strong><span>${e.domain}</span></div></div></td>
            <td>${e.subject}</td>
            <td><span class="badge badge-${catColor(e.category)}">${e.category}</span></td>
            <td>${e.time}</td>
          </tr>`).join("")
        : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">No matching emails found. Try rephrasing your question.</td></tr>`
    );
  }

  $("#smartSearchBtn").on("click", () => runSmartSearch($("#smartSearchInput").val()));
  $("#smartSearchInput").on("keydown", function (e) { if (e.key === "Enter") runSmartSearch($(this).val()); });
  $(".query-chip").on("click", function () {
    const q = $(this).text();
    $("#smartSearchInput").val(q);
    runSmartSearch(q);
  });

  /* ---------------- ORGANIZATION ---------------- */
  function renderOrganization() {
    $("#orgGrid").html(ORG_STATS.map(s => `
      <div class="org-card"><i class="fa-solid ${s.icon}"></i><strong>${s.value}</strong><span>${s.label}</span></div>
    `).join(""));
    $("#orgBody").html(MEMBERS.map(m => `
      <tr>
        <td><div class="sender-cell"><div class="mini-avatar">${initials(m.name)}</div><div><strong>${m.name}</strong></div></div></td>
        <td>${m.dept}</td>
        <td>${m.role}</td>
        <td>${m.status === "Active" ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-amber">Invited</span>'}</td>
      </tr>`).join(""));
  }

  /* ---------------- LICENSE ---------------- */
  function renderLicense() {
    const statusBadge = (s) => s === "Active" ? '<span class="badge badge-green">Active</span>' : s === "Expired" ? '<span class="badge badge-red">Expired</span>' : '<span class="badge badge-amber">Suspended</span>';
    $("#licenseBody").html(LICENSES.map(l => `
      <tr>
        <td style="font-family:monospace;">${l.key}</td>
        <td>${l.type}</td>
        <td>${statusBadge(l.status)}</td>
        <td>
          ${l.status === "Active" ? '<button class="btn btn-outline small">Suspend</button>' : '<button class="btn btn-outline small">Reactivate</button>'}
        </td>
      </tr>`).join(""));
  }

  /* ---------------- SETTINGS TABS ---------------- */
  $("#settingsTabs .tab").on("click", function () {
    const tab = $(this).data("tab");
    $("#settingsTabs .tab").removeClass("active");
    $(this).addClass("active");
    $(".settings-tab").removeClass("active");
    $(`#tab-${tab}`).addClass("active");
  });

  /* ---------------- MOBILE SIDEBAR TOGGLE (safety net if narrow) ---------------- */
  $(document).on("click", ".search-box input", function () {
    $(".sidebar").removeClass("open");
  });

  /* ---------------- INIT ---------------- */
  renderRecentEmails();
  renderDashboardCharts();
  renderInbox();
  renderThreat();
  renderClassification();
  renderSentiment();
  renderAttachments();
  renderOrganization();
  renderLicense();
});
