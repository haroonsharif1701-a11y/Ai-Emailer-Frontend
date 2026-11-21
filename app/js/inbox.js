$(async function () {
  if (!await appAccess.ready) return;
  $('#demoNotice').remove();
  let selected = null, pageToken = null, filter = 'all', generation = 0, loading = false, connected = false;
  const status = message => $('#mailStatus').text(message);
  const messagePath = id => '/api/mailbox/messages/' + encodeURIComponent(id);
  const control = (label, action, permission) => $('<button>', { type: 'button', class: 'btn btn-outline small', text: label })
    .attr('data-permission-menu', 'inbox').attr('data-permission-action', permission || 'view').on('click', async function () {
      $(this).prop('disabled', true);
      try { await action(); } catch (error) { status(error.message); }
      finally { $(this).prop('disabled', false); }
    });

  async function load(append = false) {
    if (loading || !connected) return;
    loading = true;
    $('#mailMore, #mailSync, #inboxTabs button').prop('disabled', true);
    try {
      const query = 'in:inbox' + (filter === 'unread' ? ' is:unread' : filter === 'flagged' ? ' is:starred' : '');
      const params = new URLSearchParams({ pageSize: '25', query });
      if (append && pageToken) params.set('pageToken', pageToken);
      const page = await apiFetch('/api/mailbox/messages?' + params);
      if (!append) $('#inboxItems').empty();
      for (const mail of page.messages) {
        const button = $('<button>', { type: 'button', class: 'inbox-item' }).attr('aria-pressed', 'false');
        const body = $('<div>', { class: 'inbox-item-body' }).appendTo(button);
        $('<strong>').text(mail.from).appendTo(body);
        $('<div>', { class: 'inbox-item-subj' }).text(mail.subject || '(No subject)').appendTo(body);
        $('<div>', { class: 'inbox-item-preview' }).text(mail.snippet).appendTo(body);
        if (mail.labels.includes('UNREAD')) $('<span>', { class: 'badge', text: 'Unread' }).appendTo(body);
        button.on('click', () => openMessage(mail.id, button)).appendTo('#inboxItems');
      }
      pageToken = page.nextPageToken;
      $('#mailMore').prop('hidden', !pageToken);
      if (!$('#inboxItems').children().length) $('<p>', { text: 'No messages in this view.' }).appendTo('#inboxItems');
    } finally {
      loading = false;
      $('#mailMore, #mailSync, #inboxTabs button').prop('disabled', false);
    }
  }

  async function openMessage(id, button) {
    const current = ++generation;
    selected = id;
    $('.inbox-item').removeClass('selected').attr('aria-pressed', 'false');
    button.addClass('selected').attr('aria-pressed', 'true');
    $('#inboxDetail').empty().text('Loading message…');
    try {
      const mail = await apiFetch(messagePath(id));
      if (current !== generation) return;
      const detail = $('#inboxDetail').empty();
      const header = $('<header>', { class: 'mail-header' }).appendTo(detail);
      $('<p>', { class: 'mail-eyebrow', text: 'MESSAGE' }).appendTo(header);
      $('<h2>', { class: 'detail-subject' }).text(mail.subject || '(No subject)').appendTo(header);
      const meta = $('<dl>', { class: 'mail-meta' }).appendTo(header);
      for (const [label, value] of [['From', mail.from], ['To', mail.to]]) {
        $('<dt>').text(label).appendTo(meta);
        $('<dd>').text(value || 'Not provided').appendTo(meta);
      }
      const received = new Date(mail.receivedAt);
      if (!Number.isNaN(received.getTime())) {
        $('<dt>', { text: 'Received' }).appendTo(meta);
        $('<dd>').text(received.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })).appendTo(meta);
      }
      const actions = $('<div>', { class: 'mail-toolbar', role: 'group', 'aria-label': 'Message actions' }).appendTo(detail);
      const output = $('<div>', { class: 'mail-ai-output', role: 'status' }).appendTo(detail);
      $('<div>', { class: 'mail-body' }).text(mail.bodyText?.trim() || 'No readable text is available for this message.').appendTo(detail);
      control('Summarize', async () => {
        output.text('Generating summary…');
        const result = await apiFetch(messagePath(id) + '/summary', { method: 'POST' });
        if (selected !== id) return;
        output.empty();
        $('<p>').text(result.summary).appendTo(output);
        $('<p>').text('Priority: ' + result.priority).appendTo(output);
        const list = $('<ul>').appendTo(output);
        result.actionItems.forEach(item => $('<li>').text(item).appendTo(list));
      }).appendTo(actions);
      for (const [label, action] of [['Mark read', 'read'], ['Mark unread', 'unread'], ['Archive', 'archive']]) {
        control(label, async () => {
          await apiFetch(messagePath(id), { method: 'PATCH', body: { action } });
          status(label + ' completed.');
          await load();
        }, 'update').appendTo(actions);
      }
      control('Move to trash', async () => {
        if (!confirm('Move this message to Gmail Trash?')) return;
        await apiFetch(messagePath(id), { method: 'DELETE' });
        selected = null;
        detail.empty().text('Message moved to Trash.');
        await load();
      }, 'delete').addClass('mail-action-danger').appendTo(actions);
      const attachments = $('<section>', { class: 'mail-attachments' }).appendTo(detail);
      if (mail.attachments.length) $('<h3>').text('Attachments (' + mail.attachments.length + ')').appendTo(attachments);
      for (const attachment of mail.attachments) {
        const path = messagePath(id) + '/attachments/' + encodeURIComponent(attachment.id);
        const row = $('<div>', { class: 'mail-attachment' }).appendTo(attachments);
        const info = $('<div>', { class: 'mail-attachment-info' }).appendTo(row);
        $('<strong>').text(attachment.fileName).appendTo(info);
        $('<span>').text(attachment.size >= 1048576 ? (attachment.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.ceil(attachment.size / 1024)) + ' KB').appendTo(info);
        control('Download', async () => {
          const { blob } = await apiDownload(path);
          const url = URL.createObjectURL(blob);
          const anchor = $('<a>').attr({ href: url, download: attachment.fileName }).appendTo(document.body);
          anchor[0].click(); anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }).attr('aria-label', 'Download ' + attachment.fileName).appendTo(row);
        if (appAccess.can('attachments', 'add')) control('Analyze', async () => {
          const result = await apiFetch(path + '/analysis', { method: 'POST' });
          output.text(result.summary + '\n' + result.description + '\nThreat level: ' + result.threatLevel);
        }).attr('data-permission-menu', 'attachments').attr('data-permission-action', 'add').appendTo(row);
      }
      if (appAccess.can('inbox', 'add')) {
        const reply = $('<section>', { class: 'mail-reply' }).appendTo(detail);
        $('<h3>', { text: 'Reply' }).appendTo(reply);
        $('<label>', { for: 'mailReplyTo', text: 'To' }).appendTo(reply);
        const to = $('<input>', { id: 'mailReplyTo', type: 'email', required: true, 'aria-label': 'Reply recipient', placeholder: 'Recipient email' })
          .val((mail.from.match(/<([^>]+)>/) || [null, mail.from])[1]).appendTo(reply);
        $('<label>', { for: 'mailReplyBody', text: 'Message' }).appendTo(reply);
        const body = $('<textarea>', { id: 'mailReplyBody', 'aria-label': 'Reply body', rows: 6, placeholder: 'Write your reply...' }).appendTo(reply);
        const replyActions = $('<div>', { class: 'mail-reply-actions' }).appendTo(reply);
        if (appAccess.can('reply', 'add')) control('Generate reply draft', async () => {
          const result = await apiFetch(messagePath(id) + '/reply-draft', { method: 'POST' });
          body.val(result.draft);
        }).attr('data-permission-menu', 'reply').attr('data-permission-action', 'add').appendTo(replyActions);
        control('Send reply', async () => {
          if (!body.val().trim() || !to[0].checkValidity()) throw new Error('Enter a recipient and reply.');
          if (!confirm('Send this reply to ' + to.val() + '?')) return;
          await apiFetch('/api/mailbox/messages/send', { method: 'POST', body: {
            to: to.val(), subject: mail.subject || '(No subject)', body: body.val(), replyToMessageId: id
          } });
          body.val(''); status('Reply sent.');
        }, 'add').removeClass('btn-outline').addClass('btn-primary').appendTo(replyActions);
      }
    } catch (error) { if (current === generation) $('#inboxDetail').text(error.message); }
  }

  async function refreshConnection() {
    const result = await apiFetch('/api/mailbox/status');
    connected = result.connected && !result.reconnectRequired;
    $('#mailConnect').prop('hidden', connected).text(result.reconnectRequired ? 'Reconnect Gmail' : 'Connect Gmail');
    $('#mailDisconnect').prop('hidden', !result.connected);
    $('#mailSync').prop('disabled', !connected);
    status(connected ? 'Connected: ' + result.email : 'Connect Gmail to load your messages.');
    if (connected) await load();
    else { generation++; selected = null; pageToken = null; $('#inboxItems, #inboxDetail').empty(); $('#mailMore').prop('hidden', true); }
  }
  $('#mailConnect').on('click', async function () {
    const popup = window.open('about:blank', 'AiEmailerGmail', 'width=600,height=750');
    if (!popup) { status('Allow popups to connect Gmail.'); return; }
    popup.opener = null;
    $(this).prop('disabled', true);
    try {
      const result = await apiFetch('/api/mailbox/connect', { method: 'POST' });
      popup.location = result.authorizationUrl;
      status('Complete Google consent, close that window, then click Refresh.');
      $('#mailSync').prop('disabled', false);
    } catch (error) { popup.close(); status(error.message); }
    finally { $(this).prop('disabled', false); }
  });
  $('#mailDisconnect').on('click', async function () {
    if (!confirm('Disconnect Gmail and remove its saved authorization?')) return;
    $(this).prop('disabled', true);
    try {
      const result = await apiFetch('/api/mailbox/connection', { method: 'DELETE' });
      await refreshConnection();
      if (!result.providerRevoked) status('Disconnected locally. Remove AiEmailer access in Google Account permissions to finish revocation.');
    } catch (error) { status(error.message); }
    finally { $(this).prop('disabled', false); }
  });
  $('#mailSync').on('click', async () => {
    try { await refreshConnection(); if (connected) await apiFetch('/api/mailbox/sync', { method: 'POST' }); }
    catch (error) { status(error.message); }
  });
  $('#mailMore').on('click', () => load(true).catch(error => status(error.message)));
  $('#inboxTabs .tab').on('click', function () {
    if (loading) return;
    filter = $(this).data('filter');
    $('#inboxTabs .tab').removeClass('active'); $(this).addClass('active');
    load().catch(error => status(error.message));
  });
  try {
    const providers = await apiFetch('/api/auth/providers');
    if (!providers.gmail) { status('Mailbox functionality is disabled for this deployment.'); return; }
    await refreshConnection();
    setInterval(() => { if (!document.hidden && connected && !loading) load().catch(error => status(error.message)); }, 120000);
  } catch (error) { status(error.message); }
});
