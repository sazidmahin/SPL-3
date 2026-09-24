# Rule-Based Pipeline — বাংলা ব্যাখ্যা

> এই ডকুমেন্টটা `backend/app/rule_engine/pipeline.py` (≈2700 লাইন) আর `backend/app/dictionaries/v1/*.json` পড়ে লেখা।
> নিচের **সব উদাহরণের আউটপুট আসল কোড চালিয়ে নেওয়া** — আন্দাজে লেখা না।
> কোনো AI/LLM এখানে নেই। পুরোটাই **regex + dictionary + কিছু scoring rule**। একই input দিলে সবসময় একই output আসে (deterministic)।

---

## ১. বড় ছবি — পুরো pipeline একনজরে

ইউজার একটা সাধারণ ইংরেজি টেক্সট (requirement/story) দেয়। Pipeline সেটাকে ধাপে ধাপে ভেঙে শেষে একটা draw.io Class Diagram (XML) বানায়।

```
Raw Text
   │
   ▼
[১] normalize_text        → টেক্সট পরিষ্কার করা (unicode, contraction, quote)
   ▼
[২] split_sentences       → বাক্যে ভাগ
   ▼
[৩] split_clauses         → বাক্যকে ছোট clause-এ ভাগ (and / or / comma / then / but)
   ▼
[৪] extract_facts         → প্রতিটা clause থেকে  actor + action + object (+ condition, modality, multiplicity, NFR)
   ▼
[৫] generate_clarifications → যা বোঝা যায়নি সেগুলোর জন্য প্রশ্ন বানানো
   ▼        ↑
   │   ইউজার উত্তর দেয় → apply_answers() fact-এ বসিয়ে দেয়
   ▼
[৬] generate_final_story  → "The Librarian must approve a Request." ধরনের atomic story
   ▼
[৭] generate_requirements → FR-001 / BR-001 / NFR-001
   ▼
[৮] generate_class_model  → Class, Attribute, Method, Relationship (scoring দিয়ে)
   ▼
[৯] generate_drawio_xml   → validate করে draw.io XML
```

`analyze_text()` (pipeline.py:1658) ধাপ [১]–[৫] একসাথে চালায়। বাকি ধাপগুলো আলাদা আলাদা function, এবং service layer-এ (`rule_system_service.py`, `generation_pipeline_service.py`) একটার পর একটা call হয়।

### Stage আর Approval

Service layer-এ ৬টা stage আছে (`STAGES` — pipeline.py:12):

`input → clarifications → final-story → requirements → class-model → xml`

