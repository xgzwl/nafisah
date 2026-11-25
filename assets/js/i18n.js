(function () {
  "use strict";

  var DICT = {
    en: {
      "site.name": "Tom Marvolo Riddle",
      "site.eyebrow": "a private shrine",
      "nav.home": "Home",
      "nav.about": "About",
      "nav.quotes": "Quotes",
      "nav.letters": "Letters",
      "nav.gallery": "Gallery",
      "nav.disclaimer": "Notes",
      "footer.line": "A quiet fan shrine, kept by candlelight.",
      "footer.lang": "Language",
      "common.backTop": "Back to top",
      "common.skip": "Skip to content",

      "hero.eyebrow": "a diary that remembers",
      "hero.tagline": "A diary that remembers you.",
      "hero.intro1": "Some pages stay open long after the candle has gone out.",
      "hero.intro2": "This is a small, gentle place for a reader who knows the story by heart.",
      "hero.cta": "Enter the shrine",
      "hero.scroll": "Turn the page",
      "hero.imageNote": "An old study, after midnight",
      "index.sectionTitle": "Three doors",
      "index.sectionLead": "Choose where the evening should go.",
      "index.card1Title": "The record",
      "index.card1Body": "A neutral account of the boy, the house and the diary.",
      "index.card2Title": "The echoes",
      "index.card2Body": "Canon lines, kept quiet and accompanied in two languages.",
      "index.card3Title": "The letters",
      "index.card3Body": "Original notes written as if paper could listen.",

      "about.title": "The boy behind the name",
      "about.lead": "A short record drawn from canon, told without ornament.",
      "about.fact1t": "Birth",
      "about.fact1d": "Born on 31 December 1926.",
      "about.fact2t": "Family",
      "about.fact2d": "Son of a Muggle father and a witch mother of the Gaunt line.",
      "about.fact3t": "Early years",
      "about.fact3d": "Raised in a Muggle orphanage in London before Hogwarts.",
      "about.fact4t": "Hogwarts",
      "about.fact4d": "Sorted into Slytherin in 1938, a student of unusual ability.",
      "about.fact5t": "The diary",
      "about.fact5d": "A book that kept a record of his younger self.",
      "about.fact6t": "The name",
      "about.fact6d": "He rearranged his name into another identity.",
      "about.note": "This profile keeps to background facts. It does not excuse harm or soften what the stories tell.",

      "quotes.title": "Quote Wall",
      "quotes.lead": "Five canon lines, chosen for their quietness.",
      "q1.text": "Lucky that I recorded my memories in something more lasting than ink.",
      "q1.src": "Harry Potter and the Chamber of Secrets",
      "q2.text": "I knew I had to talk to you, meet you if I could.",
      "q2.src": "Harry Potter and the Chamber of Secrets",
      "q3.text": "I've always been able to charm the people I needed.",
      "q3.src": "Harry Potter and the Chamber of Secrets",
      "q4.text": "I always knew I was special.",
      "q4.src": "Harry Potter and the Half-Blood Prince",
      "q5.text": "I can speak to snakes. Is that normal for someone like me?",
      "q5.src": "Harry Potter and the Half-Blood Prince",

      "letters.title": "Letter Wall",
      "letters.lead": "Original notes, written in a gentle register. Nothing here is a canon document.",
      "l1.date": "14 November",
      "l1.body": "Dear diary, the candle has burned low again. I found a name in the margin of an old book today, and the page seemed to wait for me. I said nothing. Some things are safer between paper and light.",
      "l2.date": "2 December",
      "l2.body": "Dear diary, the corridor was quiet this evening. I thought about the way a room keeps a voice after its owner has left. I hope you do not mind me writing here. I only wanted somewhere soft to put the thought.",
      "l3.date": "31 December",
      "l3.body": "Dear diary, another year has turned over. I did not make a wish. I simply opened the window, listened to the rain, and let the page stay blank for a while. Some answers arrive later, and only if we wait.",
      "letters.note": "Written for this shrine. No passage is copied from published fan fiction.",

      "gallery.title": "Gallery",
      "gallery.lead": "Atmospheric photographs, held in a green and gold frame.",
      "g1.cap": "The candlelit study",
      "g1.note": "Where the evening begins",
      "g2.cap": "The old shelves",
      "g2.note": "Books that remember hands",
      "g3.cap": "A rose after midnight",
      "g3.note": "Dark, but not severe",
      "g4.cap": "Silver in the dark",
      "g4.note": "A small, cold light",
      "g5.cap": "Ink and memory",
      "g5.note": "The archive of a quiet room",
      "g6.cap": "Still life with light",
      "g6.note": "Objects left behind",
      "gallery.note": "All images are public domain or CC0 atmospheric photographs from Wikimedia Commons. No character portraits are used.",

      "dis.title": "Notes & Disclaimer",
      "dis.lead": "A few things worth saying plainly.",
      "dis.1": "This is a non-commercial fan work. The characters and settings belong to J.K. Rowling and Warner Bros.",
      "dis.2": "Please turn away if the same name or another pairing would trouble you.",
      "dis.3": "The tone stays gentle. There is no explicit content, no violence, no advertising and no third-party link.",
      "dis.4": "Atmospheric photographs come from Wikimedia Commons under public domain or CC0 terms. Typefaces are Cinzel, Cormorant Garamond, EB Garamond and LXGW WenKai, all under the SIL Open Font License.",
      "dis.footer": "Made for a quiet reader.",

      "nf.title": "This page wandered into the mist",
      "nf.body": "The room you were looking for is not here. The candle is still lit in the main hall.",
      "nf.link": "Return home"
    },

    zh: {
      "site.name": "Tom Marvolo Riddle",
      "site.eyebrow": "一座私人神龛",
      "nav.home": "首页",
      "nav.about": "档案",
      "nav.quotes": "语录",
      "nav.letters": "书信",
      "nav.gallery": "图库",
      "nav.disclaimer": "声明",
      "footer.line": "一座安静的粉丝神龛，烛光长明。",
      "footer.lang": "语言",
      "common.backTop": "回到顶部",
      "common.skip": "跳到正文",

      "hero.eyebrow": "一本记得你的日记",
      "hero.tagline": "一本记得你的日记。",
      "hero.intro1": "烛火熄了很久，有些书页仍摊开着。",
      "hero.intro2": "这里很小，也很温柔，留给熟悉那个故事的读者。",
      "hero.cta": "走进神龛",
      "hero.scroll": "翻过这一页",
      "hero.imageNote": "午夜后的旧书房",
      "index.sectionTitle": "三扇门",
      "index.sectionLead": "今晚想往哪里走。",
      "index.card1Title": "记录",
      "index.card1Body": "关于那个男孩、那所学院和那本日记的中立叙述。",
      "index.card2Title": "回声",
      "index.card2Body": "温和的原著台词，附中文与法文译文。",
      "index.card3Title": "书信",
      "index.card3Body": "原创短札，像纸页愿意听人说话。",

      "about.title": "名字背后的男孩",
      "about.lead": "一段依据原著整理的小传，不加修饰。",
      "about.fact1t": "出生",
      "about.fact1d": "生于 1926 年 12 月 31 日。",
      "about.fact2t": "家庭",
      "about.fact2d": "父亲是麻瓜，母亲是冈特家族的女巫。",
      "about.fact3t": "早年",
      "about.fact3d": "入霍格沃茨前在伦敦的麻瓜孤儿院长大。",
      "about.fact4t": "霍格沃茨",
      "about.fact4d": "1938 年进入斯莱特林，天赋出众。",
      "about.fact5t": "日记本",
      "about.fact5d": "一本留下年轻时记忆的书。",
      "about.fact6t": "名字",
      "about.fact6d": "他把自己的名字重排成另一个身份。",
      "about.note": "这里只保留背景事实，不为伤害辩解，也不淡化原著中的叙述。",

      "quotes.title": "语录墙",
      "quotes.lead": "五条温和的原著台词。",
      "q1.text": "幸好我把记忆留在了比墨水更长久的东西里。",
      "q1.src": "《哈利·波特与密室》",
      "q2.text": "我知道我必须和你说话，若可以，就见一面。",
      "q2.src": "《哈利·波特与密室》",
      "q3.text": "我总能打动我需要打动的人。",
      "q3.src": "《哈利·波特与密室》",
      "q4.text": "我一直知道自己与众不同。",
      "q4.src": "《哈利·波特与混血王子》",
      "q5.text": "我能和蛇说话。像我这样的人，这正常吗？",
      "q5.src": "《哈利·波特与混血王子》",

      "letters.title": "书信墙",
      "letters.lead": "原创短札，语气克制。这里没有原著公文。",
      "l1.date": "11 月 14 日",
      "l1.body": "亲爱的日记，烛火又低了。今天我在一本旧书的页边看到一个名字，那一页像是在等我。我没有说话。有些事留在纸和光之间更稳妥。",
      "l2.date": "12 月 2 日",
      "l2.body": "亲爱的日记，今晚走廊很安静。我想起一个房间会在主人离开后仍留住声音。你若不介意，我就写在这里。我只是想给这个念头找个柔软的地方。",
      "l3.date": "12 月 31 日",
      "l3.body": "亲爱的日记，又一年翻过去了。我没有许愿，只是推开窗，听了一会儿雨，让这一页空白留久一些。有些答案来得晚，而且只给愿意等的人。",
      "letters.note": "本站原创文字，未抄录任何已发表的同人作品。",

      "gallery.title": "美学图库",
      "gallery.lead": "暗调氛围照片，收进绿金色的边框里。",
      "g1.cap": "烛光书房",
      "g1.note": "夜晚从此处开始",
      "g2.cap": "旧书架",
      "g2.note": "记得手温的书",
      "g3.cap": "午夜后的玫瑰",
      "g3.note": "幽暗，却不锋利",
      "g4.cap": "暗处的银器",
      "g4.note": "一点清冷的光",
      "g5.cap": "墨水与记忆",
      "g5.note": "安静房间的档案",
      "g6.cap": "有光的静物",
      "g6.note": "被留下的物件",
      "gallery.note": "图片来自 Wikimedia Commons 的公有领域或 CC0 氛围照片，未使用角色肖像。",

      "dis.title": "避雷与声明",
      "dis.lead": "有几件事需要说清楚。",
      "dis.1": "本站为非商业同人创作，角色与设定版权归 J.K. Rowling 及华纳所有。",
      "dis.2": "若雷同梦或其他 CP 会让你不适，请自行避雷。",
      "dis.3": "全站保持克制，无露骨内容、无血腥暴力、无商业广告、无第三方外链。",
      "dis.4": "氛围图片来自 Wikimedia Commons 的公有领域或 CC0 照片。字体为 Cinzel、Cormorant Garamond、EB Garamond 与霞鹜文楷，均遵循 SIL 开源字体许可。",
      "dis.footer": "写给一位安静的读者。",

      "nf.title": "这一页走进了薄雾",
      "nf.body": "你想找的房间不在这里，主厅的烛火还亮着。",
      "nf.link": "回到首页"
    },

    fr: {
      "site.name": "Tom Marvolo Riddle",
      "site.eyebrow": "un sanctuaire privé",
      "nav.home": "Accueil",
      "nav.about": "À propos",
      "nav.quotes": "Citations",
      "nav.letters": "Lettres",
      "nav.gallery": "Galerie",
      "nav.disclaimer": "Notes",
      "footer.line": "Un sanctuaire de fan discret, veillé à la bougie.",
      "footer.lang": "Langue",
      "common.backTop": "Retour en haut",
      "common.skip": "Aller au contenu",

      "hero.eyebrow": "un journal qui se souvient",
      "hero.tagline": "Un journal qui se souvient de vous.",
      "hero.intro1": "Certaines pages restent ouvertes longtemps après que la bougie s'est éteinte.",
      "hero.intro2": "Voici un lieu petit et doux, pour une lectrice qui connaît l'histoire par cœur.",
      "hero.cta": "Entrer dans le sanctuaire",
      "hero.scroll": "Tourner la page",
      "hero.imageNote": "Un vieux cabinet, après minuit",
      "index.sectionTitle": "Trois portes",
      "index.sectionLead": "Choisissez où va la soirée.",
      "index.card1Title": "Le registre",
      "index.card1Body": "Un récit neutre du garçon, de la maison et du journal.",
      "index.card2Title": "Les échos",
      "index.card2Body": "Des répliques canoniques, choisies pour leur douceur et traduites en deux langues.",
      "index.card3Title": "Les lettres",
      "index.card3Body": "Des notes inédites, écrites comme si le papier savait écouter.",

      "about.title": "Le garçon derrière le nom",
      "about.lead": "Une courte notice tirée du canon, sans fard.",
      "about.fact1t": "Naissance",
      "about.fact1d": "Né le 31 décembre 1926.",
      "about.fact2t": "Famille",
      "about.fact2d": "Fils d'un père moldu et d'une mère sorcière de la lignée Gaunt.",
      "about.fact3t": "Premières années",
      "about.fact3d": "Élevé dans un orphelinat moldu à Londres avant Poudlard.",
      "about.fact4t": "Poudlard",
      "about.fact4d": "Envoyé chez Serpentard en 1938, élève d'une rare aptitude.",
      "about.fact5t": "Le journal",
      "about.fact5d": "Un livre qui conservait le souvenir de son moi plus jeune.",
      "about.fact6t": "Le nom",
      "about.fact6d": "Il a réarrangé son nom pour en faire une autre identité.",
      "about.note": "Cette page s'en tient aux faits de fond. Elle n'excuse rien et n'atténue pas ce que racontent les récits.",

      "quotes.title": "Mur des citations",
      "quotes.lead": "Cinq répliques canoniques, choisies pour leur calme.",
      "q1.text": "J'ai eu la chance d'enregistrer mes souvenirs dans quelque chose de plus durable que l'encre.",
      "q1.src": "Harry Potter et la Chambre des secrets",
      "q2.text": "Je savais que je devais vous parler, vous rencontrer si je le pouvais.",
      "q2.src": "Harry Potter et la Chambre des secrets",
      "q3.text": "J'ai toujours su charmer les gens dont j'avais besoin.",
      "q3.src": "Harry Potter et la Chambre des secrets",
      "q4.text": "J'ai toujours su que j'étais spécial.",
      "q4.src": "Harry Potter et le Prince de sang-mêlé",
      "q5.text": "Je peux parler aux serpents. Est-ce normal pour quelqu'un comme moi ?",
      "q5.src": "Harry Potter et le Prince de sang-mêlé",

      "letters.title": "Mur des lettres",
      "letters.lead": "Des notes inédites, sur un ton retenu. Aucune n'est un document canonique.",
      "l1.date": "14 novembre",
      "l1.body": "Cher journal, la bougie a de nouveau baissé. Aujourd'hui, j'ai trouvé un nom dans la marge d'un vieux livre, et la page semblait m'attendre. Je n'ai rien dit. Certaines choses tiennent mieux entre le papier et la lumière.",
      "l2.date": "2 décembre",
      "l2.body": "Cher journal, le couloir était silencieux ce soir. Je pensais à la façon dont une pièce garde une voix après le départ de son maître. Si cela ne vous dérange pas, j'écrirai ici. Je voulais seulement un endroit doux pour poser cette pensée.",
      "l3.date": "31 décembre",
      "l3.body": "Cher journal, une année vient de tourner. Je n'ai pas formulé de vœu. J'ai simplement ouvert la fenêtre, écouté la pluie, et laissé la page blanche un peu plus longtemps. Certaines réponses arrivent tard, et seulement à qui sait attendre.",
      "letters.note": "Textes écrits pour ce sanctuaire. Aucun passage n'est copié d'une fanfiction publiée.",

      "gallery.title": "Galerie",
      "gallery.lead": "Des photographies d'ambiance, encadrées de vert et d'or.",
      "g1.cap": "Le cabinet aux bougies",
      "g1.note": "Là où commence la soirée",
      "g2.cap": "Les vieilles étagères",
      "g2.note": "Des livres qui se souviennent des mains",
      "g3.cap": "Une rose après minuit",
      "g3.note": "Sombre, mais sans rudesse",
      "g4.cap": "L'argent dans l'ombre",
      "g4.note": "Une petite lumière froide",
      "g5.cap": "Encre et souvenir",
      "g5.note": "Les archives d'une pièce tranquille",
      "g6.cap": "Nature morte avec lumière",
      "g6.note": "Les objets laissés derrière",
      "gallery.note": "Toutes les images sont des photographies d'ambiance du domaine public ou sous licence CC0, issues de Wikimedia Commons. Aucun portrait de personnage n'est utilisé.",

      "dis.title": "Notes et avertissement",
      "dis.lead": "Quelques points à dire simplement.",
      "dis.1": "Ce site est une création de fan non commerciale. Les personnages et l'univers appartiennent à J.K. Rowling et Warner Bros.",
      "dis.2": "Veuillez vous éloigner si un nom identique ou un autre couple vous met mal à l'aise.",
      "dis.3": "Le ton reste doux. Aucun contenu explicite, aucune violence, aucune publicité et aucun lien tiers.",
      "dis.4": "Les photographies d'ambiance proviennent de Wikimedia Commons sous licence domaine public ou CC0. Les polices sont Cinzel, Cormorant Garamond, EB Garamond et LXGW WenKai, toutes sous licence SIL Open Font License.",
      "dis.footer": "Pour une lectrice tranquille.",

      "nf.title": "Cette page s'est égarée dans la brume",
      "nf.body": "La pièce que vous cherchiez n'est pas ici. La bougie brûle encore dans le hall principal.",
      "nf.link": "Retour à l'accueil"
    }
  };

  var STORAGE_KEY = "tr-lang";

  function normalize(lang) {
    return Object.prototype.hasOwnProperty.call(DICT, lang) ? lang : null;
  }

  function currentLang() {
    var query = new URLSearchParams(window.location.search).get("lang");
    var fromQuery = normalize(query);
    if (fromQuery) {
      try { window.localStorage.setItem(STORAGE_KEY, fromQuery); } catch (error) {}
      return fromQuery;
    }
    var stored = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch (error) {}
    return normalize(stored) || "en";
  }

  function apply(lang) {
    var dict = DICT[lang];
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var value = dict[node.getAttribute("data-i18n")];
      if (typeof value === "string") node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
      var value = dict[node.getAttribute("data-i18n-html")];
      if (typeof value === "string") node.innerHTML = value;
    });
    document.querySelectorAll("[data-lang-btn]").forEach(function (button) {
      var active = button.getAttribute("data-lang-btn") === lang;
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    document.querySelectorAll("a[data-internal]").forEach(function (link) {
      if (!link.getAttribute("data-orig-href")) {
        link.setAttribute("data-orig-href", link.getAttribute("href"));
      }
      var target = new URL(link.getAttribute("data-orig-href"), window.location.href);
      target.searchParams.set("lang", lang);
      link.setAttribute("href", target.href);
    });
    document.title = dict["site.name"] + " · " + dict["site.eyebrow"];
  }

  window.ShrineI18n = {
    current: currentLang,
    apply: apply,
    available: ["en", "zh", "fr"],
    dict: DICT
  };
})();
