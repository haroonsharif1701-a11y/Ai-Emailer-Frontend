/* Database permissions are authoritative. This in-memory copy only controls presentation. */
window.appAccess = (() => {
  let snapshot = null;
  let pending = null;
  let initialized = false;
  const can = (menu, action = "view") => snapshot?.menus?.[menu]?.view === true && snapshot.menus[menu][action] === true;
  const canPage = menu => menu === "settings"
    ? Object.keys(snapshot?.menus || {}).some(key => key.startsWith("settings.") && can(key))
    : can(menu);

  const rules = [
    ["#addUserBtn", "settings.users", "add"],
    [".user-list-item", "settings.users", "update"],
    ["#addRoleBtn", "settings.roles", "add"],
    [".edit-role-btn", "settings.roles", "update"],
    [".delete-role-btn", "settings.roles", "delete"],
    ["#addDepartmentBtn", "settings.dept", "add"],
    [".department-list-item", "settings.dept", "update"],
    ["#addTeamBtn", "settings.team", "add"],
    [".edit-team-btn, #teamMembersSaveBtn", "settings.team", "update"],
    [".manage-team-members-btn", "settings.team", "view"],
    ["#saveProfileBtn", "settings.profile", "update"],
    ["#rbmpSaveBtn", "settings.permissions", "update"],
    ["#generateReplyBtn", "reply", "add"],
    ["#attachDropzone, #attachFileInput", "attachments", "add"],
    ["[data-attachment-delete-id]", "attachments", "delete"]
  ];
  function applyControls() {
    document.querySelectorAll(".user-list-item, .department-list-item").forEach(row => row.classList.add("permission-readonly-row"));
    document.querySelectorAll("#teamMembersModal input[type=checkbox]").forEach(input => { input.disabled = !can("settings.team", "update") || input.closest("#teamMembersModal").getAttribute("aria-busy") === "true"; });
    rules.forEach(([selector, menu, action]) => document.querySelectorAll(selector).forEach(element => {
      element.dataset.permissionMenu = menu;
      element.dataset.permissionAction = action;
      element.classList.toggle("permission-denied-control", !can(menu, action));
    }));
    document.querySelectorAll("[data-permission-menu]").forEach(element => {
      element.classList.toggle("permission-denied-control", !can(element.dataset.permissionMenu, element.dataset.permissionAction || "view"));
    });
  }
  function apply() {
    document.querySelectorAll(".nav-item[data-page], [data-goto]").forEach(link => {
      link.classList.toggle("permission-hidden", !canPage(link.dataset.page || link.dataset.goto));
    });
    document.querySelectorAll("#settingsTabs [data-tab]").forEach(tab => {
      const allowed = can(`settings.${tab.dataset.tab}`);
      tab.classList.toggle("permission-hidden", !allowed);
      document.querySelector(`#tab-${tab.dataset.tab}`)?.classList.toggle("permission-hidden", !allowed);
    });
    applyControls();
  }
  function block(message) {
    document.querySelectorAll(".modal.is-open, .attachment-modal.is-open").forEach(modal => modal.remove());
    document.body.classList.remove("modal-open");
    const content = document.querySelector("#content");
    if (!content) return;
    content.replaceChildren();
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert"); notice.textContent = message;
    content.append(notice);
    const allowed = Object.keys(pageRoutes).find(canPage);
    if (allowed) {
      const link = document.createElement("a"); link.href = pageRoutes[allowed];
      link.textContent = "Open an available page"; content.append(link);
    }
  }
  async function refresh() {
    if (pending) return pending;
    pending = (async () => {
      try {
        const next = await apiFetch("/api/permission/me");
        if (!next?.menus || !Number.isInteger(next.organizationId) || !Number.isInteger(next.roleId)) throw new Error("Invalid permission response.");
        const changed = initialized && (!snapshot || JSON.stringify(snapshot) !== JSON.stringify(next));
        snapshot = next;
        if (initialized && changed) {
          // Reload clears stale page data, open edit dialogs, and cached role lists.
          location.reload();
          return false;
        }
        apply();
        if (new URLSearchParams(location.search).get("landing") === "1") {
          history.replaceState(null, "", location.pathname);
          if (!canPage(document.body.dataset.page)) {
            const firstPage = Object.keys(pageRoutes).find(canPage);
            if (firstPage) { location.replace(pageRoutes[firstPage]); return false; }
          }
        }
        if (!canPage(document.body.dataset.page)) {
          block("You do not have access to this page. Contact your organization administrator.");
          return false;
        }
        return true;
      } catch {
        snapshot = null;
        apply();
        block("Access could not be verified. Reload this page to try again.");
        return false;
      } finally {
        document.documentElement.classList.remove("access-loading");
        pending = null;
      }
    })();
    return pending;
  }
  document.addEventListener("click", event => {
    const control = event.target.closest("[data-permission-menu]");
    if (control && !can(control.dataset.permissionMenu, control.dataset.permissionAction || "view")) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  window.addEventListener("focus", () => refresh());
  window.addEventListener("aiemailer:forbidden", () => refresh());
  setInterval(() => { if (!document.hidden) refresh(); }, 15000);
  const ready = refresh();
  ready.then(() => { initialized = true; });
  new MutationObserver(applyControls).observe(document.body, { childList: true, subtree: true });
  return { ready, refresh, can, canPage, applyControls };
})();
