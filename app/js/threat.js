$(async function () {
  if (!await appAccess.ready) return;
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


renderThreat();
});
