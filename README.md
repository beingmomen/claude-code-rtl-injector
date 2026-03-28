# Claude Code RTL Support

<div align="center">

**اضافة VS Code لدعم الكتابة العربية (RTL) تلقائيًا في Claude Code Extension**

A VS Code extension that automatically injects RTL (Right-to-Left) CSS into the Claude Code extension's webview, enabling proper Arabic and other RTL language rendering.

[![Version](https://img.shields.io/github/v/release/beingmomen/claude-code-rtl-injector)](https://github.com/beingmomen/claude-code-rtl-injector/releases)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.94.0-blue)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/beingmomen/claude-code-rtl-injector/total)](https://github.com/beingmomen/claude-code-rtl-injector/releases)

</div>

---

## المشكلة | The Problem

Claude Code extension من Anthropic لا تدعم اللغة العربية بشكل صحيح في واجهة الـ webview الخاصة بها. النصوص العربية تظهر بشكل خاطئ - الاتجاه غلط والمحاذاة مش مظبوطة.

الحل اليدوي كان إنك تفتح ملف `webview/index.css` الخاص بـ Claude Code وتضيف CSS في آخره. لكن المشكلة إن كل ما Claude Code يتحدث لإصدار جديد:

1. اسم فولدر الـ extension بيتغير (لأن رقم الإصدار جزء من اسم الفولدر)
2. الـ CSS اللي ضفته بيتمسح لأن الملف بيتاستبدل بالكامل
3. أسماء الـ CSS classes بتتغير (لأنها hashed CSS modules)

**النتيجة:** لازم تعيد العملية يدويًا كل مرة وتعدل أسماء الـ classes كمان!

---

## الحل | The Solution

هذه الـ Extension بتعمل كل ده تلقائيًا:

- تلاقي مسار Claude Code Extension ديناميكيًا (بغض النظر عن الإصدار)
- تحقن CSS الـ RTL في آخر ملف الـ webview
- تكتشف تحديثات Claude Code وتعيد الحقن تلقائيًا
- تعدل أسماء الـ CSS classes المتغيرة تلقائيًا (Hash Auto-Fix)
- تحفظ نسخة احتياطية من الملف الأصلي

---

## المتطلبات | Prerequisites

| المتطلب | التفاصيل |
|---------|----------|
| VS Code | الإصدار 1.94.0 أو أحدث |
| Claude Code Extension | مثبتة من Anthropic (`anthropic.claude-code`) |
| Node.js | الإصدار 18 أو أحدث (للبناء من المصدر فقط) |
| npm | يأتي مع Node.js (للبناء من المصدر فقط) |

---

## التثبيت | Installation

### الطريقة 1: التحميل من GitHub Releases (الأسهل | Easiest)

1. اذهب لصفحة [Releases](https://github.com/beingmomen/claude-code-rtl-injector/releases)
2. حمّل ملف `.vsix` من آخر إصدار
3. ثبته بإحدى الطريقتين:

**الطريقة A: من سطر الأوامر**
```bash
code --install-extension claude-code-rtl-injector-0.3.0.vsix
```

**الطريقة B: من داخل VS Code**
1. افتح VS Code
2. اضغط `Ctrl+Shift+P` لفتح Command Palette
3. اكتب `Extensions: Install from VSIX...`
4. اختار ملف `.vsix` اللي حملته
5. اضغط Install
6. اعمل Reload لـ VS Code

---

### الطريقة 2: البناء من المصدر (Build from Source)

```bash
# انسخ المشروع
git clone https://github.com/beingmomen/claude-code-rtl-injector.git
cd claude-code-rtl-injector

# ثبت الـ dependencies
npm install

# ابني المشروع
npm run compile

# اعمل ملف VSIX
npm run package
```

هيتعمل ملف `claude-code-rtl-injector-0.3.0.vsix` في نفس المجلد. ثبته بنفس الخطوات في الطريقة 1.

---

### الطريقة 3: التشغيل في وضع التطوير (Development Mode)

هذه الطريقة مفيدة لو عايز تجرب أو تعدل الكود:

```bash
# انسخ المشروع
git clone https://github.com/beingmomen/claude-code-rtl-injector.git
cd claude-code-rtl-injector

# ثبت الـ dependencies
npm install

# ابني المشروع
npm run compile
```

بعدين:
1. افتح المجلد في VS Code
2. اضغط `F5` (أو من القائمة: Run → Start Debugging)
3. هيفتح نافذة VS Code جديدة (Extension Development Host)
4. الـ Extension هتشتغل تلقائيًا في النافذة الجديدة

---

## الاستخدام | Usage

### الحقن التلقائي (Automatic Injection)

**مش محتاج تعمل حاجة!** الـ Extension بتشتغل تلقائيًا:

1. لما VS Code يفتح → الـ Extension بتتفعل بعد ما VS Code يخلص تحميل
2. بتدور على Claude Code Extension تلقائيًا
3. لو لقيتها → بتحقن CSS الـ RTL
4. بتعرض notification: `"Claude Code RTL: CSS injected for vX.X.X. Reload to apply."`
5. اضغط **"Reload Now"** عشان التغييرات تتطبق

لما Claude Code يتحدث:
1. الـ Extension بتاخد بالها من التحديث تلقائيًا (عن طريق `vscode.extensions.onDidChange`)
2. بتحقن CSS الـ RTL من جديد في الإصدار الجديد
3. بتعدل أسماء الـ CSS classes لو اتغيرت
4. بتعرض notification تاني عشان تعمل Reload

---

### الأوامر (Commands)

افتح Command Palette بـ `Ctrl+Shift+P` واكتب أي من الأوامر التالية:

#### 1. `Claude Code RTL: Inject CSS Now`

حقن يدوي لـ CSS الـ RTL. مفيد في الحالات التالية:
- لو الحقن التلقائي مشتغلش لسبب ما
- لو عدلت ملف `css/rtl-support.css` وعايز تطبق التعديلات
- لو حذفت الحقن وعايز ترجعه

**اللي بيحصل:**
1. بيدور على Claude Code Extension
2. لو مش موجودة → رسالة تحذير: `"Claude Code extension not found. Please install it first."`
3. لو موجودة → بيقرأ الـ CSS الحالي ويستخرج الـ hashes
4. بيحقن الـ RTL CSS مع تعديل الـ hashes
5. بيعرض notification بالنتيجة مع زر "Reload Now"

#### 2. `Claude Code RTL: Remove Injected CSS`

إزالة CSS الـ RTL المحقون. مفيد لو:
- عايز ترجع Claude Code لحالته الأصلية
- بتعمل troubleshooting لمشكلة ما
- مش محتاج الدعم العربي حاليًا

**اللي بيحصل:**
1. بيدور على Claude Code Extension
2. بيشيك لو في CSS محقون (بيدور على الـ markers)
3. لو مفيش → رسالة: `"No injected RTL CSS found."`
4. لو في → بيشيل كل حاجة بين الـ markers
5. بيعرض notification مع زر "Reload Now"

#### 3. `Claude Code RTL: Check Status`

فحص حالة الحقن. بيعرض معلومات عن:
- هل Claude Code مثبتة ولا لأ
- رقم إصدار Claude Code الحالي
- هل CSS الـ RTL محقون ولا لأ
- هل الإصدار اتغير من آخر حقن

**أمثلة على الرسائل:**
- `"Claude Code RTL Status: RTL CSS is injected. Claude Code v2.1.72."`
- `"Claude Code RTL Status: RTL CSS is NOT injected. Claude Code v2.1.72."`
- `"Claude Code RTL Status: RTL CSS is injected. Claude Code v2.2.0. (version changed since last injection!)"`
- `"Claude Code RTL Status: Claude Code extension not found."`

---

## كيف تشتغل الـ Extension | How It Works

### 1. اكتشاف Claude Code (Detection)

الـ Extension بتستخدم VS Code API الرسمي:
```typescript
vscode.extensions.getExtension('anthropic.claude-code')
```

هذا الـ API بيرجع:
- **مسار الـ extension** على الجهاز (بغض النظر عن رقم الإصدار أو نظام التشغيل)
- **معلومات الإصدار** من `package.json`

فمش محتاج تعرف اسم الفولدر الكامل زي `anthropic.claude-code-2.1.72-linux-x64` - الـ API بيتعامل مع كل ده تلقائيًا.

### 2. استخراج الـ Hashes (Hash Extraction)

Claude Code بيستخدم CSS Modules اللي بتضيف hash عشوائي لأسماء الـ classes:
```
userMessage_07S1Yg    ← "07S1Yg" هو الـ hash
root_-a7MRw           ← "-a7MRw" هو الـ hash
messageInput_cKsPxg   ← "cKsPxg" هو الـ hash
```

هذه الـ hashes بتتغير مع كل إصدار جديد. الـ Extension بتقرأ ملف `index.css` الحالي بتاع Claude Code وبتستخرج الـ hashes الحالية لكل class باستخدام regex:
```
\.userMessage_([a-zA-Z0-9_-]+)   →  يستخرج الـ hash الحالي
```

### 3. إعادة تعيين الـ Hashes (Hash Remapping)

الـ Extension عندها template CSS فيه hashes قديمة. قبل الحقن، بتستبدل كل hash قديم بالـ hash الحالي:

```
قبل: .userMessage_07S1Yg    →  بعد: .userMessage_xY9kLm
قبل: .root_-a7MRw           →  بعد: .root_pQ3nRs
```

لو class معين مش موجود في الإصدار الجديد (يعني Claude Code غيره أو شاله)، الـ Extension بتسيبه وبتحذرك.

### 4. الحقن (Injection)

الـ CSS المحقون بيكون محاط بـ markers عشان الـ Extension تقدر تتعرف عليه بعدين:

```css
/* === RTL_INJECTOR_START === */
/* Injected by Claude Code RTL Support extension */
/* Do not edit manually - this block is managed automatically */

... RTL CSS rules ...

/* === RTL_INJECTOR_END === */
```

### 5. النسخ الاحتياطي (Backup)

أول مرة الـ Extension تعدل على ملف CSS، بتحفظ نسخة احتياطية:
```
webview/index.css           ← الملف المعدل
webview/index.css.rtl-backup ← النسخة الأصلية
```

النسخة الاحتياطية بتتعمل مرة واحدة بس ومش بتتكتب عليها تاني.

### 6. إزالة الحقن اليدوي القديم

لو كنت بتحقن CSS يدويًا قبل كده باستخدام comment:
```css
/* === RTL / Arabic Support === */
```

الـ Extension هتكتشفه وتشيله تلقائيًا قبل ما تحقن النسخة الجديدة، عشان ميبقاش في CSS مكرر.

---

## هيكل المشروع | Project Structure

```
claude-code-rtl-injector/
│
├── package.json              ← Extension manifest و metadata
├── tsconfig.json             ← إعدادات TypeScript compiler
├── .vscodeignore             ← ملفات مستثناة من الـ VSIX package
│
├── src/                      ← الكود المصدري (TypeScript)
│   ├── extension.ts          ← نقطة الدخول الرئيسية
│   ├── detector.ts           ← اكتشاف Claude Code واستخراج الـ hashes
│   ├── injector.ts           ← منطق الحقن والإزالة
│   └── constants.ts          ← الثوابت والإعدادات
│
├── css/                      ← ملفات CSS
│   └── rtl-support.css       ← Template الـ RTL CSS
│
├── out/                      ← الكود المجمع (JavaScript) - يتولد تلقائيًا
│   ├── extension.js
│   ├── detector.js
│   ├── injector.js
│   └── constants.js
│
└── node_modules/             ← Dependencies - يتولد بـ npm install
```

### شرح الملفات بالتفصيل

#### `src/constants.ts`
يحتوي على كل الثوابت:
- **`CLAUDE_EXTENSION_ID`**: معرف Claude Code Extension (`anthropic.claude-code`)
- **`WEBVIEW_CSS_PATH`**: المسار النسبي لملف CSS (`webview/index.css`)
- **`MARKER_START` / `MARKER_END`**: علامات بداية ونهاية CSS المحقون
- **`OLD_MANUAL_MARKER`**: علامة الحقن اليدوي القديم (للتنظيف)
- **`STATE_KEY_VERSION`**: مفتاح تخزين رقم الإصدار في globalState
- **`CLASS_NAME_BASES`**: قائمة بأسماء الـ CSS classes بدون الـ hash (23 class)

#### `src/detector.ts`
مسؤول عن:
- **`detectClaudeCode()`**: يستخدم `vscode.extensions.getExtension()` للحصول على مسار Claude Code وإصدارها
- **`hasVersionChanged()`**: يقارن الإصدار المخزن في `globalState` بالإصدار الحالي
- **`saveVersion()`**: يحفظ رقم الإصدار بعد كل حقن ناجح
- **`extractCurrentHashes()`**: يقرأ CSS بتاع Claude Code ويبني خريطة `{baseName: hash}`

#### `src/injector.ts`
مسؤول عن:
- **`injectRtlCss()`**: العملية الكاملة للحقن (backup → قراءة → تنظيف → remap → حقن → كتابة)
- **`removeRtlCss()`**: إزالة CSS المحقون بين الـ markers
- **`remapHashes()`**: استبدال hashes القديمة في الـ template بالحالية
- **`isAlreadyInjected()`**: فحص هل CSS محقون أم لا
- **`readRtlTemplate()`**: قراءة template الـ RTL CSS المرفق مع الـ extension

#### `src/extension.ts`
نقطة الدخول الرئيسية:
- **`activate()`**: تسجيل الأوامر + الحقن التلقائي + listener لتغييرات الـ extensions
- **`autoInject()`**: الحقن التلقائي (يشتغل عند التفعيل وعند تغيير أي extension)
- **`manualInject()`**: handler لأمر الحقن اليدوي
- **`manualRemove()`**: handler لأمر الإزالة
- **`checkStatus()`**: handler لأمر فحص الحالة

#### `css/rtl-support.css`
Template الـ CSS اللي بيتحقن. يحتوي على rules لـ:
- رسائل المستخدم (User messages)
- ردود المساعد بـ Markdown (Assistant responses)
- حقل الإدخال (Chat input)
- رسائل الـ Timeline والأدوات
- طلبات الصلاحيات (Permission requests)
- قائمة المهام (Todo list)
- نتائج الـ Slash commands
- رسائل الأخطاء والمعلومات
- واجهة الأسئلة والأجوبة
- أسماء الجلسات
- **أكواد البرمجة تبقى LTR دائمًا** (لأن الكود يُكتب من اليسار لليمين)

---

## العناصر المدعومة بالتفصيل | Supported Elements

| العنصر | CSS Class Base | الوصف |
|--------|---------------|-------|
| رسائل المستخدم | `userMessage` | النصوص اللي بتكتبها أنت |
| ردود المساعد | `root` | كل محتوى رد Claude (فقرات، قوائم، جداول، عناوين) |
| حقل الإدخال | `messageInput` | المكان اللي بتكتب فيه رسالتك |
| رسائل الـ Timeline | `timelineMessage` | رسائل التقدم والأدوات |
| محتوى التقدم | `progressContent` | تفاصيل خطوات التنفيذ |
| محتوى طلب الصلاحية | `permissionRequestContent` | نص طلب الصلاحية |
| وصف طلب الصلاحية | `permissionRequestDescription` | شرح ليه الصلاحية مطلوبة |
| عنوان طلب الصلاحية | `permissionRequestHeader` | عنوان طلب الصلاحية |
| محتوى المهام | `content` | عناصر قائمة المهام (Todo) |
| نتائج الأوامر | `slashCommandResultMessage` | نتائج الـ slash commands |
| رسائل الأخطاء | `errorMessage` | رسائل الخطأ |
| رسائل المعلومات | `metaMessage` | رسائل معلوماتية |
| رسائل المقاطعة | `interruptedMessage` | لما توقف Claude أثناء الرد |
| نص السؤال | `questionText` | أسئلة Claude ليك |
| نص الإجابة | `answerText` | إجاباتك على أسئلة Claude |
| سؤال كبير | `questionTextLarge` | أسئلة بخط أكبر |
| عنوان الخيار | `optionLabel` | عنوان كل خيار في الأسئلة |
| وصف الخيار | `optionDescription` | شرح كل خيار |
| اسم الجلسة (القائمة) | `sessionName` | أسماء الجلسات في القائمة الجانبية |
| زر الجلسات | `sessionsButtonText` | نص زر الجلسات |
| محتوى زر الجلسات | `sessionsButtonContent` | محتوى زر الجلسات |
| أوامر Bash | `bashCommand` | أوامر الـ terminal (تبقى LTR) |
| محتوى الأدوات | `toolBodyRowContent` | محتوى نتائج الأدوات (الأكواد تبقى LTR) |

---

## تعديل CSS الـ RTL | Customizing the RTL CSS

لو عايز تعدل أو تضيف rules جديدة:

### الخطوة 1: عدل ملف الـ Template

```bash
# افتح ملف الـ template
code css/rtl-support.css
```

عدل أو ضيف أي CSS rules تحتاجها. مثلًا لو عايز تضيف دعم لعنصر جديد:

```css
/* New element support */
.newElement_HASH,
.newElement_HASH * {
  unicode-bidi: plaintext;
  text-align: start;
}
```

### الخطوة 2: حدث قائمة الـ Class Names

لو ضفت class جديد، لازم تضيف الـ base name بتاعه في `src/constants.ts`:

```typescript
export const CLASS_NAME_BASES = [
  // ... الموجودين
  'newElement',  // ← ضيف الجديد هنا
];
```

### الخطوة 3: أعد البناء والحقن

```bash
# أعد البناء
npm run compile

# بعدين من VS Code، شغل الأمر:
# Ctrl+Shift+P → "Claude Code RTL: Inject CSS Now"
```

---

## استكشاف الأخطاء | Troubleshooting

### المشكلة: "Claude Code extension not found"

**السبب:** Claude Code مش مثبتة أو مثبتة باسم مختلف.

**الحل:**
1. تأكد إن Claude Code مثبتة من VS Code Marketplace
2. ابحث عنها في Extensions panel بـ `anthropic.claude-code`
3. لو مثبتة بس مش شغالة، جرب Reload Window

### المشكلة: الحقن نجح بس النصوص لسه مش عربي

**السبب:** لازم تعمل Reload لـ VS Code بعد الحقن.

**الحل:**
1. اضغط `Ctrl+Shift+P`
2. اكتب `Developer: Reload Window`
3. اضغط Enter

### المشكلة: بعض العناصر مش متأثرة بالـ RTL

**السبب:** أسماء الـ CSS classes اتغيرت بالكامل (مش بس الـ hash).

**الحل:**
1. شغل أمر `Claude Code RTL: Check Status` وشوف لو في تحذير
2. افتح Claude Code DevTools:
   - `Ctrl+Shift+P` → `Developer: Toggle Developer Tools`
   - Inspect العنصر المشكلة وشوف اسم الـ class الجديد
3. حدث `css/rtl-support.css` و `src/constants.ts` بالأسماء الجديدة
4. أعد البناء والحقن

### المشكلة: خطأ في الصلاحيات (Permission Error)

**السبب:** ملف CSS بتاع Claude Code ممكن يكون read-only.

**الحل:**
```bash
# غير صلاحيات ملف الـ CSS
chmod 644 ~/.vscode/extensions/anthropic.claude-code-*/webview/index.css
```

### المشكلة: عايز أرجع للملف الأصلي

**الحل:**
```bash
# الـ Extension بتعمل backup تلقائي، انسخ الـ backup فوق الأصلي
cp ~/.vscode/extensions/anthropic.claude-code-*/webview/index.css.rtl-backup \
   ~/.vscode/extensions/anthropic.claude-code-*/webview/index.css
```

أو استخدم الأمر: `Claude Code RTL: Remove Injected CSS`

---

## الأسئلة الشائعة | FAQ

### هل الـ Extension بتشتغل مع كل إصدارات Claude Code؟
نعم، طالما Claude Code عندها مجلد `webview/index.css`. لو Claude Code غيرت هيكل الملفات بالكامل، ممكن تحتاج تحديث.

### هل الـ Extension بتأثر على أداء VS Code؟
لا، الـ Extension بتشتغل مرة واحدة عند فتح VS Code (بعد التحميل الكامل) ومرة تانية لو Extensions اتغيرت. مفيش processes في الـ background.

### هل ممكن أستخدمها مع لغات RTL تانية غير العربية؟
أيوه! الـ CSS بيستخدم `unicode-bidi: plaintext` و `text-align: start` اللي بيدعموا كل لغات RTL (العربية، العبرية، الفارسية، الأردية، إلخ).

### هل الـ Extension بتعدل على أي ملفات تانية؟
لا، الـ Extension بتعدل على ملف واحد فقط: `webview/index.css` الخاص بـ Claude Code. وبتحفظ نسخة احتياطية قبل أي تعديل.

### هل لازم أعمل Reload بعد كل حقن؟
نعم، لأن VS Code بتحمل CSS الـ webview مرة واحدة لما تفتح الـ panel. الـ Reload بيخلي VS Code يعيد تحميل كل حاجة من جديد.

### إيه اللي بيحصل لو ثبت الـ Extension قبل Claude Code؟
مفيش مشكلة. الـ Extension هتشتغل بس مش هتلاقي Claude Code فهتسكت. أول ما تثبت Claude Code، الـ `onDidChange` listener هيكتشف ده ويحقن تلقائيًا.

### إيه اللي بيحصل لو حذفت Claude Code؟
الـ Extension هتسكت ومش هتعمل أي حاجة. لو رجعت ثبت Claude Code، هتحقن تلقائيًا.

---

## أوامر البناء | Build Commands

| الأمر | الوصف |
|-------|-------|
| `npm install` | تثبيت الـ dependencies |
| `npm run compile` | بناء المشروع (TypeScript → JavaScript) |
| `npm run watch` | بناء تلقائي عند حفظ أي ملف (مفيد أثناء التطوير) |
| `npm run package` | تعبئة Extension كملف VSIX (يحتاج `@vscode/vsce`) |

---

## المساهمة | Contributing

1. Fork المشروع
2. اعمل branch جديد: `git checkout -b feature/amazing-feature`
3. اعمل التعديلات بتاعتك
4. ابني وتأكد إن كل حاجة شغالة: `npm run compile`
5. اعمل commit: `git commit -m 'Add amazing feature'`
6. اعمل push: `git push origin feature/amazing-feature`
7. افتح Pull Request

---

## الرخصة | License

MIT License - حر تستخدمه وتعدل عليه وتوزعه.

---

## الكاتب | Author

**Abdelmomen Elshatory** ([@beingmomen](https://github.com/beingmomen))
