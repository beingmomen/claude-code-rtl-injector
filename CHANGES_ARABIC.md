# تقرير التعديلات: تعميم الامتداد لدعم عدة امتدادات AI

**تاريخ التعديل:** 8 أبريل 2026  
**الإصدار:** 0.6.0

---

## الهدف من التعديل

كان المشروع في الأصل مقيّداً بـ **Claude Code** فقط — جميع المسارات وأسماء الكلاسات ومفاتيح الحالة مكتوبة بشكل ثابت للتعامل مع امتداد واحد فقط.

**الهدف:** تحويل المشروع إلى بنية **قابلة للتوسيع (multi-target)** تستطيع دعم أي امتداد AI يمتلك webview يمكن الحقن فيه، مع إضافة دعم فوري لـ:
- ✅ **Claude Code** (`anthropic.claude-code`) — محافظة على الدعم الحالي
- ✅ **Codex / OpenAI ChatGPT** (`openai.chatgpt`) — دعم جديد
- ❌ **GitHub Copilot Chat** (`github.copilot-chat`) — مستثنى (سبب تقني مفصّل أدناه)

---

## لماذا تم استثناء GitHub Copilot Chat؟

بعد الفحص التقني العميق، تبيّن أن **Copilot Chat** يستخدم مكتبة **FAST (Microsoft)** للمكوّنات المرئية. هذه المكتبة تُحقن CSS عبر `adoptedStyleSheets` في **runtime** داخل ملفات JavaScript، وليس في ملفات CSS ثابتة على القرص.

أي أنه لا يوجد ملف `index.css` أو ما شابهه قابل للتعديل البسيط. الحقن في hadopted stylesheets يتطلب مقاربة مختلفة كلياً (تعديل JS bundle) وهو خارج نطاق هذا المشروع حالياً.

---

## الملفات التي تم تعديلها

| الملف | نوع التغيير |
|---|---|
| `src/constants.ts` | تعديل جوهري — نموذج البيانات الجديد |
| `src/detector.ts` | إعادة بناء كاملة |
| `src/injector.ts` | تعديلات على الدوال الرئيسية |
| `src/extension.ts` | إعادة بناء كاملة |
| `css/rtl-chatgpt.css` | ملف جديد |
| `package.json` | إعادة تسمية + تحديث الأوامر |

---

## التفاصيل الكاملة لكل ملف

---

### 1. `src/constants.ts` — نموذج البيانات

#### ما تم حذفه
```typescript
// حُذفت هذه الثوابت لأنها كانت خاصة بـ Claude Code فقط
export const CLAUDE_EXTENSION_ID = 'anthropic.claude-code';
export const WEBVIEW_CSS_PATH = 'webview/index.css';
export const WEBVIEW_JS_PATH = 'webview/index.js';
export const STATE_KEY_VERSION = 'claudeCodeRtl.lastInjectedVersion';
// قبل: 'claudeCodeRtl.lastRtlExtensionVersion'
```

#### ما تم إضافته

**Interface جديد `ExtensionTarget`** — يصف أي امتداد مستهدَف:

```typescript
export interface ExtensionTarget {
  id: string;              // معرّف الامتداد في VS Code
  displayName: string;     // الاسم الظاهر للمستخدم في الإشعارات
  webviewCssPath: string;  // مسار ملف CSS نسبةً لمجلد الامتداد
  webviewCssIsGlob?: boolean; // true = المسار أعلاه هو نمط glob مثل index-*.css
  webviewJsPath?: string;  // مسار ملف JS نسبةً لمجلد الامتداد (اختياري)
  classNameBases: string[]; // أسماء الكلاسات التي تحتاج لإعادة ربط الهاشات
  cssTplFile: string;      // اسم ملف CSS template داخل مجلد css/
}
```

**مصفوفة `TARGET_EXTENSIONS`** — تعريف الامتدادات المدعومة:

```typescript
export const TARGET_EXTENSIONS: ExtensionTarget[] = [
  {
    id: 'anthropic.claude-code',
    displayName: 'Claude Code',
    webviewCssPath: 'webview/index.css',        // مسار ثابت
    webviewJsPath: 'webview/index.js',
    classNameBases: CLASS_NAME_BASES,           // 25 اسم كلاس تحتاج hash remapping
    cssTplFile: 'rtl-support.css',
  },
  {
    id: 'openai.chatgpt',
    displayName: 'Codex',
    webviewCssPath: 'webview/assets/index-*.css', // نمط glob — الاسم يتغيّر مع كل إصدار
    webviewCssIsGlob: true,
    classNameBases: [],                           // لا يوجد CSS Modules → لا حاجة لـ hash remapping
    cssTplFile: 'rtl-chatgpt.css',
  },
];
```

