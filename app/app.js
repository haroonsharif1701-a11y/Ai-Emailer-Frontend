$(function () {

    /*=========================
        SIDEBAR ACTIVE
    =========================*/

    $(".menu li").click(function (e) {

        e.preventDefault();

        $(".menu li").removeClass("active");

        $(this).addClass("active");

    });

    /*=========================
        SEARCH
    =========================*/

    $(".search-box input").on("keyup", function () {

        const value = $(this).val();

        console.log("Searching :", value);

    });

    /*=========================
        CONNECT BUTTON
    =========================*/

    $(".connect").click(function () {

        alert("Connect Email Account");

    });

    /*=========================
        DATE PICKER
    =========================*/

    $(".date-btn").click(function () {

        alert("Open Date Picker");

    });

    /*=========================
        NOTIFICATION
    =========================*/

    $(".notify").click(function () {

        alert("Notifications");

    });

    /*=========================
        PROFILE
    =========================*/

    $(".profile").click(function () {

        alert("Profile Menu");

    });

    /*=========================
        CARD HOVER
    =========================*/

    $(".card").hover(function () {

        $(this).css({
            transform: "translateY(-8px)",
            transition: ".25s"
        });

    }, function () {

        $(this).css({
            transform: "translateY(0)"
        });

    });

});