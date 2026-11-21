$(async function () {
  if (!await appAccess.ready) return;
  /* ---------------- AI REPLY GENERATOR ---------------- */
  let selectedReplyEmail = null;
  let replyRequestId = 0;

  function setReplyStatus(message, isError = false) {
    $("#replyStatus").text(message).toggleClass("is-error", isError);
  }

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
    if (isDifferentEmail) {
      replyRequestId++;
      $("#replyOutput").val("").attr("aria-busy", "false");
      $("#copyReplyBtn").prop("disabled", true);
      $("#generateReplyBtn").prop("disabled", false).html('<i class="fa-solid fa-pen-to-square"></i> Generate reply');
      setReplyStatus("");
    }
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
    if (!selectedReplyEmail) return;
    const email = selectedReplyEmail;
    const requestId = ++replyRequestId;
    const tone = $(".tone-chip.active").data("tone");
    const $btn = $(this);
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Generating...');
    $("#replyOutput").attr("aria-busy", "true");
    $("#copyReplyBtn").prop("disabled", true);
    setReplyStatus("Generating a reply...");
    try {
      const result = await apiFetch("/api/reply/generate", {
        method: "POST",
        body: { originalEmailBody: email.body, tone, senderName: email.name },
      });
      if (requestId !== replyRequestId) return;
      if (typeof result?.draft !== "string" || !result.draft.trim()) throw new Error("The server returned an empty draft. Try again.");
      $("#replyOutput").val(result.draft);
      setReplyStatus("Draft ready. Review it before copying.");
    } catch (err) {
      if (requestId === replyRequestId) setReplyStatus(`Couldn't generate a reply: ${err.message}`, true);
    } finally {
      if (requestId === replyRequestId) {
        $btn.prop("disabled", false).html('<i class="fa-solid fa-pen-to-square"></i> Generate reply');
        $("#replyOutput").attr("aria-busy", "false");
        $("#copyReplyBtn").prop("disabled", !$("#replyOutput").val().trim());
      }
    }
  });

  $("#copyReplyBtn").on("click", async function () {
    const text = $("#replyOutput").val();
    if (!text.trim()) return;
    const requestId = replyRequestId;
    const $btn = $(this);
    $btn.prop("disabled", true);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Select the draft and copy it manually.");
      await navigator.clipboard.writeText(text);
      if (requestId === replyRequestId) setReplyStatus("Draft copied. Paste it into your email client.");
    } catch {
      if (requestId === replyRequestId) setReplyStatus("Couldn't copy the draft. Select the text and copy it manually.", true);
    } finally {
      if (requestId === replyRequestId) $btn.prop("disabled", false);
    }
  });


renderReplyInbox();
});
