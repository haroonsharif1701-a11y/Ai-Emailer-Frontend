$(async function () {
  if (!await appAccess.ready) return;
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


renderLicense();
});
