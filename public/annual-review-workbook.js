/* MediPrimer — Annual Review Workbook.
   A fillable, printable worksheet for the Oct 15 – Dec 7 window: what changed
   in your plan's notice, whether your drugs and doctors survive the change,
   and a side-by-side comparison to decide with. Answers persist in this
   browser only (localStorage) so it can be filled over several sittings —
   nothing is sent anywhere, which matters for a page that asks about drugs. */
(function () {
  "use strict";

  var root = document.getElementById("annual-review-workbook");
  if (!root) return;

  var YEAR = 2027;             // the plan year being reviewed
  var KEY = "mp-workbook-" + YEAR;

  var STR = {
    en: {
      s1: "1. Your plan today",
      s1h: "Find these on your plan card and your most recent bill.",
      planName: "Plan name",
      planType: "Plan type (Advantage, Part D, Medigap…)",
      premium: "What you pay each month now",
      s2: "2. What the notice says is changing",
      s2h: "Your plan mailed an Annual Notice of Change by the end of September. Compare next year's numbers with this year's.",
      nextPremium: "Monthly premium next year",
      nextDeductible: "Deductible next year",
      nextOOP: "Out-of-pocket maximum next year",
      biggest: "The change that worries you most",
      s3: "3. Your prescriptions",
      s3h: "The single most common reason to switch plans is a drug leaving the plan's list or moving to a costlier tier.",
      drug: "Drug",
      covered: "Still covered next year?",
      cost: "What it will cost",
      s4: "4. Your doctors and pharmacy",
      s4h: "Networks change every year. Check each one for next year, not this year.",
      provider: "Doctor, hospital or pharmacy",
      inNetwork: "Still in network next year?",
      s5: "5. Compare before you decide",
      s5h: "Put your current plan beside anything you are considering. Medicare's Plan Finder shows what each would cost with your drugs.",
      option: "Option",
      monthly: "Monthly premium",
      drugsCovered: "Your drugs covered?",
      doctorsIn: "Your doctors in network?",
      yearlyEst: "Estimated cost for the year",
      current: "My current plan",
      alt1: "Alternative 1",
      alt2: "Alternative 2",
      s6: "6. Your decision",
      s6h: "If you do nothing, most plans renew automatically with next year's changes applied.",
      decision: "What I decided",
      deadline: "Deadline: December 7",
      doneBy: "I will act by",
      print: "Print this workbook",
      clear: "Clear all answers",
      saved: "Saved in this browser only — nothing is sent anywhere.",
      addRow: "Add another"
    },
    es: {
      s1: "1. Su plan actual",
      s1h: "Encuentre estos datos en su tarjeta del plan y en su factura más reciente.",
      planName: "Nombre del plan",
      planType: "Tipo de plan (Advantage, Parte D, Medigap…)",
      premium: "Lo que paga cada mes ahora",
      s2: "2. Lo que dice el aviso que va a cambiar",
      s2h: "Su plan envió un Aviso Anual de Cambios a finales de septiembre. Compare las cifras del próximo año con las de este año.",
      nextPremium: "Prima mensual del próximo año",
      nextDeductible: "Deducible del próximo año",
      nextOOP: "Máximo de gastos de bolsillo del próximo año",
      biggest: "El cambio que más le preocupa",
      s3: "3. Sus medicamentos recetados",
      s3h: "La razón más común para cambiar de plan es que un medicamento salga de la lista del plan o pase a un nivel más caro.",
      drug: "Medicamento",
      covered: "¿Sigue cubierto el próximo año?",
      cost: "Cuánto costará",
      s4: "4. Sus médicos y su farmacia",
      s4h: "Las redes cambian cada año. Verifique cada uno para el próximo año, no para este.",
      provider: "Médico, hospital o farmacia",
      inNetwork: "¿Sigue en la red el próximo año?",
      s5: "5. Compare antes de decidir",
      s5h: "Ponga su plan actual junto a los que esté considerando. El Buscador de Planes de Medicare muestra lo que costaría cada uno con sus medicamentos.",
      option: "Opción",
      monthly: "Prima mensual",
      drugsCovered: "¿Cubre sus medicamentos?",
      doctorsIn: "¿Sus médicos en la red?",
      yearlyEst: "Costo estimado del año",
      current: "Mi plan actual",
      alt1: "Alternativa 1",
      alt2: "Alternativa 2",
      s6: "6. Su decisión",
      s6h: "Si no hace nada, la mayoría de los planes se renuevan automáticamente con los cambios del próximo año.",
      decision: "Lo que decidí",
      deadline: "Fecha límite: 7 de diciembre",
      doneBy: "Actuaré antes del",
      print: "Imprimir este cuaderno",
      clear: "Borrar todas las respuestas",
      saved: "Guardado solo en este navegador; no se envía a ningún sitio.",
      addRow: "Añadir otro"
    },
    "zh-Hant": {
      s1: "1. 您目前的計畫",
      s1h: "這些資料可在您的計畫卡和最近一期帳單上找到。",
      planName: "計畫名稱",
      planType: "計畫類型（Advantage、D 部分、Medigap…）",
      premium: "您目前每月支付的金額",
      s2: "2. 通知說明會有哪些變動",
      s2h: "您的計畫已在九月底前寄出年度變更通知。請比較明年與今年的數字。",
      nextPremium: "明年每月保費",
      nextDeductible: "明年自付額",
      nextOOP: "明年自付上限",
      biggest: "您最擔心的變動",
      s3: "3. 您的處方藥",
      s3h: "換計畫最常見的原因，是某種藥物被移出計畫藥品清單或調到更貴的級別。",
      drug: "藥物",
      covered: "明年仍有給付嗎？",
      cost: "費用為何",
      s4: "4. 您的醫師與藥局",
      s4h: "網絡每年都會變動。請確認明年的狀況，而非今年。",
      provider: "醫師、醫院或藥局",
      inNetwork: "明年仍在網絡內嗎？",
      s5: "5. 決定前先比較",
      s5h: "把目前的計畫與考慮中的計畫並排比較。Medicare 的計畫搜尋工具會依您的藥物顯示各計畫的費用。",
      option: "選項",
      monthly: "每月保費",
      drugsCovered: "涵蓋您的藥物嗎？",
      doctorsIn: "您的醫師在網絡內嗎？",
      yearlyEst: "全年預估費用",
      current: "我目前的計畫",
      alt1: "替代方案 1",
      alt2: "替代方案 2",
      s6: "6. 您的決定",
      s6h: "若您不採取行動，多數計畫會自動續保並套用明年的變動。",
      decision: "我的決定",
      deadline: "截止日：12 月 7 日",
      doneBy: "我會在此日期前行動",
      print: "列印此工作手冊",
      clear: "清除所有答案",
      saved: "僅儲存在此瀏覽器，不會傳送到任何地方。",
      addRow: "再新增一列"
    },
    "vi": {
      s1: "1. Gói bảo hiểm hiện tại của bạn",
      s1h: "Tìm thông tin này trên thẻ gói bảo hiểm và hóa đơn gần nhất của bạn.",
      planName: "Tên gói bảo hiểm",
      planType: "Loại gói (Advantage, Part D, Medigap…)",
      premium: "Số tiền bạn trả mỗi tháng hiện nay",
      s2: "2. Thông báo cho biết điều gì sẽ thay đổi",
      s2h: "Gói bảo hiểm của bạn đã gửi Thông Báo Thay Đổi Hằng Năm trước cuối tháng Chín. So sánh số liệu năm tới với năm nay.",
      nextPremium: "Phí bảo hiểm hằng tháng năm tới",
      nextDeductible: "Mức khấu trừ năm tới",
      nextOOP: "Mức chi trả tối đa năm tới",
      biggest: "Thay đổi khiến bạn lo lắng nhất",
      s3: "3. Thuốc theo toa của bạn",
      s3h: "Lý do phổ biến nhất để đổi gói bảo hiểm là một loại thuốc bị loại khỏi danh sách hoặc chuyển sang bậc giá cao hơn.",
      drug: "Thuốc",
      covered: "Vẫn được chi trả năm tới?",
      cost: "Chi phí sẽ là bao nhiêu",
      s4: "4. Bác sĩ và nhà thuốc của bạn",
      s4h: "Mạng lưới thay đổi mỗi năm. Hãy kiểm tra từng nơi cho năm tới, không phải năm nay.",
      provider: "Bác sĩ, bệnh viện hoặc nhà thuốc",
      inNetwork: "Vẫn trong mạng lưới năm tới?",
      s5: "5. So sánh trước khi quyết định",
      s5h: "Đặt gói hiện tại của bạn cạnh bất kỳ gói nào bạn đang cân nhắc. Plan Finder của Medicare cho biết chi phí mỗi gói với thuốc của bạn.",
      option: "Lựa chọn",
      monthly: "Phí bảo hiểm hằng tháng",
      drugsCovered: "Thuốc của bạn được chi trả?",
      doctorsIn: "Bác sĩ của bạn trong mạng lưới?",
      yearlyEst: "Chi phí ước tính cho cả năm",
      current: "Gói hiện tại của tôi",
      alt1: "Lựa chọn thay thế 1",
      alt2: "Lựa chọn thay thế 2",
      s6: "6. Quyết định của bạn",
      s6h: "Nếu bạn không làm gì, hầu hết các gói sẽ tự động gia hạn với thay đổi của năm tới.",
      decision: "Quyết định của tôi",
      deadline: "Hạn chót: ngày 7 tháng 12",
      doneBy: "Tôi sẽ hành động trước ngày",
      print: "In tài liệu này",
      clear: "Xóa tất cả câu trả lời",
      saved: "Chỉ lưu trong trình duyệt này — không gửi đi đâu cả.",
      addRow: "Thêm mục khác"},
    "ko": {
      s1: "1. 현재 내 플랜",
      s1h: "플랜 카드와 최근 청구서에서 확인하세요.",
      planName: "플랜 이름",
      planType: "플랜 유형 (Advantage, Part D, Medigap 등)",
      premium: "현재 매달 내는 금액",
      s2: "2. 안내문에 나온 변경 사항",
      s2h: "플랜에서 9월 말까지 연간 변경 안내문(Annual Notice of Change)을 발송했습니다. 내년 수치를 올해와 비교하세요.",
      nextPremium: "내년 월 보험료",
      nextDeductible: "내년 공제액",
      nextOOP: "내년 본인부담 상한액",
      biggest: "가장 걱정되는 변경 사항",
      s3: "3. 내 처방약",
      s3h: "플랜 변경의 가장 흔한 이유는 약이 플랜 목록에서 빠지거나 더 비싼 등급으로 이동하는 것입니다.",
      drug: "약물",
      covered: "내년에도 보장되나요?",
      cost: "예상 비용",
      s4: "4. 내 의사와 약국",
      s4h: "네트워크는 매년 바뀝니다. 올해가 아니라 내년 기준으로 각각 확인하세요.",
      provider: "의사, 병원 또는 약국",
      inNetwork: "내년에도 네트워크 안에 있나요?",
      s5: "5. 결정하기 전에 비교하기",
      s5h: "현재 플랜을 고려 중인 다른 플랜과 나란히 비교하세요. Medicare의 Plan Finder에서 내 약 기준 예상 비용을 확인할 수 있습니다.",
      option: "선택지",
      monthly: "월 보험료",
      drugsCovered: "내 약이 보장되나요?",
      doctorsIn: "내 의사가 네트워크 안에 있나요?",
      yearlyEst: "연간 예상 비용",
      current: "현재 내 플랜",
      alt1: "대안 1",
      alt2: "대안 2",
      s6: "6. 내 결정",
      s6h: "아무 조치도 하지 않으면 대부분의 플랜은 내년 변경 사항이 적용된 채로 자동 갱신됩니다.",
      decision: "내가 내린 결정",
      deadline: "마감일: 12월 7일",
      doneBy: "이 날짜까지 처리하겠습니다",
      print: "이 워크북 인쇄하기",
      clear: "모든 답변 지우기",
      saved: "이 브라우저에만 저장되며 어디로도 전송되지 않습니다.",
      addRow: "항목 추가"}
  };

  function lang() {
    var p = window.location.pathname;
    if (p.indexOf("/es/") === 0) return "es";
    if (p.indexOf("/zh-Hant/") === 0) return "zh-Hant";
    return "en";
  }
  var t = STR[lang()] || STR.en;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  var data = load();

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function field(name, label, wide) {
    var wrap = el("div", "wb-field" + (wide ? " wb-wide" : ""));
    var l = el("label", null, label);
    l.setAttribute("for", "wb-" + name);
    var i = el("input");
    i.type = "text"; i.id = "wb-" + name; i.value = data[name] || "";
    i.addEventListener("input", function () { data[name] = i.value; save(data); });
    wrap.appendChild(l); wrap.appendChild(i);
    return wrap;
  }

  function section(title, hint) {
    var s = el("section", "wb-section");
    s.appendChild(el("h2", null, title));
    if (hint) s.appendChild(el("p", "wb-hint", hint));
    return s;
  }

  function rowTable(prefix, headers, rows) {
    var scroll = el("div", "table-scroll");
    var tbl = el("table", "wb-table");
    var thead = el("thead"), hr = el("tr");
    headers.forEach(function (h) { hr.appendChild(el("th", null, h)); });
    thead.appendChild(hr); tbl.appendChild(thead);
    var tb = el("tbody");
    for (var r = 0; r < rows; r++) {
      var tr = el("tr");
      for (var c = 0; c < headers.length; c++) {
        var td = el("td");
        var name = prefix + "-" + r + "-" + c;
        var i = el("input");
        i.type = "text"; i.value = data[name] || "";
        (function (n, inp) {
          inp.addEventListener("input", function () { data[n] = inp.value; save(data); });
        })(name, i);
        td.appendChild(i); tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
    tbl.appendChild(tb); scroll.appendChild(tbl);
    return scroll;
  }

  // 1 — current plan
  var s1 = section(t.s1, t.s1h);
  var g1 = el("div", "wb-grid");
  g1.appendChild(field("planName", t.planName, true));
  g1.appendChild(field("planType", t.planType));
  g1.appendChild(field("premium", t.premium));
  s1.appendChild(g1); root.appendChild(s1);

  // 2 — what changes
  var s2 = section(t.s2, t.s2h);
  var g2 = el("div", "wb-grid");
  g2.appendChild(field("nextPremium", t.nextPremium));
  g2.appendChild(field("nextDeductible", t.nextDeductible));
  g2.appendChild(field("nextOOP", t.nextOOP));
  g2.appendChild(field("biggest", t.biggest, true));
  s2.appendChild(g2); root.appendChild(s2);

  // 3 — drugs
  var s3 = section(t.s3, t.s3h);
  s3.appendChild(rowTable("drug", [t.drug, t.covered, t.cost], 6));
  root.appendChild(s3);

  // 4 — providers
  var s4 = section(t.s4, t.s4h);
  s4.appendChild(rowTable("prov", [t.provider, t.inNetwork], 5));
  root.appendChild(s4);

  // 5 — comparison
  var s5 = section(t.s5, t.s5h);
  s5.appendChild(rowTable("cmp", [t.option, t.monthly, t.drugsCovered, t.doctorsIn, t.yearlyEst], 3));
  root.appendChild(s5);

  // 6 — decision
  var s6 = section(t.s6, t.s6h);
  var g6 = el("div", "wb-grid");
  g6.appendChild(field("decision", t.decision, true));
  g6.appendChild(field("doneBy", t.doneBy));
  s6.appendChild(g6);
  s6.appendChild(el("p", "wb-deadline", t.deadline));
  root.appendChild(s6);

  var actions = el("div", "wb-actions");
  var printBtn = el("button", "wb-print", t.print);
  printBtn.type = "button";
  printBtn.addEventListener("click", function () { window.print(); });
  var clearBtn = el("button", "wb-clear", t.clear);
  clearBtn.type = "button";
  clearBtn.addEventListener("click", function () {
    data = {};
    try { localStorage.removeItem(KEY); } catch (e) {}
    root.querySelectorAll("input").forEach(function (i) { i.value = ""; });
  });
  actions.appendChild(printBtn); actions.appendChild(clearBtn);
  actions.appendChild(el("p", "wb-hint", t.saved));
  root.appendChild(actions);
})();
