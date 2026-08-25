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
      badge: '✦ Motion design, made effortless',
      title: 'Create scroll-stopping motion videos in seconds',
      sub: 'No design skills, no software, no learning curve. Pick a template, drop in your images, and export a polished looping video up to 8K — right in your browser.',
      ctaPrimary: 'Start free — no signup',
      ctaSecondary: 'See how easy it is',
    },
    stats: [
      ['60+', 'ready-made templates'],
      ['~30s', 'from image to video'],
      ['8K', 'crisp MP4 / WebM export'],
    ],
    about: {
      title: 'The easiest way to animate',
      body: 'Rotion turns a still image or logo into a professional motion video — no timelines, no plugins, no complicated tools. Open the page and you are designing in seconds. Perfect for social posts, ads, and brand content that actually stands out.',
      points: [
        ['🖱️', 'Ridiculously simple', 'Choose, drop, export. Anyone gets a pro-looking video on the first try.'],
        ['⚡', 'Instant results', 'A live preview updates as you tweak, and export is faster than real time.'],
        ['🔒', 'Private by design', 'Everything runs on your device — your images are never uploaded.'],
      ],
    },
    how: {
      title: 'From image to video in 4 easy steps',
      sub: 'No experience needed — really.',
      steps: [
        ['Pick a template', 'Browse 60+ animated templates and preview each one live.'],
        ['Drop your images', 'Drag & drop a photo or logo — that is it.'],
        ['Tweak (optional)', 'Colours, text, background, timing… or just keep the defaults.'],
        ['Export', 'Download a seamless looping MP4 or WebM in any size, up to 8K.'],
      ],
    },
    features: {
      title: 'Powerful results, zero effort',
      items: [
        ['🎬', '60+ animated templates', '3D carousels, kinetic text, spirals, cinematic and more.'],
        ['🖱️', 'Zero learning curve', 'No timeline, no keyframes. If you can drag a file, you can use it.'],
        ['✍️', 'Add custom text', 'Type your own headlines with animated effects — morph, typewriter, gradient, 3D.'],
        ['🎵', 'Add music', 'Drop a soundtrack onto your clip; it is baked into the exported video.'],
        ['🖼️', 'Your backgrounds', 'Solid colour, gradient, or your own image behind any template.'],
        ['⚡', 'Up to 8K export', 'Crisp MP4 / WebM, seamless loops, in any aspect ratio.'],
      ],
    },
    pricing: {
      title: 'Plans for everyone',
      sub: 'Start free, upgrade when you need more',
      perMonth: '/ mo',
      perYear: '/ yr',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlySave: 'Save 17%',
      popular: 'Most popular',
      cta: 'Get started',
      // When true, the Pro price is replaced at runtime with the real localized
      // price from Paddle. Off here so the fixed $10 / $99 below are shown — keep
      // your Paddle prices in sync with these.
      showLivePrice: false,
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
          price: '10',
          priceYearly: '99',
          desc: 'For creators & designers',
          features: ['All templates', 'Export up to 8K', 'No app watermark', 'Your own watermark', 'Custom font upload'],
          featured: true,
        },
      ],
      note: '* Billed securely via Paddle. Cancel anytime.',
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
      badge: '✦ تصميم موشن بلا تعقيد',
      title: 'اصنع فيديوهات متحركة تلفت الأنظار في ثوانٍ',
      sub: 'بلا خبرة تصميم، بلا برامج، بلا منحنى تعلّم. اختر قالباً، أفلت صورك، وصدّر فيديو حلقة أنيقاً بجودة تصل إلى 8K — كل ذلك داخل متصفحك.',
      ctaPrimary: 'ابدأ مجاناً — بلا تسجيل',
      ctaSecondary: 'شاهد كم هو سهل',
    },
    stats: [
      ['+60', 'قالب جاهز'],
      ['~30ث', 'من الصورة إلى الفيديو'],
      ['8K', 'تصدير MP4 / WebM عالي الوضوح'],
    ],
    about: {
      title: 'أسهل طريقة لتحريك تصاميمك',
      body: 'يحوّل Rotion صورةً ثابتة أو شعاراً إلى فيديو متحرك احترافي — بلا خطوط زمنية، ولا إضافات، ولا أدوات معقّدة. افتح الصفحة وابدأ التصميم خلال ثوانٍ. مثالي لمنشورات السوشيال والإعلانات ومحتوى العلامة الذي يلفت النظر فعلاً.',
      points: [
        ['🖱️', 'بسيط لأبعد حد', 'اختر، أفلت، صدّر. أي شخص يحصل على فيديو احترافي من أول محاولة.'],
        ['⚡', 'نتائج فورية', 'معاينة حيّة تتحدّث أثناء التعديل، وتصدير أسرع من الزمن الحقيقي.'],
        ['🔒', 'خصوصية بالتصميم', 'كل شيء يجري على جهازك؛ صورك لا تُرفَع أبداً.'],
      ],
    },
    how: {
      title: 'من الصورة إلى الفيديو في 4 خطوات سهلة',
      sub: 'لا تحتاج أي خبرة — حقاً.',
      steps: [
        ['اختر قالباً', 'تصفّح أكثر من 60 قالباً متحركاً، وعاين كلّاً منها حيّاً.'],
        ['أفلت صورك', 'اسحب وأفلت صورة أو شعاراً — وهذا كل شيء.'],
        ['عدّل (اختياري)', 'ألوان، نصوص، خلفية، توقيت… أو اترك الإعدادات الافتراضية.'],
        ['صدّر', 'نزّل فيديو حلقة سلساً MP4 أو WebM بأي مقاس، حتى 8K.'],
      ],
    },
    features: {
      title: 'نتائج قوية بلا أي جهد',
      items: [
        ['🎬', '+60 قالب متحرك', 'كاروسيلات ثلاثية الأبعاد، نصوص حركية، حلزونات، سينمائي والمزيد.'],
        ['🖱️', 'بلا منحنى تعلّم', 'لا خطوط زمنية ولا مفاتيح حركة. إن كنت تسحب ملفاً فأنت تُتقنه.'],
        ['✍️', 'أضف نصاً مخصّصاً', 'اكتب عناوينك الخاصة بتأثيرات متحركة — تحوّل، آلة كاتبة، تدرّج، وثلاثي الأبعاد.'],
        ['🎵', 'أضف موسيقى', 'أضف مقطعاً صوتياً إلى الفيديو، ويُدمَج تلقائياً في التصدير.'],
        ['🖼️', 'خلفياتك الخاصة', 'لون، تدرّج، أو صورتك الخاصة خلف أي قالب.'],
        ['⚡', 'تصدير حتى 8K', 'MP4 / WebM واضح، حلقات سلسة، بأي نسبة أبعاد.'],
      ],
    },
    pricing: {
      title: 'خطط تناسب الجميع',
      sub: 'ابدأ مجاناً، وطوّر متى احتجت المزيد',
      perMonth: '/ شهرياً',
      perYear: '/ سنوياً',
      monthly: 'شهري',
      yearly: 'سنوي',
      yearlySave: 'وفّر 17%',
      popular: 'الأكثر رواجاً',
      cta: 'ابدأ الآن',
      showLivePrice: false,
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
          price: '10',
          priceYearly: '99',
          desc: 'لصنّاع المحتوى والمصممين',
          features: ['كل القوالب', 'تصدير حتى 8K', 'بدون علامة مائية', 'علامتك المائية الخاصة', 'رفع خطوط مخصّصة'],
          featured: true,
        },
      ],
      note: '* الدفع بأمان عبر Paddle. يمكنك الإلغاء في أي وقت.',
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
