(function () {
  "use strict";

  // Figures used for the dollar estimates. Update these each year when CMS
  // publishes — they are also listed in .claude/CLAUDE.md's annual refresh list.
  // Part B standard premium 2026: $202.90/mo
  // Part D national base beneficiary premium 2026: $38.99/mo
  var PART_B_PREMIUM = 202.90;
  var PART_D_BASE = 38.99;

  var STR = {
    en: {
      legend: "Your date of birth",
      go: "Show my dates",
      win: "Your sign-up window",
      opens: "Opens",
      closes: "Closes",
      best: "Best time to sign up",
      bestBody: "Sign up in these three months and your coverage starts the first day of the month you turn 65 — no gap and no penalty.",
      startsIf: "When coverage starts",
      rowSign: "If you sign up…",
      rowStart: "Coverage starts…",
      before: "In the 3 months before your birthday month",
      bmonth: "In your birthday month",
      after1: "1 month after",
      after2: "2 months after",
      after3: "3 months after",
      firstDay: "the first day of",
      penaltyH: "What waiting could cost",
      penaltyBody: "If you miss the whole window and have no other creditable coverage, Part B adds 10% for each full year you could have had it — for as long as you have Medicare. Part D adds 1% of the national base premium for each month you went without.",
      pbLabel: "Part B penalty if you wait a year",
      pdLabel: "Part D penalty after 12 months without drug coverage",
      perMonth: "/month, for life",
      note: "Estimates using 2026 figures ($202.90 Part B standard premium; $38.99 Part D national base premium). Different rules apply if you are still working and covered by a large employer's plan, or if you qualify for a Special Enrollment Period.",
      born1: "Because you were born on the 1st, Medicare treats you as turning 65 in the previous month, so your window shifts one month earlier.",
      invalid: "Please enter the month, day and year you were born.",
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"]
    },
    es: {
      legend: "Su fecha de nacimiento",
      go: "Ver mis fechas",
      win: "Su período de inscripción",
      opens: "Comienza",
      closes: "Termina",
      best: "El mejor momento para inscribirse",
      bestBody: "Si se inscribe en estos tres meses, su cobertura comienza el primer día del mes en que cumple 65 años, sin interrupción ni multa.",
      startsIf: "Cuándo comienza la cobertura",
      rowSign: "Si se inscribe…",
      rowStart: "La cobertura comienza…",
      before: "En los 3 meses antes del mes de su cumpleaños",
      bmonth: "En el mes de su cumpleaños",
      after1: "1 mes después",
      after2: "2 meses después",
      after3: "3 meses después",
      firstDay: "el primer día de",
      penaltyH: "Lo que podría costarle esperar",
      penaltyBody: "Si deja pasar todo el período y no tiene otra cobertura acreditable, la Parte B agrega 10% por cada año completo que pudo haberla tenido, mientras tenga Medicare. La Parte D agrega 1% de la prima base nacional por cada mes sin cobertura de medicamentos.",
      pbLabel: "Multa de la Parte B si espera un año",
      pdLabel: "Multa de la Parte D tras 12 meses sin cobertura de medicamentos",
      perMonth: "/mes, de por vida",
      note: "Estimaciones con cifras de 2026 (prima estándar de la Parte B $202.90; prima base nacional de la Parte D $38.99). Las reglas son distintas si sigue trabajando con seguro de un empleador grande o si califica para un Período Especial de Inscripción.",
      born1: "Como nació el día 1, Medicare considera que cumple 65 años el mes anterior, así que su período se adelanta un mes.",
      invalid: "Indique el mes, el día y el año en que nació.",
      months: ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
    },
    "zh-Hant": {
      legend: "您的出生日期",
      go: "顯示我的日期",
      win: "您的報名期",
      opens: "開始",
      closes: "結束",
      best: "報名的最佳時機",
      bestBody: "在這三個月內報名，保險會從您年滿 65 歲當月的第一天開始，沒有空窗期，也沒有罰款。",
      startsIf: "保險何時開始",
      rowSign: "如果您在…報名",
      rowStart: "保險開始於…",
      before: "生日當月前的 3 個月",
      bmonth: "生日當月",
      after1: "之後 1 個月",
      after2: "之後 2 個月",
      after3: "之後 3 個月",
      firstDay: "的第一天：",
      penaltyH: "延遲報名可能的代價",
      penaltyBody: "若您錯過整個報名期且沒有其他合格保險，B 部分每滿一年會加收 10%，只要您持有 Medicare 就一直加收。D 部分則每個月加收全國基準保費的 1%。",
      pbLabel: "延遲一年的 B 部分罰款",
      pdLabel: "沒有藥物保險 12 個月後的 D 部分罰款",
      perMonth: "／月，終身",
      note: "以 2026 年數字估算（B 部分標準保費 $202.90；D 部分全國基準保費 $38.99）。若您仍在工作並有大型雇主保險，或符合特殊報名期，適用規則不同。",
      born1: "由於您在 1 日出生，Medicare 視為您在前一個月年滿 65 歲，因此報名期提前一個月。",
      invalid: "請輸入您出生的月、日與年份。",
      months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
    },
    "vi": {
      legend: "Ngày sinh của bạn",
      go: "Xem ngày của tôi",
      win: "Thời gian đăng ký của bạn",
      opens: "Bắt đầu",
      closes: "Kết thúc",
      best: "Thời điểm tốt nhất để đăng ký",
      bestBody: "Đăng ký trong ba tháng này thì bảo hiểm bắt đầu vào ngày đầu tiên của tháng bạn tròn 65 tuổi — không gián đoạn, không bị phạt.",
      startsIf: "Khi nào bảo hiểm bắt đầu",
      rowSign: "Nếu bạn đăng ký…",
      rowStart: "Bảo hiểm bắt đầu…",
      before: "Trong 3 tháng trước tháng sinh nhật",
      bmonth: "Trong tháng sinh nhật của bạn",
      after1: "1 tháng sau",
      after2: "2 tháng sau",
      after3: "3 tháng sau",
      firstDay: "ngày đầu tiên của",
      penaltyH: "Cái giá của việc chờ đợi",
      penaltyBody: "Nếu bạn bỏ lỡ toàn bộ thời gian đăng ký và không có bảo hiểm hợp lệ khác, Part B sẽ tăng thêm 10% cho mỗi năm đầy đủ bạn đáng lẽ đã có — trong suốt thời gian bạn có Medicare. Part D tăng thêm 1% phí bảo hiểm cơ bản toàn quốc cho mỗi tháng không có bảo hiểm.",
      pbLabel: "Mức phạt Part B nếu chờ một năm",
      pdLabel: "Mức phạt Part D sau 12 tháng không có bảo hiểm thuốc",
      perMonth: "/tháng, suốt đời",
      note: "Ước tính dựa trên số liệu năm 2026 (phí bảo hiểm chuẩn Part B $202.90; phí bảo hiểm cơ bản toàn quốc Part D $38.99). Quy định khác áp dụng nếu bạn vẫn đang làm việc và có bảo hiểm từ chủ lao động lớn, hoặc nếu bạn đủ điều kiện cho Thời Gian Đăng Ký Đặc Biệt.",
      born1: "Vì bạn sinh vào ngày 1, Medicare coi bạn tròn 65 tuổi vào tháng trước đó, nên thời gian đăng ký của bạn dịch sớm hơn một tháng.",
      invalid: "Vui lòng nhập tháng, ngày và năm sinh của bạn.",
      months: ["Tháng Một","Tháng Hai","Tháng Ba","Tháng Tư","Tháng Năm","Tháng Sáu","Tháng Bảy","Tháng Tám","Tháng Chín","Tháng Mười","Tháng Mười Một","Tháng Mười Hai"]},
    "ko": {
      legend: "생년월일",
      go: "내 일정 보기",
      win: "가입 가능 기간",
      opens: "시작일",
      closes: "마감일",
      best: "가입하기 가장 좋은 시기",
      bestBody: "이 세 달 안에 가입하면 만 65세가 되는 달의 1일부터 공백이나 벌금 없이 보장이 시작됩니다.",
      startsIf: "보장 시작 시점",
      rowSign: "가입 시기…",
      rowStart: "보장 시작…",
      before: "생일이 있는 달 이전 3개월 안",
      bmonth: "생일이 있는 달에",
      after1: "1개월 후",
      after2: "2개월 후",
      after3: "3개월 후",
      firstDay: "의 1일",
      penaltyH: "기다리면 드는 비용",
      penaltyBody: "가입 가능 기간을 놓치고 다른 유효 보장이 없으면, Part B는 가입할 수 있었던 매 1년마다 보험료가 10%씩 올라가며 Medicare를 유지하는 동안 계속 적용됩니다. Part D는 보장 없이 지낸 매달마다 전국 기본 보험료의 1%가 추가됩니다.",
      pbLabel: "1년 늦게 가입할 경우 Part B 벌금",
      pdLabel: "약제 보장 없이 12개월 경과 시 Part D 벌금",
      perMonth: "/월, 평생",
      note: "2026년 기준 수치 사용 (Part B 표준 보험료 $202.90; Part D 전국 기본 보험료 $38.99). 대기업 고용주 보험에 가입된 상태로 계속 근무 중이거나 특별 가입 기간 자격이 있는 경우에는 다른 규정이 적용됩니다.",
      born1: "1일에 태어나셨기 때문에 Medicare는 전달에 만 65세가 되는 것으로 간주하여 가입 가능 기간이 한 달 앞당겨집니다.",
      invalid: "생년월일(월, 일, 년)을 입력해 주세요.",
      months: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]}
  };

  function lang() {
    var p = window.location.pathname;
    if (p.indexOf("/es/") === 0) return "es";
    if (p.indexOf("/zh-Hant/") === 0) return "zh-Hant";
    return "en";
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function monthLabel(t, y, m) {
    // m is 0-based; roll over safely
    var d = new Date(y, m, 1);
    return t.months[d.getMonth()] + " " + d.getFullYear();
  }

  function compute(t, birthYear, birthMonth, birthDay) {
    // Medicare treats someone born on the 1st as turning 65 the previous
    // month, which shifts the whole window one month earlier.
    var bornFirst = birthDay === 1;
    var refMonth = birthMonth + (bornFirst ? -1 : 0);   // 0-based, may be -1
    var turn65Year = birthYear + 65;
    var open = new Date(turn65Year, refMonth - 3, 1);
    var close = new Date(turn65Year, refMonth + 4, 0);  // last day of +3 month
    return {
      bornFirst: bornFirst,
      open: open,
      close: close,
      refMonth: refMonth,
      year: turn65Year,
      coverageIfEarly: new Date(turn65Year, refMonth, 1),
      coverageIfMonth: new Date(turn65Year, refMonth + 1, 1),
      coverageIfAfter1: new Date(turn65Year, refMonth + 2, 1),
      coverageIfAfter2: new Date(turn65Year, refMonth + 3, 1),
      coverageIfAfter3: new Date(turn65Year, refMonth + 4, 1)
    };
  }

  function fmt(t, d) {
    return t.months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function render(host, t, r) {
    host.innerHTML = "";
    var win = el("div", "calc-result");
    var h = el("h3", null, t.win);
    win.appendChild(h);
    var p = el("p");
    p.innerHTML = "<strong>" + t.opens + ":</strong> " + fmt(t, r.open) +
                  " &nbsp;·&nbsp; <strong>" + t.closes + ":</strong> " + fmt(t, r.close);
    win.appendChild(p);
    if (r.bornFirst) win.appendChild(el("p", "calc-note", t.born1));

    var best = el("div", "calc-best");
    best.appendChild(el("h3", null, t.best));
    best.appendChild(el("p", null, t.bestBody));
    win.appendChild(best);

    var tbl = el("table", "calc-table");
    var thead = el("thead");
    var hr = el("tr");
    hr.appendChild(el("th", null, t.rowSign));
    hr.appendChild(el("th", null, t.rowStart));
    thead.appendChild(hr);
    tbl.appendChild(thead);
    var tb = el("tbody");
    [[t.before, r.coverageIfEarly], [t.bmonth, r.coverageIfMonth],
     [t.after1, r.coverageIfAfter1], [t.after2, r.coverageIfAfter2],
     [t.after3, r.coverageIfAfter3]].forEach(function (row) {
      var tr = el("tr");
      tr.appendChild(el("td", null, row[0]));
      tr.appendChild(el("td", null, t.firstDay + " " + monthLabel(t, row[1].getFullYear(), row[1].getMonth())));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    var scroll = el("div", "table-scroll");
    scroll.appendChild(tbl);
    win.appendChild(el("h3", null, t.startsIf));
    win.appendChild(scroll);

    var pen = el("div", "calc-penalty");
    pen.appendChild(el("h3", null, t.penaltyH));
    pen.appendChild(el("p", null, t.penaltyBody));
    var pb = (PART_B_PREMIUM * 0.10);
    var pd = (PART_D_BASE * 0.12);
    var ul = el("ul");
    var li1 = el("li");
    li1.innerHTML = t.pbLabel + ": <strong>+$" + pb.toFixed(2) + t.perMonth + "</strong>";
    var li2 = el("li");
    li2.innerHTML = t.pdLabel + ": <strong>+$" + pd.toFixed(2) + t.perMonth + "</strong>";
    ul.appendChild(li1); ul.appendChild(li2);
    pen.appendChild(ul);
    pen.appendChild(el("p", "calc-note", t.note));
    win.appendChild(pen);
    host.appendChild(win);
  }

  function init() {
    var host = document.getElementById("enrollment-calculator");
    if (!host) return;
    var t = STR[lang()] || STR.en;
    var form = el("form", "calc-form");
    var fs = el("fieldset");
    fs.appendChild(el("legend", null, t.legend));
    var mSel = el("select"); mSel.id = "calc-month";
    t.months.forEach(function (m, i) {
      var o = el("option", null, m); o.value = i; mSel.appendChild(o);
    });
    var dSel = el("select"); dSel.id = "calc-day";
    for (var d = 1; d <= 31; d++) { var o = el("option", null, String(d)); o.value = d; dSel.appendChild(o); }
    var yIn = el("input"); yIn.type = "number"; yIn.id = "calc-year";
    yIn.min = "1900"; yIn.max = String(new Date().getFullYear());
    yIn.placeholder = "1961";
    var btn = el("button", null, t.go); btn.type = "submit";
    [mSel, dSel, yIn, btn].forEach(function (n) { fs.appendChild(n); });
    form.appendChild(fs);
    var out = el("div"); out.id = "calc-output"; out.setAttribute("aria-live", "polite");
    host.appendChild(form); host.appendChild(out);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var y = parseInt(yIn.value, 10);
      if (!y || y < 1900 || y > new Date().getFullYear()) {
        out.innerHTML = ""; out.appendChild(el("p", "calc-note", t.invalid)); return;
      }
      render(out, t, compute(t, y, parseInt(mSel.value, 10), parseInt(dSel.value, 10)));
      if (window.gtag) { gtag("event", "calculator_used", { page_path: location.pathname }); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
