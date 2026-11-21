$(async function () {
  if (!await appAccess.ready) return;
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


renderClassification();
});
