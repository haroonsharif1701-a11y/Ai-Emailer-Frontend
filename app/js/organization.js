$(async function () {
  if (!await appAccess.ready) return;
  /* ---------------- ORGANIZATION ---------------- */
  function renderOrganization() {
    $("#orgGrid").html(
        // ORG_STATS.map(s => `
        //     <div class="org-card">
        //         <i class="fa-solid ${s.icon}"></i>
        //         <strong>${s.value}</strong>
        //         <span>${s.label}</span>
        //     </div>
        // `).join("")
    );
  }
  async function loadOrganizationCardCounts() {
    try {
        const counts = await apiFetch("/api/organization/card-counts");

        $("#totalUsers").text(counts.totalUser);
        $("#totalDepartments").text(counts.totalDept);
        $("#totalTeams").text(counts.totalTeams);
        $("#totalAdmins").text(counts.totalAdmins);

    } catch (err) {
        console.error("Failed to load organization card counts:", err);

        $("#totalUsers").text("—");
        $("#totalDepartments").text("—");
        $("#totalTeams").text("—");
        $("#totalAdmins").text("—");
    }
}

  async function renderOrganizationUsers() {
    const $grid = $("#orgUsersGrid");
    const $count = $("#orgMemberCount");

    $grid.html(`
        <div class="org-users-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading users...
        </div>
    `);

    try {
        const users = await apiFetch("/api/user/list");

        $count.text(`${users.length} ${users.length === 1 ? "Member" : "Members"}`);

        if (!users.length) {
            $grid.html(`
                <div class="org-users-empty">
                    <i class="fa-solid fa-users"></i>
                    <span>No users found in this organization.</span>
                </div>
            `);
            return;
        }

        $grid.html(
            users.map(u => `
                <div class="org-user-card">
                    <div class="user-avatar-wrapper">
                        <div class="mini-avatar">
                            ${initials(u.fullName)}
                        </div>
                        <div class="mini-avatar-name">
                            ${escapeHtml(u.fullName)}
                        </div>
                    </div>

                    <div class="org-user-info">
                        <strong>${escapeHtml(u.fullName)}</strong>
                        <span>${escapeHtml(u.username)}</span>
                    </div>

                    <div class="org-user-meta">
                        <span class="badge badge-blue">
                            ${escapeHtml(u.roleName ?? "User")}
                        </span>

                        ${
                            u.deptName
                                ? `<span class="org-user-dept">
                                      ${escapeHtml(u.deptName)}
                                   </span>`
                                : ""
                        }
                        <span class="org-user-status">
                            ${u.isActive ? ' <span class="badge badge-green" id="user-status">Active</span>' : 
                              '<span class="badge badge-amber">Inactive</span>'}
                        </span>
                    </div>

                </div>
            `).join("")
        );

    } catch (err) {
        console.error("Failed to load organization users:", err);

        $grid.html(`
            <div class="org-users-empty">
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>Couldn't load organization users.</span>
            </div>
        `);
    }
  }


renderOrganization(); renderOrganizationUsers(); loadOrganizationCardCounts();
});