প্রতিটা stage-এর status: `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, `STALE`, `FAILED`।
ইউজার আগের কোনো stage বদলালে (`_stale_later`, rule_system_service.py:120) তার **পরের সব stage `STALE`** হয়ে যায় — মানে আবার generate করতে হবে।

---

## ২. Dictionary কীভাবে কাজ করে

### লোড হওয়ার নিয়ম
- ফাইল: `backend/app/dictionaries/v1/*.json` — মোট **২৫টা JSON**।
- `dictionaries.py`-এর `load_dictionaries()` সব ফাইল একবার পড়ে `{ফাইলের নাম: JSON content}` dict বানায়, আর `@lru_cache` দিয়ে মেমোরিতে রাখে।
  যেমন `load_dictionaries()["quantifiers"]` = `quantifiers.json`-এর content।
- Version: `DICTIONARY_VERSION = "dict_v1"`, `RULE_VERSION = "rules_v1"` — প্রতিটা output-এ এই version লেখা থাকে, যাতে পরে বোঝা যায় কোন rule/dictionary দিয়ে বানানো।
- Code বদলানো ছাড়াই শুধু JSON এডিট করে নতুন শব্দ/phrase যোগ করা যায় (cache reset হলে)।

### কোন dictionary কোথায় ব্যবহার হয়

| Dictionary (JSON) | কী আছে | কোন ধাপে / কীভাবে ব্যবহার |
|---|---|---|
| `action_aliases` + `action_aliases_extra` | `"see"→"view"`, `"remove"→"delete"`, `"email"→"sendEmail"`, `"log in"→"login"` … | Verb-কে **canonical action**-এ বদলানো (`_action_aliases`, `_canonical_action`)। Clause ভাঙার সময়ও "এটা কি verb?" চেনার জন্য। এখানে না পেলে → `Unknown action` warning → clarification প্রশ্ন |
| `irregular_verbs` | `"made"→"make"`, `"sent"→"send"`, `"paid"→"pay"` | Alias table-এর সাথে merge হয়, যাতে অনিয়মিত past tense চেনা যায় |
| `permission_modals` | `can, may, could, is allowed to …` | Modal pattern-এর অংশ; modality = **permission** |
| `obligation_modals` | `must, shall, should, need to, will …` | modality = **obligation** |
| `negative_modals` | `cannot, must not, shall not, never, do not …` | modality = **negative**, `negated = True` |
| `relationship_phrases` + `_extra` | `"has"→association`, `"owns"/"consists of"/"part of"→composition`, `"includes"→aggregation`, `"uses"/"depends on"→dependency`, `"is a"/"extends"→inheritance`, `"implements"→realization` | Relationship fact চেনা ও **relationship type** ঠিক করা |
| `quantifiers` | `"one or more"→"1..*"`, `"optional"→"0..1"`, `"many"→"0..*"`, `"no"→"0"` | Multiplicity বের করা (`_quantity_from_text`)। এছাড়া clause ভাঙার সময় "one or more"-কে ভাঙা থেকে বাঁচাতে |
| `state_words` | `confirmed, shipped, approved, cancelled, paid …` | Condition চেনা: `"once the payment is confirmed"`। Class scoring-এ state word হলে penalty |
| `nfr_keywords` | `Performance`, `Availability`, `Security`, `Usability`, `Reliability`, `Maintainability`, `Scalability` … প্রতিটার keyword list + metric | Sentence NFR (non-functional) কিনা চেনা |
| `narrative_actors` | `"I"→Administrator`, `"my staff"→Staff`, `"people"→User`, `"buyers"→Customer` | কথ্য ভাষার subject-কে আসল actor class-এ বদলানো (`resolve_actor`) |
| `business_narrative_patterns` | regex + actor/action/object/want/goal | পরিচিত business গল্পের (যেমন কাপড়ের দোকান) জন্য হাতে-লেখা user story (final-story ধাপে) |
| `pronouns` | `objectPronouns: it, this, that …` | "delete **it**" — `it` কী বোঝায় তা ঠিক করা; না পারলে clarification |
| `primitive_attributes` | `name, email, phone, price, date, status, quantity …` | এগুলো **Class না, Attribute** — Class scoring থেকে বাদ দেওয়া, owner class-এর field বানানো |
| `attribute_phrases` | `"due date"→dueDate:Date`, `"full name"→fullName:String` | Multi-word attribute চেনা + নাম ও type দেওয়া |
| `data_type_hints` | `email→String`, `price→Decimal`, `age→Integer`, `date→Date`, `is/has→Boolean` | Attribute-এর data type ঠিক করা |
| `generic_nouns` | `system, data, page, button, form, list, setting …` | ঢিলেঢালা/generic noun — Class scoring-এ **−4** |

### আগে যে ৭টা dictionary লোড হতো কিন্তু ব্যবহার হতো না
`actor_hints`, `articles`, `conditional_markers`, `conjunctions`, `phrase_aliases`, `stopwords`, `temporal_markers`

প্রথম লেখার সময় এগুলো শুধু `/dictionary` API দিয়ে দেখা যেত, কোড এদের কাজ hardcode করে রেখেছিল। এখনকার অবস্থা:
- `articles`, `conditional_markers` → pipeline.py-তে wire করা (article pattern, condition trigger)।
- `actor_hints`, `conjunctions`, `stopwords`, `temporal_markers` → Class Modeler (`oop_modeler.py`)-এ ব্যবহার হয় (§৭)।
- `phrase_aliases` → ইচ্ছা করে বাদ, কারণ §৫-এর ৭ নম্বরে লেখা আছে।

---

## ৩. ধাপে ধাপে — প্রতিটা ধাপ কী করে

### ধাপ ১ — `normalize_text`
- Unicode NFKC, `\r\n` → `\n`, smart quote/dash (`’ “ ” – —`) → সাধারণ ASCII।
- `&` → `and`।
- Contraction খোলা: `can't → cannot`, `doesn't → does not`, `it's → it is` (যাতে negative modal dictionary ঠিকমতো মেলে)।
- বাড়তি space/newline কমানো।
- Rule ID: `TXT_UNICODE_NFKC_001`, `TXT_WHITESPACE_COLLAPSE_001`, `TXT_PUNCTUATION_ASCII_001`, `TXT_CONTRACTION_EXPAND_001`।

### ধাপ ২ — `split_sentences`
- `. ! ?` দিয়ে ভাগ, কিন্তু আগে **abbreviation সুরক্ষিত** করে: `e.g.`, `i.e.`, `Dr.`, `etc.`, `Ph.D.` আর দশমিক (`99.9%`, `1.5 seconds`) যেন বাক্য না ভাঙে।
- List bullet/নম্বর (`- `, `1.`, `a)`) কেটে ফেলা।
- প্রতিটা বাক্য পায় `sentence_001`, `sentence_002` … ID।

### ধাপ ৩ — `split_clauses` (`_split_clause_text`)
বাক্যকে ছোট clause-এ ভাঙে, তবে সাবধানে:
- **Hard break:** `;`, `then`, `but`।
- **`and` / `or` / `,`** — শুধু তখনই ভাঙে যখন পরের অংশটা নতুন predicate (modal বা চেনা action verb দিয়ে শুরু)। তাই `"name, email, and phone number"` একসাথে থাকে, কিন্তু `"the user can log in and the admin can approve"` ভাঙে।
- **Relative clause না ভাঙা:** `"books that are damaged or lost"` — `that/which/who/where/when/because` এর পরের অংশ আগের noun-এরই বর্ণনা, তাই ওটার ভেতরের `or` ভাঙা হয় না।
- **Quantity idiom সুরক্ষা:** `"one or more"`, `"at least"`, `"no more than"` ভাঙে না।
- **Shared object:** `"approve, reject, or forward the request"` — `approve` আর `reject` একা verb (object নেই), তাই এগুলো `"approve and reject and forward the request"` করে জোড়া লাগানো হয়, যাতে পরে একই object সব verb-এ বসতে পারে।

### ধাপ ৪ — `extract_facts` (সবচেয়ে বড় ধাপ)
প্রতিটা clause-এর উপর **একটা নির্দিষ্ট ক্রমে pattern try** করা হয়। **প্রথম যেটা মিলে যায় সেটাই জেতে**, তারপর `continue`।

প্রথমে দুটো pre-step:
1. `denarrate_clause` — কথ্য ভাষাকে প্লেইন রূপে আনা।
   - `"I want people to be able to see the clothes"` → `"User can see the clothes"`
   - `"There should be a way for a manager to approve orders"` → `"manager can approve orders"`
   - (`narrative_actors` dictionary + কয়েকটা regex ব্যবহার করে)
2. `_condition_from_text` — পুরো **sentence** থেকে condition বের করা (`"if payment fails"`, `"once the order is shipped"`)। যে clause পুরোটাই শুধু condition (`"If the payment fails"`), সেটা আলাদা fact হয় না — condition অন্য clause-গুলোতে জুড়ে যায়।

তারপর pattern-এর ক্রম:

| # | Pattern | উদাহরণ | Rule ID |
|---|---|---|---|
| 1 | **NFR** — sentence-এ NFR keyword আছে | `"The system should respond quickly"` | `NFR_<CATEGORY>_KEYWORD_001` |
| 2 | **Passive + agent** | `"An email shall be sent by the system to the customer"` | `EXT_PASSIVE_WITH_AGENT_001` |
| 3 | **Passive (agent নেই)** | `"Some books can be reserved"` | `EXT_PASSIVE_OBJECT_ACTION_001` |
| 4 | **Relationship phrase** (`has`, `owns`, `consists of` …) | `"A member has a full name, an email …"` | `REL_PHRASE_DICTIONARY_001` (বা multiplicity rule) |
| 5 | **Grant** (`allow/enable/let/give X to …`) | `"The system shall allow the admin to delete users"` | `EXT_SYSTEM_GRANTS_ACTOR_ACTION_OBJECT_001` |
| 6 | **And-joined verb list** | `"librarian must approve and reject and forward the request"` | `EXT_AND_JOINED_VERB_LIST_001` |
| 7 | **`Only …`** | `"Only the librarian can remove books"` | `EXT_ONLY_ACTOR_CAN_ACTION_OBJECT_001` |
| 8 | **Active + modal** | `"A member can borrow books"` | `EXT_ACTION_ALIAS_001` |
| 9 | **Present tense (modal ছাড়া)** | `"The system sends a confirmation email"` | `EXT_PRESENT_TENSE_ACTION_001` |
| 10 | **Positional fallback** — clause-এ কোনো চেনা verb খুঁজে তার আগে = actor, পরে = object | `"update the inventory"` (actor নেই) | `EXT_POSITIONAL_ACTION_001` (`POSITIONAL_GUESS`) |

প্রতিটা match-এর পর সাধারণ **সাজানোর কাজ**:
- **`normalize_entity`** — noun phrase পরিষ্কার: `"up to five books"` → `Book`।
  - শুরুর quantity (`up to`, `at least`) কাটে; `that/which/with/for/in/of/and …` থেকে বাকিটা ফেলে; `a/an/the/each/every/new/valid…` কাটে; শেষের adverb (`online`, `quickly`) কাটে; শেষ ৩ শব্দ রাখে; শেষ শব্দ singular (`books→book`, `statuses→status`, `categories→category`); শেষে PascalCase।
- **`resolve_actor`** — আগে `narrative_actors` dictionary-তে দেখে (`"my staff"→Staff`), না পেলে `normalize_entity`।
- **`_canonical_action`** — verb alias dictionary → না পেলে `-ing/-ed/-es/-s` কেটে base form দিয়ে আবার চেষ্টা → তবুও না পেলে `Unknown action` warning।
- **Phrasal verb:** `log` + `in` → `log in` → `login`।
- **`_expand_action_object`** — `create and update the order` → `(create, order), (update, order)` — আলাদা আলাদা fact।
- **Pronoun:** object যদি `it/this/that` হয় — জানা entity মাত্র একটা থাকলে সেটাই; না হলে condition-এর subject; না হলে warning `"Pronoun … has multiple possible references"`।
- **Elided subject:** `"shall notify the warehouse and update the inventory"` — দ্বিতীয় clause-এ actor নেই, তাই আগের clause-এর actor নেয় (warning সহ)। কিন্তু **passive fact-এ নেয় না** — ওখানে actor-না-থাকা ইচ্ছাকৃতভাবে clarification প্রশ্নে যায়।
- **Modality:** `_modality` — আগে negative dictionary, তারপর obligation, নাহলে permission।
- **Multiplicity** (`_quantity_from_text`, শুধু relationship fact-এ): আগে `quantifiers` dictionary (লম্বা phrase আগে), তারপর regex — `exactly N → N`, `at least N → N..*`, `at most N / up to N → 0..N`, `between A and B → A..B`। না পেলে default `1` : `0..*` + warning।

**একটা Fact-এর গঠন** (`_fact_template`): `id, sourceText, sourceSentenceId, sourceClauseId, actor, action, rawAction, object, condition, modality, negated, sourceMultiplicity, targetMultiplicity, relationshipType, nfr, matchedRuleId, extractionType, missingFields, warnings` …
- `missingFields` — actor/action/object যেটা পাওয়া যায়নি (NFR বাদে)।
- `extractionType` — `EXACT_PATTERN`, `PASSIVE_PATTERN`, `PHRASE_PATTERN`, `DICTIONARY_PATTERN`, `POSITIONAL_GUESS`, পরে `CLARIFICATION_ANSWER`।

### ধাপ ৫ — `generate_clarifications`
প্রতিটা fact দেখে **নিয়ম-ভিত্তিক প্রশ্ন** বানায়। প্রতিটা প্রশ্নে থাকে: `id (CLR-001…)`, `text`, `category`, `sourceSentence`, `reason`, `triggeredRuleId`, `answerMapping` (উত্তরটা fact-এর কোন field-এ বসবে)।

| Category | কখন | প্রশ্ন | Rule | উত্তর যায় |
|---|---|---|---|---|
| Missing Actor | action + object আছে, actor নেই | `Who can reserve the Book?` | `CLR_MISSING_ACTOR_001` | `actor` |
| Missing Object | actor + action আছে, object নেই | `What can the X do?` | `CLR_MISSING_OBJECT_001` | `object` |
| Missing Action | actor + object আছে, action নেই | `What does the X do with the Y?` | `CLR_MISSING_ACTION_001` | `action` |
| Unknown Action | verb dictionary-তে নেই | `What does "foo" mean in this story?` | `CLR_UNKNOWN_ACTION_001` | `canonicalAction` |
| Pronoun Reference | pronoun কার দিকে ইঙ্গিত করছে অস্পষ্ট | `Which entity does the pronoun in “…” refer to?` | `CLR_AMBIGUOUS_PRONOUN_001` | `object` |
| Vague Metric | NFR keyword আছে, সংখ্যা নেই | `What measurable performance target should be used?` | `CLR_VAGUE_NFR_TARGET_001` | `nfrTarget` |
| Ambiguous Quantity | `some/several/many/multiple/various …` আছে, কোনো digit নেই | `How many Book are expected (give a number or range)?` | `CLR_VAGUE_QUANTIFIER_001` | `quantity` |
| Vague Timing | `quickly/soon/regularly/immediately/real-time …` (NFR না হলে) | `What is the exact timing or frequency this requires?` | `CLR_VAGUE_TIMING_001` | `temporalConstraint` |
| Conflicting Rule | একই actor+action+object একবার allowed, আরেকবার not allowed | `Can the X do Y or not? The text says both.` | `CLR_CONFLICTING_MODALITY_001` | `note` |

- প্রথম তিনটা (Missing Actor/Object/Action) আর Unknown Action **একটা `if/elif` চেইনের**, মানে এক fact থেকে এদের মধ্যে সর্বোচ্চ একটা আসে। বাকিগুলো আলাদা `if` — একই fact থেকে একসাথে একাধিক প্রশ্নও আসতে পারে।
- `Vague Timing` শুধু তখনই, যখন fact NFR না — NFR হলে `Vague Metric` কাজটা করে।

### উত্তর প্রয়োগ — `apply_answers`
ইউজারের উত্তর fact-এ বসে `answerMapping` slot অনুযায়ী:
- `actor` / `object` → `normalize_entity(উত্তর)` করে বসে
- `canonicalAction` → action হিসেবে বসে (space থাকলে camelCase)
- `nfrTarget` → `nfr.targetValue` বসে, `measurable=True`, warning মুছে যায়
- অন্য slot → সরাসরি বসে
- `missingFields` থেকে সেই field সরে যায়, `extractionType = "CLARIFICATION_ANSWER"`
- `skipped` / `not_applicable` উত্তর উপেক্ষা করা হয়।

### ধাপ ৬ — `generate_final_story`
- প্রতিটা **sentence-এর** জন্য আগে দেখা হয় `business_narrative_patterns` (হাতে-লেখা regex) মেলে কিনা। মিললে সেটা জেতে — "As a customer, I want to …, so that …" আকারে।
- বাকি সব sentence-এর জন্য fact থেকে template: `"The <Actor> <can|must|cannot> <action> a/an <Object>."`; condition থাকলে `"If <condition>, …"`।
  - Modality → শব্দ: `obligation→must`, `negative→cannot`, নাহলে `can`।
  - `a`/`an` ঠিক করে (`an Inventory`, `a User`)।
- যে fact-এ action নেই, বা actor+object দুটোই নেই — তা story হয় না।
- Output-এ `unresolvedFields` (এখনও যা অজানা) আর `warnings` জমা হয়।

### ধাপ ৭ — `generate_requirements`
প্রতিটা story section থেকে:
- **NFR** → `NFR-001`: `"The system shall satisfy performance expectations."` (সংখ্যা থাকলে `" within 2 seconds"` জোড়ে)।
- **FR** → `FR-001`: `"The system shall allow the <Actor> to <action> the <Object>."`
  - Actor `System` হলে: `"The system shall <action> the <Object>."` (system নিজের কাছে permission চাইবে না)।
  - Condition থাকলে: `"If <condition>, the system shall …"`।
- **BR** (Business Rule) — source sentence-এ এই keyword থাকলে FR-এর পাশাপাশি একটা BR-ও হয়: `only, cannot, must not, at least, at most, exactly, before, after, unless, contain, own`।
  - `only` → `"Only the X may <action> the Y."` (`BR_ONLY_ACTOR_ACTION_OBJECT_001`)
  - `contain`/`own` → `BR_MANDATORY_CONTAINMENT_001`
  - অন্যগুলো → `BR_CONSTRAINT_KEYWORD_001`

### ধাপ ৮ — `generate_class_model` (Scoring)
**কোনটা Class হবে** — এটা একটা score দিয়ে ঠিক হয়:

1. প্রতিটা fact/requirement-এ:
   - **actor** → +5
   - **object** → +4
   - Relationship fact হলে actor ও object → আরও +4
2. **Penalty / বাদ:**
   - Attribute-জাতীয় (`primitive_attributes` / `attribute_phrases` মেলে) → **সরাসরি বাদ** (Class না, field হবে)
   - নামটা primitive শব্দ → −5; `generic_nouns` → −4; pronoun বা `state_words` → −6
3. **Threshold = 4** — score ≥ 4 হলে Class।

তারপর প্রতিটা Class-এর জন্য:
- **Attributes:** ওই Class-এর evidence sentence থেকে —
  (ক) `attribute_phrases`-এর মেলা phrase (`"due date"→dueDate:Date`)
  (খ) possession শব্দের (`has, contains, includes, with …`) পরের list-এর primitive noun (`"a member has a name, an email …"`), type আসে `data_type_hints` থেকে।
  আর ওপরের ধাপে "X has a due date" এর মতো fact-এর object যদি attribute-জাতীয় হয়, সেটা নতুন Class/Edge না বানিয়ে X-এর attribute হয়ে যায়।
- **Methods:**
  - Actor class-এ: `camelCase(action + object)` → `Librarian.approveRequest()`
  - Object class-এ lifecycle method: `Request.approve()` (return type `Boolean`)
- **Relationships:** প্রতিটা FR (actor → object) একটা edge; type আসে fact-এর `relationshipType` থেকে, না থাকলে `association`। Cardinality-বাহী type (association/aggregation/composition)-এ multiplicity বসে (default `1` → `0..*` + warning)।
- **Eliminate rule:** যে Class-এর **কোনো method-ও নেই, attribute-ও নেই**, সে "নিষ্ক্রিয়" — বাদ, আর তার edge-ও। বাদ যাওয়াগুলো `eliminatedClasses`-এ লেখা থাকে।
- Duplicate edge মিলিয়ে ফেলা হয় (`_dedupe_relationships`)।

### ধাপ ৯ — Validate + draw.io XML
`validate_class_model` চেক করে: ID ডুপ্লিকেট নেই, edge-এর দুই প্রান্তের Class আছে, relationship type/direction বৈধ, multiplicity বৈধ (`1`, `*`, `0..*`, `2..5`), inheritance-এ নিজের সাথে নিজে বা cycle নেই। ভুল থাকলে **XML বানানোই হয় না** (খালি string + errors)। ঠিক থাকলে `generate_drawio_xml` প্রতিটা Class swimlane box (attributes `- name: Type`, methods `+ name(): Type`), ৩ কলামের grid layout, আর relationship অনুযায়ী arrow style (composition = ভরাট diamond, aggregation = ফাঁপা diamond, inheritance = ফাঁপা তীর, dependency = ড্যাশ ইত্যাদি) দিয়ে draw.io XML লেখে।

---

## ৪. উদাহরণ — একটা টেক্সট কীভাবে ভাঙে

**Input (৭টা বাক্য):**

```
A library member can borrow up to five books. The librarian must approve, reject, or forward the request. If the payment fails, the system shall notify the customer and update the inventory. A member has a full name, an email and a phone number. Only the librarian can remove books that are damaged or lost. The system should respond quickly. Some books can be reserved.
```

### ধাপ ১–২: Normalize + Sentences
আলাদা করে কিছু বদলায়নি (contraction/smart quote নেই)। ৭টা বাক্য: `sentence_001 … sentence_007`।

### ধাপ ৩: Clauses (৯টা)

| Clause | Text | কেন এভাবে |
|---|---|---|
| `clause_001_001` | A library member can borrow up to five books | ভাঙার কিছু নেই |
| `clause_002_001` | The librarian must approve **and** reject **and** forward the request | `approve`, `reject` object ছাড়া একা verb → `and` দিয়ে জোড়া (shared object) |
| `clause_003_001` | If the payment fails | পুরোটা condition |
| `clause_003_002` | the system shall notify the customer | `and`-এর পরে `update` চেনা verb → নতুন clause |
| `clause_003_003` | update the inventory | (subject লুপ্ত) |
| `clause_004_001` | A member has a full name, an email, a phone number | `phone number` ইত্যাদি bare noun phrase → ভাঙেনি, একই list-এ |
| `clause_005_001` | Only the librarian can remove books that are damaged or lost | `that are damaged or lost` relative clause → ভাঙেনি |
| `clause_006_001` | The system should respond quickly | |
| `clause_007_001` | Some books can be reserved | |

### ধাপ ৪: Facts (১২টা)

| Fact | Clause | actor | action | object | মোট বিশদ | যে rule মিলল |
|---|---|---|---|---|---|---|
| fact_001 | ১ | LibraryMember | borrow | Book | permission (`can`) | `EXT_ACTION_ALIAS_001` (active + modal) |
| fact_002 | ২ | Librarian | approve | Request | obligation (`must`) | `EXT_AND_JOINED_VERB_LIST_001` |
| fact_003 | ২ | Librarian | reject | Request | obligation | ঐ |
| fact_004 | ২ | Librarian | forward | Request | obligation | ঐ |
| fact_005 | ৩.২ | System | notify | Customer | obligation, **condition: Payment is failed** | `EXT_ACTION_ALIAS_001` |
| fact_006 | ৩.৩ | System *(আগের clause থেকে inferred)* | update | Inventory | condition একই | `EXT_POSITIONAL_ACTION_001` |
| fact_007 | ৪ | Member | have | FullName | association `1 → 0..*` | `REL_PHRASE_DICTIONARY_001` |
| fact_008 | ৪ | Member | have | Email | ঐ | ঐ |
| fact_009 | ৪ | Member | have | PhoneNumber | ঐ | ঐ |
| fact_010 | ৫ | Librarian | delete *(`remove` alias)* | Book | | `EXT_ONLY_ACTOR_CAN_ACTION_OBJECT_001` |
| fact_011 | ৬ | System | responseTime | Performance | **NFR**, সংখ্যা নেই | `NFR_PERFORMANCE_KEYWORD_001` |
| fact_012 | ৭ | **(নেই)** | reserve | Book | `missingFields: [actor]` | `EXT_PASSIVE_OBJECT_ACTION_001` |

কিছু খুঁটিনাটি, কীভাবে হলো:
- **fact_001:** `"A library member"` → `normalize_entity` → `LibraryMember`; `"up to five books"` → শুরুর `up to` কাটা, `five` কাটা, `books→book` → `Book`।
- **fact_002–004:** `approve and reject and forward` প্রতিটা `action_aliases`-এ আছে → `_expand_action_object` তিনটা আলাদা fact বানায়, প্রতিটাতে `Request`।
- **fact_005/006:** Condition আসে পুরো *sentence* থেকে — `state_words`-এ `failed` আছে, তাই `"if the payment fails"` → `{subject: Payment, value: failed}`। দ্বিতীয় clause-এ actor ছিল না, তাই আগের clause-এর `System` নিল (warning: `Actor inferred from the preceding clause`)।
- **fact_007–009:** `has` → `relationship_phrases`-এ `association`। `"a full name, an email, a phone number"` `_split_coordinated` দিয়ে ৩ ভাগ হয়ে ৩টা আলাদা fact। কোনো quantifier না থাকায় default multiplicity `1 : 0..*` বসল + warning `Default multiplicity applied.`
- **fact_010:** `remove` → `action_aliases`-এ `"remove":"delete"`। `books that are damaged or lost` — relative clause কেটে ফেলা হলো, object শুধু `Book`।
- **fact_011:** `respond` / `quickly` `nfr_keywords → Performance`-এ আছে, metric `responseTime`। `within N seconds` ধরনের সংখ্যা নেই → `measurable = False`।
- **fact_012:** Passive (`can be reserved`) — কে reserve করবে বলা নেই, তাই `actor = None`।

### ধাপ ৫: Clarification Questions (৩টা)

| ID | Category | প্রশ্ন | কেন |
|---|---|---|---|
| CLR-001 | Vague Metric | *What measurable performance target should be used?* | fact_011: NFR, সংখ্যা নেই |
| CLR-002 | Missing Actor | *Who can reserve the Book?* | fact_012: action+object আছে, actor নেই |
| CLR-003 | Ambiguous Quantity | *How many Book are expected (give a number or range)?* | fact_012-এর source clause-এ `Some` (vague quantifier) |

ইউজার যদি CLR-002 এর উত্তরে `"Member"` দেয় → `fact_012.actor = Member`, `missingFields` খালি, `extractionType = CLARIFICATION_ANSWER`। পরের ধাপগুলো এই আপডেট হওয়া fact দিয়ে চলে।

### ধাপ ৬: Final Story (১২ সেকশন, clarification ছাড়া চালালে)
```
US-001-S1  The LibraryMember can borrow a Book.
US-001-S2  The Librarian must approve a Request.
US-001-S3  The Librarian must reject a Request.
US-001-S4  The Librarian must forward a Request.
US-001-S5  If Payment failed, the System must notify a Customer.
US-001-S6  If Payment failed, the System can update an Inventory.
US-001-S7  The Member can have a FullName.
US-001-S8  The Member can have an Email.
US-001-S9  The Member can have a PhoneNumber.
US-001-S10 The Librarian can delete a Book.
US-001-S11 The System must responseTime a Performance.
US-001-S12 The UnknownActor can reserve a Book.
```
(`S12`-এ `UnknownActor` — কারণ clarification-এ উত্তর দেওয়া হয়নি; `unresolvedFields: ["actor"]`।)

### ধাপ ৭: Requirements
```
FR-001  The system shall allow the LibraryMember to borrow the Book.
FR-002  The system shall allow the Librarian to approve the Request.
FR-003  … reject the Request.        FR-004 … forward the Request.
FR-005  If Payment failed, the system shall notify the Customer.
FR-006  If Payment failed, the system shall update the Inventory.
FR-007  The system shall allow the Member to have the FullName.
FR-008  … have the Email.            FR-009 … have the PhoneNumber.
FR-010  The system shall allow the Librarian to delete the Book.
BR-001  Only the Librarian may delete the Book.          ← source-এ "only" আছে
NFR-001 The system shall satisfy performance expectations.
FR-011  The system shall allow an unspecified actor to reserve the Book.
```

### ধাপ ৮: Class Model
**Scoring:** যেমন `Librarian` = ৪টা FR এর actor (fact + requirement দুই জায়গা থেকে) → অনেক বেশি score ⇒ Class। `FullName`, `Email`, `PhoneNumber` → attribute-জাতীয় ⇒ score মুছে ফেলা হলো, Class হয়নি। `Performance` → NFR requirement স্কিপ, fact থেকে object হিসেবে score পেলেও Class-এ কোনো method/attribute নেই ⇒ **eliminated**।

| Class | Attributes | Methods |
|---|---|---|
| Book | — | `borrow()`, `delete()` |
| Customer | — | `notify()` |
| Inventory | — | `update()` |
| Librarian | — | `approveRequest()`, `rejectRequest()`, `forwardRequest()`, `deleteBook()` |
| LibraryMember | — | `borrowBook()` |
| Member | `email: String`, `fullName: String`, `phoneNumber: String` | — |
| Request | — | `approve()`, `reject()`, `forward()` |
| System | — | `notifyCustomer()`, `updateInventory()` |

`Member`-এর attribute-গুলোর type এসেছে `data_type_hints` থেকে (`email→String`, `name→String`, `phone→String`)।

**Relationships (৭টা, সবই association, `1 → 0..*`):**
`Librarian → Book (delete)`, `Librarian → Request (approve / reject / forward)`, `LibraryMember → Book (borrow)`, `System → Customer (notify)`, `System → Inventory (update)`.

**Eliminated:** `["Performance"]`।

**Fix-এর পরে একই টেক্সটের Class Model** (§৫-এর fix গুলো দেওয়ার পর আসল output):

| Class | Attributes | Methods |
|---|---|---|
| Book | — | `borrow()`, `remove()` |
| Librarian | — | `approveRequest(request: Request)`, `rejectRequest(…)`, `forwardRequest(…)`, `removeBook(book: Book)` |
| Member | `email`, `fullName`, `phoneNumber` | `borrowBook(book: Book)` |
| … | | |

- `LibraryMember` → `Member`-এ merge (`mergedClasses: {"LibraryMember": "Member"}`)
- `Member → Book (borrow)` edge-এ এখন `1 → 0..5`
- `remove` শব্দটাই method-এ থাকে (`removeBook`), `deleteBook` না

### ধাপ ৯: XML
Validation পাস → প্রতিটা Class swimlane box, edge-এ arrow, `association` তাই `dashed=0` সাধারণ তীর — draw.io-তে খোলার মতো XML।

---

## ৫. উদাহরণ থেকে যে সীমাবদ্ধতাগুলো চোখে পড়ল — এবং এখন কী অবস্থা

এই উদাহরণ চালিয়ে যেগুলো ঠিকভাবে ধরা পড়েনি (প্রতিটার নিচে এখনকার অবস্থা লেখা):

1. **`LibraryMember` ও `Member` আলাদা Class হয়ে গেছে** — `"library member"` আর `"member"` একই জিনিস, কিন্তু pipeline নাম মিলিয়ে দেখে না, শুধু string দিয়ে দেখে।
   **✅ Fix:** `class_alias_map()` (pipeline.py)। `<Modifier><Head>` compound merge হয় `<Head>`-এ যখন (ক) modifier টা system-এর domain শব্দ (`"library management system"` → `library`), অথবা (খ) ঐ head-এর একমাত্র compound, দুটো একই বাক্যে নেই, compound টা **আগে** এসেছে (পরে ছোট নামে back-reference), আর compound টা কোনো "is a kind of" সংজ্ঞায় নেই। তাই `"A member can borrow… A librarian is a kind of staff member"`-এ `StaffMember` merge **হয় না**, কারণ এটা নতুন concept।
2. **`up to five books` থেকে multiplicity আসেনি।** Multiplicity বের করা হয় শুধু *relationship phrase* (`has`, `owns` …) fact-এ; `borrow` ধরনের সাধারণ action fact-এ নয়। তাই `LibraryMember → Book` edge-এ `0..5` না বসে default `0..*` বসেছে।
   **✅ Fix:** action fact-এর object থেকেও `_quantity_from_text` চলে। সংখ্যা-শব্দ (`five → 5`) পড়ে; `"no more than 3"`-কে আর `"no" → 0` খেয়ে ফেলে না (বহু-শব্দ idiom → সংখ্যার regex → একক শব্দ, এই ক্রমে)।
3. **NFR fact-এর story/requirement বিদঘুটে:** `"The System must responseTime a Performance."` — NFR-এর metric-কে action ধরা হয়েছে। Requirement ধাপে (`NFR-001`) এটা ঠিক শোনায়, কিন্তু story ধাপে নয়।
   **✅ Fix:** এখন story: `The system must meet the performance requirement: "The system should respond quickly" (no measurable target yet).`
4. **`approve` Class-এ `Request.approve()` ইত্যাদি lifecycle method সাধারণ template** — কোন parameter লাগে সেটা জানা যায় না (`parameters: []`)।
   **✅ Fix:** actor-এর method এখন typed parameter নেয়: `approveRequest(request: Request): void`। draw.io box-এও parameter দেখায়।
5. **Attribute শুধু কিছু ক্ষেত্রে আসে:** `Member`-এ এসেছে কারণ `has` list-এ primitive noun ছিল। কিন্তু `Book`-এর `title`/`isbn` এই টেক্সটে বলাই হয়নি, তাই আসেনি — pipeline নতুন কিছু আন্দাজ করে না।
   **এটা bug না।** টেক্সটে যা বলা নেই তা বানানো উচিত না। নতুন Class Modeler (§৭) state-শব্দ থেকে `status` enum আর "for each X" থেকে owner-এর attribute বের করে, কিন্তু না-বলা field বানায় না।
6. **`Book.delete()`** — `remove` → `delete`, সরাসরি alias; ইউজারের বলা শব্দ `remove` হারিয়ে যায় (`rawAction` fact-এ থেকে যায়)।
   **✅ Fix:** `verb_lemma()` দিয়ে class model-এ লেখকের নিজের verb থাকে (`removeBook`)। Canonical action শুধু তুলনা/dedupe-এর কাজে লাগে। Clarification-এ action বদলালে সেটাই জেতে।
7. **৭টা dictionary (`stopwords`, `conjunctions`, …) বসে আছে অথচ কোডে ব্যবহার হচ্ছে না** (§২ দেখো)।
   **✅ আংশিক Fix:** `articles` আর `conditional_markers` এখন pipeline-এ (`"provided that…"`, `"in case…"` condition চেনে)। `stopwords`, `temporal_markers`, `actor_hints`, `conjunctions` ব্যবহার হয় Class Modeler-এ। **`phrase_aliases` ইচ্ছা করে বাদ:** এর `"change password" → "changePassword"` টেক্সটে বসালে `"user can changePassword"` আর কোনো pattern-এ মেলে না, মানে fact হারিয়ে যায়।

এই কাজের সময় আরও দুটো bug ধরা পড়ে fix হয়েছে: `"Members can also reserve books"`-এ `also`-কে verb ধরা হতো (এখন modal-এর পরের adverb বাদ যায়), আর `"one or more accounts"` ভেঙে `MoreAccount` হতো (এখন quantity idiom সুরক্ষিত)।

---

## ৬. কোথায় কী বদলাতে হলে (দ্রুত সূচি)

| চাই | কোথায় বদলাবো |
|---|---|
| নতুন verb / synonym চেনাতে (`"purchase"`, `"enrol"`) | `action_aliases_extra.json` |
| নতুন relationship শব্দ (`"supervises"`) | `relationship_phrases_extra.json` |
| নতুন NFR keyword | `nfr_keywords.json` |
| কথ্য subject → actor (`"my team"`) | `narrative_actors.json` |
| কোনো noun Class হওয়া বন্ধ (field হবে) | `primitive_attributes.json` / `attribute_phrases.json` |
| Generic noun-কে Class হওয়া থেকে আটকাতে | `generic_nouns.json` |
| নতুন multiplicity শব্দ (`"a couple of"`) | `quantifiers.json` |
| নতুন condition state (`"escalated"`) | `state_words.json` |
| Class threshold / score (5, 4, ±) | `pipeline.py` → `generate_class_model` |
| Clarification প্রশ্নের ধরন/ভাষা | `pipeline.py` → `generate_clarifications` |
| নতুন sentence pattern (নতুন grammar) | `pipeline.py` → `extract_facts` (ক্রম গুরুত্বপূর্ণ — আগের pattern আগে জেতে) |

---

## ৭. নতুন: Class Modeler (OOP course-এর মতো class diagram)

UI-এর sidebar-এ **Class Diagram Generation** নামে নতুন tab (URL `#class-diagram-generation`)। একটা OOP task লিখে দাও (যেমন course-এ দিত), তারপর দুটো mode-এর একটা বাছো:

| Mode | কী করে | লাগে |
|---|---|---|
| **Rule-based** | `backend/app/rule_engine/oop_modeler.py`। Offline, deterministic, প্রতিটা সিদ্ধান্তের কারণ দেখায় | কিছু না (project-ও না) |
| **LLM-based** | দুটো provider থেকে বেছে নেওয়া যায়: **Ollama (local)**, মানে নিজের মেশিনের model (dropdown-এ installed model, যেমন `llama3.2:1b`, `qwen2.5:7b`), আর **My AI provider**, মানে AI Settings-এ add করা OpenAI/Claude/Gemini। একই noun/verb analysis JSON-এ করতে বলা হয়। ছোট Ollama model-এর জন্য ছোট JSON format দেওয়া হয় | একটা project select করা (LLM call project-এ log হয়)। Ollama হলে server চালু আর model pull করা (`ollama pull llama3.2`)। নিজের key বা Ollama, তাই platform-এর plan quota লাগে না |

API: `POST /api/v1/workspaces/{workspace_id}/class-modeler/generate`। Body `{text, mode: "rule_based"|"llm", project_id?, llm_provider?: "ollama"|"byok", model_name?}`। Installed Ollama model-এর list: `GET …/class-modeler/ollama-models`। দুই mode-এর response একই shape: `model {classes, relationships, enums}`, `drawioXml`, `analysis {sentences, nouns, verbs, generalisation, warnings}`।

Engine তিনটা: **Rule-based**, **LLM-based**, **Compare both** (দুটো একসাথে চালিয়ে পাশাপাশি)।

Result-এর ট্যাব:
- **Diagram**: নিজস্ব interactive UML diagram (React Flow)। Internet লাগে না। Zoom/pan/drag করা যায়, class-এ click করলে পাশে সহজ ভাষায় ব্যাখ্যা আসে (কী inherit করে, কাকে implement করে, প্রতিটা relationship-এর মানে)। Line-এ hover করলে যেমন লেখা আসে `"Each Member borrows up to 5 Books"`। পাশে **How to read this diagram** legend: inheritance, interface, composition ইত্যাদির চিহ্ন আর বর্তমান model থেকে উদাহরণ।
- **Step-by-step**: sentence → noun decision → verb → method।
- **Classes**: card-এ `is a X`, `implements Y`, `parent of …` লেখা; relationship গুলো সহজ বাক্যে।
- **draw.io**: একই model diagrams.net-এ (internet লাগে)।
- **Compare**: session-এর যেকোনো দুটো run বেছে নাও (Rule vs LLM, বা দুটো আলাদা টেক্সট)। Agreement %, দুটো diagram পাশাপাশি, class-ভিত্তিক attribute/method diff, relationship diff।

Download: **PNG** আর **SVG** (screen-এ যেভাবে সাজানো সেভাবে, internet ছাড়া), **XML** আর **.drawio** (diagrams.net), আর project-এ save। প্রতিটা generation **Runs** strip-এ জমা থাকে (session-এ শেষ ১২টা)।

### কোনো dictionary API কেন ব্যবহার করিনি
Online dictionary API মানে প্রতিটা শব্দে network call। এটা ধীর, offline-এ চলে না, আর একই input-এ একই output-এর নিশ্চয়তা থাকে না। spaCy/NLTK-ও install নেই (backend Python 3.14-এ চলছে)। তাই মানুষ যে নিয়মে ভাবে সেটাই rule হিসেবে লেখা, সাথে v1 dictionary গুলো।

### Hypothesis
OOP course-এ মানুষ Abbott-এর noun/verb analysis করে। নিয়মগুলো explicit করলে rule-based output course-এর হাতে-করা উত্তরের কাছে পৌঁছাবে:

1. **বাক্য চেনা।** প্রতিটা বাক্য কোন ধরনের: task statement (`"Design a … system"`), generalisation (`"is a kind of"`, `"There are two types of X: A and B"`, `"A and B are Xs"`), possible states (`"A book can be available, borrowed or lost"`), structure (`"has / contains / consists of / records"`), association (`"belongs to"`, passive `"is placed by"`), behaviour (বাকি সব verb), non-functional (system-এর quality)।
2. **প্রতিটা noun-এর সিদ্ধান্ত** (কারণসহ):
   - system নিজে / generic / UI শব্দ → **rejected**
   - নিজের data আছে (`X has …`) বা hierarchy-তে আছে → **class**
   - সাধারণ মান (name, date, amount, id …) → **attribute**
   - কাজ করে (verb-এর subject) → **class**
   - অন্য class এর উপর কাজ করে বা অনেকগুলো রাখে (`many books`) → **class**
   - শুধু একবার কারো একক property হিসেবে এসেছে (`"a book has an author"`) → **attribute**
   - `money`, `points`-এর মতো মান → **value** (method parameter: `deposit(amount: Decimal)`)
   - synonym → **merged** (§৫-এর alias নিয়ম)
3. **Verb → method।** যে কাজ করে তার class-এ method যায়, acted-on object হয় typed parameter: `Member.borrowBook(book: Book)`। বিশেষ ক্ষেত্র:
   - `"add products to a shopping cart"` → `ShoppingCart.addProduct(product)` (container-এর দায়িত্ব)
   - `"The system calculates the fine for each loan"` → `Loan.fine: Decimal` + `Loan.calculateFine()`
   - `"Books can be reserved"` (actor নেই) → `Book.reserve()`
   - `"cannot …"` → method না, constraint
4. **Relationship।** `is a` → inheritance; `contains / consists of` → composition; `has many` → aggregation; অন্য verb → association। একই জোড়ার একাধিক verb এক লাইনে আসে, label `borrow / reserve`। Multiplicity আসে quantifier থেকে (`up to five` → `0..5`, `one or more` → `1..*`, `exactly one` → `1`)। না বললে `1 → 0..*` বসে, আর UI-তে `(assumed)` দেখায়।
5. **Generalisation tidy-up।** সব subclass-এ যে attribute আছে সেটা parent-এ ওঠে (`accountNumber`, `balance` → `Account`)। `"types of"` থেকে parent হয় `«abstract»`।

### Library task-এর আসল output (rule-based)

```
Design a library management system. The library has many books. Each book has a title, an author,
an ISBN and a publication year. A book can be available, borrowed or lost. A library member has a
name, an email and a membership id. A member can borrow up to five books. Members can also reserve
books. A librarian is a kind of staff member. A staff member has an employee id and a salary. The
librarian can add, remove and update books. A loan records the borrow date and the due date. Each
loan belongs to exactly one member. The system calculates the fine for each loan. Members can log in.
The system should respond within 2 seconds.
```

| Class | Attributes | Methods |
|---|---|---|
| Book | `title: String`, `author: String`, `isbn: String`, `publicationYear: Integer`, `status: BookStatus` | — |
| Librarian ▷ StaffMember | — | `addBook(book: Book)`, `removeBook(book: Book)`, `updateBook(book: Book)` |
| Library | — | — |
| Loan | `borrowDate: Date`, `dueDate: Date`, `fine: Decimal` | `calculateFine()` |
| Member | `name`, `email`, `membershipId` | `borrowBook(book: Book)`, `reserveBook(book: Book)`, `login()` |
| StaffMember | `employeeId: String`, `salary: Decimal` | — |
| «enumeration» BookStatus | AVAILABLE, BORROWED, LOST | |

Relationships: `Library ◇— Book (1 → 0..*)`, `Member — Book borrow / reserve (1 → 0..5)`, `Librarian — Book add / remove / update`, `Loan — Member belongs to (0..* → 1)`, `Librarian ▷ StaffMember`।

Noun সিদ্ধান্ত: `LibraryMember` → merged into `Member`; `Author` → attribute (নিজের কোনো data বা কাজ নেই); `System` → rejected; শেষ বাক্য → Non-functional।

Bank, online shop, university, এই তিনটা task-ও test-এ আছে (`backend/tests/unit/test_oop_modeler.py`)।

### Interface, abstract class, inheritance

| লেখা | ফল |
|---|---|
| `"Payable is an interface with methods pay and refund."` / `"Define an interface called X that declares pay."` / `"The X interface declares …"` | `«interface» Payable` + `pay()`, `refund()` |
| `"Credit card payments and cash payments implement Payable."` / `"Circle implements Drawable."` | realization (dashed ▷)। Implement করা class-এ interface-এর সব method যোগ হয় |
| `"Shape is an abstract class."` / `"There are two types of X: A and B"` | `«abstract» Shape` |
| `"A librarian is a kind of staff member."`, `"Cars, motorcycles and trucks are vehicles."`, `"A user can be a student or a teacher."` | inheritance (▷) |
| সব subclass-এ একই attribute বা method থাকলে | parent-এ উঠে যায়। Interface-এ attribute ওঠে না |

### Generic কিনা: মাপা ফল
Rule গুলো বাক্যের গঠন দেখে কাজ করে, কোনো domain-এর শব্দ code-এ hardcode নেই। তিনটা আলাদা test set দিয়ে মাপা হয় (`cd backend && python -m tests.unit.oop_eval [-v] [--blind | --precision]`):

| Set | কী মাপে | ফল |
|---|---|---|
| `oop_eval_cases.py` (১২টা domain) | class, attribute, method, inheritance, multiplicity ঠিক এসেছে কিনা | ১০০% (223/223) |
| `oop_eval_cases_precision.py` (১২টা easy/medium) | প্রতিটা task-এর **পুরো** class list দেওয়া, তাই বাইরে যা আসে তা ভুল class | checks ১০০% (144/144), **class precision ১০০% (45/45), ভুল class ০টা** |
| `oop_eval_cases_blind.py` (১০টা, ২টা ইচ্ছা করে কঠিন) | এই set দেখে modeler tune করা হয়নি | ৭৯% → **৯০%** (134/148)। অন্য set-এর general fix-এ বেড়েছে |

### Precision: ভুল class যেন না আসে
যেসব rule false class আটকায়:
- **Junk নাম বাতিল:** parsing-এর ভুলে verb ঢুকে যাওয়া নাম (`MonthlyProducesPayslip`, `Headed`, `EmployeesWork`) কখনো class হয় না।
- **Mass/value noun:** article ছাড়া একবার বলা (`"Customers order food"`, `"Stock is updated"`) → value, class না। `money`, `points` → method parameter (`deposit(amount: Decimal)`)।
- **`its/their …`:** `"calculate its perimeter"` → subject-এর নিজের value, আলাদা class না।
- **Field list-এর plural:** `"An exercise has a name, sets and repetitions"` → `sets: Integer`, `repetitions: Integer`। অন্যদিকে `"many exercises"` (গোনা) → class।
- **Generic শব্দ** (`page`, `section`, `data` …): OOP প্রমাণ না থাকলে বাতিল। কিন্তু নিজের data আছে, কাজ করে, বা একাধিক বাক্যে এসেছে (যেমন course-এর `Section`) → class।
- **System নিজে**, আর কোনো attribute/method/link নেই এমন box → বাদ।

### "Proper" class diagram: attribute + method সহ
- `"A cinema has several halls"` → `Cinema.halls: List<Hall>` (whole তার part-এর list রাখে)।
- `"Each rental belongs to one customer"`, `"tickets for a show"`, `"A show is scheduled in a hall"` → `customer: Customer`, `show: Show`, `hall: Hall` reference field + association।
- `"A show … and plays a movie"`: এক subject-এর দুটো predicate আলাদা fact → `Show.playMovie(movie: Movie)`।
- `"A premium listener can download songs"` (Listener class থাকলে) → `PremiumListener ▷ Listener`।
- `"A manager is also an employee"` → inheritance (`also` বাধা দেয় না)।
- CamelCase নাম (`PaymentMethod`) আর possessive (`"employee's salary"`) ঠিক থাকে।

### কোনগুলো ঠিকঠাক পারে
প্রতিটা বাক্যে একটা ধারণা, OOP course-এর task যেভাবে লেখা হয়:
- `"A X has a …, a … and a …"` → typed attribute
- `"A X can <verb> Ys"`, `"X <verb>s Ys"`, `"Ys are <verb>ed by X"`, `"X is <verb>ed in Y"` → method + association
- `"X is a kind of Y"`, `"A and B are Ys"`, interface / implements / abstract → hierarchy
- `"can be A, B or C"` → enum
- `"up to five"`, `"one or more"`, `"exactly one"`, `"200 rooms"` → multiplicity
- phrasal verb (`"checks out guests"` → `checkOutGuest`), বুলেট বা নম্বর দেওয়া list, dictionary-তে নেই এমন verb (৩৯০টার বেশি সাধারণ verb-এর offline list)

### কঠিন বাক্য (দরকার নেই, শুধু জানিয়ে রাখা)
`"When a patient arrives …, the receptionist, who also handles billing, registers …"` বা `"Payroll runs monthly and produces payslips"`-এর মতো বাক্যে recall কম (৩৬% ও ১১%)। তবে precision rule-এর কারণে এখানেও junk class কম আসে। এমন বাক্য ভেঙে লিখলে, বা LLM mode ব্যবহার করলে ভালো ফল আসে।

### যা এখনও পারে না (সাধারণ)
- যে বাক্য বোঝা যায়নি সেটা "Not modelled" দেখায়, UI-তে লাল chip-এ।
- Pronoun resolution শুধু আগের বাক্যের subject পর্যন্ত যায় (`"They can also…"`)।
- Association-এর multiplicity টেক্সটে না থাকলে `1 → 0..*` ধরে নেয়, আর `assumed` দেখায়।