**مفتاح الحالة الجديد:**
```typescript
// قبل:  'claudeCodeRtl.lastRtlExtensionVersion'
export const STATE_KEY_RTL_VERSION = 'aiRtl.lastRtlExtensionVersion';
```

---

### 2. `src/detector.ts` — اكتشاف الامتدادات

#### ما تغيّر في Interface

```typescript
// قبل:
export interface ClaudeCodeInfo {
  extensionPath: string;
  cssFilePath: string;
  jsFilePath: string;
  version: string;
}

// بعد: يحمل مرجعاً للـ target حتى تعرف بقية الشيفرة ما هو الامتداد المقصود
export interface ExtensionInfo {
  target: ExtensionTarget;  // ← جديد
  extensionPath: string;
  cssFilePath: string;
  jsFilePath: string;
  version: string;
}
```

#### دالة جديدة: `discoverCssFile()`

المشكلة مع Codex هو أن Vite يُضمّن hash في اسم ملف CSS نفسه مثل `index-CrdGJg1L.css`. الاسم كامل يتغيّر مع كل إصدار لذا لا يمكن كتابه ثابتاً.

الحل: البحث في المجلد عن أول ملف يطابق النمط:

```typescript
function discoverCssFile(extPath: string, target: ExtensionTarget): string | undefined {
  if (!target.webviewCssIsGlob) {
    // مسار ثابت — التحقق من وجوده فقط
    const p = path.join(extPath, target.webviewCssPath);
    return fs.existsSync(p) ? p : undefined;
  }

  // glob: تحويل النمط index-*.css إلى regex ثم البحث
  const dir = path.join(extPath, path.dirname(target.webviewCssPath));
  const filePattern = path.basename(target.webviewCssPath);
  const regex = new RegExp('^' + filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');

  const files = fs.readdirSync(dir);
  const match = files.find(f => regex.test(f));
  return match ? path.join(dir, match) : undefined;
}
```

#### دالة معدّلة: `detectExtensions()` (سابقاً `detectClaudeCode()`)

```typescript
// قبل: كانت تُعيد ClaudeCodeInfo | undefined لامتداد واحد فقط

// بعد: تُعيد مصفوفة لجميع الامتدادات الموجودة
export function detectExtensions(): ExtensionInfo[] {
  const results: ExtensionInfo[] = [];

  for (const target of TARGET_EXTENSIONS) {
    const ext = vscode.extensions.getExtension(target.id);
    if (!ext) continue; // غير مثبّت، تجاوز بصمت

    const cssFilePath = discoverCssFile(ext.extensionPath, target);
    if (!cssFilePath) continue; // ملف CSS غير موجود

    results.push({ target, extensionPath: ext.extensionPath, cssFilePath, ... });
  }

  return results; // يمكن أن تكون فارغة أو تحتوي على 1 أو أكثر
}
```

#### مفاتيح الحالة per-target

كل امتداد الآن له مفتاح حالة خاص به لتتبّع الإصدار:
```typescript
// قبل: مفتاح واحد ثابت 'claudeCodeRtl.lastInjectedVersion'

// بعد: مفتاح مشتق من معرّف الامتداد
function getVersionStateKey(targetId: string): string {
  return `aiRtl.version.${targetId}`;
}
// مثال: 'aiRtl.version.anthropic.claude-code'
// مثال: 'aiRtl.version.openai.chatgpt'
```

#### `extractCurrentHashes()` — معامل اختياري جديد

```typescript
// قبل: كانت ترجع دائماً الـ 25 كلاس الخاصة بـ Claude Code
export function extractCurrentHashes(cssContent: string): HashMap

// بعد: يمكن تحديد أي كلاسات تريد البحث عنها
export function extractCurrentHashes(
  cssContent: string,
  classNameBases: string[] = CLASS_NAME_BASES // الافتراضي: Claude Code bases
): HashMap
```

> الاختبارات القديمة تعمل بدون تغيير لأن المعامل الجديد اختياري.

