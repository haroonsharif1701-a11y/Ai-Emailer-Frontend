$(async function () {
  if (!await appAccess.ready) return;
  /* ---------------- USERS (Settings tab) ---------------- */
  let rolesCache = null; // fetched once, reused for both the list's role names and the form's dropdown

  async function getRoles(force = false) {
    if (!force && rolesCache) return rolesCache;
    rolesCache = await apiFetch("/api/role/list");
    return rolesCache;
  }

  async function renderRoles() {
    $("#roleList").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading roles...</p>');
    try {
      const roles = await getRoles(true);
      if (!roles.length) {
        $("#roleList").html('<p class="attach-preview-placeholder">No roles yet — add one to get started.</p>');
        return;
      }
      $("#roleList").html(roles.map(r => `
        <div class="settings-list-row">
          <span class="mini-avatar"><i class="fa-solid fa-user-shield"></i></span>
          <span class="settings-list-main">
            <span class="settings-list-title">${escapeHtml(r.roleName)}</span>
            <span class="settings-list-sub">Role</span>
          </span>
          <span class="settings-list-action" style="display:flex;gap:6px">
            <button type="button" class="icon-btn small-action edit-role-btn" title="Edit role"
                    data-id-role="${r.idRole}">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="icon-btn small-action delete-role-btn" title="Delete role"
                    data-id-role="${r.idRole}" data-role-name="${escapeHtml(r.roleName)}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </span>
        </div>
      `).join(""));
    } catch (err) {
      $("#roleList").html(`<p class="attach-preview-placeholder">Couldn't load roles: ${escapeHtml(err.message)}</p>`);
    }
  }

  async function openRoleModal(mode, role = null) {
    $("#roleFormError").text("");
    $("#roleModalForm")[0].reset();
    $("#roleModalForm").attr("data-id-role", role?.idRole || 0);
    $("#roleModalTitle").text(mode === "edit" ? "Edit Role" : "Add Role");
    $("#roleFormName").val(role?.roleName || "");
    $("#roleModal").attr("aria-hidden", "false").addClass("is-open");
    $("body").addClass("modal-open");
    $("#roleFormName").trigger("focus");
  }

  function closeRoleModal() {
    $("#roleModal").attr("aria-hidden", "true").removeClass("is-open");
    $("body").removeClass("modal-open");
  }

  $("#addRoleBtn").on("click", () => openRoleModal("add"));

  $(document).on("click", ".edit-role-btn", async function () {
    const idRole = Number($(this).data("id-role"));
    try {
      const roles = await getRoles();
      const role = roles.find(r => r.idRole === idRole);
      if (role) await openRoleModal("edit", role);
    } catch (err) {
      alert(`Couldn't load this role: ${err.message}`);
    }
  });

  $(document).on("click", ".delete-role-btn", async function () {
    const idRole = Number($(this).data("id-role"));
    const roleName = $(this).data("role-name");
    if (!confirm(`Delete role "${roleName}"? This cannot be undone.`)) return;

    const $btn = $(this);
    $btn.prop("disabled", true);
    try {
      await apiFetch("/api/role/delete", { method: "POST", body: { idRole } });
      rolesCache = null;
      await renderRoles();
    } catch (err) {
      alert(`Couldn't delete this role: ${err.message}`);
    } finally {
      $btn.prop("disabled", false);
    }
  });

  $("#roleModalForm").on("submit", async function (e) {
    e.preventDefault();
    const idRole = Number($(this).attr("data-id-role")) || 0;
    const roleName = $("#roleFormName").val().trim();

    
    if (!roleName) {
      $("#roleFormError").text("Role name not reaching backend.");
      return;
    }

    const $btn = $("#roleFormSaveBtn");
    $btn.prop("disabled", true).text("Saving...");
    $("#roleFormError").text("");

    try {
      await apiFetch("/api/role/addupd", {
        method: "POST",
        body: { idRole, roleName }
      });
      closeRoleModal();
      rolesCache = null;
      await renderRoles();
    } catch (err) {
      $("#roleFormError").text(err.message);
    } finally {
      $btn.prop("disabled", false).text("Save");
    }
  });

  $(document).on("click", "[data-close-role-modal]", closeRoleModal);

  async function renderUsers() {
    $("#userList").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading users...</p>');
    try {
      const users = await apiFetch("/api/user/list");
      if (!users.length) {
        $("#userList").html('<p class="attach-preview-placeholder">No users yet — add one to get started.</p>');
        return;
      }
      $("#userList").html(users.map(u => `
        <button class="user-list-item" type="button" data-user-id="${u.idUser}">
          <div class="mini-avatar">${escapeHtml(initials(u.fullName))}</div>
          <div class="user-list-main">
            <div class="user-list-top"><strong>${escapeHtml(u.fullName)}</strong>${u.isActive ? "" : '<span class="badge badge-amber" id="inactiveBadge">Inactive</span>'}</div>
            <span class="user-list-email">${escapeHtml(u.username)}</span>
          </div>
        </button>`).join(""));
    } catch (err) {
      $("#userList").html(`<p class="attach-preview-placeholder">Couldn't load users: ${escapeHtml(err.message)}</p>`);
    }
  }

  async function populateRoleDropdown(selectedId) {
  const roles = await getRoles();

  $("#userFormRole").html(
    `<option value="" disabled ${selectedId == null ? "selected" : ""}>
      Choose a role
    </option>` +
    roles.map(r =>
      `<option value="${r.idRole}" ${r.idRole === selectedId ? "selected" : ""}>
        ${escapeHtml(r.roleName)}
      </option>`
    ).join("")
  );
  }

  async function openUserModal(mode, user) {
    $("#userFormError").text("");
    $("#userModalForm")[0].reset();
    $("#userModalForm").data("mode", mode).attr("data-id-user", user ? user.idUser : 0);

    if (mode === "add") {
      $("#userModalTitle").text("Add User");
      $("#userFormPasswordLabel").html('Password<input type="password" id="userFormPassword" autocomplete="new-password" required>');
      await populateRoleDropdown(null);
      await populateDepartmentDropdown(null);
    } else {
      $("#userModalTitle").text("Edit User");
      $("#userFormFullName").val(user.fullName);
      $("#userFormUsername").val(user.username);
      $("#userFormIsActive").prop("checked", user.isActive);
      $("#userFormIsInactive").prop("checked", !user.isActive);
      // Password left blank on edit — the backend keeps the existing hash
      // unless something is actually typed here.
      $("#userFormPasswordLabel").html('Password<input type="password" id="userFormPassword" autocomplete="new-password" placeholder="Leave blank to keep the current password">');
      await populateRoleDropdown(user.idRole);
      await populateDepartmentDropdown(user.idDept);
    }

    $("#userModal").attr("aria-hidden", "false").addClass("is-open");
    $("body").addClass("modal-open");
  }

  
  function closeUserModal() {
    $("#userModal").attr("aria-hidden", "true").removeClass("is-open");
    $("body").removeClass("modal-open");
  }

  async function populateDepartmentDropdown(selectedId) {
    const departments = await apiFetch("/api/department/list");

    $("#userFormDepartment").html(
        `<option value="">Choose Department</option>` +
        departments.map(d =>
            `<option value="${d.idDept}" ${
                d.idDept === selectedId ? "selected" : ""
            }>
                ${escapeHtml(d.deptName)}
            </option>`
        ).join("")
    );
}
  $("#addUserBtn").on("click", () => openUserModal("add", null));

  $(document).on("click", ".user-list-item", async function (e) {
    e.preventDefault();

    const idUser = parseInt($(this).attr("data-user-id"), 10);

    if (!idUser) {
        console.error("Invalid user ID:", $(this).attr("data-user-id"));
        return;
    }

    console.log("Editing user ID:", idUser);

    try {
        const user = await apiFetch(`/api/user/${idUser}`);

        console.log("User returned from API:", user);

        await openUserModal("edit", user);

    } catch (err) {
        console.error("Failed to load user:", err);
        alert(`Couldn't load this user: ${err.message}`);
    }
});

  $(document).on("click", "[data-close-user-modal]", closeUserModal);
  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && $("#userModal").hasClass("is-open")) closeUserModal();
  });

  $("#userModalForm").on("submit", async function (e) {
    e.preventDefault();
    const mode = $(this).data("mode");
    const idUser = parseInt($(this).attr("data-id-user"), 10) || 0;
    const password = $("#userFormPassword").val();

    if (mode === "add" && !password) {
      $("#userFormError").text("Password is required for a new user.");
      return;
    }

    const $btn = $("#userFormSaveBtn");
    $btn.prop("disabled", true).text("Saving...");

    try {
      await apiFetch("/api/user/addupd", {
        method: "POST",
        body: {
          idUser,
          username: $("#userFormUsername").val().trim(),
          fullName: $("#userFormFullName").val().trim(),
          password: password || null,
          idRole: parseInt($("#userFormRole").val(), 10),
          idDept: $("#userFormDepartment").val() ? parseInt($("#userFormDepartment").val(), 10) : null,
          isActive: $("#userFormIsActive").is(":checked"),
        },
      });
      closeUserModal();
      renderUsers(); // re-fetch rather than patch the DOM in place — simplest way to stay correct after add or edit
    } catch (err) {
      $("#userFormError").text(err.message);
    } finally {
      $btn.prop("disabled", false).text("Save");
    }
  });

   /* ---------------- ROLE BASED MENU PERMISSIONS (Settings tab) ---------------- */
  // Mirrors the app's actual navigation (sidebar + settings sub-tabs) so the
 // permission tree always matches what a role could realistically see.
       /* ---------------- ROLE BASED MENU PERMISSIONS (Settings tab) ---------------- */
  // The menu tree used to be hardcoded here. It's now loaded from
  // GET /api/menu/list (MenuController) and rebuilt into the parent/child
  // shape the tree renderer expects, so adding/editing/disabling a menu in
  // the database is reflected here without any front-end code changes.
  let menuPermissionTreeCache = null;
  let menuKeyToId = new Map(); // menuKey -> idMenu, needed because the permission API works in idMenu
  let menuIdToKey = new Map(); // idMenu -> menuKey, needed to map API rows back onto the tree

  async function getMenuPermissionTree(force = false) {
    if (!force && menuPermissionTreeCache) return menuPermissionTreeCache;
    const menus = await apiFetch("/api/menu/list");
    menuKeyToId = new Map(menus.map(m => [m.menuKey, m.idMenu]));
    menuIdToKey = new Map(menus.map(m => [m.idMenu, m.menuKey]));
    menuPermissionTreeCache = buildMenuPermissionTree(menus);
    return menuPermissionTreeCache;
  }

  // Converts the flat skey_menu rows (idMenu, idParentMenu, orderId, isEnable, ...)
  // into a nested tree, dropping any menu with isEnable = false so a disabled
  // menu stays hidden here too — not just from the sidebar.
  function buildMenuPermissionTree(menus) {
    const enabled = (menus || []).filter(m => m.isEnable);
    const childrenByParent = new Map();
    enabled.forEach(m => {
      const parentId = m.idParentMenu ?? null;
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(m);
    });
    childrenByParent.forEach(list => list.sort((a, b) => a.orderId - b.orderId));

    function toNode(m) {
      const kids = (childrenByParent.get(m.idMenu) || []).map(toNode);
      return {
        key: m.menuKey,
        label: m.menuName,
        icon: m.iconClass || "fa-circle",
        children: kids.length ? kids : undefined
      };
    }

    return (childrenByParent.get(null) || []).map(toNode);
  }

  let permissionSelectedRoleId = null;
  let permissionState = new Map(); // menu key -> independent action grants
  let permissionVersion = 0;
  let permissionExpanded = new Set(["settings"]); // which parent nodes show their children

    async function renderPermissionRolesList() {
      $("#rbmpRoleList").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading roles...</p>');
      try {
        const roles = await getRoles(true);
        if (!roles.length) {
          $("#rbmpRoleList").html('<p class="attach-preview-placeholder">No roles yet — add one in the Roles tab first.</p>');
          return;
        }
        $("#rbmpRoleList").html(roles.map(r => `
          <button type="button" class="rbmp-role-row ${r.idRole === permissionSelectedRoleId ? "active" : ""}"
                  data-id-role="${r.idRole}" data-role-name="${escapeHtml(r.roleName)}">
            <span class="rbmp-role-name">${escapeHtml(r.roleName)}</span>
            <i class="fa-solid fa-chevron-right" style="font-size:11px;color:var(--text-muted,#7a7f8c)"></i>
          </button>
        `).join(""));
      } catch (err) {
        $("#rbmpRoleList").html(`<p class="attach-preview-placeholder">Couldn't load roles: ${escapeHtml(err.message)}</p>`);
      }
    }

    function permissionRowsHtml(nodes, depth) {
      return nodes.map(n => {
        const grant = permissionState.get(n.key) || {};
        const hasChildren = n.children && n.children.length;
        const row = `
          <div class="permission-row ${depth > 0 ? "nested" : ""}" data-menu-key="${n.key}">
            <span class="permission-label">
              ${hasChildren ? `<button type="button" class="permission-toggle-chevron" data-toggle-children="${n.key}">
                  <i class="fa-solid fa-chevron-${permissionExpanded.has(n.key) ? "down" : "right"}"></i>
                </button>` : ""}
              <i class="fa-solid ${n.icon}"></i>
              <span>${escapeHtml(n.label)}</span>
            </span>
            <span class="permission-actions">${["view", "add", "update", "delete"].map(action => `
              <label><input type="checkbox" class="permission-checkbox" data-menu-key="${escapeHtml(n.key)}" data-action="${action}"
                ${grant[action] ? "checked" : ""} ${appAccess.can("settings.permissions", "update") ? "" : "disabled"}>
                ${action.charAt(0).toUpperCase() + action.slice(1)}</label>`).join("")}</span>
          </div>`;
        const children = hasChildren && permissionExpanded.has(n.key)
          ? permissionRowsHtml(n.children, depth + 1)
          : "";
        return row + children;
      }).join("");
    }

    function renderPermissionTree() {
      $("#rbmpPermissionTree").html(permissionRowsHtml(menuPermissionTreeCache || [], 0));
    }

    async function selectPermissionRole(idRole, roleName) {
      permissionSelectedRoleId = idRole;
      permissionState = new Map();
      permissionVersion = 0;
      $("#rbmpPermissionError").text("");
      $(".rbmp-role-row").removeClass("active");
      $(`.rbmp-role-row[data-id-role="${idRole}"]`).addClass("active");
      $("#rbmpPermissionHead").html(`<span>Permission of <strong>${escapeHtml(roleName)}</strong></span><span></span>`);
      $("#rbmpPermissionTree").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading permissions...</p>');
      $("#rbmpSaveBar").hide();

      try {
        await getMenuPermissionTree(); // uses the cache filled when the tab opened; refetches if missing
      } catch (err) {
        $("#rbmpPermissionTree").html(`<p class="attach-preview-placeholder">Couldn't load the menu list: ${escapeHtml(err.message)}</p>`);
        return;
      }

      try {
        const selectedRole = idRole;
        const result = await apiFetch(`/api/permission/list?idRole=${idRole}`);
        if (permissionSelectedRoleId !== selectedRole) return;
        permissionVersion = result.permissionVersion;
        permissionState = new Map(result.permissions.map(p => [menuIdToKey.get(p.idMenu), p]).filter(([key]) => key !== undefined));
        renderPermissionTree();
        $("#rbmpSaveBar").show();
      } catch (err) {
        $("#rbmpPermissionTree").html(`<p class="attach-preview-placeholder">Couldn't load permissions: ${escapeHtml(err.message)}</p>`);
      }
    }
    

    $(document).on("click", ".rbmp-role-row", function () {
      selectPermissionRole(Number($(this).data("id-role")), $(this).data("role-name"));
    });

    $(document).on("click", "[data-toggle-children]", function (e) {
      e.stopPropagation();
      const key = $(this).data("toggle-children");
      if (permissionExpanded.has(key)) permissionExpanded.delete(key);
      else permissionExpanded.add(key);
      renderPermissionTree();
    });

    $(document).on("change", ".permission-checkbox", function () {
      const key = this.dataset.menuKey;
      const grant = { view: false, add: false, update: false, delete: false, ...permissionState.get(key) };
      grant[this.dataset.action] = this.checked;
      if (this.dataset.action === "view" && !this.checked) grant.add = grant.update = grant.delete = false;
      if (this.checked && this.dataset.action !== "view") grant.view = true;
      permissionState.set(key, grant);
      renderPermissionTree();
    });

    $("#rbmpSaveBtn").on("click", async function () {
      if (!permissionSelectedRoleId) return;
      const $btn = $(this);
      $btn.prop("disabled", true).text("Saving...");
      $("#rbmpPermissionError").text("");
      try {
        const selectedRole = permissionSelectedRoleId;
        const permissions = Array.from(permissionState.entries())
          .map(([menuKey, grant]) => ({ idMenu: menuKeyToId.get(menuKey), view: !!grant.view, add: !!grant.add, update: !!grant.update, delete: !!grant.delete }))
          .filter(p => p.idMenu !== undefined);
        await apiFetch("/api/permission/save", {
          method: "POST",
          body: { idRole: selectedRole, permissionVersion, permissions }
        });
        if (permissionSelectedRoleId === selectedRole) permissionVersion += 1;
        await appAccess.refresh();
        } catch (err) {
        $("#rbmpPermissionError").text(err.message);
      } finally {
        $btn.prop("disabled", false).text("Save Permissions");
      }
    });
  /* ---------------- DEPARTMENTS + TEAMS ---------------- */
  let departmentsCache = null;
  let teamsCache = null;
  let currentTeamForMembers = null;
  let teamMembersGeneration = 0;
  let teamMembersLoaded = false;
  let teamMembersSaving = false;
  let teamMemberSelection = new Set();
  let teamMemberOriginal = new Set();
  let teamMemberCandidates = new Set();
  let teamMembersTrigger = null;

  async function getDepartments(force = false) {
    if (!force && departmentsCache) return departmentsCache;
    departmentsCache = await apiFetch("/api/department/list");
    return departmentsCache;
  }

  async function getTeams(force = false) {
    if (!force && teamsCache) return teamsCache;
    teamsCache = await apiFetch("/api/team/list");
    return teamsCache;
  }

  async function renderDepartments() {
    $("#departmentList").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading departments...</p>');
    try {
      const departments = await getDepartments(true);
      if (!departments.length) {
        $("#departmentList").html('<p class="attach-preview-placeholder">No departments yet — add one to get started.</p>');
        return;
      }

      $("#departmentList").html(departments.map(d => `
        <button class="settings-list-row department-list-item" type="button" data-id-dept="${d.idDept}">
          <span class="mini-avatar"><i class="fa-solid fa-building"></i></span>
          <span class="settings-list-main">
            <span class="settings-list-title">${escapeHtml(d.deptName)}</span>
            <span class="settings-list-sub">Department</span>
          </span>
          <span class="settings-list-action"><i class="fa-solid fa-pen"></i></span>
        </button>
      `).join(""));
    } catch (err) {
      $("#departmentList").html(`<p class="attach-preview-placeholder">Couldn't load departments: ${escapeHtml(err.message)}</p>`);
    }
  }

  async function renderTeams() {
    $("#teamList").html('<p class="attach-preview-placeholder"><i class="fa-solid fa-spinner fa-spin"></i> Loading teams...</p>');
    try {
      const teams = await getTeams(true);
      if (!teams.length) {
        $("#teamList").html('<p class="attach-preview-placeholder">No teams yet — add one to get started.</p>');
        return;
      }

      $("#teamList").html(teams.map(t => `
        <div class="settings-list-row">
          <span class="mini-avatar"><i class="fa-solid fa-users"></i></span>
          <span class="settings-list-main">
            <span class="settings-list-title">${escapeHtml(t.team)}</span>
            <span class="settings-list-sub">${escapeHtml(t.deptName)} • ${t.totalMembers} member${t.totalMembers === 1 ? "" : "s"}</span>
          </span>
          <span class="settings-list-action" style="display:flex;gap:6px">
            <button type="button" class="icon-btn small-action edit-team-btn" title="Edit team"
                    data-id-team="${t.idTeam}">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="icon-btn small-action manage-team-members-btn" title="Manage team members"
                    data-id-team="${t.idTeam}">
              <i class="fa-solid fa-user-check"></i>
            </button>
          </span>
        </div>
      `).join(""));
    } catch (err) {
      $("#teamList").html(`<p class="attach-preview-placeholder">Couldn't load teams: ${escapeHtml(err.message)}</p>`);
    }
  }

  async function openDepartmentModal(mode, department = null) {
    $("#departmentFormError").text("");
    $("#departmentModalForm")[0].reset();
    $("#departmentModalForm").attr("data-id-dept", department?.idDept || 0);
    $("#departmentModalTitle").text(mode === "edit" ? "Edit Department" : "Add Department");
    $("#departmentFormName").val(department?.deptName || "");
    $("#departmentModal").attr("aria-hidden", "false").addClass("is-open");
    $("body").addClass("modal-open");
    $("#departmentFormName").trigger("focus");
  }

  function closeDepartmentModal() {
    $("#departmentModal").attr("aria-hidden", "true").removeClass("is-open");
    $("body").removeClass("modal-open");
  }

  async function openTeamModal(mode, team = null) {
    $("#teamFormError").text("");
    $("#teamModalForm")[0].reset();
    $("#teamModalForm").attr("data-id-team", team?.idTeam || 0);
    $("#teamModalTitle").text(mode === "edit" ? "Edit Team" : "Add Team");
    $("#teamFormName").val(team?.team || "");

    const departments = await getDepartments();
    $("#teamFormDepartment").html(departments.map(d =>
      `<option value="${d.idDept}" ${d.idDept === team?.idDept ? "selected" : ""}>${escapeHtml(d.deptName)}</option>`
    ).join(""));

    if (!departments.length) {
      $("#teamFormError").text("Create a department before creating a team.");
    }

    $("#teamModal").attr("aria-hidden", "false").addClass("is-open");
    $("body").addClass("modal-open");
    $("#teamFormName").trigger("focus");
  }

  function closeTeamModal() {
    $("#teamModal").attr("aria-hidden", "true").removeClass("is-open");
    $("body").removeClass("modal-open");
  }

  function selectTeamMembersTab(tab) {
    if (tab !== "team" && tab !== "add") return;
    $("#teamMembersTabs [data-member-tab]").each(function () {
      const active = this.dataset.memberTab === tab;
      $(this).toggleClass("active", active).attr("aria-pressed", String(active));
    });
    $("#teamMembersModal [data-member-panel]").each(function () {
      $(this).toggleClass("active", this.dataset.memberPanel === tab);
    });
  }

  function updateTeamMembersSaveState() {
    const changed = teamMemberSelection.size !== teamMemberOriginal.size ||
      [...teamMemberSelection].some(id => !teamMemberOriginal.has(id));
    $("#teamMembersSaveBtn").prop("disabled",
      !teamMembersLoaded || teamMembersSaving || !changed || !appAccess.can("settings.team", "update"));
  }

  function teamMemberOption(user) {
    const fullName = user.fullName || user.username || "User";
    return `<label class="team-member-option">
      <input type="checkbox" class="team-member-checkbox" value="${user.idUser}"
        ${teamMemberSelection.has(user.idUser) ? "checked" : ""}
        ${appAccess.can("settings.team", "update") ? "" : "disabled"}>
      <span class="mini-avatar">${escapeHtml(initials(fullName))}</span>
      <span class="team-member-meta"><strong>${escapeHtml(fullName)}</strong>
        <span>${escapeHtml(user.username || "")}${user.isActive === false ? " · Inactive" : ""}</span>
      </span>
    </label>`;
  }

  async function openTeamMembersModal(idTeam, teamName) {
    if (teamMembersSaving || !appAccess.can("settings.team", "view") || !Number.isInteger(idTeam) || idTeam <= 0) return;
    const generation = ++teamMembersGeneration;
    teamMembersTrigger = document.activeElement;
    currentTeamForMembers = idTeam;
    teamMembersLoaded = false;
    teamMemberSelection = new Set();
    teamMemberOriginal = new Set();
    teamMemberCandidates = new Set();
    $("#teamMembersFormError").text("");
    $("#teamMembersModalSubtitle").text(appAccess.can("settings.team", "update")
      ? `${teamName}: uncheck existing members to remove them, or select users in Add Member. Changes apply when you save.`
      : `Members of ${teamName}. You have read-only access.`);
    $("#teamMemberList, #addMemberList").html('<p class="attach-preview-placeholder">Loading members...</p>');
    $("#teamMembersSaveBtn").text("Save Members");
    $("#teamMembersModal").attr("aria-hidden", "false").attr("aria-busy", "true").addClass("is-open");
    $("body").addClass("modal-open");
    selectTeamMembersTab("team");
    updateTeamMembersSaveState();
    $("#teamMembersTeamTabBtn").trigger("focus");

    try {
      const [users, members] = await Promise.all([
        apiFetch("/api/user/list"),
        apiFetch(`/api/team/${idTeam}/members`)
      ]);
      if (generation !== teamMembersGeneration) return;
      const valid = rows => Array.isArray(rows) && rows.every(row =>
        row && Number.isInteger(row.idUser) && row.idUser > 0);
      if (!valid(users) || !valid(members)) throw new Error("Invalid member data returned. Close and reopen this dialog to retry.");
      const usersById = new Map(users.map(user => [user.idUser, user]));
      const membersById = new Map(members.map(member => [member.idUser, member]));
      teamMemberOriginal = new Set(membersById.keys());
      teamMemberSelection = new Set(teamMemberOriginal);
      teamMemberCandidates = new Set([...usersById.keys(), ...membersById.keys()]);
      // Retain existing memberships even when the user list omits a member.
      const existing = [...membersById.values()].map(member => usersById.get(member.idUser) || member);
      const available = [...usersById.values()].filter(user => !teamMemberOriginal.has(user.idUser));
      $("#teamMemberList").html(existing.length ? existing.map(teamMemberOption).join("")
        : '<p class="attach-preview-placeholder">This team has no members. Use Add Member to select users.</p>');
      $("#addMemberList").html(available.length ? available.map(teamMemberOption).join("")
        : '<p class="attach-preview-placeholder">No additional users are available.</p>');
      teamMembersLoaded = true;
    } catch (err) {
      if (generation !== teamMembersGeneration) return;
      $("#teamMemberList, #addMemberList").html('<p class="attach-preview-placeholder">Members could not be loaded. Close and reopen this dialog to retry.</p>');
      $("#teamMembersFormError").text(err.message);
    } finally {
      if (generation === teamMembersGeneration) {
        $("#teamMembersModal").attr("aria-busy", "false");
        updateTeamMembersSaveState();
        appAccess.applyControls();
      }
    }
  }

  function closeTeamMembersModal() {
    if (teamMembersSaving) return;
    ++teamMembersGeneration;
    teamMembersLoaded = false;
    currentTeamForMembers = null;
    teamMemberSelection.clear();
    teamMemberOriginal.clear();
    teamMemberCandidates.clear();
    $("#teamMembersModal").attr("aria-hidden", "true").attr("aria-busy", "false").removeClass("is-open");
    $("body").removeClass("modal-open");
    updateTeamMembersSaveState();
    if (teamMembersTrigger?.isConnected) $(teamMembersTrigger).trigger("focus");
  }

  $("#teamMembersTabs").on("click", "[data-member-tab]", function () {
    selectTeamMembersTab(this.dataset.memberTab);
  });

  $("#teamMembersModal").on("change", ".team-member-checkbox", function () {
    const id = Number(this.value);
    if (!teamMembersLoaded || teamMembersSaving || !teamMemberCandidates.has(id) || !appAccess.can("settings.team", "update")) {
      this.checked = teamMemberSelection.has(id);
      return;
    }
    if (this.checked) teamMemberSelection.add(id);
    else teamMemberSelection.delete(id);
    updateTeamMembersSaveState();
  });

  $("#addDepartmentBtn").on("click", () => openDepartmentModal("add"));

  $(document).on("click", ".department-list-item", async function () {
    const idDept = Number($(this).data("id-dept"));
    try {
      const departments = await getDepartments();
      const department = departments.find(d => d.idDept === idDept);
      if (department) await openDepartmentModal("edit", department);
    } catch (err) {
      alert(`Couldn't load this department: ${err.message}`);
    }
  });

  $("#departmentModalForm").on("submit", async function (e) {
    e.preventDefault();
    const idDept = Number($(this).attr("data-id-dept")) || 0;
    const deptName = $("#departmentFormName").val().trim();
    if (!deptName) {
      $("#departmentFormError").text("Department name is required.");
      return;
    }

    const $btn = $("#departmentFormSaveBtn");
    $btn.prop("disabled", true).text("Saving...");
    $("#departmentFormError").text("");

    try {
      await apiFetch("/api/department/addupd", {
        method: "POST",
        body: { idDept, deptName }
      });
      closeDepartmentModal();
      await renderDepartments();
      departmentsCache = null;
      teamsCache = null;
    } catch (err) {
      $("#departmentFormError").text(err.message);
    } finally {
      $btn.prop("disabled", false).text("Save");
    }
  });

  $("#addTeamBtn").on("click", () => openTeamModal("add"));

  $(document).on("click", ".edit-team-btn", async function () {
    const idTeam = Number($(this).data("id-team"));
    try {
      const teams = await getTeams();
      const team = teams.find(t => t.idTeam === idTeam);
      if (team) await openTeamModal("edit", team);
    } catch (err) {
      alert(`Couldn't load this team: ${err.message}`);
    }
  });

  $(document).on("click", ".manage-team-members-btn", function () {
    const idTeam = Number($(this).data("id-team"));
    const team = teamsCache?.find(item => item.idTeam === idTeam);
    if (team) openTeamMembersModal(idTeam, team.team);
  });

  $("#teamModalForm").on("submit", async function (e) {
    e.preventDefault();
    const idTeam = Number($(this).attr("data-id-team")) || 0;
    const team = $("#teamFormName").val().trim();
    const idDept = Number($("#teamFormDepartment").val());

    if (!team) {
      $("#teamFormError").text("Team name is required.");
      return;
    }
    if (!idDept) {
      $("#teamFormError").text("Department is required.");
      return;
    }

    const $btn = $("#teamFormSaveBtn");
    $btn.prop("disabled", true).text("Saving...");
    $("#teamFormError").text("");

    try {
      await apiFetch("/api/team/addupd", {
        method: "POST",
        body: { idTeam, team, idDept }
      });
      closeTeamModal();
      teamsCache = null;
      await renderTeams();
    } catch (err) {
      $("#teamFormError").text(err.message);
    } finally {
      $btn.prop("disabled", false).text("Save");
    }
  });

  $("#teamMembersSaveBtn").on("click", async function () {
    if (!currentTeamForMembers || !teamMembersLoaded || teamMembersSaving || !appAccess.can("settings.team", "update")) return;
    const userIds = [...teamMemberSelection];
    if (userIds.length === teamMemberOriginal.size && userIds.every(id => teamMemberOriginal.has(id))) return;
    const idTeam = currentTeamForMembers;
    const generation = teamMembersGeneration;
    teamMembersSaving = true;
    $("#teamMembersModal").attr("aria-busy", "true");
    $("#teamMembersSaveBtn").text("Saving...");
    $("#teamMembersFormError").text("");
    updateTeamMembersSaveState();
    appAccess.applyControls();
    try {
      await apiFetch(`/api/team/${idTeam}/members`, {
        method: "POST", body: { idTeam, userIds }
      });
      if (generation !== teamMembersGeneration) return;
      teamMembersSaving = false;
      closeTeamMembersModal();
      teamsCache = null;
      await renderTeams();
    } catch (err) {
      if (generation === teamMembersGeneration) $("#teamMembersFormError").text(err.message);
    } finally {
      if (generation === teamMembersGeneration) {
        teamMembersSaving = false;
        $("#teamMembersModal").attr("aria-busy", "false");
        $("#teamMembersSaveBtn").text("Save Members");
        updateTeamMembersSaveState();
        appAccess.applyControls();
      }
    }
  });

  $(document).on("click", "[data-close-department-modal]", closeDepartmentModal);
  $(document).on("click", "[data-close-team-modal]", closeTeamModal);
  $(document).on("click", "[data-close-team-members-modal]", closeTeamMembersModal);

  $(document).on("keydown", function (e) {
    if (e.key !== "Escape") return;
    if ($("#departmentModal").hasClass("is-open")) closeDepartmentModal();
    else if ($("#roleModal").hasClass("is-open")) closeRoleModal();
    else if ($("#teamModal").hasClass("is-open")) closeTeamModal();
    else if ($("#teamMembersModal").hasClass("is-open")) closeTeamMembersModal();
  });

  /* ---------------- SETTINGS TABS ---------------- */
  $("#settingsTabs .tab").on("click", function () {
    const tab = $(this).data("tab");
    if (!appAccess.can(`settings.${tab}`)) return;
    $("#settingsTabs .tab").removeClass("active");
    $(this).addClass("active");
    $(".settings-tab").removeClass("active");
    $(`#tab-${tab}`).addClass("active");
    
    
    if (tab === "users") renderUsers();
    if (tab === "roles") renderRoles();
    if (tab === "dept") renderDepartments();
    if (tab === "team") renderTeams();
    if (tab === "permissions") {
      renderPermissionRolesList();
      getMenuPermissionTree(true).catch(() => {
        // Silently ignore here — the error surfaces in the tree panel once a role is selected.
      });
    }
  });
 
  /* ---------------- PROFILE ---------------- */

