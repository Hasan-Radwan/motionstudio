// Bilingual marketing copy. Pure data (no DOM), shared by:
//  - landing.js (client render + hydration)
//  - scripts/prerender.mjs (build-time static HTML for `/` [en] and `/ar`)
// English is the primary/default language; Arabic lives at /ar.

export const COPY = {
  en: {
    dir: 'ltr',
    nav: { about: 'About', how: 'How it works', features: 'Features', pricing: 'Pricing', faq: 'FAQ', launch: 'Launch' },
    langBtn: 'ع',
    langHref: '/ar',
    hero: {
      badge: '✦ A motion studio in your browser',
      title: 'Turn your images into professional motion videos',
      sub: 'Pick a template, add your images, customize freely, and export a seamless looping video up to 8K — entirely in your browser, nothing uploaded.',
      ctaPrimary: 'Start free',
      ctaSecondary: 'See how it works',
    },
    stats: [
      ['41+', 'pro motion templates'],
      ['8K', 'MP4 / WebM export'],
      ['100%', 'local & private'],
    ],
    about: {
      title: 'What is Rotion?',
      body: 'A motion-design tool that runs entirely in your browser: no install, no account, nothing uploaded to any server. Built for designers and creators who want to turn a still image or logo into an eye-catching social video in minutes.',
      points: [
        ['🔒', 'Fully private', 'All processing happens on your device — your images never leave it.'],
        ['⚡', 'Fast & instant', 'Live preview and faster-than-realtime export via WebCodecs.'],
        ['🌐', 'Arabic & English', 'Full RTL Arabic text support with professional Arabic fonts.'],
      ],
    },
    how: {
      title: 'How it works',
      sub: 'Four steps from image to video',
      steps: [
        ['Pick a template', 'Browse 41+ motion templates across 11 categories and pick your vibe.'],
        ['Add your images', 'Drag & drop your photo or logo; some templates take several images.'],
        ['Customize', 'Control colors, backgrounds, Arabic text, watermark and card shape.'],
        ['Export video', 'Export a seamless looping MP4 or WebM in any aspect and quality.'],
      ],
    },
    features: {
      title: 'Everything you need for motion content',
      items: [
        ['🎬', '41+ templates', '3D, orbits, slideshows, cinematic, isometric and more.'],
        ['🅰️', 'Arabic text', 'Multiple text layers, auto RTL, and Cairo / Tajawal fonts.'],
        ['🖼️', 'Flexible backgrounds', 'Colors, gradients, mesh, or upload your own image.'],
        ['💧', 'Watermark', 'Upload your logo and control its size and corner on every export.'],
        ['🔷', 'Card shapes', 'Rectangle, square, circle, triangle — one click.'],
        ['💾', 'Local save', 'Projects are saved in your browser and restored automatically.'],
      ],
    },
    pricing: {
      title: 'Plans for everyone',
      sub: 'Start free, upgrade when you need more',
      perMonth: '/ mo',
      popular: 'Most popular',
      cta: 'Get started',
      // When true, the Pro price is replaced at runtime with the real localized
      // price from Paddle (PricePreview). Set false (from the admin dashboard) to
      // show the fixed `price` values below instead.
      showLivePrice: true,
      tiers: [
        {
          name: 'Free',
          price: '0',
          desc: 'For trying it out & personal use',
          features: ['All core templates', 'Export up to 720p', 'App watermark', 'Local save'],
          featured: false,
        },
        {
          name: 'Pro',
          price: '12',
          desc: 'For creators & designers',
          features: ['All templates', 'Export up to 8K', 'No app watermark', 'Your own watermark', 'Custom font upload'],
          featured: true,
        },
      ],
      note: '* Prices shown are placeholders — edit to match your business plan.',
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        ['What is Rotion?', 'Rotion is a browser-based motion-design tool: pick a template, add your images, tweak a few settings, and export an animated video. No timeline keyframing or design software required — everything runs on your own device.'],
        ['Do I need design or animation experience?', 'Not at all. Start from a ready-made template, drop in your images or logo, adjust the sliders, and export. It is built for anyone.'],
        ['Can I try it before I subscribe?', 'Yes. The Free plan lets you use the core templates and export up to 720p, forever. Upgrade to Pro whenever you need 8K, no watermark, custom fonts and more.'],
        ['Which browsers and devices does it work on?', 'Rotion runs in modern browsers (Chrome and Edge recommended) on desktop and mobile. Since exporting is intensive, high resolutions work best on a capable device.'],
        ['Do I need to download or install anything?', 'No. Rotion runs entirely in your browser — nothing to install. Your projects are saved locally and restored automatically.'],
        ['Can I cancel my subscription anytime?', 'Yes. You can cancel Pro at any time and keep access until the end of your paid period. See the Refund Policy for details.'],
      ],
    },
    finalCta: { title: 'Ready to animate your design?', sub: 'Start now for free — no signup.', btn: 'Open the studio' },
    legal: {
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      refund: 'Refund Policy',
      contact: 'Contact',
    },
    footer: '© 2026 Rotion App — runs entirely in your browser.',
  },
  ar: {
    dir: 'rtl',
    nav: { about: 'نبذة', how: 'كيف يعمل', features: 'المميزات', pricing: 'الأسعار', faq: 'الأسئلة', launch: 'ابدأ الآن' },
    langBtn: 'EN',
    langHref: '/',
    hero: {
      badge: '✦ استوديو موشن في متصفحك',
      title: 'حوّل صورك إلى فيديوهات متحركة احترافية',
      sub: 'اختر قالباً، أضف صورك، عدّل بحرية، وصدّر فيديو حلقة سلس بجودة تصل إلى 8K — كل ذلك داخل المتصفح دون أي رفع لخوادم.',
      ctaPrimary: 'ابدأ مجاناً',
      ctaSecondary: 'شاهد كيف يعمل',
    },
    stats: [
      ['+41', 'قالب حركة احترافي'],
      ['8K', 'تصدير MP4 / WebM'],
      ['100%', 'يعمل محلياً وبخصوصية'],
    ],
    about: {
      title: 'ما هو Rotion؟',
      body: 'أداة تصميم حركة تعمل بالكامل في متصفحك: لا تثبيت، ولا حساب، ولا رفع لصورك إلى أي خادم. مبنية للمصممين وصنّاع المحتوى الذين يريدون تحويل صورة ثابتة أو شعار إلى فيديو جذّاب للسوشيال ميديا في دقائق.',
      points: [
        ['🔒', 'خصوصية كاملة', 'كل المعالجة تحدث على جهازك؛ صورك لا تغادره أبداً.'],
        ['⚡', 'سريع وفوري', 'معاينة حيّة لحظية وتصدير أسرع من الزمن الحقيقي عبر WebCodecs.'],
        ['🌐', 'عربي وإنجليزي', 'دعم كامل للكتابة العربية RTL وخطوط عربية احترافية.'],
      ],
    },
    how: {
      title: 'كيف يعمل؟',
      sub: 'أربع خطوات من الصورة إلى الفيديو',
      steps: [
        ['اختر قالباً', 'تصفّح أكثر من 41 قالب حركة موزّعة على 11 تصنيفاً واختر ما يناسب فكرتك.'],
        ['أضف صورك', 'اسحب وأفلت صورك أو شعارك؛ بعض القوالب يدعم عدة صور معاً.'],
        ['خصّص التصميم', 'تحكّم بالألوان والخلفية والنصوص العربية والعلامة المائية وشكل الكارت.'],
        ['صدّر الفيديو', 'صدّر فيديو حلقة سلس MP4 أو WebM بالأبعاد والجودة التي تريدها.'],
      ],
    },
    features: {
      title: 'كل ما تحتاجه لصناعة محتوى متحرك',
      items: [
        ['🎬', '41+ قالب', 'ثلاثي الأبعاد، مدارات، شرائح، سينمائي، آيزومترك والمزيد.'],
        ['🅰️', 'نصوص عربية', 'طبقات نص متعددة، اتجاه RTL تلقائي، وخطوط Cairo وTajawal.'],
        ['🖼️', 'خلفيات مرنة', 'ألوان، تدرّجات، mesh، أو ارفع صورتك الخاصة كخلفية.'],
        ['💧', 'علامة مائية', 'ارفع شعارك وتحكّم بحجمه وزاويته على كل تصدير.'],
        ['🔷', 'أشكال الكارت', 'مستطيل، مربع، دائري، مثلث — بضغطة واحدة.'],
        ['💾', 'حفظ محلي', 'مشاريعك تُحفظ في متصفحك وتُستعاد تلقائياً.'],
      ],
    },
    pricing: {
      title: 'خطط تناسب الجميع',
      sub: 'ابدأ مجاناً، وطوّر متى احتجت المزيد',
      perMonth: '/ شهرياً',
      popular: 'الأكثر رواجاً',
      cta: 'ابدأ الآن',
      showLivePrice: true,
      tiers: [
        {
          name: 'مجاني',
          price: '0',
          desc: 'للتجربة والاستخدام الشخصي',
          features: ['كل القوالب الأساسية', 'تصدير حتى 720p', 'علامة مائية للتطبيق', 'حفظ محلي'],
          featured: false,
        },
        {
          name: 'احترافي',
          price: '12',
          desc: 'لصنّاع المحتوى والمصممين',
          features: ['كل القوالب', 'تصدير حتى 8K', 'بدون علامة مائية', 'علامتك المائية الخاصة', 'رفع خطوط مخصّصة'],
          featured: true,
        },
      ],
      note: '* الأسعار هنا مبدئية للعرض — عدّلها حسب خطتك التجارية.',
    },
    faq: {
      title: 'الأسئلة الشائعة',
      items: [
        ['ما هو Rotion؟', 'Rotion أداة تصميم حركة تعمل في متصفحك: اختر قالباً، أضف صورك، اضبط بعض الإعدادات، وصدّر فيديو متحركاً. بلا خطوط زمنية أو برامج تصميم — كل شيء يجري على جهازك.'],
        ['هل أحتاج خبرة في التصميم أو التحريك؟', 'لا. ابدأ من قالب جاهز، أضف صورك أو شعارك، اضبط المنزلقات، وصدّر. مصمّم لأي شخص.'],
        ['هل يمكنني التجربة قبل الاشتراك؟', 'نعم. الباقة المجانية تتيح استخدام القوالب الأساسية والتصدير حتى 720p للأبد. رقِّ إلى Pro متى احتجت 8K وإزالة العلامة والخطوط المخصّصة والمزيد.'],
        ['ما المتصفحات والأجهزة المدعومة؟', 'يعمل Rotion في المتصفحات الحديثة (يُفضّل Chrome وEdge) على الحاسوب والجوال. وبما أن التصدير ثقيل، تعمل الدقّات العالية بأفضل شكل على جهاز قوي.'],
        ['هل أحتاج تنزيل أو تثبيت شيء؟', 'لا. يعمل Rotion بالكامل في متصفحك — لا شيء للتثبيت. مشاريعك تُحفظ محلياً وتُستعاد تلقائياً.'],
        ['هل يمكنني إلغاء الاشتراك في أي وقت؟', 'نعم. يمكنك إلغاء Pro في أي وقت ويبقى وصولك حتى نهاية الفترة المدفوعة. راجع سياسة الاسترداد للتفاصيل.'],
      ],
    },
    finalCta: { title: 'جاهز لتحريك تصميمك؟', sub: 'ابدأ الآن مجاناً — بلا تسجيل.', btn: 'افتح الاستوديو' },
    legal: {
      terms: 'شروط الاستخدام',
      privacy: 'سياسة الخصوصية',
      refund: 'سياسة الاسترداد',
      contact: 'تواصل معنا',
    },
    footer: '© 2026 Rotion App — يعمل بالكامل في متصفحك.',
  },
};
