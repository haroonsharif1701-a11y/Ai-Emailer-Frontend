$(async function () {
  if (!await appAccess.ready) return;
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


renderSentiment(); updateChartTheme();
});