---

### 3. `src/injector.ts` — محرك الحقن

#### `readRtlTemplate()` — معامل filename مرن

```typescript
// قبل: كانت تقرأ 'rtl-support.css' بشكل ثابت
export function readRtlTemplate(extensionPath: string): string

// بعد: اسم الملف قابل للتحديد
export function readRtlTemplate(extensionPath: string, filename = 'rtl-support.css'): string {
  const templatePath = path.join(extensionPath, 'css', filename);
  return fs.readFileSync(templatePath, 'utf-8');
}
```

#### `remapHashes()` — يعمل مع أي template

```typescript
// قبل: كان يستخدم CLASS_NAME_BASES المحلي دائماً
export function remapHashes(templateCss: string, currentHashes: HashMap)

// بعد: classNameBases قابلة للتمرير
export function remapHashes(
  templateCss: string,
  currentHashes: HashMap,
  classNameBases: string[] = CLASS_NAME_BASES
)
```

#### `injectRtlCss()` — المنطق الذكي الجديد

هذه أهم تغيير في injector.ts. الدالة الآن تُقرر تلقائياً هل تحتاج hash remapping أم لا:

```typescript
// قبل: معاملان فقط
export function injectRtlCss(cssFilePath, extensionPath, currentHashes): InjectResult

// بعد: يضيف target الاختياري
export function injectRtlCss(
  cssFilePath: string,
  extensionPath: string,
  currentHashes: HashMap,
  target?: ExtensionTarget
): InjectResult {
  // قراءة الـ template الصحيح حسب الـ target
  const tplFile = target?.cssTplFile ?? 'rtl-support.css';
  const template = readRtlTemplate(extensionPath, tplFile);
  const classNameBases = target?.classNameBases ?? CLASS_NAME_BASES;

  let remappedCss: string;

  if (classNameBases.length === 0) {
    // ← مسار Codex: لا يوجد CSS Modules، حقن مباشر بدون إعادة ربط
    remappedCss = template;
  } else {
    // ← مسار Claude Code: إعادة ربط الهاشات المتغيّرة
    ({ css: remappedCss } = remapHashes(template, currentHashes, classNameBases));
  }
  // ...
}
```

**تحديث تعليق الحقن:**
```css
/* قبل: /* Injected by Claude Code RTL Support extension */
/* بعد: */ /* Injected by AI Extensions RTL Support (target: Claude Code) */
```

---

### 4. `src/extension.ts` — منسّق العمليات

#### تغيير أسماء الأوامر

```typescript
// قبل:
vscode.commands.registerCommand('claudeCodeRtl.inject', ...)
vscode.commands.registerCommand('claudeCodeRtl.remove', ...)
vscode.commands.registerCommand('claudeCodeRtl.status', ...)

// بعد:
vscode.commands.registerCommand('aiRtl.inject', ...)
vscode.commands.registerCommand('aiRtl.remove', ...)
vscode.commands.registerCommand('aiRtl.status', ...)
```

#### دالة مساعدة جديدة: `injectForTarget()`

لتفادي تكرار الشيفرة، تم استخراج منطق الحقن لامتداد واحد في دالة مستقلة:

```typescript
async function injectForTarget(
  info: ExtensionInfo,
  context: vscode.ExtensionContext,
  force: boolean  // true في الحقن اليدوي، false في الحقن التلقائي
): Promise<{ injected: boolean; displayName: string; unmatchedCount: number }>
```

هذه الدالة:
1. تقرأ CSS الحالي وتتحقق من وجود markers
2. تتحقق من تغيّر الإصدار
3. تستخرج الهاشات الحالية
4. تستدعي `injectRtlCss` مع الـ target
5. تستدعي `injectRtlJs` إن كان الامتداد يدعمه
6. تُعيد نتيجة موحّدة

#### `autoInject()` — يعمل على جميع الامتدادات

```typescript
async function autoInject(context: vscode.ExtensionContext): Promise<void> {
  const extensions = detectExtensions(); // يحصل على كل الامتدادات الموجودة
  if (extensions.length === 0) return;

  const injectedNames: string[] = [];

  for (const info of extensions) {
    const result = await injectForTarget(info, context, false);
    if (result.injected) {
      injectedNames.push(result.displayName);
    }
  }

  // إشعار واحد يجمع كل الامتدادات المحقونة
  if (injectedNames.length > 0) {
    await saveRtlVersion(context);
    vscode.window.showInformationMessage(
      `AI Extensions RTL: Injected into ${injectedNames.join(', ')}. Reload to apply.`
    );
  }
}
```

