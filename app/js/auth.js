/* ==========================================================================
   Auth page logic — client-side only for now.
   Replace the setTimeout block in handleLogin() with a real call to
   POST /api/auth/login once the ASP.NET Core endpoint exists.
   ========================================================================== */
$(function () {

  $("#pwToggle").on("click", function () {
    const $input = $("#password");
    const isPw = $input.attr("type") === "password";
    $input.attr("type", isPw ? "text" : "password");
    $(this).html(isPw ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>');
  });

  function validate() {
    let ok = true;
    $(".field-error").text("");

    const email = $("#email").val().trim();
    const password = $("#password").val();

    if (!email) {
      $("#emailError").text("Email is required.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $("#emailError").text("Enter a valid email address.");
      ok = false;
    }

    if (!password) {
      $("#passwordError").text("Password is required.");
      ok = false;
    } else if (password.length < 6) {
      $("#passwordError").text("Password must be at least 6 characters.");
      ok = false;
    }

    return ok;
  }

  $("#loginForm").on("submit", function (e) {
    e.preventDefault();

    if (!validate()) {
      $(".auth-card").addClass("shake");
      setTimeout(() => $(".auth-card").removeClass("shake"), 300);
      return;
    }

    const $btn = $("#loginBtn");
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Signing in...');

    
    
    // TODO: replace with real request:
    // $.ajax({ url: "/api/auth/login", method: "POST", data: {...} })
    setTimeout(() => {
      window.location.href = "index.html";
    }, 700);
  });
});
