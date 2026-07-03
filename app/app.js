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

/*=========================================================
                    AI SUMMARY DATA
=========================================================*/

const emailDatabase = [

{
    id:1,

    sender:"Amazon Business",

    subject:"Invoice #112-4587",

    received:"Today • 10:24 AM",

    summary:[
        "Amazon Business sent Invoice #1124587.",
        "Total Amount : $1,249.99",
        "Payment Due : 11 June 2025",
        "Vendor successfully verified.",
        "No malicious links detected.",
        "No suspicious attachments."
    ],

    explanation:
    "This email is requesting payment for a previous purchase. It appears legitimate because the sender is verified and the invoice format matches previous communications.",

    threat:2,

    confidence:97,

    sentiment:"Neutral",

    entity:[
        "Amazon",
        "Invoice",
        "$1,249.99",
        "11 June",
        "Finance"
    ],

    attachments:[
        {
            name:"Invoice.pdf",
            size:"245 KB"
        },
        {
            name:"Order.xlsx",
            size:"132 KB"
        }
    ]

},

{
    id:2,

    sender:"Microsoft 365",

    subject:"Security Alert",

    received:"Today • 09:15 AM",

    summary:[
        "Microsoft detected an unusual sign-in.",
        "Sign in originated from Germany.",
        "Password has NOT been changed.",
        "Multi-factor authentication protected the account."
    ],

    explanation:
    "Microsoft detected an unfamiliar login. Although the account remains protected, you should verify recent activity and change the password if the login was not yours.",

    threat:38,

    confidence:95,

    sentiment:"Warning",

    entity:[
        "Microsoft",
        "Germany",
        "Security",
        "Authentication"
    ],

    attachments:[]

},

{
    id:3,

    sender:"HR Team",

    subject:"Leave Policy Update",

    received:"Yesterday",

    summary:[
        "HR has published the updated leave policy.",
        "Effective from July 2026.",
        "Employees must acknowledge the policy."
    ],

    explanation:
    "This email informs employees about a policy update. No action is required apart from reviewing and acknowledging the document.",

    threat:0,

    confidence:99,

    sentiment:"Positive",

    entity:[
        "HR",
        "Policy",
        "Employees"
    ],

    attachments:[
        {
            name:"LeavePolicy.pdf",
            size:"450 KB"
        }
    ]

}

];

/*=========================================================
            SELECT EMAIL
=========================================================*/

$(".summary-email").click(function(){

    $(".summary-email").removeClass("active");

    $(this).addClass("active");

    let index=$(this).index();

    loadEmail(index);

});

/*=========================================================
            LOAD EMAIL
=========================================================*/

function loadEmail(index){

    const mail=emailDatabase[index];

    /*=====================
        HEADER
    =====================*/

    $(".chat-header h2").text(mail.sender);

    $(".chat-header p").text(
        mail.subject+" • "+mail.received
    );

    /*=====================
        SUMMARY
    =====================*/

    let html="";

    mail.summary.forEach(function(item){

        html+="<li>"+item+"</li>";

    });

    $(".summary-box ul").html(html);

    $(".chat-message.ai .message p")
    .first()
    .text(mail.explanation);

    /*=====================
        THREAT
    =====================*/

    $(".circle h1").text(mail.threat+"%");

    if(mail.threat<15){

        $(".safe-badge")
        .text("SAFE")
        .css({
            background:"#E8FFF2",
            color:"#17B26A"
        });

    }

    else{

        $(".safe-badge")
        .text("WARNING")
        .css({
            background:"#FFF3E5",
            color:"#F97316"
        });

    }

    /*=====================
        CONFIDENCE
    =====================*/

    $(".analysis-title strong")
    .text(mail.confidence+"%");

    $(".progress-line span")
    .css("width",mail.confidence+"%");

    /*=====================
        ENTITIES
    =====================*/

    let tags="";

    mail.entity.forEach(function(tag){

        tags+="<span>"+tag+"</span>";

    });

    $(".entity-tags").html(tags);

    /*=====================
        ATTACHMENTS
    =====================*/

    let attach="";

    mail.attachments.forEach(function(file){

        attach+=`

        <div class="attachment-item">

            <i class="fa-solid fa-file"></i>

            <div>

                <strong>${file.name}</strong>

                <small>${file.size}</small>

            </div>

        </div>

        `;

    });

    if(mail.attachments.length==0){

        attach="<small>No attachments found.</small>";

    }

    $(".analysis-card")
    .eq(4)
    .find(".attachment-item")
    .parent()
    .html(attach);

}

/*=========================================================
                INITIAL LOAD
=========================================================*/

loadEmail(0);

