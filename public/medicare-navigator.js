/* MediPrimer — "Turning 65" navigator.
   Asks marital status + each person's current/expected coverage, then composes
   directive, educational guidance. It explains the ENROLLMENT rules for the
   person's situation; it never recommends a specific insurance plan or product.
   Progressive enhancement: the full written walkthrough below works without JS. */
(function () {
  "use strict";

  /* Translations. Keys are the English source strings, so a missing
     translation degrades to English rather than breaking the tool.
     Filled by build/gen_tool_strings.py; enforced by
     build/check_language_coverage.py. */
  var I18N = {
    "en": {},   // English is the fallback: the t() key is the source string
    "es": {
    "Still working — employer has 20+ employees": "Todavía trabajando — el empleador tiene 20 o más empleados",
    "Still working — employer has fewer than 20 employees": "Todavía trabajando — el empleador tiene menos de 20 empleados",
    "Covered by a spouse/partner's employer plan (they're still working)": "Cubierto por el plan del empleador de su cónyuge o pareja (todavía trabaja)",
    "Retiree coverage from a former employer": "Cobertura de jubilado de un empleador anterior",
    "VA health care": "Atención médica de VA",
    "TRICARE For Life (military retiree)": "TRICARE For Life (jubilado militar)",
    "A Marketplace / ACA plan": "Un plan del Marketplace / ACA",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "Ninguna / sin seguro",
    "I'm not sure": "No estoy seguro/a",
    "Answer a few questions for a plan built around you": "Responda algunas preguntas para un plan hecho a su medida",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "Esto le da pasos claros y directos en lenguaje sencillo para su situación. Le explica las reglas de Medicare — no vende ni recomienda ningún plan específico.",
    "1. Are you deciding for yourself, or helping someone else?": "1. ¿Está decidiendo para usted mismo/a, o ayudando a otra persona?",
    "Deciding for myself": "Decidiendo para mí mismo/a",
    "Helping someone else": "Ayudando a otra persona",
    "on behalf of the person": "en nombre de la persona",
    "2. Are you single or married/partnered?": "2. ¿Es soltero/a o está casado/a o con pareja?",
    "Single": "Soltero/a",
    "Married or partnered": "Casado/a o con pareja",
    "3. What health coverage do you have or expect around age 65?": "3. ¿Qué cobertura de salud tiene o espera tener alrededor de los 65 años?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. ¿Su cónyuge o pareja tiene 65 años o más, o menos de 65?",
    "65 or older (deciding about Medicare now)": "65 años o más (decidiendo sobre Medicare ahora)",
    "Under 65 (not yet Medicare-eligible)": "Menos de 65 (aún no es elegible para Medicare)",
    "5. What health coverage does your spouse/partner have or expect?": "5. ¿Qué cobertura de salud tiene o espera tener su cónyuge o pareja?",
    "Show my next steps": "Mostrar mis próximos pasos",
    "Please answer the questions above to see your plan.": "Por favor responda las preguntas anteriores para ver su plan.",
    "Part A:": "Parte A:",
    "Part B:": "Parte B:",
    "Prescriptions (Part D):": "Medicamentos recetados (Parte D):",
    "Your spouse/partner": "Su cónyuge o pareja",
    "Not yet — but on the radar": "Todavía no — pero está en la mira",
    "your": "su",
    "Remember": "Recuerde",
    "Two separate decisions": "Dos decisiones separadas",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare es individual — no existe un Medicare familiar. Cada uno de ustedes se inscribe (o retrasa la inscripción) según su propia cobertura indicada arriba, en su propio calendario.",
    "Before you choose a path": "Antes de elegir un camino",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Medicare Original frente a Medicare Advantage — la parte difícil de revertir",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "Aparte del momento de inscripción mencionado arriba, usted elegirá entre Medicare Original (con la opción de un suplemento Medigap) y Medicare Advantage. Ambos cubren los mismos beneficios, pero Advantage usa redes de proveedores y autorización previa. El detalle clave: la “puerta de un solo sentido” de Medigap significa que cambiar de Advantage de vuelta a Original + Medigap más adelante puede requerir una evaluación médica y ser denegado. Piense bien en esto antes de elegir — es la decisión más difícil de revertir.",
    "Do these next": "Haga esto a continuación",
    "Your next steps": "Sus próximos pasos",
    "Limited income?": "¿Ingresos limitados?",
    "Getting help paying": "Cómo obtener ayuda para pagar",
    "Anything special apply?": "¿Aplica algo especial en su caso?",
    "Edge cases to watch": "Casos especiales a tener en cuenta",
    "Do any of these apply to you? They can change your timing or choices:": "¿Alguno de estos aplica en su caso? Pueden cambiar su calendario o sus opciones:",
    "HSA contributor:": "Contribuye a una HSA:",
    "Higher income:": "Ingresos más altos:",
    "Living part-time abroad:": "Vive parte del tiempo en el extranjero:",
    "Start over": "Empezar de nuevo"
},
    "zh-Hant": {
    "Still working — employer has 20+ employees": "目前仍在工作——雇主員工人數在20人以上",
    "Still working — employer has fewer than 20 employees": "目前仍在工作——雇主員工人數少於20人",
    "Covered by a spouse/partner's employer plan (they're still working)": "由配偶/伴侶的雇主計劃提供保障（對方仍在工作）",
    "Retiree coverage from a former employer": "來自前雇主的退休人員保障",
    "VA health care": "退伍軍人事務部（VA）醫療保健",
    "TRICARE For Life (military retiree)": "TRICARE For Life（軍人退休福利）",
    "A Marketplace / ACA plan": "Marketplace／ACA 計劃",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "沒有／未投保",
    "I'm not sure": "我不確定",
    "Answer a few questions for a plan built around you": "回答幾個問題，獲得專屬於您的規劃",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "這會針對您的情況，提供清楚易懂、可直接依循的下一步。它是為您解釋 Medicare 規則——並不推銷或推薦任何特定計劃。",
    "1. Are you deciding for yourself, or helping someone else?": "1. 您是在為自己做決定，還是在幫別人？",
    "Deciding for myself": "為自己做決定",
    "Helping someone else": "幫別人做決定",
    "on behalf of the person": "代表對方",
    "2. Are you single or married/partnered?": "2. 您是單身，還是已婚／有伴侶？",
    "Single": "單身",
    "Married or partnered": "已婚或有伴侶",
    "3. What health coverage do you have or expect around age 65?": "3. 您在65歲左右有或預期會有什麼醫療保障？",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. 您的配偶／伴侶是65歲以上，還是65歲以下？",
    "65 or older (deciding about Medicare now)": "65歲以上（正在考慮 Medicare）",
    "Under 65 (not yet Medicare-eligible)": "未滿65歲（尚未符合 Medicare 資格）",
    "5. What health coverage does your spouse/partner have or expect?": "5. 您的配偶／伴侶有或預期會有什麼醫療保障？",
    "Show my next steps": "顯示我的下一步",
    "Please answer the questions above to see your plan.": "請回答上面的問題，以查看您的規劃。",
    "Part A:": "Part A：",
    "Part B:": "Part B：",
    "Prescriptions (Part D):": "處方藥（Part D）：",
    "Your spouse/partner": "您的配偶／伴侶",
    "Not yet — but on the radar": "還沒——但已在留意中",
    "your": "您的",
    "Remember": "請記住",
    "Two separate decisions": "兩個各自獨立的決定",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare 是以個人為單位——沒有所謂的「家庭 Medicare」。你們每個人都要根據自己上面所選的保障，按各自的時間表來投保（或延後投保）。",
    "Before you choose a path": "在您選擇方向之前",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "原始 Medicare 與 Medicare Advantage 的比較——難以回頭的部分",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "除了上面的投保時機之外，您還需要在原始 Medicare（可選擇搭配 Medigap 補充保險）與 Medicare Advantage 之間做選擇。兩者涵蓋的福利相同，但 Advantage 採用網路醫療機構與事前授權制度。關鍵在於：Medigap 是一扇「單向門」，日後想從 Advantage 換回原始 Medicare + Medigap，可能需要健康核保，也可能被拒絕。做選擇前請先仔細衡量——這是最難回頭的決定。",
    "Do these next": "接下來請做這些事",
    "Your next steps": "您的下一步",
    "Limited income?": "收入有限嗎？",
    "Getting help paying": "取得付費協助",
    "Anything special apply?": "有沒有其他特殊情況？",
    "Edge cases to watch": "需要留意的特殊情況",
    "Do any of these apply to you? They can change your timing or choices:": "以下情況是否適用於您？它們可能會改變您的投保時機或選擇：",
    "HSA contributor:": "健康儲蓄帳戶（HSA）提撥人：",
    "Higher income:": "較高收入者：",
    "Living part-time abroad:": "部分時間居住國外者：",
    "Start over": "重新開始"
},
    "vi": {
    "Still working — employer has 20+ employees": "Vẫn đang đi làm — công ty có từ 20 nhân viên trở lên",
    "Still working — employer has fewer than 20 employees": "Vẫn đang đi làm — công ty có dưới 20 nhân viên",
    "Covered by a spouse/partner's employer plan (they're still working)": "Được bảo hiểm theo chương trình của công ty vợ/chồng/bạn đời (người đó vẫn đang đi làm)",
    "Retiree coverage from a former employer": "Bảo hiểm hưu trí từ công ty cũ",
    "VA health care": "Chăm sóc sức khỏe của VA",
    "TRICARE For Life (military retiree)": "TRICARE For Life (quân nhân đã nghỉ hưu)",
    "A Marketplace / ACA plan": "Chương trình Marketplace / ACA",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "Không có / chưa có bảo hiểm",
    "I'm not sure": "Tôi không chắc",
    "Answer a few questions for a plan built around you": "Trả lời vài câu hỏi để có kế hoạch phù hợp với bạn",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "Công cụ này đưa ra các bước tiếp theo rõ ràng, dễ hiểu cho tình huống của bạn. Nó giải thích các quy định của Medicare cho bạn — không bán hay giới thiệu bất kỳ chương trình cụ thể nào.",
    "1. Are you deciding for yourself, or helping someone else?": "1. Bạn đang quyết định cho chính mình, hay đang giúp người khác?",
    "Deciding for myself": "Quyết định cho chính mình",
    "Helping someone else": "Giúp người khác",
    "on behalf of the person": "thay mặt cho người đó",
    "2. Are you single or married/partnered?": "2. Bạn độc thân hay đã kết hôn/có bạn đời?",
    "Single": "Độc thân",
    "Married or partnered": "Đã kết hôn hoặc có bạn đời",
    "3. What health coverage do you have or expect around age 65?": "3. Bạn có hoặc dự kiến sẽ có loại bảo hiểm sức khỏe nào ở tuổi 65?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. Vợ/chồng/bạn đời của bạn từ 65 tuổi trở lên, hay dưới 65 tuổi?",
    "65 or older (deciding about Medicare now)": "Từ 65 tuổi trở lên (đang quyết định về Medicare ngay bây giờ)",
    "Under 65 (not yet Medicare-eligible)": "Dưới 65 tuổi (chưa đủ điều kiện hưởng Medicare)",
    "5. What health coverage does your spouse/partner have or expect?": "5. Vợ/chồng/bạn đời của bạn có hoặc dự kiến sẽ có loại bảo hiểm sức khỏe nào?",
    "Show my next steps": "Xem các bước tiếp theo của tôi",
    "Please answer the questions above to see your plan.": "Vui lòng trả lời các câu hỏi ở trên để xem kế hoạch của bạn.",
    "Part A:": "Part A:",
    "Part B:": "Part B:",
    "Prescriptions (Part D):": "Thuốc theo toa (Part D):",
    "Your spouse/partner": "Vợ/chồng/bạn đời của bạn",
    "Not yet — but on the radar": "Chưa — nhưng đang được lưu ý",
    "your": "của bạn",
    "Remember": "Xin nhớ",
    "Two separate decisions": "Hai quyết định riêng biệt",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare mang tính cá nhân — không có Medicare theo gia đình. Mỗi người trong hai bạn sẽ đăng ký (hoặc trì hoãn) dựa trên bảo hiểm hiện có của riêng mình, theo thời gian riêng của mình.",
    "Before you choose a path": "Trước khi bạn chọn hướng đi",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Original Medicare so với Medicare Advantage — phần khó thay đổi lại",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "Ngoài vấn đề thời gian nêu trên, bạn sẽ phải chọn giữa Original Medicare (có thể kèm theo Medigap bổ sung) và Medicare Advantage. Cả hai đều bao phủ các quyền lợi giống nhau, nhưng Advantage sử dụng mạng lưới nhà cung cấp và yêu cầu chấp thuận trước. Điều quan trọng cần lưu ý: Medigap có “cánh cửa một chiều” — nghĩa là sau này chuyển từ Advantage trở lại Original + Medigap có thể cần thẩm định y tế và có thể bị từ chối. Hãy cân nhắc kỹ trước khi chọn — đây là quyết định khó thay đổi lại nhất.",
    "Do these next": "Việc cần làm tiếp theo",
    "Your next steps": "Các bước tiếp theo của bạn",
    "Limited income?": "Thu nhập hạn chế?",
    "Getting help paying": "Nhận hỗ trợ chi trả",
    "Anything special apply?": "Có trường hợp đặc biệt nào áp dụng không?",
    "Edge cases to watch": "Những trường hợp đặc biệt cần lưu ý",
    "Do any of these apply to you? They can change your timing or choices:": "Có điều nào dưới đây áp dụng cho bạn không? Chúng có thể thay đổi thời gian hoặc lựa chọn của bạn:",
    "HSA contributor:": "Người đóng góp vào HSA:",
    "Higher income:": "Thu nhập cao hơn:",
    "Living part-time abroad:": "Sống một phần thời gian ở nước ngoài:",
    "Start over": "Bắt đầu lại"
},
    "ko": {
    "Still working — employer has 20+ employees": "현재 근무 중 — 고용주 직원 수 20명 이상",
    "Still working — employer has fewer than 20 employees": "현재 근무 중 — 고용주 직원 수 20명 미만",
    "Covered by a spouse/partner's employer plan (they're still working)": "배우자/파트너의 직장 보험 적용 중 (배우자/파트너가 현재 근무 중)",
    "Retiree coverage from a former employer": "이전 직장의 은퇴자 보험",
    "VA health care": "VA 건강보험 (재향군인 의료)",
    "TRICARE For Life (military retiree)": "TRICARE For Life (군 은퇴자)",
    "A Marketplace / ACA plan": "Marketplace / ACA 플랜",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "없음 / 보험 미가입",
    "I'm not sure": "잘 모르겠어요",
    "Answer a few questions for a plan built around you": "몇 가지 질문에 답하고 나에게 맞는 계획을 받아보세요",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "이 도구는 귀하의 상황에 맞는 명확하고 쉬운 다음 단계를 알려드립니다. Medicare 규정을 설명해 드릴 뿐, 특정 플랜을 판매하거나 추천하지 않습니다.",
    "1. Are you deciding for yourself, or helping someone else?": "1. 본인을 위해 결정하시나요, 아니면 다른 분을 돕고 계신가요?",
    "Deciding for myself": "제 자신을 위해 결정",
    "Helping someone else": "다른 분을 돕는 중",
    "on behalf of the person": "그분을 대신하여",
    "2. Are you single or married/partnered?": "2. 미혼이신가요, 아니면 배우자/파트너가 있으신가요?",
    "Single": "미혼",
    "Married or partnered": "배우자/파트너 있음",
    "3. What health coverage do you have or expect around age 65?": "3. 만 65세 무렵에 어떤 건강보험을 갖고 계시거나 예상하시나요?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. 배우자/파트너는 만 65세 이상인가요, 아니면 65세 미만인가요?",
    "65 or older (deciding about Medicare now)": "65세 이상 (지금 Medicare를 결정 중)",
    "Under 65 (not yet Medicare-eligible)": "65세 미만 (아직 Medicare 대상 아님)",
    "5. What health coverage does your spouse/partner have or expect?": "5. 배우자/파트너는 어떤 건강보험을 갖고 계시거나 예상하시나요?",
    "Show my next steps": "다음 단계 보기",
    "Please answer the questions above to see your plan.": "위 질문에 답하시면 맞춤 계획을 보여드립니다.",
    "Part A:": "Part A:",
    "Part B:": "Part B:",
    "Prescriptions (Part D):": "처방약 (Part D):",
    "Your spouse/partner": "배우자/파트너",
    "Not yet — but on the radar": "아직 아니지만 — 염두에 두고 있음",
    "your": "귀하의",
    "Remember": "기억하세요",
    "Two separate decisions": "두 가지 별개의 결정",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare는 개인별로 적용됩니다 — 가족 단위 Medicare는 없습니다. 각자 위에서 답한 본인의 보험 상황에 따라, 각자의 일정에 맞춰 가입하거나 연기하게 됩니다.",
    "Before you choose a path": "방향을 선택하기 전에",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "오리지널 Medicare와 Medicare Advantage 비교 — 되돌리기 어려운 부분",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "위의 시기 문제와는 별도로, 오리지널 Medicare(선택적으로 Medigap 보충보험 포함)와 Medicare Advantage 중 하나를 선택하게 됩니다. 두 가지 모두 동일한 혜택을 보장하지만, Advantage는 네트워크와 사전 승인 절차를 사용합니다. 핵심 주의사항: Medigap의 '일방통행 문' 때문에 나중에 Advantage에서 오리지널 + Medigap으로 다시 바꾸려면 건강 심사가 필요할 수 있고 거부될 수도 있습니다. 선택하기 전에 이 점을 신중히 고려하세요 — 되돌리기가 가장 어려운 결정입니다.",
    "Do these next": "다음으로 이렇게 하세요",
    "Your next steps": "다음 단계",
    "Limited income?": "소득이 적으신가요?",
    "Getting help paying": "비용 지원 받기",
    "Anything special apply?": "해당되는 특별한 사항이 있나요?",
    "Edge cases to watch": "주의해야 할 특수한 경우",
    "Do any of these apply to you? They can change your timing or choices:": "다음 중 해당되는 사항이 있으신가요? 이는 시기나 선택에 영향을 줄 수 있습니다:",
    "HSA contributor:": "HSA(건강저축계좌) 납입자:",
    "Higher income:": "고소득자:",
    "Living part-time abroad:": "해외에서 일부 기간 거주:",
    "Start over": "처음부터 다시 시작"
},
    "tl": {
    "Still working — employer has 20+ employees": "Nagtatrabaho pa — 20+ empleyado ang employer",
    "Still working — employer has fewer than 20 employees": "Nagtatrabaho pa — mas kaunti sa 20 empleyado ang employer",
    "Covered by a spouse/partner's employer plan (they're still working)": "Nasasaklawan ng plano ng employer ng asawa/partner (nagtatrabaho pa sila)",
    "Retiree coverage from a former employer": "Saklaw ng retiree mula sa dating employer",
    "VA health care": "VA health care",
    "TRICARE For Life (military retiree)": "TRICARE For Life (retiradong militar)",
    "A Marketplace / ACA plan": "Isang planong Marketplace / ACA",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "Wala / walang insurance",
    "I'm not sure": "Hindi ako sigurado",
    "Answer a few questions for a plan built around you": "Sagutan ang ilang tanong para sa isang planong angkop para sa iyo",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "Bibigyan ka nito ng malinaw at simpleng susunod na hakbang para sa iyong sitwasyon. Ipinapaliwanag nito ang mga alituntunin ng Medicare para sa iyo — hindi ito nagbebenta o nagrerekomenda ng anumang partikular na plano.",
    "1. Are you deciding for yourself, or helping someone else?": "1. Ikaw ba ang magpapasya para sa sarili mo, o tumutulong ka sa iba?",
    "Deciding for myself": "Magpapasya para sa sarili ko",
    "Helping someone else": "Tumutulong sa iba",
    "on behalf of the person": "sa ngalan ng tao",
    "2. Are you single or married/partnered?": "2. Ikaw ba ay walang asawa, o may asawa/partner?",
    "Single": "Walang asawa",
    "Married or partnered": "May asawa o partner",
    "3. What health coverage do you have or expect around age 65?": "3. Anong saklaw pangkalusugan ang mayroon ka o inaasahan mo sa edad na 65?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. Ang asawa/partner mo ba ay 65 taon gulang na o mas matanda, o wala pang 65?",
    "65 or older (deciding about Medicare now)": "65 taon o mas matanda (nagpapasya na tungkol sa Medicare ngayon)",
    "Under 65 (not yet Medicare-eligible)": "Wala pang 65 (hindi pa karapat-dapat sa Medicare)",
    "5. What health coverage does your spouse/partner have or expect?": "5. Anong saklaw pangkalusugan ang mayroon o inaasahan ng asawa/partner mo?",
    "Show my next steps": "Ipakita ang mga susunod kong hakbang",
    "Please answer the questions above to see your plan.": "Pakisagutan ang mga tanong sa itaas para makita ang iyong plano.",
    "Part A:": "Part A:",
    "Part B:": "Part B:",
    "Prescriptions (Part D):": "Mga Reseta (Part D):",
    "Your spouse/partner": "Ang asawa/partner mo",
    "Not yet — but on the radar": "Hindi pa — pero nasa isip na",
    "your": "iyong",
    "Remember": "Tandaan",
    "Two separate decisions": "Dalawang magkahiwalay na desisyon",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Indibidwal ang Medicare — walang family Medicare. Bawat isa sa inyo ay mag-eenroll (o mag-aantala) batay sa sarili ninyong saklaw sa itaas, sa sarili ninyong takdang panahon.",
    "Before you choose a path": "Bago ka pumili ng landas",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Original Medicare kumpara sa Medicare Advantage — ang mahirap nang baguhin na bahagi",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "Hiwalay sa pagpapasya ng timing sa itaas, pipili ka sa pagitan ng Original Medicare (maaaring may karagdagang Medigap) at Medicare Advantage. Parehong sakop ang mga ito ng parehong benepisyo, pero gumagamit ang Advantage ng mga network at paunang pahintulot (prior authorization). Ang pangunahing bagay na dapat isaalang-alang: ang Medigap ay may “one-way door” — ibig sabihin, kung lilipat ka mula sa Advantage pabalik sa Original + Medigap sa hinaharap, maaaring kailanganin ang medical underwriting at maaari kang tanggihan. Timbangin ito bago pumili — ito ang desisyong pinakamahirap nang baguhin.",
    "Do these next": "Gawin ang mga ito susunod",
    "Your next steps": "Ang iyong mga susunod na hakbang",
    "Limited income?": "Limitado ang kita?",
    "Getting help paying": "Humingi ng tulong sa pagbabayad",
    "Anything special apply?": "May espesyal bang naaangkop sa iyo?",
    "Edge cases to watch": "Mga espesyal na sitwasyong dapat bantayan",
    "Do any of these apply to you? They can change your timing or choices:": "May naaangkop ba sa iyo sa mga ito? Maaari nitong baguhin ang iyong timing o mga pagpipilian:",
    "HSA contributor:": "Nag-aambag sa HSA:",
    "Higher income:": "Mas mataas na kita:",
    "Living part-time abroad:": "Naninirahan nang part-time sa ibang bansa:",
    "Start over": "Magsimula ulit"
}
  };
  var MP_LANG = (document.documentElement.getAttribute("lang") || "en").trim() || "en";
  function t(en) {
    var tbl = I18N[MP_LANG];
    return (tbl && tbl[en]) || en;
  }

  // Coverage options offered for "you" and "your spouse/partner".
  var COVERAGE = [
    { id: "working_large", label: t("Still working — employer has 20+ employees") },
    { id: "working_small", label: t("Still working — employer has fewer than 20 employees") },
    { id: "spouse_plan",   label: t("Covered by a spouse/partner's employer plan (they're still working)") },
    { id: "retiree",       label: t("Retiree coverage from a former employer") },
    { id: "cobra",         label: "COBRA" },
    { id: "va",            label: t("VA health care") },
    { id: "tricare",       label: t("TRICARE For Life (military retiree)") },
    { id: "marketplace",   label: t("A Marketplace / ACA plan") },
    { id: "medicaid",      label: t("Medicaid") },
    { id: "none",          label: t("Nothing / uninsured") },
    { id: "unsure",        label: t("I'm not sure") }
  ];

  // Guidance block per coverage type. partB is the pivotal, directive line.
  var G = {
    working_large: {
      verdict: "You can probably delay Part B safely — but confirm two things first.",
      partB: "Because you have active coverage from an employer with 20+ employees, you can usually delay Part B without a penalty and add it later through a Special Enrollment Period when the job or that coverage ends. Confirm two facts in writing: the employer truly has 20+ employees, and the plan is “creditable.”",
      partA: "Enroll in premium-free Part A during your window — unless you contribute to an HSA, in which case Part A stops new HSA contributions.",
      partD: "Employer drug coverage is usually creditable, so you can likely delay Part D too. Get that confirmed by the plan.",
      links: [["/working-past-65.html","Working Past 65"],["/medicare-part-b.html","About Part B"],["/enrollment.html","Enrollment windows"]]
    },
    working_small: {
      verdict: "Enroll in BOTH Part A and Part B during your 7-month window — don't delay.",
      partB: "With a small employer (fewer than 20 employees), Medicare is usually PRIMARY and the employer plan pays second. If you skip Part B, you can be left with large gaps and a lifelong penalty. Sign up for Part B on time.",
      partA: "Enroll in premium-free Part A as well.",
      partD: "Confirm whether the employer drug coverage is creditable; if not, take Part D on time.",
      links: [["/working-past-65.html","Working Past 65"],["/medicare-part-b.html","About Part B"],["/enrollment.html","Enrollment windows"]]
    },
    spouse_plan: {
      verdict: "You can likely delay Part B based on your spouse's active employment — verify it.",
      partB: "Coverage through a spouse/partner who is actively working at an employer with 20+ employees generally lets you delay Part B without penalty, with a Special Enrollment Period when their employment or that coverage ends. Confirm the employer size and creditable status.",
      partA: "Take premium-free Part A now (watch the HSA rule if either of you contributes to one).",
      partD: "Their employer drug coverage is usually creditable — confirm before delaying Part D.",
      links: [["/working-past-65.html","Working Past 65"],["/retiring-losing-coverage.html","When that coverage ends"]]
    },
    retiree: {
      verdict: "Enroll in Part A and Part B on time — retiree coverage expects it.",
      partB: "Retiree coverage from a former employer does NOT let you delay Part B without penalty. These plans almost always assume you take Medicare at 65 and pay second. Enroll in Part B during your window.",
      partA: "Enroll in premium-free Part A too.",
      partD: "Some retiree plans include creditable drug coverage that stands in for Part D — confirm with the plan before skipping Part D.",
      links: [["/retiring-losing-coverage.html","Retiring or Losing Coverage"],["/medicare-part-b.html","About Part B"]]
    },
    cobra: {
      verdict: "Enroll in Medicare on time — COBRA is a trap for delaying Part B.",
      partB: "COBRA does NOT count as active coverage for delaying Part B. If you rely on COBRA and skip Part B, you'll likely get a lifelong penalty and a coverage gap. Enroll in Part A and Part B during your Initial Enrollment Period even if you still have COBRA.",
      partA: "Enroll in premium-free Part A.",
      partD: "COBRA drug coverage may not be creditable — check, and take Part D on time if it isn't.",
      links: [["/retiring-losing-coverage.html","Retiring or Losing Coverage"],["/medicare-part-b.html","About Part B"]]
    },
    va: {
      verdict: "Take Part A; make a deliberate Part B decision; you can likely skip Part D.",
      partB: "VA health care is a separate system and does NOT let you delay Part B without penalty. Many veterans still enroll in Part B at 65 to keep access to civilian care; some skip it on purpose. Decide deliberately during your window — don't let it lapse by accident.",
      partA: "Take premium-free Part A — it adds civilian hospital coverage on top of the VA.",
      partD: "VA drug coverage IS creditable, so you can usually skip Part D without penalty while using the VA pharmacy.",
      links: [["/veterans-medicare.html","Veterans & Medicare (read this)"],["/medicare-part-b.html","About Part B"]]
    },
    tricare: {
      verdict: "You MUST enroll in Part B to keep TRICARE For Life.",
      partB: "TRICARE For Life requires Medicare Part B once you're eligible. If you don't enroll, you can lose TRICARE. Enroll in Part A and Part B during your window.",
      partA: "Enroll in premium-free Part A.",
      partD: "TRICARE's drug coverage is creditable — you generally don't need Part D.",
      links: [["/veterans-medicare.html","Veterans & Medicare"],["/medicare-part-b.html","About Part B"]]
    },
    marketplace: {
      verdict: "Move to Medicare at 65 and end the Marketplace plan (no gap).",
      partB: "Once you're eligible for Medicare, Marketplace premium subsidies generally stop, and keeping a subsidized Marketplace plan can mean paying subsidies back. Enroll in Part A and Part B during your Initial Enrollment Period and end the Marketplace plan, timing it so there's no gap.",
      partA: "Enroll in premium-free Part A.",
      partD: "Set up Part D (or get drug coverage through a Medicare Advantage plan).",
      links: [["/marketplace.html","About the Marketplace"],["/enrollment.html","Enrollment windows"]]
    },
    medicaid: {
      verdict: "Enroll in Medicare — you'll likely be “dual eligible,” and Medicaid may help pay.",
      partB: "Enroll in Part A and Part B during your window. With Medicaid you may become dual eligible: Medicare becomes primary, and Medicaid may help pay your premiums and cost-sharing.",
      partA: "Enroll in premium-free Part A.",
      partD: "You likely qualify automatically for Extra Help with drug costs — see Getting Help Paying.",
      links: [["/dual-eligible.html","Both Medicare & Medicaid"],["/getting-help.html","Getting Help Paying"]]
    },
    none: {
      verdict: "Enroll in Part A, Part B, and drug coverage during your 7-month window.",
      partB: "With no other coverage, there's nothing to delay for. Enroll in Part A and Part B during your Initial Enrollment Period to avoid penalties and gaps.",
      partA: "Enroll in premium-free Part A.",
      partD: "Set up drug coverage (Part D) on time, and use your one-time Medigap window if you choose Original Medicare.",
      links: [["/enrollment.html","Enrollment windows"],["/medigap.html","Medigap window"],["/getting-help.html","Help paying"]]
    },
    unsure: {
      verdict: "First, find out if your coverage is “creditable” and “active employer.”",
      partB: "Two facts decide everything: is your coverage from a currently-active employer (and how big is it), and is it “creditable”? Call your HR/benefits office or plan, and a free SHIP counselor, before your window closes.",
      partA: "Take premium-free Part A now while you sort out the rest (watch the HSA rule).",
      partD: "Ask the same source whether your drug coverage is creditable.",
      links: [["/ship-directory.html","Find free SHIP help"],["/enrollment.html","Enrollment windows"]]
    }
  };

  var NEXT_STEPS = [
    "Put your 7-month Initial Enrollment Period on the calendar (it starts 3 months before your birthday month) and set an early reminder.",
    "Create your accounts at ssa.gov (Social Security handles sign-up) and medicare.gov.",
    "Confirm in writing whether your current coverage is “creditable” and whether it's active-employer — this one fact drives your timing.",
    "Gather your info: work history, current coverage details, your doctors, your medications and pharmacy, and your spouse's coverage and age.",
    "Call a free SHIP counselor (or 1-800-MEDICARE, 1-800-633-4227) to review your specifics before you enroll.",
    "Enroll during your window — or make a deliberate, confirmed decision to delay. Don't let the window pass by accident."
  ];

  var root = document.getElementById("medicare-navigator");
  if (!root) return;

  var state = { deciding: null, married: null, you: null, spouseAge: null, spouse: null };

  function optionsHTML(name) {
    return COVERAGE.map(function (c) {
      return '<label><input type="radio" name="' + name + '" value="' + c.id + '"><span>' + c.label + '</span></label>';
    }).join("");
  }

  function esc(s){ return s; }

  function renderForm() {
    root.innerHTML =
      '<h2>' + t('Answer a few questions for a plan built around you') + '</h2>' +
      '<p>' + t('This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.') + '</p>' +
      '<div class="nav-q"><span class="nav-label">' + t('1. Are you deciding for yourself, or helping someone else?') + '</span>' +
        '<div class="nav-options">' +
          '<label><input type="radio" name="deciding" value="self"><span>' + t('Deciding for myself') + '</span></label>' +
          '<label><input type="radio" name="deciding" value="other"><span>' + t('Helping someone else') + '</span></label>' +
        '</div></div>' +
      '<div id="helper-note" class="nav-hidden note tip" style="margin: 1rem 0; font-size: 0.95rem;">' +
        '<strong>You\'re a helper.</strong> Answer the remaining questions <em>' + t('on behalf of the person') + '</em> you\'re helping. See <a href="/caregivers.html">Caregivers and Authorized Representatives</a> for what authority you need.' +
      '</div>' +
      '<div class="nav-q"><span class="nav-label">' + t('2. Are you single or married/partnered?') + '</span>' +
        '<div class="nav-options">' +
          '<label><input type="radio" name="married" value="no"><span>' + t('Single') + '</span></label>' +
          '<label><input type="radio" name="married" value="yes"><span>' + t('Married or partnered') + '</span></label>' +
        '</div></div>' +
      '<div class="nav-q"><span class="nav-label">' + t('3. What health coverage do you have or expect around age 65?') + '</span>' +
        '<div class="nav-options">' + optionsHTML("you") + '</div></div>' +
      '<div id="spouse-block" class="nav-hidden">' +
        '<div class="nav-q"><span class="nav-label">' + t('4. Is your spouse/partner 65 or older, or under 65?') + '</span>' +
          '<div class="nav-options">' +
            '<label><input type="radio" name="spouseAge" value="65plus"><span>' + t('65 or older (deciding about Medicare now)') + '</span></label>' +
            '<label><input type="radio" name="spouseAge" value="under65"><span>' + t('Under 65 (not yet Medicare-eligible)') + '</span></label>' +
          '</div></div>' +
        '<div class="nav-q nav-hidden" id="spouse-cov-q"><span class="nav-label">' + t('5. What health coverage does your spouse/partner have or expect?') + '</span>' +
          '<div class="nav-options">' + optionsHTML("spouse") + '</div></div>' +
      '</div>' +
      '<div class="nav-actions">' +
        '<button type="button" class="nav-btn" id="nav-go">' + t('Show my next steps') + '</button>' +
      '</div>' +
      '<p id="nav-warn" class="glossary-empty nav-hidden">' + t('Please answer the questions above to see your plan.') + '</p>';

    root.addEventListener("change", onChange);
    document.getElementById("nav-go").addEventListener("click", onGo);
  }

  function onChange(e) {
    if (e.target.name === "deciding") {
      state.deciding = e.target.value;
      document.getElementById("helper-note").className = e.target.value === "other" ? "note tip" : "nav-hidden";
    } else if (e.target.name === "married") {
      state.married = e.target.value === "yes";
      document.getElementById("spouse-block").className = state.married ? "" : "nav-hidden";
    } else if (e.target.name === "you") state.you = e.target.value;
    else if (e.target.name === "spouse") state.spouse = e.target.value;
    else if (e.target.name === "spouseAge") {
      state.spouseAge = e.target.value;
      // The spouse's coverage type only matters if they're deciding about Medicare now.
      document.getElementById("spouse-cov-q").className =
        e.target.value === "65plus" ? "nav-q" : "nav-q nav-hidden";
    }
  }

  function trackHTML(title, tag, cov) {
    var g = G[cov];
    var links = g.links.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + '</a>'; }).join("");
    return '<div class="track"><span class="tag">' + tag + '</span><h3>' + title + '</h3>' +
      '<p class="verdict-line"><strong>' + g.verdict + '</strong></p>' +
      '<p><strong>' + t('Part A:') + '</strong> ' + g.partA + '</p>' +
      '<p><strong>' + t('Part B:') + '</strong> ' + g.partB + '</p>' +
      '<p><strong>' + t('Prescriptions (Part D):') + '</strong> ' + g.partD + '</p>' +
      '<p class="reflinks">' + links + '</p></div>';
  }

  function onGo() {
    var warn = document.getElementById("nav-warn");
    if (!state.deciding || state.married === null || !state.you ||
        (state.married && !state.spouseAge) ||
        (state.married && state.spouseAge === "65plus" && !state.spouse)) {
      warn.className = "glossary-empty"; return;
    }
    warn.className = "glossary-empty nav-hidden";
    if (typeof gtag === "function") {
      gtag("event", "navigator_result", {
        coverage: state.you,
        married: state.married ? "yes" : "no"
      });
    }

    var html = '<div class="nav-result">';
    html += '<div class="verdict">Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.</div>';
    html += trackHTML("Your path", "You", state.you);

    if (state.married) {
      if (state.spouseAge === "under65") {
        html += '<div class="track"><span class="tag">' + t('Your spouse/partner') + '</span><h3>' + t('Not yet — but on the radar') + '</h3>' +
          '<p>Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If <em>' + t('your') + '</em> Medicare choice affects a plan you share, factor that in now.</p>' +
          '<p class="reflinks"><a href="/enrollment.html">Enrollment windows</a><a href="/retiring-losing-coverage.html">If coverage ends</a></p></div>';
      } else {
        html += trackHTML("Your spouse/partner's path", "Spouse/partner", state.spouse);
        html += '<div class="track"><span class="tag">' + t('Remember') + '</span><h3>' + t('Two separate decisions') + '</h3>' +
          '<p>' + t('Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.') + '</p></div>';
      }
    }

    html += '<div class="track"><span class="tag">' + t('Before you choose a path') + '</span><h3>' + t('Original Medicare vs. Medicare Advantage — the hard-to-reverse part') + '</h3>' +
      '<p>' + t('Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.') + '</p>' +
      '<p class="reflinks"><a href="/choosing-coverage.html">How to choose</a><a href="/edge-cases.html">Edge cases &amp; the one-way door</a></p></div>';

    html += '<div class="track"><span class="tag">' + t('Do these next') + '</span><h3>' + t('Your next steps') + '</h3><ol class="steps">' +
      NEXT_STEPS.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol></div>";

    html += '<div class="track"><span class="tag">' + t('Limited income?') + '</span><h3>' + t('Getting help paying') + '</h3>' +
      '<p>If money is tight, Medicaid, Medicare Savings Programs, and Extra Help can pay your premiums and reduce drug costs. Having both Medicare and Medicaid (called "dual eligible") unlocks extra benefits. <strong>Many people qualify and don\'t realize it.</strong></p>' +
      '<p class="reflinks"><a href="/getting-help.html">See programs you might qualify for</a><a href="/dual-eligible.html">How being dual eligible works</a></p></div>';

    html += '<div class="track"><span class="tag">' + t('Anything special apply?') + '</span><h3>' + t('Edge cases to watch') + '</h3>' +
      '<p>' + t('Do any of these apply to you? They can change your timing or choices:') + '</p>' +
      '<ul style="margin: 0.6rem 0; padding-left: 1.4rem;">' +
      '<li><strong>' + t('HSA contributor:') + '</strong> Enrolling in Part A freezes new HSA contributions. <a href="/edge-cases.html">See what that means.</a></li>' +
      '<li><strong>' + t('Higher income:') + '</strong> Income over certain limits triggers IRMAA (extra premiums). <a href="/costs.html">Understanding costs and premiums.</a></li>' +
      '<li><strong>' + t('Living part-time abroad:') + '</strong> Original Medicare may limit coverage. <a href="/edge-cases.html">Traveling and living abroad.</a></li>' +
      '</ul></div>';

    html += '<div class="note">Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free <a href="/ship-directory.html">SHIP counselor</a> before you decide.</div>';
    html += '<div class="nav-actions"><button type="button" class="nav-btn secondary" id="nav-reset">' + t('Start over') + '</button></div>';
    html += '</div>';

    root.insertAdjacentHTML("beforeend", html);
    document.getElementById("nav-go").className = "nav-btn nav-hidden";
    document.getElementById("nav-reset").addEventListener("click", function () {
      state = { deciding: null, married: null, you: null, spouseAge: null, spouse: null };
      renderForm();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    root.querySelector(".nav-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderForm();
})();
