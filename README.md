# AI Extensions RTL Support

<div align="center">

**إضافة VS Code لدعم الكتابة العربية (RTL) تلقائيًا في Claude Code و Codex و Copilot Chat**

A VS Code extension that automatically injects RTL (Right-to-Left) CSS into AI extension webviews, enabling proper Arabic and other RTL language rendering.

[![Version](https://img.shields.io/github/v/release/beingmomen/claude-code-rtl-injector)](https://github.com/beingmomen/claude-code-rtl-injector/releases)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.94.0-blue)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/beingmomen/claude-code-rtl-injector/total)](https://github.com/beingmomen/claude-code-rtl-injector/releases)

</div>

---

## الامتدادات المدعومة | Supported Extensions

| الامتداد | المعرف | طريقة الحقن |
|---------|--------|------------|
| **Claude Code** | `anthropic.claude-code` | CSS + hash remapping + JS observer |
| **Codex (ChatGPT)** | `openai.chatgpt` | CSS مباشر بـ attribute selectors |
| **GitHub Copilot Chat** | `github.copilot-chat` | Shadow DOM JS عبر `adoptedStyleSheets` |

---

## المشكلة | The Problem

امتدادات الذكاء الاصطناعي في VS Code لا تدعم اللغة العربية بشكل صحيح في واجهات الـ webview. النصوص العربية تظهر بشكل خاطئ — الاتجاه غلط والمحاذاة مش مظبوطة.

**التحدي الإضافي لـ Claude Code:** يستخدم CSS Modules بـ hashes عشوائية تتغير مع كل تحديث:
```
userMessage_07S1Yg  →  يتغير لـ  userMessage_xY9kLm
```

---

## الحل | The Solution

هذه الإضافة تعمل كل ذلك تلقائيًا:

- **تكتشف** الامتدادات المدعومة المثبتة لديك
- **تحقن** CSS أو JS الخاص بدعم RTL حسب كل امتداد
- **تتابع** التحديثات وتعيد الحقن تلقائيًا
- **تُصلح** أسماء CSS classes المتغيرة في Claude Code (Hash Auto-Fix)
- **تحفظ** نسخة احتياطية من الملفات الأصلية

---

## التثبيت | Installation

### الطريقة 1: من GitHub Releases (الأسهل)

1. اذهب لصفحة [Releases](https://github.com/beingmomen/claude-code-rtl-injector/releases)
2. حمّل ملف `ai-extensions-rtl-support-0.7.0.vsix`
3. ثبته:

**من سطر الأوامر:**
```bash
code --install-extension ai-extensions-rtl-support-0.7.0.vsix
```

**من داخل VS Code:**
- `Ctrl+Shift+P` → `Extensions: Install from VSIX...` → اختر الملف

4. أعد تشغيل VS Code — الإضافة ستعمل تلقائيًا

---

### الطريقة 2: البناء من المصدر

```bash
git clone https://github.com/beingmomen/claude-code-rtl-injector.git
cd claude-code-rtl-injector
npm install
npm run compile
npm run package
```

سيُنشئ ملف `ai-extensions-rtl-support-0.7.0.vsix` في نفس المجلد.

---

### الطريقة 3: وضع التطوير (F5)

```bash
git clone https://github.com/beingmomen/claude-code-rtl-injector.git
cd claude-code-rtl-injector
npm install
npm run compile
```

افتح المجلد في VS Code واضغط **F5** لتشغيل Extension Development Host.

---

## الاستخدام | Usage

### الحقن التلقائي

**لا تحتاج لفعل أي شيءrun compile 2>&1 && npm run package 2>&1* عند فتح VS Code:

1. الإضافة تكتشف الامتدادات المدعومة المثبتة
2. تحقن دعم RTL لكل امتداد مكتشف
3. تظهر notification: `"AI Extensions RTL: Injected into Claude Code, Codex. Reload to apply."`
4. اضغط **"Reload Now"**

عند تحديث أي امتداد مدعوم، تعيد الحقن تلقائيًا.

---

### الأوامر | Commands

افتح Command Palette بـ `Ctrl+Shift+P`:

#### `AI Extensions RTL: Inject CSS Now`
حقن يدوي — يُجبر إعادة الحقن لكل الامتدادات المكتشفة. مفيد بعد تعديل ملفات CSS.

#### `AI Extensions RTL: Remove Injected CSS`
إزالة كل CSS/JS المحقون واستعادة الملفات الأصلية.

#### `AI Extensions RTL: Check Status`
يعرض حالة الحقن لكل امتداد، مثل:
```
Claude Code v2.1.96: CSS ✓, JS ✓
Codex v26.325.31654: CSS ✓
Copilot Chat v0.42.3: Shadow DOM JS ✓
```

---

## كيف تعمل | How It Works

### Claude Code — CSS + Hash Remapping

Claude Code يستخدم CSS Modules بـ hashes تتغير مع كل تحديث:

```
.userMessage_07S1Yg  →  .userMessage_xY9kLm
```

الإضافة:
1. تقرأ `webview/index.css` الحالي وتستخرج الـ hashes الحالية
2. تستبدل الـ hashes القديمة في template الـ CSS بالجديدة
3. تحقن CSS محاط بـ markers + JS observer لضبط `dir="auto"`

```css
/* === RTL_INJECTOR_START === */
/* Injected by AI Extensions RTL Support (target: Claude Code) */
... RTL CSS rules with current hashes ...
/* === RTL_INJECTOR_END === */
```

### Codex — Direct CSS Injection

Codex لا يستخدم CSS Modules، لذا تحقن الإضافة CSS مباشراً بـ attribute selectors:

```css
[class*="message-"] {
  unicode-bidi: plaintext !important;
}
```

يستهدف ملف `webview/assets/index-*.css` (يُكتشف بـ glob pattern).

### Copilot Chat — Shadow DOM JS Injection

Copilot Chat يستخدم FAST framework مع Shadow DOM (`mode: "open"`) و`adoptedStyleSheets`. لا يمكن إضافة CSS خارجي لـ Shadow DOM مباشرةً.

الإضافة تحقن JS في `dist/suggestionsPanelWebview.js` يقوم بـ:
1. إنشاء `CSSStyleSheet` وتحميل قواعد RTL فيه
2. إضافته لكل `shadowRoot` مكتشَف عبر `adoptedStyleSheets`
3. مراقبة DOM عبر `MutationObserver` لاكتشاف shadow roots جديدة

```js
var sheet = new CSSStyleSheet();
sheet.replaceSync('*, *::before, *::after { unicode-bidi: plaintext !important; }');
root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
```

---

## هيكل المشروع | Project Structure

```
ai-extensions-rtl-support/
│
├── package.json              ← Extension manifest و metadata
├── tsconfig.json             ← إعدادات TypeScript compiler
│
├── src/                      ← الكود المصدري (TypeScript)
│   ├── extension.ts          ← نقطة الدخول: أوامر + auto-inject
│   ├── detector.ts           ← اكتشاف الامتدادات + استخراج الـ hashes
│   ├── injector.ts           ← منطق الحقن (CSS + JS + Shadow DOM)
│   └── constants.ts          ← TARGET_EXTENSIONS + ثوابت + أنواع
│
├── css/                      ← قوالب CSS
│   ├── rtl-support.css       ← Template للـ RTL CSS (Claude Code)
│   └── rtl-chatgpt.css       ← Template للـ RTL CSS (Codex)
│
├── js/                       ← قوالب JS
│   ├── rtl-observer.js       ← MutationObserver لـ dir="auto" (Claude Code)
│   └── rtl-shadow-dom.js     ← Shadow DOM patcher (Copilot Chat)
│
└── out/                      ← JavaScript مجمع (يتولد تلقائيًا)
```

---

## إضافة امتداد جديد | Adding a New Extension

لدعم امتداد جديد، أضف entry واحدة في `src/constants.ts`:

```typescript
// CSS injection (standard)
{
  id: 'publisher.extension-name',
  displayName: 'My Extension',
  webviewCssPath: 'webview/index.css',
  classNameBases: [],       // أضف class bases لو في hash remapping
  cssTplFile: 'rtl-new.css',
}

// Shadow DOM JS injection
{
  id: 'publisher.extension-name',
  displayName: 'My Extension',
  injectionMode: 'shadow-dom-js',
  webviewJsPath: 'dist/webview.js',
  classNameBases: [],
  cssTplFile: '',
}
```

---

## استكشاف الأخطاء | Troubleshooting

### الإضافة لا تكتشف امتدادًا مثبتاً
- تأكد أن الامتداد مفعَّل
- شغل: `AI Extensions RTL: Check Status`
- جرب: `AI Extensions RTL: Inject CSS Now`

### النصوص لا تزال LTR بعد الحقن
- تأكد من الضغط على **Reload Now** بعد الحقن
- أو يدويًا: `Ctrl+Shift+P` → `Developer: Reload Window`

### خطأ في الصلاحيات
```bash
chmod 644 ~/.vscode/extensions/anthropic.claude-code-*/webview/index.css
```

### الرجوع للملفات الأصلية
```bash
cp ~/.vscode/extensions/anthropic.claude-code-*/webview/index.css.rtl-backup \
   ~/.vscode/extensions/anthropic.claude-code-*/webview/index.css
```

أو استخدم: `AI Extensions RTL: Remove Injected CSS`

### Copilot Chat — لا يظهر تأثير في نافذة المحادثة الرئيسية
متوقع. نافذة المحادثة الرئيسية تُعرض بـ VS Code core مباشرةً وليس webview منفصل. الحقن يؤثر على `suggestionsPanelWebview` (واجهة اقتراحات الكود الداخلية).

---

## الأسئلة الشائعة | FAQ

**هل تعمل مع كل لغات RTL؟**
نعم — `unicode-bidi: plaintext` يدعم العربية والعبرية والفارسية والأردية وكل لغات RTL.

**هل تؤثر على الأداء؟**
لا — تعمل مرة واحدة عند فتح VS Code ومرة عند تحديث الامتدادات. لا processes في الخلفية.

**ماذا يحدث إذا لم يكن أي امتداد مدعوم مثبتاً؟**
تسكت الإضافة تمامًا ولا تعرض أي رسائل.

**هل أحتاج Reload بعد كل حقن؟**
نعم — webview يُحمَّل مرة واحدة عند فتحه، والـ Reload يجبره على إعادة تحميل الملفات المعدَّلة.

---

## أوامر البناء | Build Commands

| الأمر | الوصف |
|-------|-------|
| `npm install` | تثبيت الـ dependencies |
| `npm run compile` | TypeScript → JavaScript |
| `npm run watch` | بناء تلقائي عند الحفظ |
| `npm run package` | إنشاء ملف VSIX |
| `npm run test` | تشغيل الاختبارات |

---

## المساهمة | Contributing

1. Fork المشروع
2. `git checkout -b feature/new-feature`
3. اعمل تعديلاتك
4. `npm run compile && npm test`
5. `git commit -m 'Add new feature'`
6. `git push origin feature/new-feature`
7. افتح Pull Request

---

## الرخصة | License

MIT License — حر تستخدمه وتعدل عليه وتوزعه.

---

## الكاتب | Author

**Abdelmomen Elshatory** ([@beingmomen](https://github.com/beingmomen))
