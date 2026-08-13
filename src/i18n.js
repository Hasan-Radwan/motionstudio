// Tiny language-state store + translator shared across the site. Holds the
// current language ('ar' | 'en'), persists it, and notifies subscribers on
// change so the landing page AND the studio can re-render. Arabic is the default.
//
// Translation model: the KEY is the English source string. In English we return
// the key as-is; in Arabic we look it up in AR and fall back to the English key
// when a translation is missing — so untranslated strings degrade gracefully.

const KEY = 'ms-lang';
let lang = localStorage.getItem(KEY) || 'ar';
const listeners = new Set();

export function getLang() {
  return lang;
}
export function isRTL() {
  return lang === 'ar';
}
export function setLang(next) {
  if (next !== 'ar' && next !== 'en') return;
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage may be unavailable */
  }
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn(lang));
}
export function toggleLang() {
  setLang(lang === 'ar' ? 'en' : 'ar');
}
// Subscribe to language changes; returns an unsubscribe function.
export function onLang(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Arabic translations, keyed by the English source string.
const AR = {
  // topbar / chrome
  'Upload image': 'رفع صورة',
  Mockup: 'موك أب',
  'My projects': 'مشاريعي',
  Export: 'تصدير',
  Home: 'الرئيسية',
  'Drop an image anywhere to start.': 'أفلت صورة في أي مكان لتبدأ.',
  loop: 'حلقة',
  image: 'صورة',
  images: 'صور',
  'demo image': 'صورة تجريبية',

  // categories
  '3D & Perspective': 'ثلاثي الأبعاد والمنظور',
  Orbit: 'مدارات',
  'Carousel & Flow': 'كاروسيل وانسياب',
  'Slideshow & Story': 'شرائح وقصة',
  Grid: 'شبكة',
  'Ticker & Marquee': 'شريط متحرك',
  'Spotlight & Focus': 'إبراز وتركيز',
  'Reveal & Wipe': 'كشف ومسح',
  'Stack & Scatter': 'تكديس وتبعثر',
  Isometric: 'آيزومترك',
  'Logo & Branding': 'الشعار والهوية',

  // media panel
  Frame: 'الإطار',
  'Card shape': 'شكل الكارت',
  Media: 'الوسائط',
  'Number of images': 'عدد الصور',
  Image: 'صورة',
  'Click to replace': 'اضغط للاستبدال',
  'Drop or click to add': 'أفلت أو اضغط للإضافة',
  'Remove image': 'إزالة الصورة',

  // shape titles
  Original: 'أصلي',
  Landscape: 'مستطيل بالعرض',
  Portrait: 'مستطيل بالطول',
  Square: 'مربع',
  Circle: 'دائري',
  Triangle: 'مثلث',

  // text panel
  Text: 'النص',
  'Add text': 'أضف نصاً',
  'Remove this text': 'حذف هذا النص',
  'Add text (optional)…': 'أضف نصاً (اختياري)…',
  Font: 'الخط',
  Weight: 'الوزن',
  Colour: 'اللون',
  Align: 'المحاذاة',
  'Position X': 'الموضع أفقياً',
  'Position Y': 'الموضع عمودياً',
  Regular: 'عادي',
  Medium: 'متوسط',
  Semibold: 'شبه عريض',
  Bold: 'عريض',
  Black: 'أسود',
  Left: 'يسار',
  Center: 'وسط',
  Right: 'يمين',
  None: 'بلا',
  'Fade in/out': 'تلاشٍ',
  Rise: 'صعود',
  Pop: 'نطّة',
  Typewriter: 'آلة كاتبة',
  'Auto (detects Arabic)': 'تلقائي (يكتشف العربية)',

  // watermark
  Watermark: 'العلامة المائية',
  'Add logo': 'أضف شعاراً',
  'Show watermark': 'إظهار العلامة',
  Replace: 'استبدال',
  'Remove logo': 'إزالة الشعار',
  Position: 'الزاوية',
  Opacity: 'الشفافية',
  Margin: 'الهامش',
  'Top-left': 'أعلى يسار',
  'Top-right': 'أعلى يمين',
  'Bottom-left': 'أسفل يسار',
  'Bottom-right': 'أسفل يمين',

  // background
  Background: 'الخلفية',
  Solid: 'لون',
  Gradient: 'تدرّج',
  'From / To': 'من / إلى',
  Angle: 'الزاوية',
  Cover: 'ملء',
  Contain: 'احتواء',
  Dim: 'تعتيم',

  // export dialog
  'Export video': 'تصدير فيديو',
  Format: 'الصيغة',
  Aspect: 'الأبعاد',
  Resolution: 'الدقة',
  'Loop duration': 'مدة الحلقة',
  'Render & download': 'إخراج وتنزيل',
  'Rendering…': 'جارٍ الإخراج…',
  'Done ✓ — download again': 'تم ✓ — نزّل مجدداً',
  Retry: 'إعادة المحاولة',
  'Export failed: ': 'فشل التصدير: ',
  'Renders offline frame-by-frame — usually faster than the clip length.':
    'يخرج محلياً إطاراً بإطار — أسرع عادةً من طول المقطع.',
  'WebCodecs not available: exporting in realtime as WebM.':
    'WebCodecs غير متاح: التصدير بالزمن الحقيقي كـWebM.',

  // projects
  'Save current project': 'حفظ المشروع الحالي',
  'No saved projects yet. Save one to reopen it later.':
    'لا مشاريع محفوظة بعد. احفظ واحداً لتفتحه لاحقاً.',
  Open: 'فتح',
  Delete: 'حذف',

  // mockup picker
  'Device mockup': 'موك أب جهاز',
  Browser: 'متصفح',
  Phone: 'هاتف',
  Laptop: 'لابتوب',

  // control labels (templates)
  Corners: 'الزوايا',
  'Card size': 'حجم الكارت',
  Cards: 'البطاقات',
  Gap: 'الفجوة',
  'Frame size': 'حجم الإطار',
  Rows: 'الصفوف',
  Columns: 'الأعمدة',
  Float: 'تعويم',
  'Tile size': 'حجم البلاطة',
  Perspective: 'المنظور',
  'Globe size': 'حجم الكرة',
  Direction: 'الاتجاه',
  'Wave height': 'ارتفاع الموجة',
  Vignette: 'تظليل الحواف',
  Vertical: 'عمودي',
  Spread: 'التوزّع',
  'Slow zoom': 'تكبير بطيء',
  Scatter: 'التبعثر',
  Rotation: 'الدوران',
  Radius: 'نصف القطر',
  'Near size': 'الحجم القريب',
  Horizontal: 'أفقي',
  Glow: 'التوهّج',
  Flatten: 'التسطيح',
  'Edge glow': 'توهّج الحواف',
  Copies: 'النسخ',
  Border: 'الحد',
  Zoom: 'التكبير',
  Wobble: 'التمايل',
  Wave: 'موجة',
  Twist: 'الالتواء',
  Turns: 'اللفّات',
  Tumble: 'التقلّب',
  'Top → Bottom': 'أعلى ← أسفل',
  Tilt: 'الميلان',
  Tiles: 'البلاطات',
  'Thumb size': 'حجم المصغّرة',
  Thickness: 'السماكة',
  Sway: 'التأرجح',
  'Strip height': 'ارتفاع الشريط',
  'Stream count': 'عدد التيار',
  'Streak steps': 'خطوات الأثر',
  Static: 'ثابت',
  'Stack peek': 'إطلالة الكومة',
  Spin: 'الدوران',
  Spacing: 'التباعد',
  Slats: 'الشرائح',
  Size: 'الحجم',
  'Side tilt': 'ميلان جانبي',
  'Side padding': 'حشوة جانبية',
  'Shine sweep': 'كنس اللمعان',
  'Row padding': 'حشوة الصف',
  'Ring size': 'حجم الحلقة',
  'Right → Left': 'يمين ← يسار',
  Reflection: 'الانعكاس',
  Pulse: 'النبض',
  'Pop in': 'ظهور نطّي',
  'Plate corners': 'زوايا اللوح',
  Photos: 'الصور',
  'Photo size': 'حجم الصورة',
  Parallax: 'بارالاكس',
  Panels: 'اللوحات',
  Pan: 'التحريك',
  'Moving glow': 'توهّج متحرّك',
  'Logo size': 'حجم الشعار',
  Letterbox: 'أشرطة سينمائية',
  'Left → Right': 'يسار ← يمين',
  'Ken-Burns': 'كين بيرنز',
  'Ken Burns': 'كين بيرنز',
  'Ken-Burns zoom': 'كين بيرنز',
  'Image size': 'حجم الصورة',
  'Hero size': 'حجم البطل',
  'Frame gap': 'فجوة الإطار',
  'Flips / loop': 'قلبات/حلقة',
  Drift: 'الانجراف',
  Diagonal: 'قُطري',
  Depth: 'العمق',
  Crossfade: 'تلاشٍ متبادل',
  'Center focus': 'تركيز المركز',
  'Bottom → Top': 'أسفل ← أعلى',
  'Blur pulse': 'نبض التمويه',
  'Backing plate': 'لوح خلفي',
  'Axis tilt': 'ميلان المحور',
  'Arc bulge': 'انتفاخ القوس',
  Animation: 'الأنيميشن',

  // account / auth / billing
  Account: 'الحساب',
  'Sign in': 'تسجيل الدخول',
  'Sign out': 'تسجيل الخروج',
  'Create account': 'إنشاء حساب',
  Name: 'الاسم',
  Email: 'البريد الإلكتروني',
  Password: 'كلمة المرور',
  'Local demo accounts — no real server yet.': 'حسابات تجريبية محلية — لا خادم فعلي بعد.',
  or: 'أو',
  'Google sign-in failed. Please try again.': 'فشل تسجيل الدخول بجوجل. حاول مجدداً.',
  'Signed in as': 'مسجّل الدخول كـ',
  Plan: 'الباقة',
  Upgrade: 'ترقية',
  'Choose your plan': 'اختر باقتك',
  Choose: 'اختيار',
  'Current plan': 'باقتك الحالية',
  'Switch to Free': 'التحويل للمجاني',
  Free: 'مجاني',
  '/ mo': '/ شهرياً',
  '/ yr': '/ سنوياً',
  Monthly: 'شهري',
  Yearly: 'سنوي',
  'Secure checkout by Paddle.': 'دفع آمن عبر Paddle.',
  'Demo mode — add your Paddle keys to enable real checkout.':
    'وضع تجريبي — أضِف مفاتيح Paddle لتفعيل الدفع الحقيقي.',
  'Sign in to save projects to your account': 'سجّل الدخول لحفظ المشاريع في حسابك',
  'Upgrade to export in higher quality': 'رقِّ باقتك للتصدير بجودة أعلى',
  'Requires Pro': 'يتطلب Pro',
  // plan features
  'All core templates': 'كل القوالب الأساسية',
  'Export up to 720p': 'تصدير حتى 720p',
  'App watermark': 'علامة التطبيق المائية',
  'Local save': 'حفظ محلي',
  'All templates': 'كل القوالب',
  'Export up to 4K': 'تصدير حتى 4K',
  'Export up to 8K': 'تصدير حتى 8K',
  'No app watermark': 'بدون علامة التطبيق',
  'Your own watermark': 'علامتك المائية الخاصة',
  'Everything in Pro': 'كل مزايا Pro',
  'Multiple seats': 'مقاعد متعددة',
  'Custom templates': 'قوالب مخصّصة',
  'Priority support': 'دعم ذو أولوية',
};

// Translate an English source string for the current language.
export function t(s) {
  if (lang !== 'ar') return s;
  return AR[s] ?? s;
}
