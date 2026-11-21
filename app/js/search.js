$(async function () {
  if (!await appAccess.ready) return;
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



});
