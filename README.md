<div align="center">

# NOTWEB

### Beyond Websites. Beyond Limits.

**One website. Multiple platforms. Unlimited possibilities.**

An open-source, local-first platform designed to transform websites into responsive experiences, installable Progressive Web Apps, and cross-platform applications.

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-technology-stack) • [Roadmap](#-roadmap) • [Contributing](#-contributing)

<br>

![Status](https://img.shields.io/badge/Status-Early%20Development-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Local--First-purple?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen?style=for-the-badge)

</div>

---

## 🌌 What Is NOTWEB?

NOTWEB is an ambitious open-source project that aims to simplify the process of transforming websites into applications for different devices and platforms.

The project combines a browser extension, an intelligent development studio, website analysis tools, responsive previews, and application packaging workflows into one unified ecosystem.

Instead of manually rebuilding every website for every platform, NOTWEB aims to automate as much of the process as possible.

**Our vision:** Make website-to-application transformation accessible, customizable, and developer-friendly.

> Build once. Adapt everywhere.

## ✨ Features

### 🌐 1. Browser Extension

Capture and analyse websites directly from the browser.

- Capture website URLs and page metadata.
- Inspect accessible page structure and layout information.
- Send website information to NOTWEB Studio.
- Start conversion workflows from a browser toolbar.
- Manage captured projects.

### 🧠 2. Intelligent Website Analysis

Analyse website structure to help determine the best conversion strategy.

- Inspect page structure and styles.
- Identify layouts and reusable UI components.
- Analyse navigation and responsive behaviour.
- Detect potential compatibility issues.
- Recommend an appropriate conversion approach.

The initial implementation will use local processing wherever practical.

### 🎨 3. Responsive Design Engine

Preview and optimise application layouts for different screen sizes.

- Mobile phones.
- Tablets.
- Laptops.
- Desktop monitors.
- Custom viewport dimensions.

The goal is to identify layout problems and generate improvements without requiring manual testing on every physical device.

### ⚡ 4. Hybrid Conversion Engine

NOTWEB will support three complementary approaches.

| Mode | Purpose |
|---|---|
| Website Wrapper | Display an existing website inside an application shell. |
| UI Reconstruction | Generate an editable implementation inspired by an accessible website's structure and appearance. |
| Responsive Optimisation | Analyse and improve layouts for different screen sizes. |

The appropriate approach will depend on the website, its permissions, technical constraints, and the user's requirements.

### 📱 5. Progressive Web Apps

Generate installable web application projects with features such as:

- Web app manifest.
- Application icons.
- Installation support.
- Service worker integration.
- Optional offline functionality.

Offline capabilities will depend on the application's architecture and available resources.

### 💻 6. Cross-Platform Applications

NOTWEB aims to support application packaging workflows for:

- Android.
- iOS.
- macOS.
- Windows.

The project will initially prioritise a working web application and PWA workflow before expanding into desktop and mobile packaging.

Some targets require additional platform-specific development tools, signing credentials, or developer accounts.

### 🔒 7. Local-First AI

NOTWEB is designed around a local-first philosophy.

- Prefer local processing when practical.
- Support compatible open-source AI models.
- Avoid mandatory paid AI APIs in the core workflow.
- Keep user control and privacy central to the design.
- Make processing requirements and limitations transparent.

Local AI capabilities will depend on the selected model and available hardware.

---

## 🏗️ Architecture

NOTWEB uses a modular monorepo architecture so individual components can evolve independently.

```text
NOTWEB/
│
├── apps/
│   ├── studio/                  # Main development studio
│   ├── extension/               # Browser extension
│   ├── api/                     # Backend API
│   └── desktop/                 # Desktop application
│
├── packages/
│   ├── ui/                      # Shared UI components
│   ├── shared/                  # Shared utilities and types
│   ├── website-analyzer/        # Website inspection
│   ├── responsive-engine/      # Responsive analysis
│   ├── ai-engine/               # Local AI integration
│   ├── device-preview/          # Device viewport previews
│   ├── wrapper-engine/          # Website wrapper workflows
│   ├── pwa-generator/           # PWA project generation
│   └── app-packager/            # Platform packaging
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
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

*This is the planned architecture. Individual components will become functional as development progresses.*

## 🛠️ Technology Stack

| Component | Planned Technology |
|---|---|
| Language | TypeScript |
| Browser Extension | WXT |
| Studio Frontend | React + Next.js |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | Node.js + Fastify |
| Monorepo | pnpm + Turborepo |
| Browser Automation | Playwright |
| Testing | Vitest + Playwright |
| PWA Generation | Vite + PWA tooling |
| Desktop Packaging | Tauri |
| Mobile Packaging | Capacitor |
| AI | Compatible local open-source models |
| Version Control | Git + GitHub Actions |

The final stack may evolve as the project develops and technical requirements become clearer.

## 🚀 Development Roadmap

NOTWEB is currently in its early development stage. The following milestones describe the intended development sequence.

### Phase 1 — Project Foundation
- [x] Create the GitHub repository.
- [x] Establish the initial project directory structure.
- [ ] Configure Git and automated quality checks.
- [ ] Set up the monorepo workspace.
- [ ] Add development documentation.

### Phase 2 — Browser Extension
- [ ] Create the extension interface.
- [ ] Capture the active tab's URL and metadata.
- [ ] Extract permitted page structure information.
- [ ] Connect the extension to NOTWEB Studio.
- [ ] Add error handling and permission controls.

### Phase 3 — NOTWEB Studio
- [ ] Build the main dashboard.
- [ ] Add URL-based project creation.
- [ ] Create a website analysis interface.
- [ ] Add responsive device previews.
- [ ] Add project history and export controls.

### Phase 4 — Conversion Engine
- [ ] Implement the website wrapper workflow.
- [ ] Build the first responsive analysis engine.
- [ ] Generate basic PWA projects.
- [ ] Add editable UI reconstruction.
- [ ] Validate generated projects automatically.

### Phase 5 — Local AI
- [ ] Integrate a compatible local model.
- [ ] Add AI-assisted layout analysis.
- [ ] Generate and refine UI components.
- [ ] Add model configuration and resource checks.

### Phase 6 — Cross-Platform Packaging
- [ ] Add desktop application packaging.
- [ ] Add Android packaging.
- [ ] Investigate and implement iOS workflows.
- [ ] Add platform-specific validation.
- [ ] Document signing and distribution requirements.

### Phase 7 — Release
- [ ] Complete automated tests.
- [ ] Publish installation instructions.
- [ ] Add example projects.
- [ ] Prepare the first public release.

**Roadmap note:** These are planned features, not claims that the functionality is already implemented.

## 💻 Getting Started

The project scaffold is being prepared. Installation instructions will be updated once the workspace configuration and initial applications are implemented.

### Prerequisites

The planned development environment includes:

- macOS, Linux, or Windows.
- Node.js with a supported LTS release.
- pnpm.
- Git.
- A Chromium-based browser for initial extension development.

Additional tools will be required for some desktop and mobile targets.

### Future Setup

The intended setup workflow will look similar to:

```bash
git clone https://github.com/not-brajesh/notweb.git

cd notweb

pnpm install

pnpm dev
```

**Note:** These commands are illustrative until the root package scripts and application configurations are implemented.

## 🔐 Security and Privacy

Security is a core design consideration.

NOTWEB will aim to:

- Request only the browser permissions it needs.
- Avoid collecting website credentials.
- Keep sensitive configuration out of source control.
- Validate URLs before accessing websites.
- Restrict local services to trusted origins where appropriate.
- Avoid executing untrusted website code directly on the host.
- Make external network requests transparent.
- Provide clear controls for website capture and export.

Website access may be limited by authentication, browser security policies, cross-origin restrictions, content protection, or website terms.

NOTWEB does not promise to bypass those restrictions.

## ⚖️ Important Limitations

Not every website can be converted perfectly into a native application.

For example:

- Some websites require their original backend.
- Authentication and payment workflows may require special handling.
- Protected resources may not be accessible.
- Generated interfaces may need manual refinement.
- iOS and desktop packaging may require platform-specific configuration.
- Some applications depend on capabilities that cannot be reproduced by a generic wrapper.

NOTWEB will focus on transparent conversion workflows rather than claiming that every website can be converted automatically without limitations.

## 🤝 Contributing

Contributions, bug reports, feature requests, and technical discussions are welcome.

Before contributing:

1. Check existing issues.
2. Describe the proposed change.
3. Keep pull requests focused.
4. Include tests where appropriate.
5. Document significant architectural changes.
6. Never commit secrets or private credentials.

Contribution instructions will be expanded as the development workflow becomes available.

## 🗺️ Project Principles

NOTWEB is guided by five principles:

1. **Open Source:** Make the platform accessible to developers.
2. **Local First:** Prefer local execution when practical.
3. **Modular Architecture:** Keep components reusable and maintainable.
4. **User Control:** Make generated output editable and exportable.
5. **Honest Automation:** Clearly communicate limitations and failures.

## 📜 License

NOTWEB is intended to use the MIT License.

The repository's final licensing terms will be established when the `LICENSE` file is populated.

## 🌟 Support the Project

If you find the project interesting:

- ⭐ Star the repository.
- 🐛 Report bugs.
- 💡 Suggest improvements.
- 🧪 Test early versions.
- 🤝 Contribute code and documentation.

Every contribution helps move the project forward.

---

<div align="center">

### NOTWEB

**Beyond Websites. Beyond Limits.**

*An open-source vision for turning the web into applications.*

[GitHub Repository](https://github.com/not-brajesh/notweb)

</div>