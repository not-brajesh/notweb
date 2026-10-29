# NOTWEB

### Beyond Websites. Beyond Limits.

**One website. Multiple platforms. Unlimited possibilities.**

NOTWEB is an open-source platform designed to transform websites into responsive experiences and cross-platform applications through intelligent analysis, automated optimization, and AI-assisted development.

The long-term vision is to bring website analysis, responsive adaptation, Progressive Web App (PWA) generation, application wrapping, device previews, and AI-powered reconstruction together in one developer-friendly platform.

> **Project status:** Early development. Features described in the roadmap are planned and may not be implemented yet.

---

## The Vision

Building for multiple platforms often means managing separate tools, configurations, and workflows.

NOTWEB aims to simplify that process by bringing these capabilities into a unified workspace.

- **Analyze** — Understand a website's structure and behavior.
- **Adapt** — Identify and improve responsive layouts.
- **Preview** — Test experiences across different screen sizes.
- **Generate** — Prepare Progressive Web App configurations.
- **Wrap** — Explore packaging web experiences for supported platforms.
- **Reconstruct** — Use AI-assisted workflows to help developers improve or rebuild interfaces.

Our goal is to make the journey from website to multi-platform experience more accessible.

---

## Planned Features

| Feature | Description | Status |
|---|---|---|
| Website Analyzer | Inspect website structure and resources | Planned |
| Responsive Engine | Help identify layout and viewport issues | Planned |
| Device Preview | Preview layouts across device sizes | Planned |
| AI Engine | Support AI-assisted analysis and reconstruction | Planned |
| PWA Generator | Generate PWA-related files and configurations | Planned |
| Wrapper Engine | Prepare web experiences for application wrappers | Planned |
| Application Packager | Support packaging workflows for compatible platforms | Planned |
| Browser Extension | Provide browser-based access to NOTWEB tools | Planned |
| NOTWEB Studio | Offer a unified workspace for projects | Planned |
| Local-First Workflows | Prioritize local processing where practical | Planned |

Features will be marked as implemented only after they are working and tested.

---

## Architecture

NOTWEB is organized as a modular monorepo.

```text
notweb/
├── apps/
│   ├── studio/       # Main development workspace
│   ├── extension/    # Browser extension
│   ├── api/          # Optional API services
│   └── desktop/      # Desktop application
│
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── shared/              # Shared utilities and types
│   ├── website-analyzer/    # Website analysis
│   ├── responsive-engine/   # Responsive layout tools
│   ├── ai-engine/           # AI integration and orchestration
│   ├── device-preview/      # Device preview utilities
│   ├── wrapper-engine/      # Web application wrapping
│   ├── pwa-generator/       # PWA generation
│   └── app-packager/        # Application packaging
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── architecture/
│   ├── guides/
│   └── api/
│
├── scripts/
└── .github/
    └── workflows/
```

The architecture is intended to keep features modular, reusable, and independently testable.

---

## Technology Direction

The project is being developed with a modern TypeScript-oriented toolchain.

| Technology | Intended role |
|---|---|
| TypeScript | Type-safe application and package development |
| React | Interactive user interfaces |
| Node.js | Development tooling and backend services |
| pnpm | Package management and workspace dependencies |
| Turborepo | Monorepo task orchestration |
| ESLint | Code quality checks |
| Prettier | Consistent code formatting |
| Playwright | End-to-end testing |
| Local AI models | Optional AI-assisted workflows |

The exact stack may evolve as implementation and testing progress.

---

## Design Principles

### 1. Modular by Design
Features should be separated into reusable packages with clear responsibilities.

### 2. Local-First Where Practical
Prefer local processing when feasible. External AI services should be optional rather than a mandatory requirement for every workflow.

### 3. Developer-Friendly
Provide clear interfaces, predictable configuration, useful errors, and documented workflows.

### 4. Responsive by Default
Treat mobile, tablet, and desktop experiences as first-class targets.

### 5. Privacy-Conscious
Make data flows understandable and avoid transmitting website content to external services without an explicit, documented reason.

### 6. Open Source
Encourage community contributions, transparent development, and reproducible workflows.

---

## Getting Started

### Prerequisites

Install the following tools:

- Node.js 22 or a compatible supported version
- pnpm 10 or a compatible supported version
- Git

