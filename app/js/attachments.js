$(async function () {
  if (!await appAccess.ready) return;
  /* ---------------- ATTACHMENT ANALYZER ---------------- */
  let lastModalTrigger = null;

  function attachmentModalHtml(a) {
    const topics = Array.isArray(a.keyTopics) && a.keyTopics.length
      ? `<ul class="attachment-modal__topics">${a.keyTopics.map(topic => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>`
      : '<p class="attachment-modal__empty">No key topics were returned for this analysis.</p>';
    const action = (label, icon, url, mode) => url
      ? `<button class="attachment-modal__action" type="button" data-attachment-file-url="${escapeHtml(url)}" data-attachment-file-name="${escapeHtml(a.name)}" data-attachment-file-mode="${mode}"><i class="fa-solid ${icon}"></i>${label}</button>`
      : `<button class="attachment-modal__action" type="button" disabled title="Available when the attachment is stored"><i class="fa-solid ${icon}"></i>${label}</button>`;
    const deleteAction = a.apiId
      ? `<button class="attachment-modal__action danger" type="button" data-attachment-delete-id="${escapeHtml(String(a.apiId))}" data-attachment-card-id="${escapeHtml(a.id)}"><i class="fa-solid fa-trash"></i>Delete</button>`
      : `<button class="attachment-modal__action danger" type="button" disabled title="Available when the attachment is stored"><i class="fa-solid fa-trash"></i>Delete</button>`;

    return `
      <header class="attachment-modal__header">
        <div class="attachment-modal__file-icon badge-${escapeHtml(a.color || "blue")}"><i class="fa-solid ${escapeHtml(a.icon || "fa-file")}"></i></div>
        <div><h2 id="attachmentModalTitle">${escapeHtml(a.name)}</h2><p>${escapeHtml(a.type || "Attachment")} <span>•</span> ${escapeHtml(a.size || "Size unavailable")}</p></div>
      </header>
      <div class="attachment-modal__actions">${action("Preview", "fa-eye", a.previewUrl, "preview")}${action("Download", "fa-download", a.downloadUrl, "download")}${deleteAction}</div>
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
  /*Attachment Load */
    async function loadAttachmentsFromServer() {
    $("#attachGrid").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading attachments...</p>');
    try {
      const records = await apiFetch("/api/attachment/list");
      ATTACHMENTS.length = 0;
      records.forEach((r) => {
        const { icon, color } = iconForExt((r.fileType || "").toLowerCase());
        ATTACHMENTS.push({
          id: `attachment-${r.id}`,
          apiId: r.id,
          name: r.fileName,
          type: r.fileType,
          icon, color,
          size: r.fileSize,
          uploadedOn: r.analyzedOn ? new Date(r.analyzedOn).toLocaleString() : "Unavailable",
          summary: r.summary,
          description: r.description,
          previewUrl: r.previewUrl,
          downloadUrl: r.downloadUrl,
        });
      });
      $("#attachGrid").html(ATTACHMENTS.length
        ? ATTACHMENTS.map(attachCardHtml).join("")
        : '<p class="attach-preview-placeholder">No attachments analyzed yet — drop a file above to get started.</p>');
    } catch (err) {
      $("#attachGrid").html(`<p class="attach-preview-placeholder">Couldn't load attachments: ${escapeHtml(err.message)}</p>`);
    }
  }
  function iconForExt(ext) {
    if (ext === "pdf") return { icon: "fa-file-pdf", color: "red" };
    if (ext === "docx") return { icon: "fa-file-word", color: "blue" };
    if (ext === "xlsx") return { icon: "fa-file-excel", color: "green" };
    return { icon: "fa-file-image", color: "purple" };
  }

  async function analyzeAndPrependFile(file) {
    if (!appAccess.can("attachments", "add")) return;
    const extension = file.name.split(".").pop().toLowerCase();
    let error = "";
    if (!["pdf", "docx", "xlsx"].includes(extension)) error = "Choose a PDF, DOCX, or XLSX file. Scanned images are not supported.";
    else if (file.size > 10 * 1024 * 1024) error = "This file is larger than 10 MB. Choose a smaller file.";
    else if (!file.size) error = "This file is empty. Choose a document containing text.";
    $("#attachmentStatus").text(error).toggleClass("is-error", Boolean(error));
    if (error) return;
    $("#attachGrid .attach-preview-placeholder").remove();
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
        id: result.id ? `attachment-${result.id}` : `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        apiId: result.id,
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

  $("#attachDropzone").on("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $("#attachFileInput").trigger("click");
    }
  });
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
  $(document).on("click", "[data-attachment-file-url]", async function () {
    const $btn = $(this);
    if ($btn.prop("disabled")) return;

    const path = $btn.data("attachment-file-url");
    const fileName = $btn.data("attachment-file-name") || "download";
    const mode = $btn.data("attachment-file-mode");

    // Open the tab synchronously, inside the click handler, so pop-up
    // blockers don't flag it once we're past the "await" below.
    const previewWindow = mode === "preview" ? window.open("", "_blank") : null;

    const original = $btn.html();
    $btn.prop("disabled", true).html(`<i class="fa-solid fa-spinner fa-spin"></i> ${mode === "preview" ? "Opening..." : "Downloading..."}`);

    try {
      const { blob } = await apiDownload(path);
      const objectUrl = URL.createObjectURL(blob);

      if (mode === "preview") {
        if (previewWindow) previewWindow.location.href = objectUrl;
        else window.open(objectUrl, "_blank", "noopener,noreferrer");
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (err) {
      if (previewWindow) previewWindow.close();
      alert(`Couldn't ${mode === "preview" ? "open" : "download"} the file: ${err.message}`);
    } finally {
      $btn.prop("disabled", false).html(original);
    }
  });
    $(document).on("click", "[data-attachment-delete-id]", async function () {
    const $btn = $(this);
    if ($btn.prop("disabled")) return;

    const apiId = $btn.data("attachment-delete-id");
    const cardId = $btn.data("attachment-card-id");
    const attachment = ATTACHMENTS.find(item => item.id === cardId);
    const name = attachment?.name || "this attachment";

    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;

    const original = $btn.html();
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Deleting...');

    try {
      await apiFetch(`/api/attachment/${apiId}`, { method: "DELETE" });

      const idx = ATTACHMENTS.findIndex(item => item.id === cardId);
      if (idx !== -1) ATTACHMENTS.splice(idx, 1);

      closeAttachmentModal();
      $(`.attach-card[data-attachment-id="${cardId}"]`).remove();

      if (!ATTACHMENTS.length) {
        $("#attachGrid").html('<p class="attach-preview-placeholder">No attachments analyzed yet — drop a file above to get started.</p>');
      }
    } catch (err) {
      alert(`Couldn't delete this attachment: ${err.message}`);
      $btn.prop("disabled", false).html(original);
    }
  });

loadAttachmentsFromServer();
});
