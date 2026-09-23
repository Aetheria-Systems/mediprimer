/* MediPrimer — "Help Paying" questionnaire.
   Asks about Medicare/Medicaid status, household size, income range, and prescriptions.
   Then shows which programs you likely qualify for, sorted by impact.
   Progressive enhancement: fallback static list below works without JS. */
(function () {
  "use strict";

  /* Translations. The site is published in six languages and every page around
     this questionnaire is translated, but the questionnaire itself rendered in
     English on all of them — a partner organisation serving Vietnamese speakers
     reported it on 2026-09-23. Keys are the English source strings, so a
     missing translation degrades to English instead of breaking, and
     build/check_language_coverage.py fails the build if a launched language is
     absent from I18N. */
  var I18N = {
    "en": {},   // English is the fallback: the t() key is the source string
    "vi": {
    "Qualified Medicare Beneficiary (QMB)": "Người thụ hưởng Medicare đủ điều kiện (QMB)",
    "Pays all your Part A and B premiums and cost-sharing (copayments, coinsurance). Providers cannot bill you extra.": "Trả toàn bộ phí bảo hiểm Part A và Part B của quý vị, cùng các khoản đồng chi trả (copayments, coinsurance). Nhà cung cấp dịch vụ không được tính thêm tiền của quý vị.",
    "Specified Low-Income Medicare Beneficiary (SLMB)": "Người thụ hưởng Medicare có thu nhập thấp cụ thể (SLMB)",
    "Pays your Part B premium. You pay other Medicare costs.": "Trả phí bảo hiểm Part B của quý vị. Quý vị tự trả các chi phí Medicare khác.",
    "Qualifying Individual (QI)": "Cá nhân đủ điều kiện (QI)",
    "Pays part or all of your Part B premium.": "Trả một phần hoặc toàn bộ phí bảo hiểm Part B của quý vị.",
    "Extra Help (Low-Income Subsidy / LIS)": "Extra Help (Trợ cấp thu nhập thấp / LIS)",
    "Pays Part D premiums, deductibles, and copayments for prescription drugs.": "Trả phí bảo hiểm Part D, khoản khấu trừ, và các khoản đồng chi trả cho thuốc theo toa.",
    "Full health coverage: doctor visits, hospital, drugs, long-term care. Income limits vary by state.": "Bảo hiểm y tế đầy đủ: khám bác sĩ, bệnh viện, thuốc, chăm sóc dài hạn. Giới hạn thu nhập khác nhau tùy theo tiểu bang.",
    "PACE (Programs of All-Inclusive Care for the Elderly)": "PACE (Chương trình chăm sóc toàn diện cho người cao tuổi)",
    "For people 55 or older who need a nursing-home level of care but want to stay at home. Includes medical care, social services, and daily help. Only offered in some areas, and your state must certify the level of need. You can join with Medicare, Medicaid, or both.": "Dành cho người từ 55 tuổi trở lên cần mức chăm sóc như viện dưỡng lão nhưng muốn ở nhà. Bao gồm chăm sóc y tế, dịch vụ xã hội, và trợ giúp hàng ngày. Chỉ có ở một số khu vực, và tiểu bang của quý vị phải xác nhận mức độ cần thiết. Quý vị có thể tham gia cùng với Medicare, Medicaid, hoặc cả hai.",
    "Marketplace Premium Tax Credits &amp; Subsidies": "Khoản tín dụng thuế phí bảo hiểm &amp; Trợ cấp của Marketplace",
    "If you buy insurance on HealthCare.gov, tax credits lower your monthly payment. Cost-sharing reductions lower your copays and deductibles.": "Nếu quý vị mua bảo hiểm trên HealthCare.gov, các khoản tín dụng thuế sẽ giảm khoản thanh toán hàng tháng của quý vị. Giảm chia sẻ chi phí sẽ giảm các khoản đồng chi trả và khấu trừ của quý vị.",
    "SHIP (State Health Insurance Assistance Program)": "SHIP (Chương trình hỗ trợ bảo hiểm y tế tiểu bang)",
    "Free, unbiased counseling about Medicare, Medicaid, and health coverage. They explain your options.": "Tư vấn miễn phí, khách quan về Medicare, Medicaid, và bảo hiểm y tế. Họ sẽ giải thích các lựa chọn của quý vị.",
    "What help might you qualify for?": "Quý vị có thể đủ điều kiện nhận trợ giúp gì?",
    "Answer four quick questions. We'll show you programs that could help you save on healthcare costs.": "Trả lời bốn câu hỏi nhanh. Chúng tôi sẽ cho quý vị biết các chương trình có thể giúp quý vị tiết kiệm chi phí chăm sóc sức khỏe.",
    "1. Do you have Medicare, Medicaid, both, or neither?": "1. Quý vị có Medicare, Medicaid, cả hai, hay không có cái nào?",
    "Medicare only": "Chỉ có Medicare",
    "Medicaid only": "Chỉ có Medicaid",
    "Both Medicare and Medicaid": "Cả Medicare và Medicaid",
    "Neither or unsure": "Không có cái nào hoặc không chắc chắn",
    "2. Do you live alone, or with a spouse or partner?": "2. Quý vị sống một mình, hay sống cùng vợ/chồng hoặc bạn đời?",
    "Just me": "Chỉ một mình tôi",
    "Me and my spouse or partner": "Tôi và vợ/chồng hoặc bạn đời của tôi",
    "Other household sizes have different limits — your state agency or SHIP can check the exact numbers for you.": "Các quy mô hộ gia đình khác có giới hạn khác nhau — cơ quan tiểu bang của quý vị hoặc SHIP có thể kiểm tra con số chính xác giúp quý vị.",
    "3. Approximately how much does your household earn per month (gross income, before taxes)?": "3. Hộ gia đình của quý vị kiếm được khoảng bao nhiêu mỗi tháng (thu nhập gộp, trước thuế)?",
    "Under about $1,000": "Dưới khoảng $1,000",
    "About $1,000 to $1,200": "Khoảng $1,000 đến $1,200",
    "About $1,200 to $1,400": "Khoảng $1,200 đến $1,400",
    "About $1,400 to $1,600": "Khoảng $1,400 đến $1,600",
    "About $1,600 to $2,000": "Khoảng $1,600 đến $2,000",
    "Over $2,000": "Trên $2,000",
    "4. Do you take prescription drugs regularly?": "4. Quý vị có thường xuyên dùng thuốc theo toa không?",
    "Yes": "Có",
    "No": "Không",
    "Show programs I might qualify for": "Cho tôi xem các chương trình tôi có thể đủ điều kiện",
    "Please answer all questions above.": "Vui lòng trả lời tất cả các câu hỏi ở trên.",
    "You might qualify for these programs": "Quý vị có thể đủ điều kiện nhận các chương trình này",
    "Below are programs based on your answers. Many people are surprised by what they qualify for.": "Dưới đây là các chương trình dựa trên câu trả lời của quý vị. Nhiều người ngạc nhiên về những gì họ đủ điều kiện nhận.",
    "It costs nothing to apply.": "Việc nộp đơn không tốn phí gì.",
    "These are approximate 2026 figures and change every year.": "Đây là các con số ước tính của năm 2026 và thay đổi mỗi năm.",
    "Income is only part of the test: most of these programs also have resource (savings) limits, and many states set higher limits or drop the resource test entirely. Only your state agency can decide. Apply even if you are close to the limit — it costs nothing, and you might qualify.": "Thu nhập chỉ là một phần của tiêu chí xét duyệt: hầu hết các chương trình này cũng có giới hạn tài sản (tiền tiết kiệm), và nhiều tiểu bang đặt giới hạn cao hơn hoặc bỏ hẳn tiêu chí tài sản. Chỉ cơ quan tiểu bang của quý vị mới có thể quyết định. Hãy nộp đơn ngay cả khi quý vị gần đạt giới hạn — việc này không tốn phí gì, và quý vị có thể đủ điều kiện.",
    "Answer again": "Trả lời lại",
    "for one person": "cho một người",
    "for a couple": "cho một cặp vợ chồng",
    "Automatic with Medicare + Medicaid": "Tự động có khi có cả Medicare + Medicaid",
    "Worth applying — your answers fit": "Đáng để nộp đơn — câu trả lời của quý vị phù hợp",
    "If you have both Medicare and full Medicaid, you get this automatically — no income test.": "Nếu quý vị có cả Medicare và Medicaid đầy đủ, quý vị sẽ tự động nhận được điều này — không cần xét thu nhập.",
    "Approximate 2026 income limit:": "Giới hạn thu nhập ước tính năm 2026:",
    "Resource limits also apply; many states go higher.": "Giới hạn tài sản cũng áp dụng; nhiều tiểu bang đặt mức cao hơn.",
    "Limits and rules vary by state.": "Giới hạn và quy định khác nhau tùy theo tiểu bang.",
    "What it does:": "Chương trình này làm gì:",
    "How to apply:": "Cách nộp đơn:"
},
    "es": {
    "Qualified Medicare Beneficiary (QMB)": "Beneficiario Calificado de Medicare (QMB)",
    "Pays all your Part A and B premiums and cost-sharing (copayments, coinsurance). Providers cannot bill you extra.": "Paga todas sus primas de la Part A y la Part B, además de los costos compartidos (copagos, coseguro). Los proveedores no pueden cobrarle de más.",
    "Specified Low-Income Medicare Beneficiary (SLMB)": "Beneficiario de Medicare de Bajos Ingresos Especificado (SLMB)",
    "Pays your Part B premium. You pay other Medicare costs.": "Paga su prima de la Part B. Usted paga los demás costos de Medicare.",
    "Qualifying Individual (QI)": "Individuo Calificado (QI)",
    "Pays part or all of your Part B premium.": "Paga parte o toda su prima de la Part B.",
    "Extra Help (Low-Income Subsidy / LIS)": "Extra Help (Subsidio por Bajos Ingresos / LIS)",
    "Pays Part D premiums, deductibles, and copayments for prescription drugs.": "Paga las primas, los deducibles y los copagos de la Part D para medicamentos recetados.",
    "Full health coverage: doctor visits, hospital, drugs, long-term care. Income limits vary by state.": "Cobertura de salud completa: visitas al médico, hospital, medicamentos, cuidado a largo plazo. Los límites de ingresos varían según el estado.",
    "PACE (Programs of All-Inclusive Care for the Elderly)": "PACE (Programas de Cuidado Integral para Personas Mayores)",
    "For people 55 or older who need a nursing-home level of care but want to stay at home. Includes medical care, social services, and daily help. Only offered in some areas, and your state must certify the level of need. You can join with Medicare, Medicaid, or both.": "Para personas de 55 años o más que necesitan un nivel de cuidado propio de un asilo de ancianos, pero que quieren quedarse en casa. Incluye atención médica, servicios sociales y ayuda diaria. Solo se ofrece en algunas áreas, y su estado debe certificar el nivel de necesidad. Puede inscribirse con Medicare, Medicaid, o ambos.",
    "Marketplace Premium Tax Credits &amp; Subsidies": "Créditos Fiscales para Primas &amp; Subsidios del Marketplace",
    "If you buy insurance on HealthCare.gov, tax credits lower your monthly payment. Cost-sharing reductions lower your copays and deductibles.": "Si compra un seguro en HealthCare.gov, los créditos fiscales reducen su pago mensual. Las reducciones de costos compartidos bajan sus copagos y deducibles.",
    "SHIP (State Health Insurance Assistance Program)": "SHIP (Programa Estatal de Asistencia con el Seguro de Salud)",
    "Free, unbiased counseling about Medicare, Medicaid, and health coverage. They explain your options.": "Asesoría gratuita e imparcial sobre Medicare, Medicaid y la cobertura de salud. Le explican sus opciones.",
    "What help might you qualify for?": "¿Para qué ayuda podría calificar?",
    "Answer four quick questions. We'll show you programs that could help you save on healthcare costs.": "Responda cuatro preguntas rápidas. Le mostraremos programas que podrían ayudarle a ahorrar en costos de salud.",
    "1. Do you have Medicare, Medicaid, both, or neither?": "1. ¿Tiene Medicare, Medicaid, ambos o ninguno?",
    "Medicare only": "Solo Medicare",
    "Medicaid only": "Solo Medicaid",
    "Both Medicare and Medicaid": "Medicare y Medicaid",
    "Neither or unsure": "Ninguno o no estoy seguro",
    "2. Do you live alone, or with a spouse or partner?": "2. ¿Vive solo, o con su cónyuge o pareja?",
    "Just me": "Solo yo",
    "Me and my spouse or partner": "Yo y mi cónyuge o pareja",
    "Other household sizes have different limits — your state agency or SHIP can check the exact numbers for you.": "Otros tamaños de hogar tienen límites diferentes; la agencia de su estado o el SHIP puede verificar las cifras exactas por usted.",
    "3. Approximately how much does your household earn per month (gross income, before taxes)?": "3. ¿Aproximadamente cuánto gana su hogar por mes (ingreso bruto, antes de impuestos)?",
    "Under about $1,000": "Menos de unos $1,000",
    "About $1,000 to $1,200": "Entre $1,000 y $1,200",
    "About $1,200 to $1,400": "Entre $1,200 y $1,400",
    "About $1,400 to $1,600": "Entre $1,400 y $1,600",
    "About $1,600 to $2,000": "Entre $1,600 y $2,000",
    "Over $2,000": "Más de $2,000",
    "4. Do you take prescription drugs regularly?": "4. ¿Toma medicamentos recetados con regularidad?",
    "Yes": "Sí",
    "No": "No",
    "Show programs I might qualify for": "Mostrar los programas para los que podría calificar",
    "Please answer all questions above.": "Por favor responda todas las preguntas anteriores.",
    "You might qualify for these programs": "Podría calificar para estos programas",
    "Below are programs based on your answers. Many people are surprised by what they qualify for.": "A continuación se muestran programas según sus respuestas. A muchas personas les sorprende para qué califican.",
    "It costs nothing to apply.": "No cuesta nada solicitar.",
    "These are approximate 2026 figures and change every year.": "Estas son cifras aproximadas de 2026 y cambian cada año.",
    "Income is only part of the test: most of these programs also have resource (savings) limits, and many states set higher limits or drop the resource test entirely. Only your state agency can decide. Apply even if you are close to the limit — it costs nothing, and you might qualify.": "El ingreso es solo parte de la prueba: la mayoría de estos programas también tienen límites de recursos (ahorros), y muchos estados fijan límites más altos o eliminan por completo la prueba de recursos. Solo la agencia de su estado puede decidir. Solicite aunque esté cerca del límite; no cuesta nada, y podría calificar.",
    "Answer again": "Responder de nuevo",
    "for one person": "para una persona",
    "for a couple": "para una pareja",
    "Automatic with Medicare + Medicaid": "Automático con Medicare + Medicaid",
    "Worth applying — your answers fit": "Vale la pena solicitar: sus respuestas encajan",
    "If you have both Medicare and full Medicaid, you get this automatically — no income test.": "Si tiene Medicare y Medicaid completo, esto lo recibe automáticamente, sin prueba de ingresos.",
    "Approximate 2026 income limit:": "Límite de ingresos aproximado para 2026:",
    "Resource limits also apply; many states go higher.": "También se aplican límites de recursos; muchos estados permiten más.",
    "Limits and rules vary by state.": "Los límites y las reglas varían según el estado.",
    "What it does:": "Qué hace:",
    "How to apply:": "Cómo solicitar:"
},
    "zh-Hant": {
    "Qualified Medicare Beneficiary (QMB)": "合格Medicare受益人（QMB）",
    "Pays all your Part A and B premiums and cost-sharing (copayments, coinsurance). Providers cannot bill you extra.": "支付您所有的Part A和Part B保費及自付費用（共付額、共同保險）。醫療提供者不能向您額外收費。",
    "Specified Low-Income Medicare Beneficiary (SLMB)": "特定低收入Medicare受益人（SLMB）",
    "Pays your Part B premium. You pay other Medicare costs.": "支付您的Part B保費。其他Medicare費用由您自付。",
    "Qualifying Individual (QI)": "合格個人（QI）",
    "Pays part or all of your Part B premium.": "支付您部分或全部的Part B保費。",
    "Extra Help (Low-Income Subsidy / LIS)": "Extra Help（低收入補助 / LIS）",
    "Pays Part D premiums, deductibles, and copayments for prescription drugs.": "支付處方藥的Part D保費、自付額和共付額。",
    "Full health coverage: doctor visits, hospital, drugs, long-term care. Income limits vary by state.": "完整的健康保障：看診、住院、藥物、長期照護。收入限制因州而異。",
    "PACE (Programs of All-Inclusive Care for the Elderly)": "PACE（全方位老年照護計畫）",
    "For people 55 or older who need a nursing-home level of care but want to stay at home. Includes medical care, social services, and daily help. Only offered in some areas, and your state must certify the level of need. You can join with Medicare, Medicaid, or both.": "適合55歲以上、需要護理之家等級照護但希望留在家中的人士。包含醫療照護、社會服務和日常協助。僅在部分地區提供，您所在的州必須認證您的照護需求等級。您可以透過Medicare、Medicaid或兩者一同加入。",
    "Marketplace Premium Tax Credits &amp; Subsidies": "Marketplace保費稅務抵免 &amp; 補助",
    "If you buy insurance on HealthCare.gov, tax credits lower your monthly payment. Cost-sharing reductions lower your copays and deductibles.": "如果您在HealthCare.gov購買保險，稅務抵免可降低您的每月費用。共付費用減免則可降低您的共付額和自付額。",
    "SHIP (State Health Insurance Assistance Program)": "SHIP（州健康保險協助計畫）",
    "Free, unbiased counseling about Medicare, Medicaid, and health coverage. They explain your options.": "提供關於Medicare、Medicaid和健康保障的免費、中立諮詢服務，為您說明各項選擇。",
    "What help might you qualify for?": "您可能符合哪些補助資格？",
    "Answer four quick questions. We'll show you programs that could help you save on healthcare costs.": "回答四個簡單問題，我們將為您列出可能幫助您節省醫療費用的計畫。",
    "1. Do you have Medicare, Medicaid, both, or neither?": "1. 您有Medicare、Medicaid、兩者皆有，還是都沒有？",
    "Medicare only": "僅有Medicare",
    "Medicaid only": "僅有Medicaid",
    "Both Medicare and Medicaid": "Medicare和Medicaid皆有",
    "Neither or unsure": "都沒有或不確定",
    "2. Do you live alone, or with a spouse or partner?": "2. 您是獨居，還是與配偶或伴侶同住？",
    "Just me": "只有我一人",
    "Me and my spouse or partner": "我和配偶或伴侶",
    "Other household sizes have different limits — your state agency or SHIP can check the exact numbers for you.": "其他家庭人數的限制有所不同——您所在州的機構或SHIP可以為您查詢確切數字。",
    "3. Approximately how much does your household earn per month (gross income, before taxes)?": "3. 您的家庭每月大約收入多少（稅前總收入）？",
    "Under about $1,000": "約$1,000以下",
    "About $1,000 to $1,200": "約$1,000至$1,200",
    "About $1,200 to $1,400": "約$1,200至$1,400",
    "About $1,400 to $1,600": "約$1,400至$1,600",
    "About $1,600 to $2,000": "約$1,600至$2,000",
    "Over $2,000": "超過$2,000",
    "4. Do you take prescription drugs regularly?": "4. 您是否定期服用處方藥？",
    "Yes": "是",
    "No": "否",
    "Show programs I might qualify for": "顯示我可能符合資格的計畫",
    "Please answer all questions above.": "請回答以上所有問題。",
    "You might qualify for these programs": "您可能符合以下計畫的資格",
    "Below are programs based on your answers. Many people are surprised by what they qualify for.": "以下是根據您的回答列出的計畫。許多人對自己符合的資格感到驚訝。",
    "It costs nothing to apply.": "申請完全免費。",
    "These are approximate 2026 figures and change every year.": "這些是2026年的大略數字，每年都會變動。",
    "Income is only part of the test: most of these programs also have resource (savings) limits, and many states set higher limits or drop the resource test entirely. Only your state agency can decide. Apply even if you are close to the limit — it costs nothing, and you might qualify.": "收入只是審查的一部分：大多數這類計畫也設有資產（存款）限制，許多州會提高限制或完全取消資產審查。最終只有您所在州的機構能做出決定。即使您的收入接近上限，也建議提出申請——申請免費，而且您可能符合資格。",
    "Answer again": "重新回答",
    "for one person": "適用於一人",
    "for a couple": "適用於夫妻",
    "Automatic with Medicare + Medicaid": "同時擁有Medicare和Medicaid即自動符合",
    "Worth applying — your answers fit": "值得申請——您的回答符合條件",
    "If you have both Medicare and full Medicaid, you get this automatically — no income test.": "如果您同時擁有Medicare和完整的Medicaid，您將自動獲得此補助——無需收入審查。",
    "Approximate 2026 income limit:": "2026年大略收入限制：",
    "Resource limits also apply; many states go higher.": "資產限制同樣適用；許多州設有更高的限制。",
    "Limits and rules vary by state.": "限制和規則因州而異。",
    "What it does:": "此計畫的作用：",
    "How to apply:": "申請方式："
},
    "ko": {
    "Qualified Medicare Beneficiary (QMB)": "적격 메디케어 수혜자 (QMB)",
    "Pays all your Part A and B premiums and cost-sharing (copayments, coinsurance). Providers cannot bill you extra.": "Part A와 Part B의 모든 보험료와 본인부담금(공동부담금, 코인슈런스)을 지원합니다. 의료 제공자는 추가 비용을 청구할 수 없습니다.",
    "Specified Low-Income Medicare Beneficiary (SLMB)": "저소득 메디케어 수혜자 (SLMB)",
    "Pays your Part B premium. You pay other Medicare costs.": "Part B 보험료를 지원합니다. 다른 메디케어 비용은 본인이 부담합니다.",
    "Qualifying Individual (QI)": "적격 개인 (QI)",
    "Pays part or all of your Part B premium.": "Part B 보험료의 일부 또는 전부를 지원합니다.",
    "Extra Help (Low-Income Subsidy / LIS)": "엑스트라 헬프 (저소득 보조금 / LIS)",
    "Pays Part D premiums, deductibles, and copayments for prescription drugs.": "처방약에 대한 Part D 보험료, 공제금, 공동부담금을 지원합니다.",
    "Full health coverage: doctor visits, hospital, drugs, long-term care. Income limits vary by state.": "의사 방문, 입원, 약물, 장기요양을 포함한 전체 건강보험 혜택입니다. 소득 한도는 주마다 다릅니다.",
    "PACE (Programs of All-Inclusive Care for the Elderly)": "PACE (노인을 위한 종합돌봄 프로그램)",
    "For people 55 or older who need a nursing-home level of care but want to stay at home. Includes medical care, social services, and daily help. Only offered in some areas, and your state must certify the level of need. You can join with Medicare, Medicaid, or both.": "요양원 수준의 돌봄이 필요하지만 집에 머물고 싶은 55세 이상을 위한 프로그램입니다. 의료 서비스, 사회복지 서비스, 일상생활 도움이 포함됩니다. 일부 지역에서만 제공되며, 주에서 필요 수준을 인증해야 합니다. 메디케어, 메디케이드, 또는 둘 다로 가입할 수 있습니다.",
    "Marketplace Premium Tax Credits &amp; Subsidies": "마켓플레이스 보험료 세액공제 &amp; 보조금",
    "If you buy insurance on HealthCare.gov, tax credits lower your monthly payment. Cost-sharing reductions lower your copays and deductibles.": "HealthCare.gov에서 보험에 가입하면 세액공제로 월 납부액이 줄어듭니다. 비용분담 경감으로 공동부담금과 공제금도 낮아집니다.",
    "SHIP (State Health Insurance Assistance Program)": "SHIP (주 건강보험 지원 프로그램)",
    "Free, unbiased counseling about Medicare, Medicaid, and health coverage. They explain your options.": "메디케어, 메디케이드, 건강보험에 대한 무료의 공정한 상담을 제공합니다. 선택 가능한 옵션을 설명해 드립니다.",
    "What help might you qualify for?": "어떤 도움을 받을 자격이 있을까요?",
    "Answer four quick questions. We'll show you programs that could help you save on healthcare costs.": "간단한 네 가지 질문에 답해 주세요. 의료비 절감에 도움이 될 수 있는 프로그램을 알려드립니다.",
    "1. Do you have Medicare, Medicaid, both, or neither?": "1. 메디케어, 메디케이드, 둘 다, 아니면 둘 다 없으신가요?",
    "Medicare only": "메디케어만",
    "Medicaid only": "메디케이드만",
    "Both Medicare and Medicaid": "메디케어와 메디케이드 둘 다",
    "Neither or unsure": "둘 다 없거나 잘 모름",
    "2. Do you live alone, or with a spouse or partner?": "2. 혼자 사시나요, 아니면 배우자나 파트너와 함께 사시나요?",
    "Just me": "저 혼자",
    "Me and my spouse or partner": "저와 배우자 또는 파트너",
    "Other household sizes have different limits — your state agency or SHIP can check the exact numbers for you.": "다른 가구 규모는 한도가 다릅니다 — 정확한 숫자는 주 기관이나 SHIP에서 확인해 드릴 수 있습니다.",
    "3. Approximately how much does your household earn per month (gross income, before taxes)?": "3. 가구의 월 소득은 대략 얼마인가요(세전 총소득)?",
    "Under about $1,000": "약 $1,000 미만",
    "About $1,000 to $1,200": "약 $1,000에서 $1,200",
    "About $1,200 to $1,400": "약 $1,200에서 $1,400",
    "About $1,400 to $1,600": "약 $1,400에서 $1,600",
    "About $1,600 to $2,000": "약 $1,600에서 $2,000",
    "Over $2,000": "$2,000 초과",
    "4. Do you take prescription drugs regularly?": "4. 처방약을 정기적으로 복용하시나요?",
    "Yes": "예",
    "No": "아니요",
    "Show programs I might qualify for": "자격이 될 수 있는 프로그램 보기",
    "Please answer all questions above.": "위의 모든 질문에 답해 주세요.",
    "You might qualify for these programs": "다음 프로그램에 자격이 있을 수 있습니다",
    "Below are programs based on your answers. Many people are surprised by what they qualify for.": "아래는 귀하의 답변을 바탕으로 한 프로그램입니다. 많은 분들이 본인이 받을 수 있는 혜택에 놀라곤 합니다.",
    "It costs nothing to apply.": "신청에는 비용이 들지 않습니다.",
    "These are approximate 2026 figures and change every year.": "이 수치는 2026년 대략적인 금액이며 매년 변경됩니다.",
    "Income is only part of the test: most of these programs also have resource (savings) limits, and many states set higher limits or drop the resource test entirely. Only your state agency can decide. Apply even if you are close to the limit — it costs nothing, and you might qualify.": "소득은 자격 심사의 일부일 뿐입니다. 대부분의 프로그램은 자산(저축) 한도도 있으며, 많은 주에서 더 높은 한도를 적용하거나 자산 심사를 아예 하지 않습니다. 최종 결정은 주 기관만이 내릴 수 있습니다. 한도에 가깝더라도 신청해 보세요 — 비용이 들지 않으며, 자격이 될 수도 있습니다.",
    "Answer again": "다시 답변하기",
    "for one person": "1인 기준",
    "for a couple": "2인(부부) 기준",
    "Automatic with Medicare + Medicaid": "메디케어 + 메디케이드 시 자동 적용",
    "Worth applying — your answers fit": "신청해 볼 가치가 있습니다 — 귀하의 답변과 일치합니다",
    "If you have both Medicare and full Medicaid, you get this automatically — no income test.": "메디케어와 전체 메디케이드를 모두 가지고 계시면 소득 심사 없이 자동으로 받게 됩니다.",
    "Approximate 2026 income limit:": "2026년 대략적인 소득 한도:",
    "Resource limits also apply; many states go higher.": "자산 한도도 적용됩니다. 많은 주에서 더 높은 한도를 허용합니다.",
    "Limits and rules vary by state.": "한도와 규정은 주마다 다릅니다.",
    "What it does:": "제공 혜택:",
    "How to apply:": "신청 방법:"
},
    "tl": {
    "Qualified Medicare Beneficiary (QMB)": "Qualified Medicare Beneficiary (QMB)",
    "Pays all your Part A and B premiums and cost-sharing (copayments, coinsurance). Providers cannot bill you extra.": "Babayaran ang lahat ng iyong Part A at B premiums pati na rin ang cost-sharing (copayments, coinsurance). Hindi ka maaaring singilin ng mga provider ng dagdag na bayad.",
    "Specified Low-Income Medicare Beneficiary (SLMB)": "Specified Low-Income Medicare Beneficiary (SLMB)",
    "Pays your Part B premium. You pay other Medicare costs.": "Babayaran ang iyong Part B premium. Ikaw ang magbabayad ng ibang gastos sa Medicare.",
    "Qualifying Individual (QI)": "Qualifying Individual (QI)",
    "Pays part or all of your Part B premium.": "Babayaran ang bahagi o lahat ng iyong Part B premium.",
    "Extra Help (Low-Income Subsidy / LIS)": "Extra Help (Low-Income Subsidy / LIS)",
    "Pays Part D premiums, deductibles, and copayments for prescription drugs.": "Babayaran ang Part D premiums, deductibles, at copayments para sa mga gamot na may reseta.",
    "Full health coverage: doctor visits, hospital, drugs, long-term care. Income limits vary by state.": "Kumpletong health coverage: pagpapatingin sa doktor, ospital, gamot, at pangmatagalang pangangalaga. Iba-iba ang income limit depende sa estado.",
    "PACE (Programs of All-Inclusive Care for the Elderly)": "PACE (Programs of All-Inclusive Care for the Elderly)",
    "For people 55 or older who need a nursing-home level of care but want to stay at home. Includes medical care, social services, and daily help. Only offered in some areas, and your state must certify the level of need. You can join with Medicare, Medicaid, or both.": "Para sa mga taong 55 taong gulang pataas na nangangailangan ng antas ng pangangalagang katulad sa nursing home pero gustong manatili sa bahay. Kasama ang medical care, social services, at araw-araw na tulong. Available lang sa ilang lugar, at dapat patunayan ng iyong estado ang antas ng pangangailangan. Maaari kang sumali gamit ang Medicare, Medicaid, o pareho.",
    "Marketplace Premium Tax Credits &amp; Subsidies": "Marketplace Premium Tax Credits &amp; Subsidies",
    "If you buy insurance on HealthCare.gov, tax credits lower your monthly payment. Cost-sharing reductions lower your copays and deductibles.": "Kung bibili ka ng insurance sa HealthCare.gov, ibinababa ng tax credits ang iyong buwanang bayad. Ibinababa naman ng cost-sharing reductions ang iyong copays at deductibles.",
    "SHIP (State Health Insurance Assistance Program)": "SHIP (State Health Insurance Assistance Program)",
    "Free, unbiased counseling about Medicare, Medicaid, and health coverage. They explain your options.": "Libre at walang kinikilingang payo tungkol sa Medicare, Medicaid, at health coverage. Ipapaliwanag nila ang iyong mga pagpipilian.",
    "What help might you qualify for?": "Anong tulong ang maaari mong makuha?",
    "Answer four quick questions. We'll show you programs that could help you save on healthcare costs.": "Sagutin ang apat na maiikling tanong. Ipapakita namin sa iyo ang mga programang makakatulong sa iyo na makatipid sa gastos sa kalusugan.",
    "1. Do you have Medicare, Medicaid, both, or neither?": "1. Mayroon ka bang Medicare, Medicaid, pareho, o wala?",
    "Medicare only": "Medicare lang",
    "Medicaid only": "Medicaid lang",
    "Both Medicare and Medicaid": "Pareho, Medicare at Medicaid",
    "Neither or unsure": "Wala o hindi sigurado",
    "2. Do you live alone, or with a spouse or partner?": "2. Nag-iisa ka bang nakatira, o kasama ang asawa o partner?",
    "Just me": "Ako lang",
    "Me and my spouse or partner": "Ako at ang aking asawa o partner",
    "Other household sizes have different limits — your state agency or SHIP can check the exact numbers for you.": "Iba-iba ang limitasyon para sa ibang laki ng sambahayan — maaaring tingnan ng iyong state agency o SHIP ang eksaktong mga numero para sa iyo.",
    "3. Approximately how much does your household earn per month (gross income, before taxes)?": "3. Humigit-kumulang magkano ang kinikita ng iyong sambahayan bawat buwan (gross income, bago mabawasan ng buwis)?",
    "Under about $1,000": "Mas mababa sa halos $1,000",
    "About $1,000 to $1,200": "Halos $1,000 hanggang $1,200",
    "About $1,200 to $1,400": "Halos $1,200 hanggang $1,400",
    "About $1,400 to $1,600": "Halos $1,400 hanggang $1,600",
    "About $1,600 to $2,000": "Halos $1,600 hanggang $2,000",
    "Over $2,000": "Higit sa $2,000",
    "4. Do you take prescription drugs regularly?": "4. Regular ka bang umiinom ng gamot na may reseta?",
    "Yes": "Oo",
    "No": "Hindi",
    "Show programs I might qualify for": "Ipakita ang mga programang maaari kong ma-qualify",
    "Please answer all questions above.": "Mangyaring sagutin ang lahat ng tanong sa itaas.",
    "You might qualify for these programs": "Maaari kang maging kwalipikado para sa mga programang ito",
    "Below are programs based on your answers. Many people are surprised by what they qualify for.": "Nasa ibaba ang mga programang batay sa iyong mga sagot. Marami ang nagulat sa kung ano ang naging kwalipikado nila.",
    "It costs nothing to apply.": "Walang bayad ang mag-apply.",
    "These are approximate 2026 figures and change every year.": "Ito ay tinatayang mga numero para sa 2026 at nagbabago taun-taon.",
    "Income is only part of the test: most of these programs also have resource (savings) limits, and many states set higher limits or drop the resource test entirely. Only your state agency can decide. Apply even if you are close to the limit — it costs nothing, and you might qualify.": "Ang kita ay bahagi lamang ng pagsusuri: karamihan sa mga programang ito ay may limitasyon din sa resource (ipon), at maraming estado ang nagtatakda ng mas mataas na limitasyon o hindi na kinokonsidera ang resource test. Ang iyong state agency lamang ang maaaring magpasya. Mag-apply kahit malapit ka na sa limitasyon — walang bayad ito, at maaari kang maging kwalipikado.",
    "Answer again": "Sagutin muli",
    "for one person": "para sa isang tao",
    "for a couple": "para sa mag-asawa",
    "Automatic with Medicare + Medicaid": "Awtomatiko kung may Medicare + Medicaid",
    "Worth applying — your answers fit": "Sulit mag-apply — bagay ang iyong mga sagot",
    "If you have both Medicare and full Medicaid, you get this automatically — no income test.": "Kung mayroon kang Medicare at buong Medicaid, awtomatiko mong makukuha ito — walang income test.",
    "Approximate 2026 income limit:": "Tinatayang income limit para sa 2026:",
    "Resource limits also apply; many states go higher.": "May limitasyon din sa resource; mas mataas ito sa maraming estado.",
    "Limits and rules vary by state.": "Iba-iba ang mga limitasyon at patakaran depende sa estado.",
    "What it does:": "Ano ang ginagawa nito:",
    "How to apply:": "Paano mag-apply:"
}
  };
  var MP_LANG = (document.documentElement.getAttribute("lang") || "en").trim() || "en";
  function t(en) {
    var tbl = I18N[MP_LANG];
    return (tbl && tbl[en]) || en;
  }

  var root = document.getElementById("help-paying-questionnaire");
  if (!root) return;

  var state = {
    coverage: null,      // "medicare", "medicaid", "both", "neither"
    household: null,     // "one", "two"
    income: null,        // "under-1000", "1000-1200", "1200-1400", "1400-1600", "1600-2000", "over-2000"
    drugs: null          // "yes", "no"
  };

  // 2026 income thresholds (48 states + DC). Many states higher; note in output.
  var PROGRAMS = {
    qmb: {
      name: t("Qualified Medicare Beneficiary (QMB)"),
      limit_single: 1350,
      limit_couple: 1824,
      impact: 5,
      what: t("Pays all your Part A and B premiums and cost-sharing (copayments, coinsurance). Providers cannot bill you extra."),
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    slmb: {
      name: t("Specified Low-Income Medicare Beneficiary (SLMB)"),
      limit_single: 1616,
      limit_couple: 2184,
      impact: 4,
      what: t("Pays your Part B premium. You pay other Medicare costs."),
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    qi: {
      name: t("Qualifying Individual (QI)"),
      limit_single: 1816,
      limit_couple: 2455,
      impact: 3,
      what: t("Pays part or all of your Part B premium."),
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    extra_help: {
      name: t("Extra Help (Low-Income Subsidy / LIS)"),
      limit_single: 1995,
      limit_couple: 2705,
      impact: 4,
      what: t("Pays Part D premiums, deductibles, and copayments for prescription drugs."),
      apply: "<a href=\"https://www.ssa.gov/extrahelp/\" rel=\"noopener\">ssa.gov/extrahelp</a> or 1-800-772-1213"
    },
    medicaid: {
      name: "Medicaid",
      limit_single: null,
      limit_couple: null,
      impact: 5,
      what: t("Full health coverage: doctor visits, hospital, drugs, long-term care. Income limits vary by state."),
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    pace: {
      name: t("PACE (Programs of All-Inclusive Care for the Elderly)"),
      limit_single: null,
      limit_couple: null,
      impact: 3,
      what: t("For people 55 or older who need a nursing-home level of care but want to stay at home. Includes medical care, social services, and daily help. Only offered in some areas, and your state must certify the level of need. You can join with Medicare, Medicaid, or both."),
      apply: "<a href=\"https://www.medicare.gov/\" rel=\"noopener\">medicare.gov</a>"
    },
    marketplace: {
      name: t("Marketplace Premium Tax Credits &amp; Subsidies"),
      limit_single: null,
      limit_couple: null,
      impact: 4,
      what: t("If you buy insurance on HealthCare.gov, tax credits lower your monthly payment. Cost-sharing reductions lower your copays and deductibles."),
      apply: "<a href=\"https://www.healthcare.gov/\" rel=\"noopener\">healthcare.gov</a>"
    },
    ship: {
      name: t("SHIP (State Health Insurance Assistance Program)"),
      limit_single: null,
      limit_couple: null,
      impact: 2,
      what: t("Free, unbiased counseling about Medicare, Medicaid, and health coverage. They explain your options."),
      apply: "<a href=\"https://www.shiphelp.org/\" rel=\"noopener\">shiphelp.org</a>"
    }
  };

  function renderForm() {
    root.innerHTML =
      '<h2>' + t('What help might you qualify for?') + '</h2>' +
      '<p>' + t('Answer four quick questions. We\'ll show you programs that could help you save on healthcare costs.') + '</p>' +
      '<div class="help-q"><span class="help-label">' + t('1. Do you have Medicare, Medicaid, both, or neither?') + '</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="coverage" value="medicare"><span>' + t('Medicare only') + '</span></label>' +
          '<label><input type="radio" name="coverage" value="medicaid"><span>' + t('Medicaid only') + '</span></label>' +
          '<label><input type="radio" name="coverage" value="both"><span>' + t('Both Medicare and Medicaid') + '</span></label>' +
          '<label><input type="radio" name="coverage" value="neither"><span>' + t('Neither or unsure') + '</span></label>' +
        '</div></div>' +
      '<div class="help-q"><span class="help-label">' + t('2. Do you live alone, or with a spouse or partner?') + '</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="household" value="one"><span>' + t('Just me') + '</span></label>' +
          '<label><input type="radio" name="household" value="two"><span>' + t('Me and my spouse or partner') + '</span></label>' +
        '</div>' +
        '<p class="help-note-small">' + t('Other household sizes have different limits — your state agency or SHIP can check the exact numbers for you.') + '</p></div>' +
      '<div class="help-q"><span class="help-label">' + t('3. Approximately how much does your household earn per month (gross income, before taxes)?') + '</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="income" value="under-1000"><span>' + t('Under about $1,000') + '</span></label>' +
          '<label><input type="radio" name="income" value="1000-1200"><span>' + t('About $1,000 to $1,200') + '</span></label>' +
          '<label><input type="radio" name="income" value="1200-1400"><span>' + t('About $1,200 to $1,400') + '</span></label>' +
          '<label><input type="radio" name="income" value="1400-1600"><span>' + t('About $1,400 to $1,600') + '</span></label>' +
          '<label><input type="radio" name="income" value="1600-2000"><span>' + t('About $1,600 to $2,000') + '</span></label>' +
          '<label><input type="radio" name="income" value="over-2000"><span>' + t('Over $2,000') + '</span></label>' +
        '</div></div>' +
      '<div class="help-q"><span class="help-label">' + t('4. Do you take prescription drugs regularly?') + '</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="drugs" value="yes"><span>' + t('Yes') + '</span></label>' +
          '<label><input type="radio" name="drugs" value="no"><span>' + t('No') + '</span></label>' +
        '</div></div>' +
      '<div class="help-actions">' +
        '<button type="button" class="help-btn" id="help-go">' + t('Show programs I might qualify for') + '</button>' +
      '</div>' +
      '<p id="help-warn" class="glossary-empty help-hidden">' + t('Please answer all questions above.') + '</p>';

    root.addEventListener("change", onChange);
    document.getElementById("help-go").addEventListener("click", onGo);
  }

  function onChange(e) {
    if (e.target.name === "coverage") state.coverage = e.target.value;
    else if (e.target.name === "household") state.household = e.target.value;
    else if (e.target.name === "income") state.income = e.target.value;
    else if (e.target.name === "drugs") state.drugs = e.target.value;
  }

  // Upper bound of the selected band. A program is only flagged as a match when
  // the WHOLE band fits under its limit — never overstate eligibility.
  function getIncomeMax(income_range) {
    var ranges = {
      "under-1000": 1000,
      "1000-1200": 1200,
      "1200-1400": 1400,
      "1400-1600": 1600,
      "1600-2000": 2000,
      "over-2000": Infinity
    };
    return ranges[income_range] || 0;
  }

  function checkQualifies(prog, incomeMax, household) {
    var limit = household === "one" ? prog.limit_single : prog.limit_couple;
    if (!limit) return null; // No hard limit (state-dependent or automatic)
    return incomeMax <= limit;
  }

  function onGo() {
    var warn = document.getElementById("help-warn");
    if (!state.coverage || !state.household || !state.income || !state.drugs) {
      warn.className = "glossary-empty";
      return;
    }
    warn.className = "glossary-empty help-hidden";

    var incomeMax = getIncomeMax(state.income);
    var household = state.household;
    var qualified = [];

    // MSPs for people with (or eligible for) Medicare. Income is only one part of
    // the test — resources and state rules matter too — so a match means "worth
    // applying", not a promise.
    if (state.coverage === "medicare" || state.coverage === "both") {
      ["qmb", "slmb", "qi"].forEach(function (key) {
        if (checkQualifies(PROGRAMS[key], incomeMax, household) !== false) {
          qualified.push({prog: key, likely: checkQualifies(PROGRAMS[key], incomeMax, household)});
        }
      });
    }

    // Extra Help: anyone with BOTH Medicare and Medicaid gets it automatically,
    // at any income. Otherwise it's income-based for Medicare holders.
    if (state.coverage === "both") {
      qualified.push({prog: "extra_help", likely: true, automatic: true});
    } else if (state.coverage === "medicare" && state.drugs === "yes") {
      if (checkQualifies(PROGRAMS.extra_help, incomeMax, household) !== false) {
        qualified.push({prog: "extra_help", likely: checkQualifies(PROGRAMS.extra_help, incomeMax, household)});
      }
    }

    // Medicaid — only for people who don't already have it.
    if (state.coverage !== "medicaid" && state.coverage !== "both" && incomeMax <= 2000) {
      qualified.push({prog: "medicaid", likely: null});
    }

    // PACE has non-income gates (55+, nursing-home-level care need, service area),
    // so it is always informational — never a "match".
    qualified.push({prog: "pace", likely: null});

    // Marketplace subsidies only make sense with no Medicare or Medicaid.
    if (state.coverage === "neither") {
      qualified.push({prog: "marketplace", likely: null});
    }

    // SHIP always available
    qualified.push({prog: "ship", likely: null});

    // Sort by impact (higher = show first) then by program name
    qualified.sort(function (a, b) {
      var progA = PROGRAMS[a.prog];
      var progB = PROGRAMS[b.prog];
      if (progB.impact !== progA.impact) return progB.impact - progA.impact;
      return progA.name.localeCompare(progB.name);
    });

    var html = '<div class="help-result">';
    html += '<div class="result-header"><h3>' + t('You might qualify for these programs') + '</h3>';
    html += '<p>' + t('Below are programs based on your answers. Many people are surprised by what they qualify for.') + ' <strong>' + t('It costs nothing to apply.') + '</strong></p></div>';

    // Sort qualified programs so "likely" appears first
    var likely = qualified.filter(function (q) { return q.likely === true; });
    var maybe = qualified.filter(function (q) { return q.likely === null || q.likely === false; });

    likely.forEach(function (q) {
      html += programHTML(PROGRAMS[q.prog], true, q.automatic);
    });
    maybe.forEach(function (q) {
      html += programHTML(PROGRAMS[q.prog], false, false);
    });

    html += '<div class="help-note">';
    html += '<strong>' + t('These are approximate 2026 figures and change every year.') + '</strong> ' + t('Income is only part of the test: most of these programs also have resource (savings) limits, and many states set higher limits or drop the resource test entirely. Only your state agency can decide. Apply even if you are close to the limit — it costs nothing, and you might qualify.');
    html += '</div>';

    html += '<div class="help-actions"><button type="button" class="help-btn secondary" id="help-reset">' + t('Answer again') + '</button></div>';
    html += '</div>';

    root.insertAdjacentHTML("beforeend", html);
    document.getElementById("help-go").className = "help-btn help-hidden";
    document.getElementById("help-reset").addEventListener("click", function () {
      state = { coverage: null, household: null, income: null, drugs: null };
      renderForm();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    root.querySelector(".help-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function programHTML(prog, likely, automatic) {
    var limitNum = state.household === "one" ? prog.limit_single : prog.limit_couple;
    var who = state.household === "one" ? t("for one person") : t("for a couple");
    var badge = automatic ? '<span class="help-badge">' + t('Automatic with Medicare + Medicaid') + '</span>'
      : likely ? '<span class="help-badge">' + t('Worth applying — your answers fit') + '</span>' : '';
    var limitLine = automatic
      ? '<p class="help-limit">' + t('If you have both Medicare and full Medicaid, you get this automatically — no income test.') + '</p>'
      : limitNum
        ? '<p class="help-limit">' + t('Approximate 2026 income limit:') + ' $' + limitNum.toLocaleString("en-US") + '/month ' + who + '. ' + t('Resource limits also apply; many states go higher.') + '</p>'
        : '<p class="help-limit">' + t('Limits and rules vary by state.') + '</p>';
    return '<div class="help-program">' +
      '<div class="help-prog-header">' + badge + '<h4>' + prog.name + '</h4></div>' +
      '<p class="help-what"><strong>' + t('What it does:') + '</strong> ' + prog.what + '</p>' +
      limitLine +
      '<p class="help-apply"><strong>' + t('How to apply:') + '</strong> ' + prog.apply + '</p>' +
      '</div>';
  }

  renderForm();
})();