let currentProfile = null;

async function loadProfile() {
  const $error = $("#profileError");

  $error.text("");

  try {
    const profile = await apiFetch("/api/user/me");

    currentProfile = profile;

    $("#profileFullName").val(profile.fullName ?? "");
    $("#profileUsername").val(profile.username ?? "");
    $("#profileRole").val(profile.roleName ?? "");
    $("#profileOrganization").val(profile.orgName ?? "");
    $("#profileDepartment").val(profile.deptName ?? "");
    const $statusBadge = $("#profileStatusBadge");
    if (profile.isActive) {
        $statusBadge
            .removeClass("badge-amber")
            .addClass("badge-green")
            .text("Active");
    } else {
        $statusBadge
            .removeClass("badge-green")
            .addClass("badge-amber")
            .text("Inactive");
    }
           
    updateLoggedInUserUI(profile);

  } catch (err) {
    console.error("Failed to load profile:", err);
    $error.text(`Couldn't load your profile: ${err.message}`);
  }
}
loadProfile();
const firstTab = $("#settingsTabs .tab").filter(function () { return appAccess.can(`settings.${this.dataset.tab}`); }).first();
firstTab.trigger("click");

$("#saveProfileBtn").on("click", async function () {

  if (!currentProfile)
    return;

  const $btn = $(this);
  const $error = $("#profileError");

  $error.text("");

  const fullName = $("#profileFullName").val().trim();
  const username = $("#profileUsername").val().trim();

  if (!fullName || !username) {
    $error.text("Full name and email are required.");
    return;
  }

  const originalText = $btn.text();

  try {

    $btn
      .prop("disabled", true)
      .text("Saving...");

    await apiFetch("/api/user/me", {
      method: "PUT",
      body: { username, fullName }
    });

    /*
     * Reload from backend rather than modifying currentProfile
     * manually. This guarantees the UI reflects the database.
     */
    await loadProfile();

    $btn.text("Saved");

    setTimeout(() => {
      $btn.text(originalText);
    }, 1500);

  } catch (err) {

    console.error("Failed to save profile:", err);

    $error.text(
      `Couldn't save your profile: ${err.message}`
    );

  } finally {

    $btn.prop("disabled", false);
  }
});



});
