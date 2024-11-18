(self.webpackChunktradingview = self.webpackChunktradingview || []).push([
  [7648],
  {
    57351: (e, a, t) => {
      "use strict";
      t.r(a), t.d(a, { showThemeSaveDialog: () => i });
      var m = t(11542),
        o = t(3615),
        s = t(11014),
        r = t(51768),
        n = t(33547);
      function i(e, a, i, l) {
        function h(t) {
          (0, s.saveTheme)(t, e).then(() => {
            a && a(t);
          }),
            (0, r.trackEvent)("GUI", "Themes", "Save custom theme");
        }
        (0, o.showRename)({
          title: m.t(null, void 0, t(84034)),
          text: m.t(null, void 0, t(94508)) + ":",
          maxLength: 128,
          source: i || [],
          onClose: l,
          autocompleteFilter: n.autocompleteFilter,
          onRename: ({ newValue: e, focusInput: a, dialogClose: r, innerManager: n }) =>
            new Promise((i) => {
              (0, s.isThemeExist)(e).then((s) => {
                if (s) {
                  const s = m.t(null, { replace: { themeName: e } }, t(89028));
                  (0, o.showConfirm)(
                    {
                      text: s,
                      onConfirm: ({ dialogClose: a }) => {
                        h(e), a(), r();
                      },
                      onClose: a,
                    },
                    n,
                  ).then(() => {
                    i();
                  });
                } else h(e), i(), r();
              });
            }),
        });
      }
    },
    33547: (e, a, t) => {
      "use strict";
      function m(e, a) {
        return Boolean("" === e || (e && -1 !== a.toLowerCase().indexOf(e.toLowerCase())));
      }
      t.d(a, { autocompleteFilter: () => m });
    },
    89028: (e) => {
      e.exports = {
        ar: ["نسق الألوان ‎{themeName}‎موجود بالفعل. هل ترغب حقًا في استبداله؟"],
        ca_ES: ["La paleta de colors '{themeName}' ja existeix. De debò que voleu substituir-la?"],
        cs: "Color Theme '{themeName}' already exists. Do you really want to replace it?",
        de: ['Das Farbschema "{themeName}" gibt es schon. Wollen Sie es wirklich ersetzen?'],
        el: "Color Theme '{themeName}' already exists. Do you really want to replace it?",
        en: "Color Theme '{themeName}' already exists. Do you really want to replace it?",
        es: [
          "La paleta de colores '{themeName}' ya existe. ¿Está seguro de que desea sustituirla?",
        ],
        fa: "Color Theme '{themeName}' already exists. Do you really want to replace it?",
        fr: ["Le thème couleur '{themeName}' existe déjà. Voulez-vous vraiment le remplacer?"],
        he_IL: ["צבע ערכת נושא‎{themeName}‎ כבר קיים. האם אתה באמת רוצה להחליפו?"],
        hu_HU: "Color Theme '{themeName}' already exists. Do you really want to replace it?",
        id_ID: ["Warna Tema '{themeName}' sudah ada. Apakah benar anda ingin menggantinya?"],
        it: ['Il tema colore "{themeName}" esiste già. Sovrascriverlo?'],
        ja: ["カラーテーマ '{themeName}' は既に存在しています。本当に置き換えますか？"],
        ko: ["'{themeName}' 칼라 테마가 이미 있습니다. 바꾸시겠습니까?"],
        ms_MY: ["Tema warna '{themeName}' sudah wujud. Adakah anda ingin menggantikannya?"],
        nl_NL: "Color Theme '{themeName}' already exists. Do you really want to replace it?",
        pl: [
          "Motyw kolorystyczny o nazwie '{themeName}' już istnieje. Czy naprawdę chcesz go zastąpić?",
        ],
        pt: ["O tema de cores '{themeName}' já existe. Você realmente quer substituí-lo?"],
        ro: "Color Theme '{themeName}' already exists. Do you really want to replace it?",
        ru: ["Цветовая тема '{themeName}' уже существует. Вы действительно хотите её заменить?"],
        sv: ["Färgtema '{themeName}' finns redan. Är du säker på att du vill byta ut det?"],
        th: ["ธีมสี {themeName} มีอยู่แล้ว คุณต้องการที่จะแทนที่มันหรือไม่"],
        tr: ["{themeName} Renk Teması hali hazırda var. Değiştirmek istediğinizden emin misiniz?"],
        vi: ["Chủ đề màu '{themeName}' đã tồn tại. Bạn có thực sự muốn thay thế nó?"],
        zh: ["主题颜色 '{themeName}' 已存在。您确定要替换吗？"],
        zh_TW: ["顏色主題 '{themeName}' 已存在，您確定要替換嗎？"],
      };
    },
    84034: (e) => {
      e.exports = {
        ar: ["احفظ النسق كـ :"],
        ca_ES: ["Desa l'esquema com a"],
        cs: "Save Theme As",
        de: ["Design speichern als"],
        el: "Save Theme As",
        en: "Save Theme As",
        es: ["Guardar el esquema como"],
        fa: "Save Theme As",
        fr: ["Sauvegarder le Thème Sous"],
        he_IL: ["שמור נושא כ"],
        hu_HU: ["Téma Mentése Mint"],
        id_ID: ["Simpan Tema Sebagai"],
        it: ["Salva tema con nome"],
        ja: ["テーマを保存"],
        ko: ["테마 다른 이름으로 저장"],
        ms_MY: ["Simpan Tema Sebagai"],
        nl_NL: "Save Theme As",
        pl: ["Zapisz motyw jako"],
        pt: ["Salvar tema como"],
        ro: "Save Theme As",
        ru: ["Сохранить тему как"],
        sv: ["Spara tema som"],
        th: ["บันทึก Theme เป็น"],
        tr: ["Temaya Yeni Ad Ver"],
        vi: ["Lưu Chủ đề Là"],
        zh: ["保存主题为"],
        zh_TW: ["另存主題"],
      };
    },
    94508: (e) => {
      e.exports = {
        ar: ["أسم القالب"],
        ca_ES: ["Nom de l'esquema"],
        cs: "Theme name",
        de: ["Design-Name"],
        el: "Theme name",
        en: "Theme name",
        es: ["Nombre del esquema"],
        fa: "Theme name",
        fr: ["Nom du thème"],
        he_IL: ["שם ערכת הנושא"],
        hu_HU: ["Téma neve"],
        id_ID: ["Nama Tema"],
        it: ["Nome tema"],
        ja: ["テーマ名"],
        ko: ["테마이름"],
        ms_MY: ["Nama tema"],
        nl_NL: "Theme name",
        pl: ["Nazwa motywu"],
        pt: ["Nome do tema"],
        ro: "Theme name",
        ru: ["Имя темы"],
        sv: ["Temanamn"],
        th: ["ชื่อธีม"],
        tr: ["Tema adı"],
        vi: ["Tên Chủ đề"],
        zh: ["主题名称"],
        zh_TW: ["主題名稱"],
      };
    },
  },
]);
