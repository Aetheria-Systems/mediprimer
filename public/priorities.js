/* MediPrimer "What matters most to you?" — a priorities sorter for the
   Original Medicare vs. Medicare Advantage decision. It clarifies what the
   PERSON values and shows how each value maps to the tradeoffs. It is NOT a
   recommender: it never tells you which to buy, and both paths are legitimate. */
(function () {
  "use strict";

  /* Translations. Keys are the English source strings, so a missing
     translation degrades to English rather than breaking the tool.
     Filled by build/gen_tool_strings.py; enforced by
     build/check_language_coverage.py. */
  var I18N = {
    "en": {},   // English is the fallback: the t() key is the source string
    "es": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Ver a cualquier médico u hospital que acepte Medicare, y mantener a mis propios médicos",
    "A lower monthly premium": "Una prima mensual más baja",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Medicare Original no tiene red; Medicare Advantage usa redes locales a cambio de primas más bajas.",
    "Predictable, steady costs I can budget for": "Costos estables y predecibles que puedo presupuestar",
    "Paying less month to month, with copays as I go": "Pagar menos cada mes, con copagos según los uso",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Medicare Original + un suplemento Medigap hace que los costos sean muy predecibles (a cambio de una prima); Advantage es más bajo al inicio pero varía según el uso, hasta un límite anual.",
    "Freedom to travel or live part of the year in another state": "Libertad para viajar o vivir parte del año en otro estado",
    "Extra benefits like dental, vision, or hearing": "Beneficios adicionales como dental, visión o audición",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Medicare Original funciona en todo el país; Advantage es local pero a menudo incluye extras que Medicare Original no cubre.",
    "Rarely needing a plan's approval before I get care": "Casi nunca necesitar la aprobación de un plan antes de recibir atención",
    "Having everything — including drug coverage — in one plan": "Tener todo — incluida la cobertura de medicamentos — en un solo plan",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage a menudo requiere autorización previa e incluye la Parte D; Medicare Original rara vez requiere aprobación, pero usted agrega la cobertura de medicamentos y el suplemento por separado.",
    "Being able to change my coverage later, even if my health declines": "Poder cambiar mi cobertura más adelante, incluso si mi salud empeora",
    "The lowest cost now, while I'm healthy": "El costo más bajo ahora, mientras estoy sano",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Esta es la puerta de un solo sentido: si comienza con Advantage, un cambio posterior a Medicare Original + Medigap puede requerir una evaluación médica. Sopese la flexibilidad futura frente al ahorro de ahora.",
    "Which matters more to you?": "¿Qué es más importante para usted?",
    "No strong preference": "Sin preferencia marcada",
    "What matters most to you?": "¿Qué es lo más importante para usted?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "El camino correcto depende de lo que usted valora. Elija lo que le importa más en cada par. Esto no recomienda un plan — muestra cómo sus prioridades se alinean con las compensaciones.",
    "See how my priorities line up": "Ver cómo se alinean mis prioridades",
    "Original Medicare": "Medicare Original",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "mixto",
    "Why": "Por qué",
    "Start over": "Empezar de nuevo"
},
    "zh-Hant": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "只要是接受 Medicare 的醫生或醫院都能看診，並保留我原本的醫生",
    "A lower monthly premium": "較低的每月保費",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "原始 Medicare 沒有網絡限制；Medicare Advantage 使用當地網絡,以換取較低的保費。",
    "Predictable, steady costs I can budget for": "穩定、可預測的費用,方便我做預算",
    "Paying less month to month, with copays as I go": "每個月付得較少,依看診情況支付部分負擔",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "原始 Medicare 加上 Medigap 補充保險,費用非常可預測(需支付保費);Advantage 一開始費用較低,但會依使用情況而變動,最高到達年度上限。",
    "Freedom to travel or live part of the year in another state": "可以自由旅行,或一年中有部分時間住在其他州",
    "Extra benefits like dental, vision, or hearing": "額外的福利,例如牙科、視力或聽力",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "原始 Medicare 在全國都適用;Advantage 屬於當地性,但通常會附加原始 Medicare 不涵蓋的額外福利。",
    "Rarely needing a plan's approval before I get care": "看診前很少需要計畫的事先核准",
    "Having everything — including drug coverage — in one plan": "所有保障(包括藥物保障)都在同一個計畫裡",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage 通常需要事先核准,並且包含 Part D;原始 Medicare 很少需要事先核准,但您需要另外加保藥物和補充保險。",
    "Being able to change my coverage later, even if my health declines": "即使日後健康狀況變差,仍能更改保障",
    "The lowest cost now, while I'm healthy": "趁現在身體健康,先享有最低的費用",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "這是一扇單向門:先選擇 Advantage,之後想改成原始 Medicare 加 Medigap,可能需要接受醫療核保。請衡量未來的彈性與現在省錢之間的取捨。",
    "Which matters more to you?": "哪一項對您比較重要?",
    "No strong preference": "沒有特別偏好",
    "What matters most to you?": "什麼對您最重要?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "適合的方向要看您重視什麼。請在每一組選項中選出比較重要的一項。這並不是在推薦某個計畫,而是幫您了解自己的優先考量與取捨之間的關係。",
    "See how my priorities line up": "查看我的優先考量結果",
    "Original Medicare": "原始 Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "兩者兼顧",
    "Why": "原因",
    "Start over": "重新開始"
},
    "vi": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Được khám với bất kỳ bác sĩ hoặc bệnh viện nào nhận Medicare, và giữ được bác sĩ hiện tại của tôi",
    "A lower monthly premium": "Phí bảo hiểm hàng tháng thấp hơn",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Original Medicare không có mạng lưới giới hạn; Medicare Advantage dùng mạng lưới địa phương để đổi lấy phí bảo hiểm thấp hơn.",
    "Predictable, steady costs I can budget for": "Chi phí ổn định, có thể dự đoán để tôi lên kế hoạch chi tiêu",
    "Paying less month to month, with copays as I go": "Trả ít hơn mỗi tháng, và trả copay khi cần dùng dịch vụ",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Original Medicare cộng với bảo hiểm bổ sung Medigap giúp chi phí rất dễ dự đoán (đổi lại phải trả phí bảo hiểm); Advantage có chi phí ban đầu thấp hơn nhưng thay đổi tùy theo mức sử dụng, tối đa đến mức trần hàng năm.",
    "Freedom to travel or live part of the year in another state": "Tự do đi du lịch hoặc sống một phần thời gian trong năm ở tiểu bang khác",
    "Extra benefits like dental, vision, or hearing": "Các quyền lợi thêm như nha khoa, thị lực, hoặc thính lực",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Original Medicare có hiệu lực trên toàn quốc; Advantage mang tính địa phương nhưng thường đi kèm các quyền lợi thêm mà Original Medicare không chi trả.",
    "Rarely needing a plan's approval before I get care": "Hiếm khi cần chương trình bảo hiểm phê duyệt trước khi tôi được chăm sóc",
    "Having everything — including drug coverage — in one plan": "Có mọi thứ — kể cả bảo hiểm thuốc — trong một chương trình duy nhất",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage thường yêu cầu phê duyệt trước và đã bao gồm Part D; Original Medicare hiếm khi cần phê duyệt nhưng bạn phải thêm bảo hiểm thuốc và bảo hiểm bổ sung riêng.",
    "Being able to change my coverage later, even if my health declines": "Có thể thay đổi bảo hiểm sau này, ngay cả khi sức khỏe tôi giảm sút",
    "The lowest cost now, while I'm healthy": "Chi phí thấp nhất ngay bây giờ, khi tôi còn khỏe mạnh",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Đây là quyết định khó đảo ngược: nếu bắt đầu với Advantage rồi sau đó muốn chuyển sang Original Medicare cộng với Medigap, bạn có thể phải trải qua thẩm định y tế. Hãy cân nhắc giữa sự linh hoạt trong tương lai và việc tiết kiệm ngay bây giờ.",
    "Which matters more to you?": "Điều nào quan trọng hơn với bạn?",
    "No strong preference": "Không có ưu tiên rõ ràng",
    "What matters most to you?": "Điều gì quan trọng nhất với bạn?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "Con đường phù hợp tùy thuộc vào điều bạn coi trọng. Hãy chọn điều quan trọng hơn trong mỗi cặp. Công cụ này không đề xuất chương trình bảo hiểm nào — nó chỉ cho thấy các ưu tiên của bạn phù hợp với những sự đánh đổi ra sao.",
    "See how my priorities line up": "Xem các ưu tiên của tôi phù hợp ra sao",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "kết hợp",
    "Why": "Vì sao",
    "Start over": "Bắt đầu lại"
},
    "ko": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Medicare를 받는 병원이나 의사를 자유롭게 만나고, 지금 다니는 의사를 계속 볼 수 있는 것",
    "A lower monthly premium": "더 낮은 월 보험료",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Original Medicare는 네트워크 제한이 없습니다. Medicare Advantage는 더 낮은 보험료 대신 지역 네트워크를 사용합니다.",
    "Predictable, steady costs I can budget for": "미리 예산을 세울 수 있는, 예측 가능하고 일정한 비용",
    "Paying less month to month, with copays as I go": "매달 적게 내고, 진료를 받을 때마다 본인부담금을 내는 방식",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Original Medicare와 Medigap 보충보험을 함께 쓰면 (보험료를 내는 대신) 비용을 아주 예측하기 쉬워집니다. Advantage는 처음에는 더 저렴하지만 이용에 따라 달라지며, 연간 한도까지 오를 수 있습니다.",
    "Freedom to travel or live part of the year in another state": "여행을 다니거나 한 해 중 일부를 다른 주에서 지낼 수 있는 자유",
    "Extra benefits like dental, vision, or hearing": "치과, 시력, 청력 같은 추가 혜택",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Original Medicare는 전국 어디서나 이용할 수 있습니다. Advantage는 지역 중심이지만, Original Medicare가 보장하지 않는 추가 혜택을 함께 제공하는 경우가 많습니다.",
    "Rarely needing a plan's approval before I get care": "진료를 받기 전에 플랜의 승인을 거의 받을 필요가 없는 것",
    "Having everything — including drug coverage — in one plan": "약값 보장을 포함해 모든 것을 하나의 플랜으로 이용하는 것",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage는 사전 승인이 필요한 경우가 많고 Part D를 함께 제공합니다. Original Medicare는 승인이 거의 필요 없지만, 약값 보장과 보충보험은 따로 가입해야 합니다.",
    "Being able to change my coverage later, even if my health declines": "건강이 나빠지더라도 나중에 보장 내용을 바꿀 수 있는 것",
    "The lowest cost now, while I'm healthy": "건강할 때 지금 가장 낮은 비용으로 이용하는 것",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "이것은 되돌리기 어려운 선택입니다. Advantage로 시작한 뒤 나중에 Original Medicare와 Medigap으로 바꾸려면 건강 심사를 거쳐야 할 수 있습니다. 지금 아끼는 것과 앞으로의 선택의 폭을 잘 비교해 보세요.",
    "Which matters more to you?": "어느 쪽이 나에게 더 중요한가요?",
    "No strong preference": "특별히 선호하지 않음",
    "What matters most to you?": "나에게 가장 중요한 것은 무엇인가요?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "가장 알맞은 길은 무엇을 중요하게 생각하는지에 따라 달라집니다. 각 쌍에서 더 중요한 것을 골라 보세요. 이 도구는 특정 플랜을 추천하지 않으며, 여러분의 우선순위가 각 선택의 장단점과 어떻게 맞는지 보여줄 뿐입니다.",
    "See how my priorities line up": "내 우선순위가 어떻게 맞는지 보기",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "혼합",
    "Why": "이유",
    "Start over": "다시 시작하기"
},
    "tl": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Makakita ng kahit anong doktor o ospital na tumatanggap ng Medicare, at mapanatili ang sarili kong mga doktor",
    "A lower monthly premium": "Mas mababang buwanang premium",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Walang network ang Original Medicare; gumagamit ang Medicare Advantage ng lokal na mga network kapalit ng mas mababang premium.",
    "Predictable, steady costs I can budget for": "Steady at predictable na gastos na kaya kong i-budget",
    "Paying less month to month, with copays as I go": "Mas kaunting bayad buwan-buwan, na may copay kada gamit",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Ginagawang mas predictable ang gastos ng Original Medicare + Medigap supplement (kapalit ng premium); mas mababa ang Advantage sa simula pero nag-iiba depende sa gamit, hanggang sa taunang cap.",
    "Freedom to travel or live part of the year in another state": "Kalayaang maglakbay o mamuhay ng bahagi ng taon sa ibang estado",
    "Extra benefits like dental, vision, or hearing": "Karagdagang benepisyo tulad ng dental, vision, o hearing",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Gumagana ang Original Medicare sa buong bansa; lokal ang Advantage pero kadalasang kasama ang mga extra na hindi sakop ng Original Medicare.",
    "Rarely needing a plan's approval before I get care": "Bihirang kailanganin ang pag-apruba ng plano bago ako makakuha ng pangangalaga",
    "Having everything — including drug coverage — in one plan": "Magkakasama ang lahat — kasama ang saklaw sa gamot — sa isang plano",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Kadalasang nangangailangan ang Advantage ng prior authorization at kasama na ang Part D; bihirang mangailangan ng pag-apruba ang Original Medicare pero hiwalay mong idadagdag ang saklaw sa gamot at supplement.",
    "Being able to change my coverage later, even if my health declines": "Kayang baguhin ang aking saklaw sa hinaharap, kahit lumala ang aking kalusugan",
    "The lowest cost now, while I'm healthy": "Ang pinakamababang gastos ngayon, habang malusog ako",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Ito ang one-way door: kung magsisimula sa Advantage, ang paglipat sa Original Medicare + Medigap sa hinaharap ay maaaring mangailangan ng medical underwriting. Timbangin ang kakayahang mag-adjust sa hinaharap laban sa pagtitipid ngayon.",
    "Which matters more to you?": "Alin ang mas mahalaga sa iyo?",
    "No strong preference": "Walang matibay na kagustuhan",
    "What matters most to you?": "Ano ang pinakamahalaga sa iyo?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "Nakadepende ang tamang daan sa kung ano ang pinahahalagahan mo. Piliin kung alin ang mas mahalaga sa bawat pares. Hindi ito nagrerekomenda ng plano — ipinapakita lang nito kung paano tumutugma ang iyong mga prayoridad sa mga tradeoff.",
    "See how my priorities line up": "Tingnan kung paano tumutugma ang aking mga prayoridad",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "pinaghalo",
    "Why": "Bakit",
    "Start over": "Magsimula Muli"
}
  };
  var MP_LANG = (document.documentElement.getAttribute("lang") || "en").trim() || "en";
  function t(en) {
    var tbl = I18N[MP_LANG];
    return (tbl && tbl[en]) || en;
  }
  var root = document.getElementById("priorities");
  if (!root) return;

  // Each dimension: two things people trade off. "om" leans Original Medicare
  // (+ Medigap); "ma" leans Medicare Advantage. Neither is "right".
  var DIMS = [
    { a: t("Seeing any doctor or hospital that takes Medicare, and keeping my own doctors"),
      b: t("A lower monthly premium"),
      why: t("Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.") },
    { a: t("Predictable, steady costs I can budget for"),
      b: t("Paying less month to month, with copays as I go"),
      why: t("Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.") },
    { a: t("Freedom to travel or live part of the year in another state"),
      b: t("Extra benefits like dental, vision, or hearing"),
      why: t("Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.") },
    { a: t("Rarely needing a plan's approval before I get care"),
      b: t("Having everything — including drug coverage — in one plan"),
      why: t("Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.") },
    { a: t("Being able to change my coverage later, even if my health declines"),
      b: t("The lowest cost now, while I'm healthy"),
      why: t("This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.") }
  ];

  function render() {
    var rows = DIMS.map(function (d, i) {
      return '<div class="nav-q"><span class="nav-label">' + (i + 1) + '. ' + t('Which matters more to you?') + '</span>' +
        '<div class="nav-options">' +
          '<label><input type="radio" name="p' + i + '" value="om"><span>' + d.a + '</span></label>' +
          '<label><input type="radio" name="p' + i + '" value="ma"><span>' + d.b + '</span></label>' +
          '<label><input type="radio" name="p' + i + '" value="0"><span>' + t('No strong preference') + '</span></label>' +
        '</div></div>';
    }).join("");
    root.innerHTML =
      '<h2>' + t('What matters most to you?') + '</h2>' +
      '<p>' + t('The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.') + '</p>' +
      rows +
      '<div class="nav-actions"><button type="button" class="nav-btn" id="p-go">' + t('See how my priorities line up') + '</button></div>' +
      '<div id="p-result"></div>';
    document.getElementById("p-go").addEventListener("click", tally);
  }

  function tally() {
    var om = 0, ma = 0, answered = 0, details = [];
    DIMS.forEach(function (d, i) {
      var sel = root.querySelector('input[name="p' + i + '"]:checked');
      if (!sel) return;
      answered++;
      if (sel.value === "om") { om++; details.push("<li><strong>" + d.a + "</strong> — " + d.why + "</li>"); }
      else if (sel.value === "ma") { ma++; details.push("<li><strong>" + d.b + "</strong> — " + d.why + "</li>"); }
    });
    var lean;
    if (answered === 0) lean = "Answer a few above to see how your priorities line up.";
    else if (om > ma) lean = "Your priorities lean toward <strong>' + t('Original Medicare') + '</strong> (often paired with a Medigap supplement and a Part D drug plan).";
    else if (ma > om) lean = "Your priorities lean toward <strong>' + t('Medicare Advantage') + '</strong>.";
    else lean = "Your priorities are <strong>' + t('mixed') + '</strong> — both paths have real appeal for you, which is common. That's okay: spend time with <a href=\"/questions-to-ask.html\">the right questions to ask</a>, compare plans side by side at <a href=\"https://www.medicare.gov/\" rel=\"noopener\">Medicare's Plan Finder</a>, and talk through the tradeoffs with a free <a href=\"/ship-directory.html\">SHIP counselor</a> or talk about your financial situation with <a href=\"/getting-help.html\">getting-help resources</a>.";

    var html = '<div class="nav-result">' +
      '<div class="verdict">' + lean + '</div>';
    if (details.length) html += "<div class=\"track\"><span class=\"tag\">' + t('Why') + '</span><h3>What's driving that</h3><ul>" + details.join("") + "</ul></div>";
    html += '<div class="note">This is not a recommendation, and it can\'t see your doctors, drugs, or budget. Use it to focus your thinking, then confirm with <a href="https://www.medicare.gov/" rel="noopener">Medicare\'s Plan Finder</a> and a free <a href="/ship-directory.html">SHIP counselor</a>. Also weigh the <a href="/edge-cases.html">Medigap one-way door</a> before you decide. See the <a href="/questions-to-ask.html">questions to ask</a> any plan.</div>' +
      '<div class="nav-actions"><button type="button" class="nav-btn secondary" id="p-reset">' + t('Start over') + '</button></div></div>';

    var res = document.getElementById("p-result");
    res.innerHTML = html;
    document.getElementById("p-go").className = "nav-btn nav-hidden";
    document.getElementById("p-reset").addEventListener("click", render);
    res.querySelector(".nav-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  render();
})();
