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
    // Load profile whenever Settings page is opened
    if (page === "settings") {
        loadProfile();
    }
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
  /* LOGGED IN USER UI UPDATE */
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
  let selectedReplyEmail = null;

  function renderReplyInbox() {
    $("#replyInboxItems").html(EMAILS.map(e => `
      <button class="reply-inbox-item${selectedReplyEmail?.id === e.id ? " selected" : ""}" type="button" data-reply-email-id="${e.id}">
        <div class="mini-avatar">${escapeHtml(initials(e.name))}</div>
        <div class="reply-inbox-item-body">
          <div class="reply-inbox-item-top"><strong>${escapeHtml(e.name)}</strong><span>${escapeHtml(e.time)}</span></div>
          <div class="reply-inbox-item-subj">${escapeHtml(e.subject)}</div>
          <div class="reply-inbox-item-preview">${escapeHtml(e.preview)}</div>
          <div class="inbox-item-tags"><span class="badge badge-${catColor(e.category)}">${escapeHtml(e.category)}</span>${e.risk !== "Safe" ? riskBadge(e.risk) : ""}</div>
        </div>
      </button>`).join(""));
  }

  function showReplyComposer(email) {
    const isDifferentEmail = selectedReplyEmail?.id !== email.id;
    selectedReplyEmail = email;
    $("#replyOriginal").html(`
      <p class="ro-subject">${escapeHtml(email.subject)}</p>
      <p class="ro-from">From: ${escapeHtml(email.name)} <span>•</span> ${escapeHtml(email.domain)}</p>
      <p class="ro-body">${escapeHtml(email.body)}</p>`);
    if (isDifferentEmail) $("#replyOutput").val('Click "Generate Reply" to draft a response...');
    $("#replyInboxCard").attr("hidden", true);
    $("#replyComposeCard").removeAttr("hidden");
  }

  $(document).on("click", ".reply-inbox-item", function () {
    const email = EMAILS.find(item => item.id === $(this).data("reply-email-id"));
    if (email) showReplyComposer(email);
  });

  $("#replyBackBtn").on("click", function () {
    $("#replyComposeCard").attr("hidden", true);
    $("#replyInboxCard").removeAttr("hidden");
    renderReplyInbox();
    const $focusTarget = $("#replyInboxItems .reply-inbox-item.selected").first().length
      ? $("#replyInboxItems .reply-inbox-item.selected").first()
      : $("#replyInboxItems .reply-inbox-item").first();
    $focusTarget.trigger("focus");
  });

  $(".tone-chip").on("click", function () {
    $(".tone-chip").removeClass("active");
    $(this).addClass("active");
  });

  $("#generateReplyBtn").on("click", async function () {
    const tone = $(".tone-chip.active").data("tone");
    if (!selectedReplyEmail) return;
    const originalEmailBody = selectedReplyEmail.body;
    const $btn = $(this);

    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Generating...');
    $("#replyOutput").val("");

    try {
      const result = await apiFetch("/api/reply/generate", {
        method: "POST",
        body: { originalEmailBody, tone, senderName: selectedReplyEmail.name },
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
  let lastModalTrigger = null;

  function attachmentModalHtml(a) {
    const topics = Array.isArray(a.keyTopics) && a.keyTopics.length
      ? `<ul class="attachment-modal__topics">${a.keyTopics.map(topic => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>`
      : '<p class="attachment-modal__empty">No key topics were returned for this analysis.</p>';
    const action = (label, icon, url) => safeHttpUrl(url)
      ? `<a class="attachment-modal__action" href="${escapeHtml(safeHttpUrl(url))}" target="_blank" rel="noopener noreferrer"><i class="fa-solid ${icon}"></i>${label}</a>`
      : `<button class="attachment-modal__action" type="button" disabled title="Available when the attachment is stored"><i class="fa-solid ${icon}"></i>${label}</button>`;

    return `
      <header class="attachment-modal__header">
        <div class="attachment-modal__file-icon badge-${escapeHtml(a.color || "blue")}"><i class="fa-solid ${escapeHtml(a.icon || "fa-file")}"></i></div>
        <div><h2 id="attachmentModalTitle">${escapeHtml(a.name)}</h2><p>${escapeHtml(a.type || "Attachment")} <span>•</span> ${escapeHtml(a.size || "Size unavailable")}</p></div>
      </header>
      <div class="attachment-modal__actions">${action("Preview", "fa-eye", a.previewUrl)}${action("Download", "fa-download", a.downloadUrl)}</div>
      <div class="attachment-modal__body">
        <section class="attachment-modal__summary"><h3><i class="fa-solid fa-file-lines"></i> Attachment Summary</h3><div class="attachment-modal__summary-copy"><p>${escapeHtml(a.summary || "Analysis summary is unavailable.")}</p></div></section>
        <aside class="attachment-modal__info"><h3>File Information</h3><dl>
          <div><dt><i class="fa-solid fa-file"></i> File Name</dt><dd>${escapeHtml(a.name)}</dd></div>
          <div><dt><i class="fa-solid fa-file-lines"></i> File Type</dt><dd>${escapeHtml(a.type || "Unavailable")}</dd></div>
          <div><dt><i class="fa-regular fa-hard-drive"></i> File Size</dt><dd>${escapeHtml(a.size || "Unavailable")}</dd></div>
          <div><dt><i class="fa-regular fa-calendar"></i> Analyzed On</dt><dd>${escapeHtml(a.uploadedOn || "Unavailable")}</dd></div>
        </dl><div class="attachment-modal__description"><h4><i class="fa-regular fa-note-sticky"></i> Description</h4><p>${escapeHtml(a.description || "No description was returned.")}</p></div></aside>
      </div>`;
  }

  function openAttachmentModal(attachment, trigger) {
    lastModalTrigger = trigger;
    $("#attachmentModalContent").html(attachmentModalHtml(attachment));
    $("#attachmentModal").attr("aria-hidden", "false").addClass("is-open");
    $("body").addClass("modal-open");
    $("#attachmentModal .attachment-modal__close").trigger("focus");
  }

  function closeAttachmentModal() {
    $("#attachmentModal").attr("aria-hidden", "true").removeClass("is-open");
    $("body").removeClass("modal-open");
    if (lastModalTrigger) $(lastModalTrigger).trigger("focus");
  }

  function attachCardHtml(a) {
    const threatClass = a.threatLevel === "High" ? "badge-red" : a.threatLevel === "Medium" ? "badge-amber" : "badge-green";
    const threatRow = a.threatLevel
      ? `<div class="attach-threat"><span class="badge ${threatClass}">${escapeHtml(a.threatLevel)} risk</span>${a.threatNotes ? ` <small>${escapeHtml(a.threatNotes)}</small>` : ""}</div>`
      : "";
    return `
      <button class="attach-card" type="button" data-attachment-id="${escapeHtml(a.id)}" aria-label="View analysis for ${escapeHtml(a.name)}">
        <div class="attach-top">
          <div class="attach-icon badge-${escapeHtml(a.color || "blue")}"><i class="fa-solid ${escapeHtml(a.icon || "fa-file")}"></i></div>
          <div><strong>${escapeHtml(a.name)}</strong><span>${escapeHtml(a.type)}</span></div>
        </div>
        <div class="attach-summary" data-tooltip="${escapeHtml(a.summary)}"><span class="attach-summary__text">${escapeHtml(a.summary)}</span></div>
        ${threatRow}
      </button>`;
  }

  function renderAttachments() {
    enrichAttachments();
    ATTACHMENTS.forEach((attachment, index) => {
      attachment.id ||= `attachment-${index}`;
    });
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
          <div><strong>${escapeHtml(file.name)}</strong><span>Analyzing...</span></div>
        </div>
        <div class="attach-summary"><i class="fa-solid fa-spinner fa-spin"></i> Extracting text and running AI analysis...</div>
      </div>
    `);

    try {
      const result = await apiUpload("/api/attachment/analyze", file);
      const attachment = {
        id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: result.fileName || file.name, type: result.fileType || file.type || "Attachment", icon, color,
        size: result.fileSize || `${Math.ceil(file.size / 1024)} KB`, uploadedOn: result.analyzedOn || new Date().toLocaleString(),
        summary: result.summary, description: result.description, keyTopics: result.keyTopics,
        previewUrl: result.previewUrl, downloadUrl: result.downloadUrl,
        threatLevel: result.threatLevel, threatNotes: result.threatNotes,
      };
      ATTACHMENTS.unshift(attachment);
      $(`#${tempId}`).replaceWith(attachCardHtml(attachment));
    } catch (err) {
      $(`#${tempId} .attach-summary`).text(`Couldn't analyze this file: ${err.message}`);
      $(`#${tempId} span`).text("Failed");
    }
  }

  // $("#attachDropzone").on("click", () => $("#attachFileInput").trigger("click"));
  $("#attachDropzone").on("click", function (e) {
  if (e.target.id !== "attachFileInput") {
    $("#attachFileInput").trigger("click");
  }
});
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

  $(document).on("click", ".attach-card", function () {
    const attachment = ATTACHMENTS.find(item => item.id === $(this).data("attachment-id"));
    if (attachment) openAttachmentModal(attachment, this);
  });
  $(document).on("click", "[data-close-attachment-modal]", closeAttachmentModal);
  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && $("#attachmentModal").hasClass("is-open")) closeAttachmentModal();
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

  /* ---------------- USERS (Settings tab) ---------------- */
  let rolesCache = null; // fetched once, reused for both the list's role names and the form's dropdown

  async function getRoles() {
    if (rolesCache) return rolesCache;
    rolesCache = await apiFetch("/api/role/list");
    return rolesCache;
  }

  async function renderUsers() {
    $("#userList").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading users...</p>');
    try {
      const users = await apiFetch("/api/user/list");
      if (!users.length) {
        $("#userList").html('<p class="attach-preview-placeholder">No users yet — add one to get started.</p>');
        return;
      }
      $("#userList").html(users.map(u => `
        <button class="reply-inbox-item user-list-item" type="button" data-user-id="${u.idUser}">
          <div class="mini-avatar">${escapeHtml(initials(u.fullName))}</div>
          <div class="reply-inbox-item-body">
            <div class="reply-inbox-item-top"><strong>${escapeHtml(u.fullName)}</strong>${u.isActive ? "" : '<span class="badge badge-amber">Inactive</span>'}</div>
            <span class="reply-inbox-item-preview">${escapeHtml(u.username)}</span>
          </div>
        </button>`).join(""));
    } catch (err) {
      $("#userList").html(`<p class="attach-preview-placeholder">Couldn't load users: ${escapeHtml(err.message)}</p>`);
    }
  }

  async function populateRoleDropdown(selectedId) {
    const roles = await getRoles();
    $("#userFormRole").html(roles.map(r =>
      `<option value="${r.idRole}" ${r.idRole === selectedId ? "selected" : ""}>${escapeHtml(r.roleName)}</option>`
    ).join(""));
  }

  async function openUserModal(mode, user) {
    $("#userFormError").text("");
    $("#userModalForm")[0].reset();
    $("#userModalForm").data("mode", mode).attr("data-id-user", user ? user.idUser : 0);

    if (mode === "add") {
      $("#userModalTitle").text("Add User");
      $("#userFormPasswordLabel").html('Password<input type="password" id="userFormPassword" autocomplete="new-password" required>');
      await populateRoleDropdown(null);
    } else {
      $("#userModalTitle").text("Edit User");
      $("#userFormFullName").val(user.fullName);
      $("#userFormUsername").val(user.username);
      // Password left blank on edit — the backend keeps the existing hash
      // unless something is actually typed here.
      $("#userFormPasswordLabel").html('Password<input type="password" id="userFormPassword" autocomplete="new-password" placeholder="Leave blank to keep the current password">');
      await populateRoleDropdown(user.idRole);
    }

    $("#userModal").attr("aria-hidden", "false").addClass("is-open");
    $("body").addClass("modal-open");
  }

  
  function closeUserModal() {
    $("#userModal").attr("aria-hidden", "true").removeClass("is-open");
    $("body").removeClass("modal-open");
  }

  $("#addUserBtn").on("click", () => openUserModal("add", null));

  $(document).on("click", ".user-list-item", async function () {
    const idUser = $(this).data("user-id");
    try {
      const user = await apiFetch(`/api/user/${idUser}`);
      openUserModal("edit", user);
    } catch (err) {
      alert(`Couldn't load this user: ${err.message}`);
    }
  });

  $(document).on("click", "[data-close-user-modal]", closeUserModal);
  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && $("#userModal").hasClass("is-open")) closeUserModal();
  });

  $("#userModalForm").on("submit", async function (e) {
    e.preventDefault();
    const mode = $(this).data("mode");
    const idUser = parseInt($(this).attr("data-id-user"), 10) || 0;
    const password = $("#userFormPassword").val();

    if (mode === "add" && !password) {
      $("#userFormError").text("Password is required for a new user.");
      return;
    }

    const $btn = $("#userFormSaveBtn");
    $btn.prop("disabled", true).text("Saving...");

    try {
      await apiFetch("/api/user/addupd", {
        method: "POST",
        body: {
          idUser,
          username: $("#userFormUsername").val().trim(),
          fullName: $("#userFormFullName").val().trim(),
          password: password || null,
          idRole: parseInt($("#userFormRole").val(), 10),
        },
      });
      closeUserModal();
      renderUsers(); // re-fetch rather than patch the DOM in place — simplest way to stay correct after add or edit
    } catch (err) {
      $("#userFormError").text(err.message);
    } finally {
      $btn.prop("disabled", false).text("Save");
    }
  });

  /* ---------------- SETTINGS TABS ---------------- */
  $("#settingsTabs .tab").on("click", function () {
    const tab = $(this).data("tab");
    $("#settingsTabs .tab").removeClass("active");
    $(this).addClass("active");
    $(".settings-tab").removeClass("active");
    $(`#tab-${tab}`).addClass("active");
    
    
    if (tab === "users") renderUsers();
  });
 
     /* ---------------- LOGOUT ---------------- */
  // $(".logout").on("click", function () {
  //   clearToken();
  // });
  $(".logout").on("click", function () {
    logout();
  });
  
  /* ---------------- MOBILE SIDEBAR TOGGLE (safety net if narrow) ---------------- */
  $(document).on("click", ".search-box input", function () {
    $(".sidebar").removeClass("open");
  });

  /* ---------------- INIT ---------------- */
  renderRecentEmails();
  renderDashboardCharts();
  renderInbox();
  renderReplyInbox();
  renderThreat();
  renderClassification();
  renderSentiment();
  renderAttachments();
  renderOrganization();
  renderLicense();
