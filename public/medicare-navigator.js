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
    "es": {
    "Still working — employer has 20+ employees": "Todavía trabajando — el empleador tiene 20 o más empleados",
    "Still working — employer has fewer than 20 employees": "Todavía trabajando — el empleador tiene menos de 20 empleados",
    "Covered by a spouse/partner's employer plan (they're still working)": "Cubierto por el plan del empleador de su cónyuge o pareja (todavía está trabajando)",
    "Retiree coverage from a former employer": "Cobertura de jubilado de un empleador anterior",
    "VA health care": "Atención médica de VA",
    "TRICARE For Life (military retiree)": "TRICARE For Life (jubilado militar)",
    "A Marketplace / ACA plan": "Un plan del Mercado / ACA",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "Ninguna / sin seguro",
    "I'm not sure": "No estoy seguro/a",
    "Answer a few questions for a plan built around you": "Responda unas preguntas para obtener un plan pensado para usted",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "Esto le da pasos claros y directos en lenguaje sencillo para su situación. Le explica las reglas de Medicare — no vende ni recomienda ningún plan específico.",
    "1. Are you deciding for yourself, or helping someone else?": "1. ¿Está decidiendo por usted mismo/a, o ayudando a otra persona?",
    "Deciding for myself": "Decidiendo por mí mismo/a",
    "Helping someone else": "Ayudando a otra persona",
    "Answer the remaining questions": "Responda las preguntas restantes",
    "on behalf of the person": "en nombre de la persona",
    "Caregivers and Authorized Representatives": "Cuidadores y representantes autorizados",
    "2. Are you single or married/partnered?": "2. ¿Es soltero/a o está casado/a o en pareja?",
    "Single": "Soltero/a",
    "Married or partnered": "Casado/a o en pareja",
    "3. What health coverage do you have or expect around age 65?": "3. ¿Qué cobertura de salud tiene o espera tener alrededor de los 65 años?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. ¿Su cónyuge o pareja tiene 65 años o más, o es menor de 65?",
    "65 or older (deciding about Medicare now)": "65 años o más (decidiendo sobre Medicare ahora)",
    "Under 65 (not yet Medicare-eligible)": "Menor de 65 (aún no es elegible para Medicare)",
    "5. What health coverage does your spouse/partner have or expect?": "5. ¿Qué cobertura de salud tiene o espera tener su cónyuge o pareja?",
    "Show my next steps": "Mostrar mis próximos pasos",
    "Please answer the questions above to see your plan.": "Responda las preguntas de arriba para ver su plan.",
    "Part A:": "Parte A:",
    "Part B:": "Parte B:",
    "Prescriptions (Part D):": "Medicamentos recetados (Parte D):",
    "Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.": "Aquí está su plan con pasos claros. Todo lo siguiente asume que actúa durante su Período de Inscripción Inicial de 7 meses.",
    "Your spouse/partner": "Su cónyuge o pareja",
    "Not yet — but on the radar": "Todavía no — pero está en la mira",
    "Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If": "Su cónyuge o pareja es menor de 65 años, así que mantiene su cobertura actual por ahora. Medicare es individual: pasará por estos mismos pasos cuando se acerque a los 65 o pierda esa cobertura. Si",
    "your": "su",
    "Medicare choice affects a plan you share, factor that in now.": "elección de Medicare afecta un plan que comparten, téngalo en cuenta ahora.",
    "Enrollment windows": "Períodos de inscripción",
    "If coverage ends": "Si la cobertura termina",
    "Remember": "Recuerde",
    "Two separate decisions": "Dos decisiones separadas",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare es individual — no existe un Medicare familiar. Cada uno se inscribe (o retrasa la inscripción) según su propia cobertura mencionada arriba, en su propio calendario.",
    "Before you choose a path": "Antes de elegir un camino",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Medicare Original frente a Medicare Advantage — la parte difícil de revertir",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "Aparte del momento de inscripción mencionado arriba, elegirá entre Medicare Original (opcionalmente con un suplemento Medigap) y Medicare Advantage. Ambos cubren los mismos beneficios, pero Advantage usa redes y autorización previa. El detalle clave: la “puerta de un solo sentido” de Medigap significa que cambiar de Advantage de vuelta a Original + Medigap más adelante puede requerir una evaluación médica y ser rechazado. Considere esto antes de elegir — es la decisión más difícil de revertir.",
    "How to choose": "Cómo elegir",
    "Edge cases &amp; the one-way door": "Casos especiales &amp; la puerta de un solo sentido",
    "Do these next": "Haga esto a continuación",
    "Your next steps": "Sus próximos pasos",
    "Limited income?": "¿Ingresos limitados?",
    "Getting help paying": "Cómo obtener ayuda para pagar",
    "See programs you might qualify for": "Vea los programas para los que podría calificar",
    "How being dual eligible works": "Cómo funciona ser elegible para ambos (dual eligible)",
    "Anything special apply?": "¿Aplica algo especial?",
    "Edge cases to watch": "Casos especiales a tener en cuenta",
    "Do any of these apply to you? They can change your timing or choices:": "¿Se aplica alguno de estos a usted? Pueden cambiar su calendario o sus opciones:",
    "HSA contributor:": "Contribuyente de HSA:",
    "Enrolling in Part A freezes new HSA contributions.": "Inscribirse en la Parte A detiene las nuevas contribuciones a la HSA.",
    "See what that means.": "Vea lo que eso significa.",
    "Higher income:": "Ingresos más altos:",
    "Income over certain limits triggers IRMAA (extra premiums).": "Los ingresos por encima de ciertos límites activan el IRMAA (primas adicionales).",
    "Understanding costs and premiums.": "Entendiendo los costos y las primas.",
    "Living part-time abroad:": "Viviendo parte del tiempo en el extranjero:",
    "Original Medicare may limit coverage.": "Medicare Original puede limitar la cobertura.",
    "Traveling and living abroad.": "Viajar y vivir en el extranjero.",
    "Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free": "Verifique antes de actuar: esto es información educativa general, no un consejo sobre su caso específico. Confirme la cobertura acreditable y el momento con su plan, el Seguro Social y un",
    "SHIP counselor": "consejero de SHIP gratuito",
    "before you decide.": "antes de decidir.",
    "Start over": "Empezar de nuevo"
},
    "zh-Hant": {
    "Still working — employer has 20+ employees": "仍在工作——雇主員工超過20人",
    "Still working — employer has fewer than 20 employees": "仍在工作——雇主員工少於20人",
    "Covered by a spouse/partner's employer plan (they're still working)": "由配偶/伴侶的雇主計畫提供保障（對方仍在工作）",
    "Retiree coverage from a former employer": "來自前雇主的退休人員保障",
    "VA health care": "退伍軍人事務部（VA）醫療保健",
    "TRICARE For Life (military retiree)": "TRICARE For Life（軍人退休人員）",
    "A Marketplace / ACA plan": "Marketplace／ACA計畫",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "沒有／未投保",
    "I'm not sure": "我不確定",
    "Answer a few questions for a plan built around you": "回答幾個問題，取得為您量身打造的計畫",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "這會針對您的情況，提供明確、淺白易懂的下一步指引。它為您解釋Medicare的規則——並不銷售或推薦任何特定計畫。",
    "1. Are you deciding for yourself, or helping someone else?": "1. 您是在為自己做決定，還是在幫助他人？",
    "Deciding for myself": "為自己做決定",
    "Helping someone else": "幫助他人",
    "Answer the remaining questions": "回答其餘問題",
    "on behalf of the person": "代表該人士",
    "Caregivers and Authorized Representatives": "照顧者與授權代表",
    "2. Are you single or married/partnered?": "2. 您是單身，還是已婚／有伴侶？",
    "Single": "單身",
    "Married or partnered": "已婚或有伴侶",
    "3. What health coverage do you have or expect around age 65?": "3. 您在65歲左右擁有或預期會有什麼醫療保障？",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. 您的配偶／伴侶是65歲或以上，還是未滿65歲？",
    "65 or older (deciding about Medicare now)": "65歲或以上（現在正在決定Medicare事宜）",
    "Under 65 (not yet Medicare-eligible)": "未滿65歲（尚未符合Medicare資格）",
    "5. What health coverage does your spouse/partner have or expect?": "5. 您的配偶／伴侶擁有或預期會有什麼醫療保障？",
    "Show my next steps": "顯示我的下一步",
    "Please answer the questions above to see your plan.": "請回答以上問題，以查看您的計畫。",
    "Part A:": "Part A：",
    "Part B:": "Part B：",
    "Prescriptions (Part D):": "處方藥（Part D）：",
    "Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.": "以下是為您規劃的明確計畫。下方內容假設您在7個月的初次投保期（Initial Enrollment Period）內採取行動。",
    "Your spouse/partner": "您的配偶／伴侶",
    "Not yet — but on the radar": "還沒——但已在關注中",
    "Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If": "您的配偶／伴侶未滿65歲，因此目前會繼續保留現有保障。Medicare是以個人為單位：等對方接近65歲，或失去該保障時，也會經歷同樣的步驟。如果",
    "your": "您的",
    "Medicare choice affects a plan you share, factor that in now.": "Medicare的選擇會影響到您們共用的計畫，現在就應把這一點納入考量。",
    "Enrollment windows": "投保時段",
    "If coverage ends": "如果保障終止",
    "Remember": "請記住",
    "Two separate decisions": "兩個各自獨立的決定",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare是以個人為單位——並沒有「家庭Medicare」這回事。你們每個人都要根據自己上述的保障情況，按各自的時間表投保（或延後投保）。",
    "Before you choose a path": "在您選擇方向之前",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Original Medicare 與 Medicare Advantage——難以回頭的部分",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "除了上述的時間安排之外，您還需要在Original Medicare（可選擇搭配Medigap補充保險）與Medicare Advantage之間做出選擇。兩者涵蓋相同的給付項目，但Advantage採用醫療網絡與事前授權制度。關鍵在於：Medigap的「單向門」——意味著日後若想從Advantage轉回Original + Medigap，可能需要通過醫療核保，並可能被拒保。做選擇前請仔細衡量——這是最難以回頭的決定。",
    "How to choose": "如何選擇",
    "Edge cases &amp; the one-way door": "特殊情況 &amp; 單向門",
    "Do these next": "接下來請做這些事",
    "Your next steps": "您的下一步",
    "Limited income?": "收入有限嗎？",
    "Getting help paying": "獲得付款協助",
    "See programs you might qualify for": "查看您可能符合資格的方案",
    "How being dual eligible works": "雙重資格（dual eligible）如何運作",
    "Anything special apply?": "是否有特殊情況適用？",
    "Edge cases to watch": "需留意的特殊情況",
    "Do any of these apply to you? They can change your timing or choices:": "以下是否有任何一項適用於您？這些情況可能會改變您的時間安排或選擇：",
    "HSA contributor:": "HSA（健康儲蓄帳戶）供款人：",
    "Enrolling in Part A freezes new HSA contributions.": "投保Part A後，將無法再新增HSA供款。",
    "See what that means.": "了解這代表什麼意思。",
    "Higher income:": "較高收入：",
    "Income over certain limits triggers IRMAA (extra premiums).": "收入超過特定限額會觸發IRMAA（額外保費）。",
    "Understanding costs and premiums.": "了解費用與保費。",
    "Living part-time abroad:": "部分時間居住在海外：",
    "Original Medicare may limit coverage.": "Original Medicare可能會限制保障範圍。",
    "Traveling and living abroad.": "旅遊與海外生活。",
    "Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free": "行動前請先確認：這是一般教育性資訊，並非針對您個人情況的建議。請向您的保險計畫、Social Security，以及免費的",
    "SHIP counselor": "SHIP諮詢顧問",
    "before you decide.": "做決定前，先進行確認。",
    "Start over": "重新開始"
},
    "vi": {
    "Still working — employer has 20+ employees": "Vẫn đang đi làm — công ty có từ 20 nhân viên trở lên",
    "Still working — employer has fewer than 20 employees": "Vẫn đang đi làm — công ty có dưới 20 nhân viên",
    "Covered by a spouse/partner's employer plan (they're still working)": "Được bảo hiểm theo chương trình của công ty vợ/chồng hoặc bạn đời (họ vẫn đang đi làm)",
    "Retiree coverage from a former employer": "Bảo hiểm hưu trí từ công ty cũ",
    "VA health care": "Chăm sóc sức khỏe của VA",
    "TRICARE For Life (military retiree)": "TRICARE For Life (quân nhân đã nghỉ hưu)",
    "A Marketplace / ACA plan": "Chương trình Marketplace / ACA",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "Không có bảo hiểm",
    "I'm not sure": "Tôi không chắc",
    "Answer a few questions for a plan built around you": "Trả lời vài câu hỏi để có kế hoạch dành riêng cho bạn",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "Công cụ này đưa ra các bước tiếp theo rõ ràng, dễ hiểu cho hoàn cảnh của bạn. Nó giải thích các quy định của Medicare — không bán hay giới thiệu bất kỳ chương trình cụ thể nào.",
    "1. Are you deciding for yourself, or helping someone else?": "1. Bạn đang quyết định cho chính mình, hay đang giúp người khác?",
    "Deciding for myself": "Quyết định cho chính mình",
    "Helping someone else": "Đang giúp người khác",
    "Answer the remaining questions": "Trả lời các câu hỏi còn lại",
    "on behalf of the person": "thay mặt cho người đó",
    "Caregivers and Authorized Representatives": "Người chăm sóc và Người đại diện được ủy quyền",
    "2. Are you single or married/partnered?": "2. Bạn độc thân hay đã kết hôn/có bạn đời?",
    "Single": "Độc thân",
    "Married or partnered": "Đã kết hôn hoặc có bạn đời",
    "3. What health coverage do you have or expect around age 65?": "3. Bạn có hoặc dự kiến có loại bảo hiểm y tế nào khi gần 65 tuổi?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. Vợ/chồng hoặc bạn đời của bạn đã 65 tuổi trở lên, hay dưới 65 tuổi?",
    "65 or older (deciding about Medicare now)": "Từ 65 tuổi trở lên (đang quyết định về Medicare bây giờ)",
    "Under 65 (not yet Medicare-eligible)": "Dưới 65 tuổi (chưa đủ điều kiện nhận Medicare)",
    "5. What health coverage does your spouse/partner have or expect?": "5. Vợ/chồng hoặc bạn đời của bạn có hoặc dự kiến có loại bảo hiểm y tế nào?",
    "Show my next steps": "Xem các bước tiếp theo của tôi",
    "Please answer the questions above to see your plan.": "Vui lòng trả lời các câu hỏi ở trên để xem kế hoạch của bạn.",
    "Part A:": "Part A:",
    "Part B:": "Part B:",
    "Prescriptions (Part D):": "Thuốc theo toa (Part D):",
    "Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.": "Đây là kế hoạch dành cho bạn. Mọi nội dung dưới đây đều giả định bạn thực hiện trong Giai đoạn Đăng ký Ban đầu kéo dài 7 tháng của mình.",
    "Your spouse/partner": "Vợ/chồng hoặc bạn đời của bạn",
    "Not yet — but on the radar": "Chưa đến lúc — nhưng cần lưu ý",
    "Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If": "Vợ/chồng hoặc bạn đời của bạn dưới 65 tuổi, nên hiện tại họ vẫn giữ bảo hiểm hiện có. Medicare mang tính cá nhân: họ sẽ thực hiện các bước tương tự khi gần đến 65 tuổi hoặc mất bảo hiểm đó. Nếu",
    "your": "quyết định về Medicare của bạn",
    "Medicare choice affects a plan you share, factor that in now.": "ảnh hưởng đến một chương trình mà hai người cùng sử dụng, hãy cân nhắc điều đó ngay từ bây giờ.",
    "Enrollment windows": "Các mốc thời gian đăng ký",
    "If coverage ends": "Nếu bảo hiểm kết thúc",
    "Remember": "Lưu ý",
    "Two separate decisions": "Hai quyết định riêng biệt",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare mang tính cá nhân — không có Medicare cho cả gia đình. Mỗi người sẽ đăng ký (hoặc trì hoãn) dựa trên bảo hiểm hiện có nêu trên, theo lịch trình riêng của mình.",
    "Before you choose a path": "Trước khi bạn chọn hướng đi",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Original Medicare so với Medicare Advantage — phần khó thay đổi lại",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "Ngoài thời điểm nêu trên, bạn sẽ cần chọn giữa Original Medicare (có thể kèm thêm chương trình bổ sung Medigap) và Medicare Advantage. Cả hai đều bao phủ các quyền lợi giống nhau, nhưng Advantage sử dụng mạng lưới nhà cung cấp và yêu cầu phê duyệt trước. Điểm mấu chốt: “cánh cửa một chiều” của Medigap có nghĩa là việc chuyển từ Advantage trở lại Original + Medigap sau này có thể yêu cầu thẩm định y tế và có thể bị từ chối. Hãy cân nhắc kỹ trước khi chọn — đây là quyết định khó thay đổi lại nhất.",
    "How to choose": "Cách lựa chọn",
    "Edge cases &amp; the one-way door": "Các trường hợp đặc biệt &amp; cánh cửa một chiều",
    "Do these next": "Việc cần làm tiếp theo",
    "Your next steps": "Các bước tiếp theo của bạn",
    "Limited income?": "Thu nhập hạn chế?",
    "Getting help paying": "Nhận hỗ trợ chi trả",
    "See programs you might qualify for": "Xem các chương trình bạn có thể đủ điều kiện tham gia",
    "How being dual eligible works": "Cách thức hoạt động của việc đủ điều kiện nhận cả hai (dual eligible)",
    "Anything special apply?": "Có trường hợp đặc biệt nào áp dụng không?",
    "Edge cases to watch": "Những trường hợp đặc biệt cần lưu ý",
    "Do any of these apply to you? They can change your timing or choices:": "Có điều nào dưới đây áp dụng cho bạn không? Chúng có thể thay đổi thời điểm hoặc lựa chọn của bạn:",
    "HSA contributor:": "Người đóng góp vào HSA:",
    "Enrolling in Part A freezes new HSA contributions.": "Đăng ký Part A sẽ ngừng việc đóng góp mới vào HSA.",
    "See what that means.": "Xem điều này có ý nghĩa gì.",
    "Higher income:": "Thu nhập cao hơn:",
    "Income over certain limits triggers IRMAA (extra premiums).": "Thu nhập vượt quá một số giới hạn nhất định sẽ áp dụng IRMAA (phí bảo hiểm bổ sung).",
    "Understanding costs and premiums.": "Tìm hiểu về chi phí và phí bảo hiểm.",
    "Living part-time abroad:": "Sống một phần thời gian ở nước ngoài:",
    "Original Medicare may limit coverage.": "Original Medicare có thể giới hạn phạm vi bảo hiểm.",
    "Traveling and living abroad.": "Du lịch và sinh sống ở nước ngoài.",
    "Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free": "Hãy xác minh trước khi hành động: đây là thông tin giáo dục chung, không phải lời khuyên cho trường hợp cụ thể của bạn. Hãy xác nhận về bảo hiểm đủ tiêu chuẩn (creditable coverage) và thời điểm với chương trình của bạn, Social Security, và một",
    "SHIP counselor": "cố vấn SHIP miễn phí",
    "before you decide.": "trước khi bạn quyết định.",
    "Start over": "Bắt đầu lại"
},
    "ko": {
    "Still working — employer has 20+ employees": "아직 직장에 다니고 있음 — 고용주 직원 수 20명 이상",
    "Still working — employer has fewer than 20 employees": "아직 직장에 다니고 있음 — 고용주 직원 수 20명 미만",
    "Covered by a spouse/partner's employer plan (they're still working)": "배우자/파트너의 직장 건강보험 적용 중 (배우자/파트너가 아직 근무 중)",
    "Retiree coverage from a former employer": "이전 직장에서 제공하는 퇴직자 건강보험",
    "VA health care": "VA 의료 서비스",
    "TRICARE For Life (military retiree)": "TRICARE For Life (군 퇴역자)",
    "A Marketplace / ACA plan": "Marketplace / ACA 플랜",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "없음 / 무보험",
    "I'm not sure": "잘 모르겠음",
    "Answer a few questions for a plan built around you": "몇 가지 질문에 답하면 나에게 맞는 계획을 알려드립니다",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "이 도구는 귀하의 상황에 맞는 명확하고 쉬운 다음 단계를 알려드립니다. Medicare 규정을 설명해 드리는 것이며, 특정 플랜을 판매하거나 추천하지 않습니다.",
    "1. Are you deciding for yourself, or helping someone else?": "1. 본인을 위해 결정하시나요, 아니면 다른 사람을 돕고 계신가요?",
    "Deciding for myself": "본인을 위한 결정",
    "Helping someone else": "다른 사람을 돕는 중",
    "Answer the remaining questions": "나머지 질문에 답하기",
    "on behalf of the person": "그 사람을 대신하여",
    "Caregivers and Authorized Representatives": "돌봄 제공자 및 공식 대리인",
    "2. Are you single or married/partnered?": "2. 미혼이신가요, 아니면 기혼/파트너가 있으신가요?",
    "Single": "미혼",
    "Married or partnered": "기혼 또는 파트너 있음",
    "3. What health coverage do you have or expect around age 65?": "3. 65세 무렵에 어떤 건강보험을 가지고 있거나 가질 것으로 예상하시나요?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. 배우자/파트너는 65세 이상인가요, 아니면 65세 미만인가요?",
    "65 or older (deciding about Medicare now)": "65세 이상 (현재 Medicare에 대해 결정 중)",
    "Under 65 (not yet Medicare-eligible)": "65세 미만 (아직 Medicare 대상자가 아님)",
    "5. What health coverage does your spouse/partner have or expect?": "5. 배우자/파트너는 어떤 건강보험을 가지고 있거나 가질 것으로 예상하시나요?",
    "Show my next steps": "다음 단계 보기",
    "Please answer the questions above to see your plan.": "계획을 보려면 위의 질문에 답해 주세요.",
    "Part A:": "Part A:",
    "Part B:": "Part B:",
    "Prescriptions (Part D):": "처방약 (Part D):",
    "Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.": "귀하를 위한 안내 계획입니다. 아래 내용은 모두 7개월간의 최초 가입 기간(Initial Enrollment Period) 중에 행동하는 것을 전제로 합니다.",
    "Your spouse/partner": "배우자/파트너",
    "Not yet — but on the radar": "아직은 아니지만 — 곧 준비해야 함",
    "Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If": "배우자/파트너가 65세 미만이므로 지금은 현재 보험을 그대로 유지합니다. Medicare는 개인별로 적용되므로, 배우자/파트너도 65세에 가까워지거나 현재 보험을 잃게 되면 동일한 단계를 거치게 됩니다.",
    "your": "귀하의",
    "Medicare choice affects a plan you share, factor that in now.": "Medicare 선택이 공동으로 이용하는 플랜에 영향을 준다면, 지금 이 점을 고려하세요.",
    "Enrollment windows": "가입 기간",
    "If coverage ends": "보험이 종료되는 경우",
    "Remember": "기억하세요",
    "Two separate decisions": "두 개의 별도 결정",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Medicare는 개인별로 적용됩니다 — 가족 단위의 Medicare는 없습니다. 각자 위에서 말한 자신의 보험 상황에 따라, 각자의 시기에 맞춰 가입(또는 연기)합니다.",
    "Before you choose a path": "방법을 선택하기 전에",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Original Medicare와 Medicare Advantage — 되돌리기 어려운 부분",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "위의 가입 시기와는 별개로, Original Medicare(선택적으로 Medigap 보완보험 추가)와 Medicare Advantage 중 하나를 선택하게 됩니다. 두 가지 모두 동일한 혜택을 제공하지만, Advantage는 네트워크와 사전 승인 제도를 사용합니다. 중요한 점은: Medigap의 '일방통행 문(one-way door)' 때문에, 나중에 Advantage에서 Original + Medigap으로 다시 전환하려면 건강 심사가 필요할 수 있고 거절될 수도 있습니다. 선택 전에 이 점을 꼭 고려하세요 — 가장 되돌리기 어려운 결정입니다.",
    "How to choose": "선택 방법",
    "Edge cases &amp; the one-way door": "특수한 경우 &amp; 일방통행 문",
    "Do these next": "다음으로 할 일",
    "Your next steps": "다음 단계",
    "Limited income?": "소득이 적으신가요?",
    "Getting help paying": "비용 지원 받기",
    "See programs you might qualify for": "자격이 될 수 있는 프로그램 확인하기",
    "How being dual eligible works": "이중 자격(dual eligible)이란 무엇인가",
    "Anything special apply?": "특별히 해당되는 사항이 있나요?",
    "Edge cases to watch": "주의할 특수한 경우",
    "Do any of these apply to you? They can change your timing or choices:": "다음 중 귀하에게 해당하는 사항이 있나요? 가입 시기나 선택에 영향을 줄 수 있습니다:",
    "HSA contributor:": "HSA 납입자:",
    "Enrolling in Part A freezes new HSA contributions.": "Part A에 가입하면 새로운 HSA 납입이 중단됩니다.",
    "See what that means.": "그것이 무엇을 의미하는지 확인하세요.",
    "Higher income:": "고소득자:",
    "Income over certain limits triggers IRMAA (extra premiums).": "소득이 일정 기준을 넘으면 IRMAA(추가 보험료)가 적용됩니다.",
    "Understanding costs and premiums.": "비용과 보험료 이해하기.",
    "Living part-time abroad:": "해외에서 일부 기간 거주:",
    "Original Medicare may limit coverage.": "Original Medicare는 해외에서 보장이 제한될 수 있습니다.",
    "Traveling and living abroad.": "해외 여행 및 거주.",
    "Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free": "행동하기 전에 확인하세요: 이 정보는 일반적인 교육용 정보이며, 귀하의 구체적인 상황에 대한 조언이 아닙니다. 크레디터블 커버리지(creditable coverage) 여부와 가입 시기는 귀하의 보험 플랜, Social Security, 그리고 무료",
    "SHIP counselor": "SHIP 상담원",
    "before you decide.": "에게 확인한 후 결정하세요.",
    "Start over": "다시 시작"
},
    "tl": {
    "Still working — employer has 20+ employees": "Nagtatrabaho pa rin — 20+ empleyado ang employer",
    "Still working — employer has fewer than 20 employees": "Nagtatrabaho pa rin — mas mababa sa 20 empleyado ang employer",
    "Covered by a spouse/partner's employer plan (they're still working)": "Sakop ng planong pang-empleyado ng asawa/kapareha (nagtatrabaho pa sila)",
    "Retiree coverage from a former employer": "Coverage bilang retirado mula sa dating employer",
    "VA health care": "VA health care",
    "TRICARE For Life (military retiree)": "TRICARE For Life (retiradong militar)",
    "A Marketplace / ACA plan": "Isang Marketplace / ACA plan",
    "Medicaid": "Medicaid",
    "Nothing / uninsured": "Wala / walang insurance",
    "I'm not sure": "Hindi ako sigurado",
    "Answer a few questions for a plan built around you": "Sagutin ang ilang tanong para sa isang planong iaangkop sa iyo",
    "This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.": "Bibigyan ka nito ng malinaw at simpleng mga susunod na hakbang para sa iyong sitwasyon. Ipinapaliwanag nito ang mga patakaran ng Medicare para sa iyo — hindi ito nagbebenta o nagrerekomenda ng anumang partikular na plano.",
    "1. Are you deciding for yourself, or helping someone else?": "1. Nagdedesisyon ka ba para sa sarili mo, o tumutulong ka sa iba?",
    "Deciding for myself": "Nagdedesisyon para sa sarili ko",
    "Helping someone else": "Tumutulong sa iba",
    "Answer the remaining questions": "Sagutin ang mga natitirang tanong",
    "on behalf of the person": "sa ngalan ng tao",
    "Caregivers and Authorized Representatives": "Mga Tagapag-alaga at Awtorisadong Kinatawan",
    "2. Are you single or married/partnered?": "2. Ikaw ba ay walang asawa o kasal/may kapareha?",
    "Single": "Walang asawa",
    "Married or partnered": "Kasal o may kapareha",
    "3. What health coverage do you have or expect around age 65?": "3. Anong health coverage ang mayroon ka o inaasahan mo sa edad na 65?",
    "4. Is your spouse/partner 65 or older, or under 65?": "4. Ang iyong asawa/kapareha ba ay 65 taong gulang pataas, o wala pang 65?",
    "65 or older (deciding about Medicare now)": "65 taong gulang pataas (nagdedesisyon na tungkol sa Medicare ngayon)",
    "Under 65 (not yet Medicare-eligible)": "Wala pang 65 (hindi pa qualified sa Medicare)",
    "5. What health coverage does your spouse/partner have or expect?": "5. Anong health coverage ang mayroon o inaasahan ng iyong asawa/kapareha?",
    "Show my next steps": "Ipakita ang aking mga susunod na hakbang",
    "Please answer the questions above to see your plan.": "Pakisagot ang mga tanong sa itaas upang makita ang iyong plano.",
    "Part A:": "Part A:",
    "Part B:": "Part B:",
    "Prescriptions (Part D):": "Mga Reseta (Part D):",
    "Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.": "Narito ang iyong malinaw na plano. Ipinapalagay ng lahat sa ibaba na kikilos ka sa loob ng iyong 7-buwang Initial Enrollment Period.",
    "Your spouse/partner": "Ang iyong asawa/kapareha",
    "Not yet — but on the radar": "Hindi pa — pero nasa isip na",
    "Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If": "Wala pang 65 ang iyong asawa/kapareha, kaya panatilihin muna nila ang kasalukuyan nilang coverage. Ang Medicare ay individual: dadaan din sila sa mga parehong hakbang na ito kapag malapit na silang mag-65 o mawalan ng coverage na iyon. Kung",
    "your": "iyong",
    "Medicare choice affects a plan you share, factor that in now.": "napipili sa Medicare ay makakaapekto sa isang planong pinagsasaluhan ninyo, isaalang-alang na ito ngayon.",
    "Enrollment windows": "Mga Panahon ng Enrollment",
    "If coverage ends": "Kung matatapos ang coverage",
    "Remember": "Tandaan",
    "Two separate decisions": "Dalawang magkahiwalay na desisyon",
    "Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.": "Ang Medicare ay individual — walang family Medicare. Bawat isa sa inyo ay magpapa-enroll (o magpapaliban) batay sa sariling coverage na nasa itaas, ayon sa sarili ninyong timeline.",
    "Before you choose a path": "Bago ka pumili ng landas",
    "Original Medicare vs. Medicare Advantage — the hard-to-reverse part": "Original Medicare kumpara sa Medicare Advantage — ang bahaging mahirap nang baguhin",
    "Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.": "Bukod sa timing sa itaas, pipili ka sa pagitan ng Original Medicare (maaaring may kasamang Medigap supplement) at Medicare Advantage. Parehas silang sumasaklaw sa mga benepisyo, pero gumagamit ang Advantage ng mga network at prior authorization. Ang mahalagang dapat tandaan: ang “one-way door” ng Medigap ay nangangahulugang ang paglipat mula sa Advantage pabalik sa Original + Medigap sa hinaharap ay maaaring mangailangan ng medical underwriting at maaaring tanggihan. Timbangin ito bago ka pumili — ito ang desisyong pinakamahirap nang baguhin.",
    "How to choose": "Paano pumili",
    "Edge cases &amp; the one-way door": "Mga espesyal na kaso &amp; ang one-way door",
    "Do these next": "Gawin ang mga ito susunod",
    "Your next steps": "Ang iyong mga susunod na hakbang",
    "Limited income?": "Limitado ang kita?",
    "Getting help paying": "Humingi ng tulong sa pagbabayad",
    "See programs you might qualify for": "Tingnan ang mga programang maaaring maging kwalipikado ka",
    "How being dual eligible works": "Paano gumagana ang pagiging dual eligible",
    "Anything special apply?": "May espesyal bang naaangkop sa iyo?",
    "Edge cases to watch": "Mga espesyal na kaso na dapat bantayan",
    "Do any of these apply to you? They can change your timing or choices:": "May naaangkop ba sa mga ito sa iyo? Maaari nilang baguhin ang iyong timing o mga pagpipilian:",
    "HSA contributor:": "Nag-aambag sa HSA:",
    "Enrolling in Part A freezes new HSA contributions.": "Ang pag-enroll sa Part A ay pumapatigil sa mga bagong ambag sa HSA.",
    "See what that means.": "Tingnan kung ano ang ibig sabihin nito.",
    "Higher income:": "Mas mataas na kita:",
    "Income over certain limits triggers IRMAA (extra premiums).": "Ang kitang lumalampas sa ilang limitasyon ay nagdudulot ng IRMAA (karagdagang premium).",
    "Understanding costs and premiums.": "Pag-unawa sa mga gastos at premium.",
    "Living part-time abroad:": "Naninirahan nang bahagi ng panahon sa ibang bansa:",
    "Original Medicare may limit coverage.": "Maaaring limitahan ng Original Medicare ang coverage.",
    "Traveling and living abroad.": "Paglalakbay at pananatili sa ibang bansa.",
    "Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free": "Tiyakin bago kumilos: ito ay pangkalahatang impormasyong pang-edukasyon, hindi payo tungkol sa iyong partikular na kaso. Kumpirmahin ang creditable-coverage at timing sa iyong plano, sa Social Security, at sa isang libreng",
    "SHIP counselor": "SHIP counselor",
    "before you decide.": "bago ka magdesisyon.",
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
        '<strong>You\'re a helper.</strong> ' + t('Answer the remaining questions') + ' <em>' + t('on behalf of the person') + '</em> you\'re helping. See <a href="/caregivers.html">' + t('Caregivers and Authorized Representatives') + '</a> for what authority you need.' +
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
    html += '<div class="verdict">' + t('Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.') + '</div>';
    html += trackHTML("Your path", "You", state.you);

    if (state.married) {
      if (state.spouseAge === "under65") {
        html += '<div class="track"><span class="tag">' + t('Your spouse/partner') + '</span><h3>' + t('Not yet — but on the radar') + '</h3>' +
          '<p>' + t('Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If') + ' <em>' + t('your') + '</em> ' + t('Medicare choice affects a plan you share, factor that in now.') + '</p>' +
          '<p class="reflinks"><a href="/enrollment.html">' + t('Enrollment windows') + '</a><a href="/retiring-losing-coverage.html">' + t('If coverage ends') + '</a></p></div>';
      } else {
        html += trackHTML("Your spouse/partner's path", "Spouse/partner", state.spouse);
        html += '<div class="track"><span class="tag">' + t('Remember') + '</span><h3>' + t('Two separate decisions') + '</h3>' +
          '<p>' + t('Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.') + '</p></div>';
      }
    }

    html += '<div class="track"><span class="tag">' + t('Before you choose a path') + '</span><h3>' + t('Original Medicare vs. Medicare Advantage — the hard-to-reverse part') + '</h3>' +
      '<p>' + t('Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.') + '</p>' +
      '<p class="reflinks"><a href="/choosing-coverage.html">' + t('How to choose') + '</a><a href="/edge-cases.html">' + t('Edge cases &amp; the one-way door') + '</a></p></div>';

    html += '<div class="track"><span class="tag">' + t('Do these next') + '</span><h3>' + t('Your next steps') + '</h3><ol class="steps">' +
      NEXT_STEPS.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol></div>";

    html += '<div class="track"><span class="tag">' + t('Limited income?') + '</span><h3>' + t('Getting help paying') + '</h3>' +
      '<p>If money is tight, Medicaid, Medicare Savings Programs, and Extra Help can pay your premiums and reduce drug costs. Having both Medicare and Medicaid (called "dual eligible") unlocks extra benefits. <strong>Many people qualify and don\'t realize it.</strong></p>' +
      '<p class="reflinks"><a href="/getting-help.html">' + t('See programs you might qualify for') + '</a><a href="/dual-eligible.html">' + t('How being dual eligible works') + '</a></p></div>';

    html += '<div class="track"><span class="tag">' + t('Anything special apply?') + '</span><h3>' + t('Edge cases to watch') + '</h3>' +
      '<p>' + t('Do any of these apply to you? They can change your timing or choices:') + '</p>' +
      '<ul style="margin: 0.6rem 0; padding-left: 1.4rem;">' +
      '<li><strong>' + t('HSA contributor:') + '</strong> ' + t('Enrolling in Part A freezes new HSA contributions.') + ' <a href="/edge-cases.html">' + t('See what that means.') + '</a></li>' +
      '<li><strong>' + t('Higher income:') + '</strong> ' + t('Income over certain limits triggers IRMAA (extra premiums).') + ' <a href="/costs.html">' + t('Understanding costs and premiums.') + '</a></li>' +
      '<li><strong>' + t('Living part-time abroad:') + '</strong> ' + t('Original Medicare may limit coverage.') + ' <a href="/edge-cases.html">' + t('Traveling and living abroad.') + '</a></li>' +
      '</ul></div>';

    html += '<div class="note">' + t('Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free') + ' <a href="/ship-directory.html">' + t('SHIP counselor') + '</a> ' + t('before you decide.') + '</div>';
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