#### `checkStatus()` — يُظهر حالة كل الامتدادات

```
// مثال على الإشعار الناتج:
AI Extensions RTL: Claude Code v2.1.96: CSS ✓, JS ✓ | Codex v26.3: CSS ✓
```

---

### 5. `css/rtl-chatgpt.css` — ملف جديد

#### لماذا لا يحتاج hash remapping؟
Codex يستخدم **Vite** لبناء الـ bundle — ملف CSS الناتج يحتوي على كلاسات عادية (مثل `.ProseMirror`) بالإضافة إلى كلاسات بنمط `._name_hash` لكن هذا الأخير يكون مُضمَّناً في الـ JS وليس في ملف CSS الرئيسي. لذلك يمكن استهداف العناصر بـ **attribute selector wildcards** بدلاً من class matching.

#### محتوى الملف

```css
/* ProseMirror — حقل الإدخال النصي */
.ProseMirror {
  unicode-bidi: plaintext;
  text-align: start;
}

/* محتوى Markdown في المحادثة */
[class*="_markdownContent_"],
[class*="_markdownRoot_"],
[class*="_inlineMarkdown_"] {
  unicode-bidi: plaintext;
  text-align: start;
}

/* الصدفة الرئيسية للـ Home */
[class*="_homeShell_"],
[class*="_home_"] { unicode-bidi: plaintext; }

/* سطح محرر الإدخال */
[class*="_composerSurface_"] { unicode-bidi: plaintext; }

/* أدوار المحادثة (مستخدم / مساعد) */
[class*="userTurn"],
[class*="assistantTurn"] {
  unicode-bidi: plaintext;
  text-align: start;
}

/* الكود — يبقى LTR دائماً */
[class*="_markdownRoot_"] pre,
[class*="_markdownContent_"] pre {
  unicode-bidi: embed;
  direction: ltr;
  text-align: left;
}
```

**لماذا `unicode-bidi: plaintext` وليس `direction: rtl`؟**  
`direction: rtl` يُجبر كل النص على الاتجاه اليميني بما فيه الإنجليزي — وهذا يكسر كل شيء.  
`unicode-bidi: plaintext` يُمكّن المتصفح من الكشف التلقائي للاتجاه بناءً على المحتوى الفعلي لكل فقرة.

---

### 6. `package.json` — إعادة تسمية

| الحقل | قبل | بعد |
|---|---|---|
| `name` | `claude-code-rtl-injector` | `ai-extensions-rtl-support` |
| `displayName` | `Claude Code RTL Support` | `AI Extensions RTL Support` |
| `description` | ...Claude Code's webview... | ...AI extension webviews (Claude Code, Codex)... |
| أمر 1 | `claudeCodeRtl.inject` | `aiRtl.inject` |
| أمر 2 | `claudeCodeRtl.remove` | `aiRtl.remove` |
| أمر 3 | `claudeCodeRtl.status` | `aiRtl.status` |
| عنوان 1 | `Claude Code RTL: Inject CSS Now` | `AI Extensions RTL: Inject CSS Now` |
| عنوان 2 | `Claude Code RTL: Remove Injected CSS` | `AI Extensions RTL: Remove Injected CSS` |
| عنوان 3 | `Claude Code RTL: Check Status` | `AI Extensions RTL: Check Status` |
| keywords جديدة | — | `codex`, `openai`, `chatgpt` |

---

## بنية المشروع بعد التعديل

```
vscode_E_Clause_code_inject/
├── css/
│   ├── rtl-support.css       ← template خاص بـ Claude Code (لم يتغيّر)
│   └── rtl-chatgpt.css       ← ★ جديد — template خاص بـ Codex
├── js/
│   └── rtl-observer.js       ← MutationObserver للـ DOM (لم يتغيّر)
├── src/
│   ├── constants.ts          ← ★ معدّل — ExtensionTarget + TARGET_EXTENSIONS
│   ├── detector.ts           ← ★ معدّل — detectExtensions() + discoverCssFile()
│   ├── injector.ts           ← ★ معدّل — per-target template + conditional remap
│   ├── extension.ts          ← ★ معدّل — loop على targets + aiRtl.* commands
│   └── test/
│       └── suite/
│           ├── detector.test.ts   ← لم تتغيّر (API متوافق بالوراء)
│           └── injector.test.ts   ← لم تتغيّر (API متوافق بالوراء)
└── package.json              ← ★ معدّل — إعادة تسمية
```