//  loadProfile();
  /* ---------------- PROFILE ---------------- */

let currentProfile = null;

async function loadProfile() {
  const $error = $("#profileError");

  $error.text("");

  try {
    const profile = await apiFetch("/api/user/me");

    currentProfile = profile;

    $("#profileFullName").val(profile.fullName ?? "");
    $("#profileUsername").val(profile.username ?? "");
    $("#profileRole").val(profile.roleName ?? "");
    $("#profileOrganization").val(profile.orgName ?? "");

    updateLoggedInUserUI(profile);

  } catch (err) {
    console.error("Failed to load profile:", err);
    $error.text(`Couldn't load your profile: ${err.message}`);
  }
}
$("#saveProfileBtn").on("click", async function () {

  if (!currentProfile)
    return;

  const $btn = $(this);
  const $error = $("#profileError");

  $error.text("");

  const fullName = $("#profileFullName").val().trim();
  const username = $("#profileUsername").val().trim();

  if (!fullName || !username) {
    $error.text("Full name and email are required.");
    return;
  }

  const originalText = $btn.text();

  try {

    $btn
      .prop("disabled", true)
      .text("Saving...");

    await apiFetch("/api/user/addupd", {
      method: "POST",
      body: {
        idUser: currentProfile.idUser,
        username: username,
        fullName: fullName,
        password: null,
        idRole: currentProfile.idRole
      }
    });

    /*
     * Reload from backend rather than modifying currentProfile
     * manually. This guarantees the UI reflects the database.
     */
    await loadProfile();

    $btn.text("Saved");

    setTimeout(() => {
      $btn.text(originalText);
    }, 1500);

  } catch (err) {

    console.error("Failed to save profile:", err);

    $error.text(
      `Couldn't save your profile: ${err.message}`
    );

  } finally {

    $btn.prop("disabled", false);
  }
});

});
