const FAQ_ITEMS = [
  {
    question: "Kurulum ne kadar sürer?",
    answer:
      "Hesap oluşturma, şirket ekleme ve ilk rota kurulumunu aynı gün içinde tamamlayabilirsiniz.",
  },
  {
    question: "Canlı takip mobilde de çalışır mı?",
    answer:
      "Evet. Operatör paneli webde çalışır, paylaşım linkleri ise mobil cihazlarda sorunsuz açılır.",
  },
  {
    question: "Veri güvenliği nasıl sağlanıyor?",
    answer:
      "Rol bazlı erişim, log kaydı ve KVKK uyumlu veri saklama politikası ile operasyon güvenli tutulur.",
  },
  {
    question: "Mevcut verilerimi taşıyabilir miyim?",
    answer: "Evet. Araç, şoför ve rota kayıtlarını CSV ile içe aktarabilirsiniz.",
  },
  {
    question: "Demo almadan satın alma gerekiyor mu?",
    answer:
      "Hayır. Önce demo veya deneme süreciyle ekip akışınıza uygunluğunu test edebilirsiniz.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-brand uppercase">SSS</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Sık sorulan sorular
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Operasyon ekiplerinin en çok sorduğu konuları kısa yanıtlarla bir araya getirdik.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
