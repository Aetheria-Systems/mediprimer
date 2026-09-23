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
    "en": {},   // English is the fallback: the t() key IS the source string
    "es": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Poder ver a cualquier médico u hospital que acepte Medicare, y mantener a mis propios médicos",
    "A lower monthly premium": "Una prima mensual más baja",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Medicare Original no tiene red; Medicare Advantage usa redes locales a cambio de primas más bajas.",
    "Predictable, steady costs I can budget for": "Costos estables y predecibles que puedo presupuestar",
    "Paying less month to month, with copays as I go": "Pagar menos cada mes, con copagos según los uso",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Medicare Original + un plan Medigap hace que los costos sean muy predecibles (a cambio de una prima); Advantage cuesta menos al principio pero varía según el uso, hasta un límite anual.",
    "Freedom to travel or live part of the year in another state": "Libertad para viajar o vivir parte del año en otro estado",
    "Extra benefits like dental, vision, or hearing": "Beneficios adicionales como dental, visión o audición",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Medicare Original funciona en todo el país; Advantage es local pero a menudo incluye beneficios extra que Medicare Original no cubre.",
    "Rarely needing a plan's approval before I get care": "Casi nunca necesitar la aprobación de un plan antes de recibir atención",
    "Having everything — including drug coverage — in one plan": "Tener todo — incluyendo la cobertura de medicamentos — en un solo plan",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage a menudo requiere autorización previa e incluye la Parte D; Medicare Original rara vez requiere aprobación, pero usted agrega la cobertura de medicamentos y de suplemento por separado.",
    "Being able to change my coverage later, even if my health declines": "Poder cambiar mi cobertura más adelante, incluso si mi salud empeora",
    "The lowest cost now, while I'm healthy": "El costo más bajo ahora, mientras estoy sano",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Esta es la puerta de un solo sentido: si empieza con Advantage, cambiar después a Medicare Original + Medigap puede requerir una evaluación médica. Sopese la flexibilidad futura frente al ahorro ahora.",
    "Which matters more to you?": "¿Qué es más importante para usted?",
    "No strong preference": "Sin preferencia clara",
    "What matters most to you?": "¿Qué es lo más importante para usted?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "El camino correcto depende de lo que usted valore. Elija lo que le importe más en cada par. Esto no recomienda un plan — muestra cómo sus prioridades se alinean con las compensaciones.",
    "See how my priorities line up": "Ver cómo se alinean mis prioridades",
    "Original Medicare": "Medicare Original",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "mixto",
    "the right questions to ask": "las preguntas correctas para hacer",
    "compare plans side by side at": "comparar planes lado a lado en",
    "and talk through the tradeoffs with a free": "y conversar sobre las compensaciones con un",
    "SHIP counselor": "consejero de SHIP gratuito",
    "or talk about your financial situation with": "o hablar sobre su situación financiera con",
    "getting-help resources": "los recursos de ayuda disponibles",
    "Why": "Por qué",
    "What's driving that": "Qué está impulsando eso",
    "Medigap one-way door": "La puerta de un solo sentido de Medigap",
    "questions to ask": "preguntas para hacer",
    "Start over": "Empezar de nuevo"
},
    "zh-Hant": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "能看任何接受 Medicare 的醫生或醫院，並保留原本的醫生",
    "A lower monthly premium": "較低的每月保費",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "原始 Medicare 沒有網絡限制；Medicare Advantage 使用當地網絡,以換取較低的保費。",
    "Predictable, steady costs I can budget for": "可預測、穩定、能夠規劃預算的費用",
    "Paying less month to month, with copays as I go": "每月花費較少，看病時再付部分負擔額",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "原始 Medicare 加上 Medigap 補充保險，費用非常可預測（需支付保費）；Advantage 前期費用較低，但會依使用情況而變動，最高到每年的上限。",
    "Freedom to travel or live part of the year in another state": "能自由旅行，或每年有一段時間住在其他州",
    "Extra benefits like dental, vision, or hearing": "牙科、視力或聽力等額外福利",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "原始 Medicare 在全國都適用；Advantage 是地區性的，但通常會附加原始 Medicare 不涵蓋的額外福利。",
    "Rarely needing a plan's approval before I get care": "很少需要在就醫前先取得計劃核准",
    "Having everything — including drug coverage — in one plan": "所有保障都在一個計劃裡，包括藥物保險",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage 通常需要事前核准，並包含 Part D；原始 Medicare 很少需要核准,但你要另外加保藥物保險和補充保險。",
    "Being able to change my coverage later, even if my health declines": "以後即使健康狀況變差，仍能更改保險",
    "The lowest cost now, while I'm healthy": "趁現在健康時，享有最低的費用",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "這是一扇單向門：一開始選擇 Advantage，之後想轉回原始 Medicare 加 Medigap，可能需要健康核保。請衡量未來的彈性與現在省錢，哪個對您更重要。",
    "Which matters more to you?": "哪一項對您更重要？",
    "No strong preference": "沒有明顯偏好",
    "What matters most to you?": "什麼對您最重要？",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "適合的路取決於您重視什麼。請在每一組選項中，選出對您比較重要的一項。這並不是在推薦某個計劃，而是幫您看清自己重視的事，和各種取捨之間的關係。",
    "See how my priorities line up": "看看我的優先考量結果",
    "Original Medicare": "原始 Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "兩者兼顧",
    "the right questions to ask": "該問的正確問題",
    "compare plans side by side at": "在以下網站並列比較計劃：",
    "and talk through the tradeoffs with a free": "並與免費的",
    "SHIP counselor": "SHIP 顧問",
    "or talk about your financial situation with": "討論各種取捨，或與",
    "getting-help resources": "尋求協助資源",
    "Why": "為什麼",
    "What's driving that": "是什麼原因造成的",
    "Medigap one-way door": "Medigap 單向門",
    "questions to ask": "該問的問題",
    "Start over": "重新開始"
},
    "vi": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Được khám với bất kỳ bác sĩ hoặc bệnh viện nào nhận Medicare, và giữ nguyên bác sĩ của mình",
    "A lower monthly premium": "Phí bảo hiểm hàng tháng thấp hơn",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Medicare Gốc không có mạng lưới bác sĩ cố định; Medicare Advantage dùng mạng lưới địa phương để đổi lấy phí bảo hiểm thấp hơn.",
    "Predictable, steady costs I can budget for": "Chi phí ổn định, dễ dự đoán để lập ngân sách",
    "Paying less month to month, with copays as I go": "Trả ít hơn mỗi tháng, và trả copay khi cần dùng dịch vụ",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Medicare Gốc cộng với bảo hiểm bổ sung Medigap giúp chi phí rất dễ dự đoán (đổi lại phải trả phí bảo hiểm); Advantage có chi phí ban đầu thấp hơn nhưng thay đổi tùy theo mức sử dụng, tối đa đến một mức trần hàng năm.",
    "Freedom to travel or live part of the year in another state": "Tự do đi du lịch hoặc sống một phần năm ở tiểu bang khác",
    "Extra benefits like dental, vision, or hearing": "Các quyền lợi thêm như nha khoa, mắt, hoặc thính giác",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Medicare Gốc có hiệu lực trên toàn quốc; Advantage mang tính địa phương nhưng thường kèm thêm các quyền lợi mà Medicare Gốc không chi trả.",
    "Rarely needing a plan's approval before I get care": "Ít khi cần được chương trình chấp thuận trước khi nhận chăm sóc",
    "Having everything — including drug coverage — in one plan": "Có mọi thứ — kể cả bảo hiểm thuốc — trong một chương trình duy nhất",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage thường yêu cầu chấp thuận trước và đã kèm sẵn Part D; Medicare Gốc ít khi cần chấp thuận trước nhưng quý vị phải đăng ký thêm bảo hiểm thuốc và bảo hiểm bổ sung riêng.",
    "Being able to change my coverage later, even if my health declines": "Có thể thay đổi bảo hiểm sau này, ngay cả khi sức khỏe suy giảm",
    "The lowest cost now, while I'm healthy": "Chi phí thấp nhất ngay bây giờ, khi tôi còn khỏe mạnh",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Đây là cánh cửa một chiều: bắt đầu với Advantage rồi sau đó chuyển sang Medicare Gốc cộng Medigap có thể yêu cầu thẩm định sức khỏe. Hãy cân nhắc giữa sự linh hoạt trong tương lai và việc tiết kiệm ngay bây giờ.",
    "Which matters more to you?": "Điều nào quan trọng hơn với quý vị?",
    "No strong preference": "Không có ưu tiên rõ rệt",
    "What matters most to you?": "Điều gì quan trọng nhất với quý vị?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "Con đường phù hợp tùy thuộc vào điều quý vị coi trọng. Hãy chọn điều quan trọng hơn trong mỗi cặp. Công cụ này không đề xuất chương trình nào — nó chỉ cho thấy ưu tiên của quý vị phù hợp với các đánh đổi ra sao.",
    "See how my priorities line up": "Xem ưu tiên của tôi phù hợp ra sao",
    "Original Medicare": "Medicare Gốc",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "kết hợp",
    "the right questions to ask": "những câu hỏi nên đặt ra",
    "compare plans side by side at": "so sánh các chương trình song song tại",
    "and talk through the tradeoffs with a free": "và trao đổi về các đánh đổi với một",
    "SHIP counselor": "tư vấn viên SHIP miễn phí",
    "or talk about your financial situation with": "hoặc trao đổi về tình hình tài chính của quý vị với",
    "getting-help resources": "các nguồn hỗ trợ tại getting-help",
    "Why": "Vì sao",
    "What's driving that": "Điều gì dẫn đến lựa chọn đó",
    "Medigap one-way door": "Cánh cửa một chiều của Medigap",
    "questions to ask": "những câu hỏi nên đặt ra",
    "Start over": "Bắt đầu lại"
},
    "ko": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Medicare를 받는 의사나 병원이라면 어디든 진료받고, 지금 다니는 의사를 그대로 유지하기",
    "A lower monthly premium": "더 낮은 월 보험료",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Original Medicare는 네트워크가 없습니다. Medicare Advantage는 더 낮은 보험료 대신 지역 네트워크를 사용합니다.",
    "Predictable, steady costs I can budget for": "예산을 세울 수 있는 예측 가능하고 안정적인 비용",
    "Paying less month to month, with copays as I go": "매달 더 적게 내고, 진료 때마다 본인부담금(copay)을 내는 방식",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Original Medicare + Medigap 보충보험은 비용을 매우 예측 가능하게 해줍니다(보험료는 필요). Advantage는 처음에는 저렴하지만 이용량에 따라 달라지며, 연간 상한선이 있습니다.",
    "Freedom to travel or live part of the year in another state": "여행하거나 1년 중 일부를 다른 주에서 지낼 수 있는 자유",
    "Extra benefits like dental, vision, or hearing": "치과, 시력, 청력 같은 추가 혜택",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Original Medicare는 전국 어디서나 이용할 수 있습니다. Advantage는 지역 기반이지만 Original Medicare가 보장하지 않는 추가 혜택을 함께 제공하는 경우가 많습니다.",
    "Rarely needing a plan's approval before I get care": "진료받기 전에 플랜의 승인이 거의 필요 없는 것",
    "Having everything — including drug coverage — in one plan": "약값 보장을 포함한 모든 것을 하나의 플랜으로 해결하는 것",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Advantage는 사전 승인이 필요한 경우가 많고 Part D를 함께 제공합니다. Original Medicare는 승인이 거의 필요 없지만, 약값 보장과 보충보험은 따로 추가해야 합니다.",
    "Being able to change my coverage later, even if my health declines": "나중에 건강이 나빠지더라도 보장 내용을 바꿀 수 있는 것",
    "The lowest cost now, while I'm healthy": "지금 건강할 때 가장 낮은 비용으로 이용하는 것",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "이것은 되돌리기 어려운 선택입니다. Advantage로 시작한 후 나중에 Original Medicare + Medigap으로 바꾸려면 건강 심사(medical underwriting)가 필요할 수 있습니다. 지금의 절약과 앞으로의 유연성을 잘 비교해 보세요.",
    "Which matters more to you?": "어느 쪽이 나에게 더 중요한가요?",
    "No strong preference": "특별히 선호하지 않음",
    "What matters most to you?": "가장 중요하게 생각하는 것은 무엇인가요?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "올바른 선택은 무엇을 중요하게 여기느냐에 따라 다릅니다. 각 항목에서 더 중요한 쪽을 선택해 주세요. 이는 특정 플랜을 추천하는 것이 아니라, 나의 우선순위가 장단점과 어떻게 맞는지 보여드리는 것입니다.",
    "See how my priorities line up": "내 우선순위 결과 보기",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "혼합",
    "the right questions to ask": "물어봐야 할 올바른 질문들",
    "compare plans side by side at": "플랜을 나란히 비교해 볼 수 있는 곳",
    "and talk through the tradeoffs with a free": "그리고 무료 상담을 통해 장단점을 함께 이야기해 보세요",
    "SHIP counselor": "SHIP 상담사",
    "or talk about your financial situation with": "또는 나의 재정 상황에 대해 상담해 보세요",
    "getting-help resources": "도움받기 자료",
    "Why": "이유",
    "What's driving that": "그 이유는 무엇인가요",
    "Medigap one-way door": "Medigap의 되돌리기 어려운 선택",
    "questions to ask": "물어봐야 할 질문들",
    "Start over": "다시 시작하기"
},
    "tl": {
    "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors": "Makakapagpatingin sa kahit anong doktor o ospital na tumatanggap ng Medicare, at mapapanatili ang sarili kong mga doktor",
    "A lower monthly premium": "Mas mababang buwanang premium",
    "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums.": "Ang Original Medicare ay walang network; gumagamit ang Medicare Advantage ng mga lokal na network kapalit ng mas mababang premium.",
    "Predictable, steady costs I can budget for": "Mahuhulaan at matatag na gastos na kaya kong badyetin",
    "Paying less month to month, with copays as I go": "Mas kaunting babayaran buwan-buwan, may copay bawat gagamitin ko",
    "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap.": "Ginagawang mas mahuhulaan ang gastos ng Original Medicare kasama ang Medigap na dagdag na coverage (kapalit ng premium); mas mababa ang Advantage sa simula pero nagbabago depende sa paggamit, hanggang sa taunang limitasyon.",
    "Freedom to travel or live part of the year in another state": "Kalayaang maglakbay o manirahan sa ibang estado sa bahagi ng taon",
    "Extra benefits like dental, vision, or hearing": "Dagdag na benepisyo tulad ng dental, vision, o hearing",
    "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover.": "Gumagana ang Original Medicare sa buong bansa; lokal ang Advantage pero kadalasan may kasamang dagdag na benepisyo na hindi sakop ng Original Medicare.",
    "Rarely needing a plan's approval before I get care": "Bihirang kailanganin ang pag-apruba ng plano bago makakuha ng pangangalaga",
    "Having everything — including drug coverage — in one plan": "Nasa isang plano na ang lahat — kasama ang coverage para sa gamot",
    "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately.": "Madalas kailangan ng Advantage ang paunang pag-apruba (prior authorization) at may kasamang Part D; bihira lang mangailangan ng pag-apruba ang Original Medicare pero hiwalay mong idadagdag ang coverage para sa gamot at Medigap.",
    "Being able to change my coverage later, even if my health declines": "Kakayahang baguhin ang coverage sa hinaharap, kahit lumala ang kalusugan ko",
    "The lowest cost now, while I'm healthy": "Ang pinakamababang gastos ngayon, habang malusog ako",
    "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now.": "Ito ang isang-direksyon na pinto: kung magsisimula sa Advantage, maaaring mangailangan ng medical underwriting ang paglipat sa Original Medicare + Medigap sa hinaharap. Timbangin ang kakayahang umangkop sa hinaharap laban sa pagtitipid ngayon.",
    "Which matters more to you?": "Alin ang mas mahalaga sa iyo?",
    "No strong preference": "Walang matinding kagustuhan",
    "What matters most to you?": "Ano ang pinakamahalaga sa iyo?",
    "The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.": "Ang tamang landas ay depende sa pinahahalagahan mo. Piliin kung alin ang mas mahalaga sa bawat pares. Hindi ito nagrerekomenda ng plano — ipinapakita lang nito kung paano tumutugma ang mga prayoridad mo sa mga kalakasan at kahinaan ng bawat opsyon.",
    "See how my priorities line up": "Tingnan kung paano tumutugma ang aking mga prayoridad",
    "Original Medicare": "Original Medicare",
    "Medicare Advantage": "Medicare Advantage",
    "mixed": "halo-halo",
    "the right questions to ask": "ang tamang mga tanong na dapat itanong",
    "compare plans side by side at": "ihambing ang mga plano nang magkatabi sa",
    "and talk through the tradeoffs with a free": "at pag-usapan ang mga kalakasan at kahinaan kasama ang libreng",
    "SHIP counselor": "SHIP counselor",
    "or talk about your financial situation with": "o pag-usapan ang iyong sitwasyong pinansyal kasama ang",
    "getting-help resources": "mga mapagkukunan ng tulong",
    "Why": "Bakit",
    "What's driving that": "Ano ang dahilan diyan",
    "Medigap one-way door": "Isang-direksyon na pinto ng Medigap",
    "questions to ask": "mga tanong na dapat itanong",
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
    html += '<div class="note">This is not a recommendation, and it can\'t see your doctors, drugs, or budget. Use it to focus your thinking, then confirm with <a href="https://www.medicare.gov/" rel="noopener">Medicare\'s Plan Finder</a> and a free <a href="/ship-directory.html">' + t('SHIP counselor') + '</a>. Also weigh the <a href="/edge-cases.html">' + t('Medigap one-way door') + '</a> before you decide. See the <a href="/questions-to-ask.html">' + t('questions to ask') + '</a> any plan.</div>' +
      '<div class="nav-actions"><button type="button" class="nav-btn secondary" id="p-reset">' + t('Start over') + '</button></div></div>';

    var res = document.getElementById("p-result");
    res.innerHTML = html;
    document.getElementById("p-go").className = "nav-btn nav-hidden";
    document.getElementById("p-reset").addEventListener("click", render);
    res.querySelector(".nav-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  render();
})();
