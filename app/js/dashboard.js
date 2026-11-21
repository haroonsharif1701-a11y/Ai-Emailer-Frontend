$(async function () {
  if (!await appAccess.ready) return;
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


renderRecentEmails(); renderDashboardCharts(); updateChartTheme();
});