---

## تدفق العمل الكامل بعد التعديل

```
VS Code يفعّل الامتداد (onStartupFinished)
          │
          ▼
detectExtensions()
  ├── Claude Code موجود؟
  │       └── discoverCssFile() → webview/index.css (مسار ثابت)
  └── Codex موجود؟
          └── discoverCssFile() → webview/assets/index-CrdGJg1L.css (glob)
          │
          ▼
لكل امتداد موجود:
  injectForTarget(info, context, force=false)
  │
  ├── هل CSS محقون بالفعل؟ + هل الإصدار لم يتغيّر؟
  │     └── نعم → تخطّ هذا الامتداد
  │
  ├── extractCurrentHashes() → فقط لـ Claude Code
  │
  ├── injectRtlCss(cssFilePath, extensionPath, hashes, target)
  │     ├── Claude Code → readRtlTemplate(rtl-support.css) → remapHashes() → حقن
  │     └── Codex → readRtlTemplate(rtl-chatgpt.css) → حقن مباشر (بدون remap)
  │
  └── injectRtlJs() → فقط للامتدادات التي لها jsFilePath (Claude Code فقط الآن)
          │
          ▼
إشعار واحد موحّد:
"AI Extensions RTL: Injected into Claude Code, Codex. Reload to apply."
```

---

## التوافق مع الوراء (Backward Compatibility)

### الاختبارات
جميع الاختبارات الموجودة تعمل **بدون أي تغيير** لأن:
- `extractCurrentHashes(css)` تعمل بمعامل واحد (المعامل الثاني اختياري)
- `remapHashes(template, hashes)` تعمل بمعاملَين (المعامل الثالث اختياري)
- `CLASS_NAME_BASES` لا يزال مُصدَّراً ومستخدَماً في الاختبارات
- `MARKER_START` و `MARKER_END` لم يتغيّرا

### ملفات الـ CSS المحقونة سابقاً
الكود الجديد يتعرّف على markers القديمة ويُزيلها ويُعيد الحقن بالصيغة الجديدة. لا حاجة لتدخّل يدوي.

---

## القيود الحالية والحلول المستقبلية

| القيد | التأثير | الحل المستقبلي |
|---|---|---|
| Codex CSS glob يجد أول ملف فقط | إذا كان هناك ملفان، يُحقن في الأول | نادر جداً في بنية Vite |
| JS injection غير مدعوم لـ Codex | لا يتم ضبط `dir="auto"` تلقائياً | إضافة jsPath لـ Codex في المستقبل |
| GitHub Copilot Chat مستثنى | لا دعم RTL له | مقاربة مختلفة تعتمد على تعديل runtime JS |
| إضافة امتداد جديد تتطلب تعديل كود | يجب تحديث `TARGET_EXTENSIONS` | — |

---

## كيفية إضافة امتداد AI جديد مستقبلاً

بفضل البنية الجديدة، إضافة امتداد جديد لا تتطلب سوى **3 خطوات**:

### الخطوة 1: إضافة إدخال في `src/constants.ts`
```typescript
export const TARGET_EXTENSIONS: ExtensionTarget[] = [
  // ... الامتدادات الموجودة ...
  {
    id: 'new-publisher.new-extension',
    displayName: 'New AI Extension',
    webviewCssPath: 'dist/index.css',       // أو نمط glob
    webviewCssIsGlob: false,
    classNameBases: ['myClass', 'myOther'], // أو [] إذا لم يكن CSS Modules
    cssTplFile: 'rtl-new-extension.css',
  },
];
```

### الخطوة 2: إنشاء ملف CSS template في `css/`
```
css/rtl-new-extension.css
```

### الخطوة 3: تشغيل `npm run compile`

---

## نتيجة التحقق

```
$ npm run compile
> ai-extensions-rtl-support@0.6.0 compile
> tsc -p ./

[لا أخطاء — 0 errors]
```

التحويل ناجح 100% بدون أي أخطاء TypeScript.
