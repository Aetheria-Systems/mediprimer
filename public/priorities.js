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
    "es": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Consultar a cualquier médico u hospital que acepte Medicare, y mantener a mis propios médicos",
    "A lower monthly premium": "Una prima mensual más baja",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Medicare Original no tiene red de proveedores; Medicare Advantage usa redes locales a cambio de primas más bajas.",
    "Predictable, steady costs I can budget for": "Costos estables y predecibles que puedo presupuestar",
    "Paying less month to month, with copays as I go": "Pagar menos cada mes, con copagos según los uso",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Medicare Original más un plan suplementario Medigap hace que los costos sean muy predecibles (a cambio de una prima); Advantage cuesta menos al principio, pero varía según el uso, hasta un límite anual.",
    "Freedom to travel or live part of the year in another state": "Libertad para viajar o vivir parte del año en otro estado",
    "Extra benefits like dental, vision, or hearing": "Beneficios adicionales como dental, visión o audición",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Medicare Original funciona en todo el país; Advantage es local pero a menudo incluye beneficios adicionales que Medicare Original no cubre.",
    "Rarely needing a plan's approval before I get care": "Rara vez necesitar la aprobación de un plan antes de recibir atención",
    "Having everything — including drug coverage — in one plan": "Tener todo, incluida la cobertura de medicamentos, en un solo plan",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage a menudo requiere autorización previa e incluye la Parte D; Medicare Original rara vez requiere aprobación, pero usted agrega por separado la cobertura de medicamentos y de suplemento.",
    "Being able to change my coverage later, even if my health declines": "Poder cambiar mi cobertura más adelante, incluso si mi salud empeora",
    "The lowest cost now, while I'm healthy": "El costo más bajo ahora, mientras estoy sano",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Esta es la puerta de un solo sentido: si empieza con Advantage, un cambio posterior a Medicare Original más Medigap puede requerir una evaluación médica. Sopese la flexibilidad futura frente al ahorro de ahora.",
    "Which matters more to you?": "¿Qué es más importante para usted?",
    "No strong preference": "Sin preferencia clara",
    "What matters most to you?": "¿Qué es lo más importante para usted?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "El camino correcto depende de lo que usted valora. Elija lo que le importa más en cada par. Esto no recomienda un plan, sino que muestra cómo sus prioridades se alinean con las ventajas y desventajas.",
    "See how my priorities line up": "Ver cómo se alinean mis prioridades",
    "Original Medicare": "Medicare Original",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "mixto",
    "the right questions to ask": "las preguntas correctas para hacer",
    "compare plans side by side at": "comparar planes uno al lado del otro en",
    "and talk through the tradeoffs with a free": "y conversar sobre las ventajas y desventajas con un",
    "SHIP counselor": "consejero de SHIP gratuito",
    "or talk about your financial situation with": "o hablar sobre su situación financiera con",
    "getting-help resources": "los recursos de ayuda disponibles",
    "Why": "Por qué",
    "What's driving that": "Qué está impulsando eso",
    ". Also weigh the": ". También considere la",
    "Medigap one-way door": "puerta de un solo sentido de Medigap",
    "before you decide. See the": "antes de decidir. Consulte las",
    "questions to ask": "preguntas para hacer",
    "any plan.": "cualquier plan.",
    "Start over": "Empezar de nuevo"
},
    "zh-Hant": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "可以看任何接受 Medicare 的醫生或醫院，並繼續看原本的醫生",
    "A lower monthly premium": "較低的每月保費",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "原始 Medicare 沒有網絡限制；Medicare Advantage 使用當地網絡，以換取較低的保費。",
    "Predictable, steady costs I can budget for": "穩定、可預測的花費，方便我做預算",
    "Paying less month to month, with copays as I go": "每個月付得較少，就診時再付部分負擔額",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "原始 Medicare 加上 Medigap 補充保險，費用非常可預測（需支付保費）；Advantage 前期費用較低，但會依使用情況而變化，最高到每年上限。",
    "Freedom to travel or live part of the year in another state": "可以自由旅行，或一年中有部分時間住在別的州",
    "Extra benefits like dental, vision, or hearing": "額外的福利，例如牙科、視力或聽力",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "原始 Medicare 在全國都適用；Advantage 是地區性的，但通常包含原始 Medicare 不涵蓋的額外福利。",
    "Rarely needing a plan's approval before I get care": "很少需要保險計畫事先核准才能就醫",
    "Having everything — including drug coverage — in one plan": "所有保障（包括藥物保障）都在同一個計畫裡",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage 通常需要事先核准，並包含 Part D；原始 Medicare 很少需要核准，但你需要另外加保藥物和補充保險。",
    "Being able to change my coverage later, even if my health declines": "即使日後健康變差，仍能更換保障內容",
    "The lowest cost now, while I'm healthy": "趁現在健康時，先享有最低的費用",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "這是一扇單向門：先選擇 Advantage，之後想改回原始 Medicare 加 Medigap，可能需要接受核保審查。請衡量未來的彈性，與現在省下的錢，哪個對你比較重要。",
    "Which matters more to you?": "哪一個對你比較重要？",
    "No strong preference": "沒有特別偏好",
    "What matters most to you?": "什麼對你最重要？",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "最合適的方向取決於你重視什麼。請在每一組選項中，選出對你比較重要的那一個。這並不是在推薦某個保險計畫，而是幫你看清楚自己重視的事，和各種取捨之間的關係。",
    "See how my priorities line up": "看看我的優先考量對應到哪裡",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "兩者兼有",
    "the right questions to ask": "該問的關鍵問題",
    "compare plans side by side at": "在以下網站比較不同計畫",
    "and talk through the tradeoffs with a free": "並和免費的",
    "SHIP counselor": "SHIP 諮詢顧問",
    "or talk about your financial situation with": "討論利弊，或就你的財務狀況諮詢",
    "getting-help resources": "求助資源",
    "Why": "為什麼",
    "What's driving that": "是什麼原因讓你這麼想",
    ". Also weigh the": "。也請一併考量",
    "Medigap one-way door": "Medigap 的單向門限制",
    "before you decide. See the": "再做決定。請參閱",
    "questions to ask": "該問的問題",
    "any plan.": "任何一個保險計畫。",
    "Start over": "重新開始"
},
    "vi": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Được khám với bất kỳ bác sĩ hoặc bệnh viện nào nhận Medicare, và giữ nguyên bác sĩ hiện tại của tôi",
    "A lower monthly premium": "Phí bảo hiểm hàng tháng thấp hơn",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Medicare gốc không có mạng lưới nhà cung cấp; Medicare Advantage dùng mạng lưới địa phương để đổi lấy phí bảo hiểm thấp hơn.",
    "Predictable, steady costs I can budget for": "Chi phí ổn định, dễ dự đoán để tôi có thể lên kế hoạch",
    "Paying less month to month, with copays as I go": "Trả ít hơn mỗi tháng, và trả copay khi cần dùng dịch vụ",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Medicare gốc cộng với bảo hiểm bổ sung Medigap giúp chi phí rất dễ dự đoán (với một khoản phí bảo hiểm); Advantage thấp hơn lúc đầu nhưng thay đổi tùy theo mức sử dụng, cho đến mức giới hạn hàng năm.",
    "Freedom to travel or live part of the year in another state": "Tự do đi du lịch hoặc sống một phần năm ở tiểu bang khác",
    "Extra benefits like dental, vision, or hearing": "Các quyền lợi thêm như nha khoa, mắt, hoặc thính giác",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Medicare gốc hoạt động trên toàn quốc; Advantage mang tính địa phương nhưng thường gộp thêm các quyền lợi mà Medicare gốc không chi trả.",
    "Rarely needing a plan's approval before I get care": "Hiếm khi cần chương trình chấp thuận trước khi tôi được chăm sóc",
    "Having everything — including drug coverage — in one plan": "Có mọi thứ — kể cả bảo hiểm thuốc — trong một chương trình duy nhất",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage thường yêu cầu chấp thuận trước và gộp chung Part D; Medicare gốc hiếm khi yêu cầu chấp thuận nhưng bạn cần thêm bảo hiểm thuốc và bảo hiểm bổ sung riêng.",
    "Being able to change my coverage later, even if my health declines": "Có thể thay đổi bảo hiểm sau này, ngay cả khi sức khỏe của tôi giảm sút",
    "The lowest cost now, while I'm healthy": "Chi phí thấp nhất ngay bây giờ, khi tôi còn khỏe mạnh",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Đây là cánh cửa một chiều: bắt đầu với Advantage rồi sau đó chuyển sang Medicare gốc cộng với Medigap có thể yêu cầu thẩm định y tế. Hãy cân nhắc giữa sự linh hoạt trong tương lai và việc tiết kiệm ngay bây giờ.",
    "Which matters more to you?": "Điều nào quan trọng hơn với bạn?",
    "No strong preference": "Không có ưu tiên rõ rệt",
    "What matters most to you?": "Điều gì quan trọng nhất với bạn?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "Con đường phù hợp tùy thuộc vào điều bạn coi trọng. Hãy chọn điều quan trọng hơn trong mỗi cặp. Công cụ này không đề xuất chương trình nào — nó chỉ cho thấy ưu tiên của bạn phù hợp thế nào với các sự đánh đổi.",
    "See how my priorities line up": "Xem ưu tiên của tôi phù hợp thế nào",
    "Original Medicare": "Medicare gốc",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "kết hợp",
    "the right questions to ask": "những câu hỏi nên hỏi",
    "compare plans side by side at": "so sánh các chương trình song song tại",
    "and talk through the tradeoffs with a free": "và trao đổi về những sự đánh đổi với một",
    "SHIP counselor": "cố vấn SHIP miễn phí",
    "or talk about your financial situation with": "hoặc trao đổi về tình hình tài chính của bạn với",
    "getting-help resources": "các nguồn hỗ trợ getting-help",
    "Why": "Vì sao",
    "What's driving that": "Điều gì dẫn đến lựa chọn đó",
    ". Also weigh the": ". Cũng nên cân nhắc",
    "Medigap one-way door": "cánh cửa một chiều của Medigap",
    "before you decide. See the": "trước khi bạn quyết định. Xem",
    "questions to ask": "những câu hỏi nên hỏi",
    "any plan.": "bất kỳ chương trình nào.",
    "Start over": "Bắt đầu lại"
},
    "ko": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Medicare를 받는 어떤 의사나 병원이든 이용하고, 지금 다니는 의사를 그대로 유지하기",
    "A lower monthly premium": "더 낮은 월 보험료",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Original Medicare에는 네트워크 제한이 없습니다. Medicare Advantage는 더 낮은 보험료 대신 지역 네트워크를 사용합니다.",
    "Predictable, steady costs I can budget for": "예산을 세울 수 있는 예측 가능하고 안정적인 비용",
    "Paying less month to month, with copays as I go": "매달 더 적게 내고, 진료를 받을 때마다 본인부담금을 내기",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Original Medicare에 Medigap 보충보험을 더하면 비용이 매우 예측 가능해집니다(단, 보험료가 듭니다). Advantage는 처음에는 비용이 낮지만, 이용량에 따라 달라지며 연간 상한선까지 늘어날 수 있습니다.",
    "Freedom to travel or live part of the year in another state": "여행하거나 일 년 중 일부를 다른 주에서 살 수 있는 자유",
    "Extra benefits like dental, vision, or hearing": "치과, 시력, 청력 같은 추가 혜택",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Original Medicare는 미국 전역에서 이용할 수 있습니다. Advantage는 지역 기반이지만, Original Medicare가 보장하지 않는 추가 혜택을 함께 제공하는 경우가 많습니다.",
    "Rarely needing a plan's approval before I get care": "진료를 받기 전에 플랜의 승인이 거의 필요 없기",
    "Having everything — including drug coverage — in one plan": "약제 보장을 포함해 모든 것을 하나의 플랜에 담기",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage는 사전 승인이 필요한 경우가 많고 Part D가 함께 포함됩니다. Original Medicare는 승인이 거의 필요 없지만, 약제 보장과 보충보험을 따로 추가해야 합니다.",
    "Being able to change my coverage later, even if my health declines": "나중에 건강이 나빠지더라도 보장을 바꿀 수 있기",
    "The lowest cost now, while I'm healthy": "건강할 때 지금 가장 낮은 비용으로 이용하기",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "이것은 되돌리기 어려운 선택입니다. Advantage로 시작한 뒤 나중에 Original Medicare + Medigap으로 바꾸려면 건강 심사가 필요할 수 있습니다. 지금 절약하는 것과 앞으로의 유연성을 함께 고려하세요.",
    "Which matters more to you?": "어느 쪽이 당신에게 더 중요한가요?",
    "No strong preference": "특별히 선호하는 쪽 없음",
    "What matters most to you?": "당신에게 가장 중요한 것은 무엇인가요?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "맞는 길은 당신이 무엇을 중요하게 여기는지에 따라 달라집니다. 각 쌍에서 더 중요한 것을 선택해 보세요. 이것은 특정 플랜을 추천하는 것이 아니라, 당신의 우선순위가 각 선택의 장단점과 어떻게 맞아떨어지는지 보여줍니다.",
    "See how my priorities line up": "내 우선순위가 어떻게 맞아떨어지는지 보기",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "혼합",
    "the right questions to ask": "물어봐야 할 올바른 질문들",
    "compare plans side by side at": "다음에서 플랜을 나란히 비교해 보세요",
    "and talk through the tradeoffs with a free": "그리고 무료",
    "SHIP counselor": "SHIP 상담원",
    "or talk about your financial situation with": "또는 재정 상황에 대해 상담하려면",
    "getting-help resources": "도움받기 자료",
    "Why": "왜냐하면",
    "What's driving that": "그 이유가 무엇인지",
    ". Also weigh the": ". 또한 다음도 함께 고려하세요:",
    "Medigap one-way door": "Medigap의 되돌릴 수 없는 선택",
    "before you decide. See the": "결정하기 전에요. 다음을 확인하세요:",
    "questions to ask": "물어봐야 할 질문들",
    "any plan.": "어떤 플랜에든요.",
    "Start over": "처음부터 다시 하기"
},
    "tl": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Makakapunta sa kahit anong doktor o ospital na tumatanggap ng Medicare, at mapapanatili ang sarili kong mga doktor",
    "A lower monthly premium": "Mas mababang buwanang premium",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Walang network ang Original Medicare; gumagamit ang Medicare Advantage ng lokal na mga network kapalit ng mas mababang premium.",
    "Predictable, steady costs I can budget for": "Steady at predictable na gastos na kaya kong i-budget",
    "Paying less month to month, with copays as I go": "Mas kaunting babayaran buwan-buwan, na may copay tuwing gagamit ako ng serbisyo",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Ang Original Medicare kasama ang Medigap supplement ay ginagawang predictable ang gastos (kapalit ng premium); mas mababa ang Advantage sa simula pero nag-iiba depende sa paggamit, hanggang sa taunang cap.",
    "Freedom to travel or live part of the year in another state": "Kalayaang maglakbay o manirahan sa ibang estado sa ilang bahagi ng taon",
    "Extra benefits like dental, vision, or hearing": "Karagdagang benepisyo tulad ng dental, vision, o hearing",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Gumagana ang Original Medicare sa buong bansa; lokal ang Advantage pero kadalasang may kasamang extra na hindi saklaw ng Original Medicare.",
    "Rarely needing a plan's approval before I get care": "Bihirang mangailangan ng pag-apruba ng plano bago makatanggap ng pangangalaga",
    "Having everything — including drug coverage — in one plan": "Nasa iisang plano na ang lahat — kasama na ang drug coverage",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Kadalasang nangangailangan ang Advantage ng prior authorization at kasama na ang Part D; bihirang mangailangan ng pag-apruba ang Original Medicare pero hiwalay mong idadagdag ang drug at supplement coverage.",
    "Being able to change my coverage later, even if my health declines": "Kakayahang baguhin ang aking coverage sa hinaharap, kahit lumala ang kalusugan ko",
    "The lowest cost now, while I'm healthy": "Pinakamababang gastos ngayon, habang malusog pa ako",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Ito ang one-way door: kung magsisimula sa Advantage, maaaring mangailangan ng medical underwriting kapag lumipat sa Original Medicare + Medigap sa hinaharap. Timbangin ang flexibility sa hinaharap kumpara sa pagtitipid ngayon.",
    "Which matters more to you?": "Alin ang mas mahalaga sa iyo?",
    "No strong preference": "Wala akong matibay na kagustuhan",
    "What matters most to you?": "Ano ang pinakamahalaga sa iyo?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "Ang tamang landas ay depende sa pinahahalagahan mo. Piliin kung alin ang mas mahalaga sa bawat pares. Hindi ito nagrerekomenda ng plano — ipinapakita lang nito kung paano tumutugma ang mga prayoridad mo sa mga tradeoff.",
    "See how my priorities line up": "Tingnan kung paano tumutugma ang aking mga prayoridad",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "halo-halo",
    "the right questions to ask": "ang tamang mga tanong na itatanong",
    "compare plans side by side at": "ihambing ang mga plano nang magkatabi sa",
    "and talk through the tradeoffs with a free": "at pag-usapan ang mga tradeoff kasama ang libreng",
    "SHIP counselor": "SHIP counselor",
    "or talk about your financial situation with": "o pag-usapan ang iyong sitwasyong pinansyal kasama ang",
    "getting-help resources": "mga mapagkukunan ng tulong",
    "Why": "Bakit",
    "What's driving that": "Ano ang dahilan nito",
    ". Also weigh the": ". Timbangin din ang",
    "Medigap one-way door": "Medigap one-way door",
    "before you decide. See the": "bago ka magpasya. Tingnan ang",
    "questions to ask": "mga tanong na itatanong",
    "any plan.": "kahit anong plano.",
    "Start over": "Magsimula ulit"
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
    else if (om > ma) lean = 'Your priorities lean toward <strong>' + t('Original Medicare') + '</strong> (often paired with a Medigap supplement and a Part D drug plan).';
    else if (ma > om) lean = 'Your priorities lean toward <strong>' + t('Medicare Advantage') + '</strong>.';
    else lean = 'Your priorities are <strong>' + t('mixed') + '</strong> — both paths have real appeal for you, which is common. That\'s okay: spend time with <a href="/questions-to-ask.html">' + t('the right questions to ask') + '</a>, ' + t('compare plans side by side at') + ' <a href="https://www.medicare.gov/" rel="noopener">Medicare\'s Plan Finder</a>, ' + t('and talk through the tradeoffs with a free') + ' <a href="/ship-directory.html">' + t('SHIP counselor') + '</a> ' + t('or talk about your financial situation with') + ' <a href="/getting-help.html">' + t('getting-help resources') + '</a>.';

    var html = '<div class="nav-result">' +
      '<div class="verdict">' + lean + '</div>';
    if (details.length) html += '<div class="track"><span class="tag">' + t('Why') + '</span><h3>' + t('What\'s driving that') + '</h3><ul>' + details.join("") + "</ul></div>";
    html += '<div class="note">This is not a recommendation, and it can\'t see your doctors, drugs, or budget. Use it to focus your thinking, then confirm with <a href="https://www.medicare.gov/" rel="noopener">Medicare\'s Plan Finder</a> and a free <a href="/ship-directory.html">' + t('SHIP counselor') + '</a>' + t('. Also weigh the') + ' <a href="/edge-cases.html">' + t('Medigap one-way door') + '</a> ' + t('before you decide. See the') + ' <a href="/questions-to-ask.html">' + t('questions to ask') + '</a> ' + t('any plan.') + '</div>' +
      '<div class="nav-actions"><button type="button" class="nav-btn secondary" id="p-reset">' + t('Start over') + '</button></div></div>';

    var res = document.getElementById("p-result");
    res.innerHTML = html;
    document.getElementById("p-go").className = "nav-btn nav-hidden";
    document.getElementById("p-reset").addEventListener("click", render);
    res.querySelector(".nav-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  render();
})();