Check your installed versions:

```bash
node --version
pnpm --version
git --version
```

### Installation

Clone the repository:

```bash
git clone https://github.com/not-brajesh/notweb.git
cd notweb
```

Install workspace dependencies:

```bash
pnpm install
```

**Development note:** The repository is under active development. Installation alone does not guarantee that every application can run yet. Individual apps and packages need their respective configuration and scripts implemented.

---

## Development Commands

The root project is designed to support these commands as the relevant package scripts are implemented.

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm format
pnpm format:check
```

Some commands may remain unavailable until their dependencies and package-level scripts have been configured.

---

## Roadmap

### Stage 1 — Foundation
- [x] Establish the repository structure
- [x] Configure the pnpm workspace
- [x] Configure Turborepo
- [x] Establish TypeScript base settings
- [x] Establish formatting and linting configuration
- [ ] Complete dependency and script configuration
- [ ] Add continuous integration checks

### Stage 2 — Core Engine
- [ ] Define shared types and interfaces
- [ ] Implement website analysis
- [ ] Build responsive layout diagnostics
- [ ] Add device preview utilities
- [ ] Create automated tests

### Stage 3 — NOTWEB Studio
- [ ] Build the main interface
- [ ] Add project creation and management
- [ ] Integrate analysis results
- [ ] Add responsive preview workflows

### Stage 4 — AI and Generation
- [ ] Implement an AI provider abstraction
- [ ] Explore local-model integrations
- [ ] Generate PWA assets and configurations
- [ ] Add AI-assisted reconstruction workflows

### Stage 5 — Cross-Platform Workflows
- [ ] Develop the browser extension
- [ ] Build application wrapper workflows
- [ ] Explore desktop packaging
- [ ] Document platform-specific limitations

### Stage 6 — Reliability and Release
- [ ] Add unit and integration tests
- [ ] Add end-to-end tests
- [ ] Configure CI
- [ ] Publish developer documentation
- [ ] Prepare an initial public release

---

## Contributing

Contributions, bug reports, feature proposals, and documentation improvements are welcome.

Before contributing:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Review the project's current issues and roadmap.
3. Keep changes focused and testable.
4. Document new behavior and configuration.
5. Avoid committing credentials, API keys, or private website data.

For security-sensitive reports, follow [SECURITY.md](SECURITY.md).

---

## Security and Privacy

NOTWEB may eventually inspect website content, source code, and external resources.

Security-sensitive features must account for:

- Untrusted website content
- Malicious URLs and redirects
- Secret and credential exposure
- Safe handling of downloaded resources
- Permission boundaries for browser extensions
- Explicit consent for external AI processing

See [SECURITY.md](SECURITY.md) for reporting guidance.

---

## License

NOTWEB is distributed under the [MIT License](LICENSE).

---

## Project Philosophy

We believe developers should not need a completely different workflow for every platform.

NOTWEB aims to make website analysis, responsive optimization, and multi-platform development feel like parts of one connected process.

**Build once. Adapt intelligently. Reach more platforms.**

**NOTWEB — Beyond Websites. Beyond Limits.**

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
216
217
218
219
220
221
222
223
224
225
226
227
228
229
230
231
232
233
234
235
236
237
238
239
240
241
242
243
244
245
246
247
248
249
250
251
252
253
254
255
256
257
258
259
260
261
262
263
264
265
266
267
268
269
270
271
272
273
274
275
276
277
278
279
280
281
282
283
284
285
286
287
288
289
290
291
292
293
294
295
296
297
298
299
300
301
302
303
304
305
306
307
308
309
310
311
312
313
314
315
316
317
318
319
320
321
322
323
324
325
326
327
328
329
330
331
332
333
334
335
336
337
338
339
340
341
342
343
344
345
346
347
348
349
350
351
352
353
354
355
356
357
358
359
360
361
362
363
364
365
366
367
368
369
370
371
372
373
374
375
376
377
378
379
380
381
382
383
384
385
386
387
388
389
390
391
392
393
394
395
396
397
398
399
400
401
402
403
404
405
406
407
408
409
410
411
412
413
414
415
416
417
418
419
420
421
422
423
424
425
426
427
428
429
430
431
432
433
434
435
436
437
438
