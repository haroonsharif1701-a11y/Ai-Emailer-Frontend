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

  $(document).on("click", ".inbox-item", async function () {
    $(".inbox-item").removeClass("selected");
    $(this).addClass("selected");
    const id = $(this).data("id");
    const e = EMAILS.find(x => x.id === id);

    // Static header/meta renders immediately; only the AI summary block waits on the network.
    $("#inboxDetail").html(`
      <p class="detail-subject">${e.subject}</p>
      <p class="detail-from">From: ${e.name.toLowerCase().replace(" ", ".")}@${e.domain} • ${e.time}</p>
      <div class="ai-summary-box" id="aiSummaryBox">
        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> AI Summary</h4>
        <p><i class="fa-solid fa-spinner fa-spin"></i> Generating summary...</p>
      </div>
      <div class="detail-meta-grid" id="detailMetaGrid">
        <div class="detail-meta-item"><span>Priority</span><strong>—</strong></div>
        <div class="detail-meta-item"><span>Sentiment</span><strong>${e.sentiment}</strong></div>
        <div class="detail-meta-item"><span>Category</span><strong>${e.category}</strong></div>
        <div class="detail-meta-item"><span>Confidence</span><strong>${e.confidence}%</strong></div>
      </div>
      <ul class="action-list" id="actionList"></ul>
    `);

    // Cache on the email object so re-clicking the same email doesn't burn another API call.
    if (!e.aiSummary) {
      try {
        e.aiSummary = await apiFetch("/api/summary/generate", {
          method: "POST",
          body: { sender: e.name, subject: e.subject, emailBody: e.body },
        });
      } catch (err) {
        e.aiSummary = { error: err.message };
      }
    }

    // Bail out silently if the user already clicked a different email while this was in flight.
    if ($(".inbox-item.selected").data("id") !== id) return;

    if (e.aiSummary.error) {
      $("#aiSummaryBox p").html(`Couldn't generate a summary: ${e.aiSummary.error}`);
      return;
    }

    $("#aiSummaryBox p").text(e.aiSummary.summary);
    $("#detailMetaGrid .detail-meta-item").eq(0).find("strong").text(e.aiSummary.priority);
    $("#actionList").html(
      e.aiSummary.actionItems.map(item => `<li><i class="fa-solid fa-circle-check"></i> ${item}</li>`).join("")
    );
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
  // The original email shown in this page is still a hardcoded sample
  // (see .reply-original in index.html) until Module 4 (real mailbox
  // integration) exists. Once emails are real, read the body from the
  // selected thread instead of the static ro-body text below.

  $(".tone-chip").on("click", function () {
    $(".tone-chip").removeClass("active");
    $(this).addClass("active");
  });

  $("#generateReplyBtn").on("click", async function () {
    const tone = $(".tone-chip.active").data("tone");
    const originalEmailBody = $(".ro-body").text().trim();
    const $btn = $(this);

    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Generating...');
    $("#replyOutput").val("");

    try {
      const result = await apiFetch("/api/reply/generate", {
        method: "POST",
        body: { originalEmailBody, tone, senderName: "Rahul" },
      });
      $("#replyOutput").val(result.draft);
    } catch (err) {
      $("#replyOutput").val(`Couldn't generate a reply: ${err.message}`);
    } finally {
      $btn.prop("disabled", false).html('<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Reply');
    }
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
  function attachCardHtml(a) {
    const threatClass = a.threatLevel === "High" ? "badge-red" : a.threatLevel === "Medium" ? "badge-amber" : "badge-green";
    const threatRow = a.threatLevel
      ? `<div class="attach-threat"><span class="badge ${threatClass}">${a.threatLevel} risk</span>${a.threatNotes ? ` <small>${a.threatNotes}</small>` : ""}</div>`
      : "";
    return `
      <div class="attach-card">
        <div class="attach-top">
          <div class="attach-icon badge-${a.color || "blue"}"><i class="fa-solid ${a.icon || "fa-file"}"></i></div>
          <div><strong>${a.name}</strong><span>${a.type}</span></div>
        </div>
        <div class="attach-summary">${a.summary}</div>
        ${threatRow}
      </div>`;
  }

  function renderAttachments() {
    $("#attachGrid").html(ATTACHMENTS.map(attachCardHtml).join(""));
  }

  function iconForExt(ext) {
    if (ext === "pdf") return { icon: "fa-file-pdf", color: "red" };
    if (ext === "docx") return { icon: "fa-file-word", color: "blue" };
    if (ext === "xlsx") return { icon: "fa-file-excel", color: "green" };
    return { icon: "fa-file-image", color: "purple" };
  }

  async function analyzeAndPrependFile(file) {
    const tempId = `pending-${Date.now()}`;
    const { icon, color } = iconForExt(file.name.split(".").pop().toLowerCase());

    $("#attachGrid").prepend(`
      <div class="attach-card" id="${tempId}">
        <div class="attach-top">
          <div class="attach-icon badge-${color}"><i class="fa-solid ${icon}"></i></div>
          <div><strong>${file.name}</strong><span>Analyzing...</span></div>
        </div>
        <div class="attach-summary"><i class="fa-solid fa-spinner fa-spin"></i> Extracting text and running AI analysis...</div>
      </div>
    `);

    try {
      const result = await apiUpload("/api/attachment/analyze", file);
      $(`#${tempId}`).replaceWith(attachCardHtml({
        name: result.fileName, type: result.fileType, icon, color,
        summary: result.summary, threatLevel: result.threatLevel, threatNotes: result.threatNotes,
      }));
    } catch (err) {
      $(`#${tempId} .attach-summary`).html(`Couldn't analyze this file: ${err.message}`);
      $(`#${tempId} span`).text("Failed");
    }
  }

  $("#attachDropzone").on("click", () => $("#attachFileInput").trigger("click"));

  $("#attachFileInput").on("change", function () {
    if (this.files.length) analyzeAndPrependFile(this.files[0]);
    this.value = ""; // allow re-selecting the same file later
  });

  $("#attachDropzone").on("dragover", function (e) {
    e.preventDefault();
    $(this).addClass("dz-active");
  });
  $("#attachDropzone").on("dragleave", function () {
    $(this).removeClass("dz-active");
  });
  $("#attachDropzone").on("drop", function (e) {
    e.preventDefault();
    $(this).removeClass("dz-active");
    const file = e.originalEvent.dataTransfer.files[0];
    if (file) analyzeAndPrependFile(file);
  });

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

  /* ---------------- LOGOUT ---------------- */
  $(".logout").on("click", function () {
    clearToken();
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
