RV UNIVERSITY, BENGALURU – 560 059
SCHOOL OF COMPUTER SCIENCE AND ENGINEERING

AGILE SOFTWARE ENGINEERING & DevOps
(CS2005) 2025-2026

PROJECT TITLE

"GIGMATCH ELITE"
Secure & Transparent Gig Economy Matchmaking Platform

Submitted by

Name 1: Prarthana [Add Last Name]   USN: [Add USN]
Name 2: [Add Name]                  USN: [Add USN]
Name 3: [Add Name]                  USN: [Add USN]
Name 4: [Add Name]                  USN: [Add USN]

Under the guidance of
PROF. Harikumar Vasudevan Pillai Santhibhavan
School of Computer Science and Engineering
RV University – 560059

---

RV UNIVERSITY, BENGALURU-59
SCHOOL OF COMPUTER SCIENCE AND ENGINEERING

CERTIFICATE

Certified that the project work titled "GigMatch Elite" is carried out by Prarthana [USN], [Name 2] [USN], [Name 3] [USN], [Name 4] [USN] in partial fulfilment of the completion of the course AGILE SOFTWARE ENGINEERING & DEVOPS with course code CS2005 of the IV Semester Computer Science Engineering programme, during the academic year 2025-2026. It is certified that all corrections/suggestions indicated for the Internal Assessment have been incorporated in the project report and duly approved by the faculty.

Signature of Faculty _____________________    Signature of Head of Department _____________________

---

# Table of Contents
1. Abstract
2. Introduction
3. Tools & Technologies Used
4. Version Control
5. Continuous Integration (CI)
6. Continuous Deployment (CD)
7. Serverless Architecture (In Lieu of Docker)
8. Infrastructure as Code (IaC)
9. Monitoring & Logging
10. Security Practices
11. Sprint Execution & Agile Artifacts
12. DevOps Demo Results
13. Lessons Learned
14. Conclusion
15. References
Appendix A: Technology Stack
Appendix B: Key Statistics
Appendix C: Glossary

---

# Abstract
GigMatch Elite is a premium, serverless gig-economy platform developed using Vanilla JavaScript, HTML5, CSS3, and Google Firebase. Built and delivered across multiple Agile sprints, the system automates the escrow-style gig workflow—from phone-based OTP verification to job matchmaking and milestone simulation—enabling independent workers and employers to connect securely.

The platform serves three primary user groups: Workers, Employers, and Administrators. Core capabilities include secure Mobile OTP authentication, Role-Based Access Control, real-time database syncing via Firestore SDKs, and a responsive Modern SaaS UI featuring high-fidelity typography. 

The project relied heavily on real-time DevOps methodologies. A fully automated CI/CD pipeline using GitHub Actions deploys the static application directly to GitHub Pages in under 20 seconds. Zero critical security issues were recorded in production, largely due to leveraging strict Firebase Security Rules instead of custom vulnerable backend routes.

# 1. Introduction

## 1.1 What is DevOps and Why It Matters
DevOps is a set of practices, cultural philosophies, and tools that combines software development (Dev) and IT operations (Ops) to shorten the development lifecycle. In academic projects like GigMatch Elite, adopting DevOps practices demonstrates an understanding of how modern applications are rapidly iterated and shipped without human intervention.

| DevOps Principle | How GigMatch Elite Implements It |
| :--- | :--- |
| **Version Control** | All code, design systems, and GitHub Action workflows are stored in GitHub with meaningful commits. |
| **Automate Everything** | GitHub Actions automatically fetches dependencies, configures the build, and publishes to the live server on every commit. |
| **Serverless Architecture** | Instead of manually provisioning Express.js servers or Docker containers, the app directly interfaces with Google Firebase, acting as a highly scalable Serverless frontend. |
| **Fail Fast, Fix Fast** | Live CI logs actively track if the deployment pipeline crashes, catching permission issues before they impact end users. |

## 1.2 DevOps in the Context of GigMatch Elite
GigMatch Elite is a strictly front-end-heavy application utilizing Backend-as-a-Service (BaaS). This drastically shifts the DevOps focus away from heavy Docker containerization and instead towards rapid static CI/CD integrations. The complexity lied in managing GitHub Pages configurations and resolving local Git Credential Manager collisions on Windows machines. By automating deployment, the team could focus entirely on feature velocity and design pivoting.

---

# 2. Tools & Technologies Used

| Category | Tool / Technology | Role in Project |
| :--- | :--- | :--- |
| **Version Control** | Git & GitHub | Local source control and remote code hosting |
| **CI/CD** | GitHub Actions | Automated build and deployment to GitHub Pages |
| **Frontend Languages** | HTML5, CSS3, ES6 JS | Core application skeleton, responsive styling, and client-side logic |
| **UI Design System** | Georgia / Modern CSS Grid | "Old Money" premium aesthetic mapped directly against 4-column modern footers |
| **Authentication** | Firebase Auth (OTP) | Secure telephone-based user identity and reCAPTCHA enforcement |
| **Database** | Google Firestore | Real-time NoSQL cloud database for Job Postings and Profiles |
| **Deployment** | GitHub Pages | Live cloud hosting environment for the static files |
| **IDE** | VS Code | Primary development environment |

---

# 3. Version Control

## 3.1 Git and GitHub
Git was utilized for all source code versioning in GigMatch. The remote repository (`prartzz/gigmatch`) was instantiated and securely managed via encrypted SSH/HTTPS tokens. 

## 3.2 Branching Strategy
Due to the MVP nature of the application and the small team size, a simplified **Trunk-Based Development** model was used:
- **main:** The sole production branch. Every commit directly pushes high-priority features to live. 
- Fast-iteration fixes (like resolving the CSS flexbox container squish) were pushed locally and integrated quickly to trigger the CD pipeline.

## 3.3 Commit Conventions
Clear descriptive commits were utilized to trace bugs to exact modifications. Examples from the repository:
- `Initial Launch - GigMatch v1.0` - Base deployment triggering the first GitHub Action.
- `Fix UI squishing on register and apply Georgia font` - Direct resolution for mobile flexbox overflows and global typography overrides.

---

# 4. Continuous Integration (CI)

Continuous Integration in GigMatch was seamlessly paired with Continuous Deployment through GitHub Actions. Rather than executing heavy unit tests (as the backend logic is handled internally by Firebase), the CI pipeline focused heavily on **Environment Validation** and **Artifact Generation**. 

## 4.1 GitHub Actions Workflow (`deploy.yml`)
The workflow operates on every push to the `main` branch. It allocates an `ubuntu-latest` secure runner environment to process the static files limitlessly.

**Pipeline Stage Breakdown:**
1. **Checkout Code:** Uses `actions/checkout@v4` to pull down the repository locally on the runner.
2. **Setup Pages:** Configures the repository settings context (`actions/configure-pages@v4`).
3. **Upload Artifact:** `actions/upload-pages-artifact@v3` bundles the HTML, JS, and CSS into a secure `.tar` artifact natively within the GitHub ecosystem.

---

# 5. Continuous Deployment (CD)

## 5.1 Deployment Architecture
Once the CI artifact is bundled, Continuous Deployment executes autonomously. 
- **Platform:** GitHub Pages Context.
- **Workflow Step:** `actions/deploy-pages@v4` connects to the `github-pages` environment namespace and injects the artifact directly to the external server URL.
- **Duration:** The entire cycle from `git push` to a live globally-accessible update takes approximately **15 - 20 seconds**.

## 5.2 Environment Variables & Configs
Unlike traditional backends, Firebase API keys (`authDomain`, `projectId`, `apiKey`) were safely permitted within the public client. True environment security was enforced entirely via Google Console instead of traditional `.env` files.

---

# 6. Serverless Architecture (In Lieu of Docker)

*Note: As this application operates on a pure Backend-as-a-Service (BaaS) model via Google Firebase, heavy containerization orchestration (like Docker or Kubernetes) was deemed architecturally inappropriate and redundant.*

GigMatch utilizes a **Serverless Frontend Model**:
- The client-side ES6 modules (`js/firebase-config.js`) hook directly into Google's highly distributed cloud infrastructure via WebSockets and REST.
- Scaling, load-balancing, and Database uptime are abstracted and managed by Google Cloud Platform, effectively rendering local server operations non-existent.

---

# 7. Infrastructure as Code (IaC)

In GigMatch, Infrastructure as Code is fulfilled entirely by the `.github/workflows/deploy.yml` pipeline file. This YAML configuration provisions the cloud Ubuntu runner, configures the environment routing parameters, and handles permission scopes required to write to the Pages domains without human clicks. 

---

# 8. Monitoring & Logging

## 8.1 CI/CD Workflow Execution Logs
The GitHub Actions terminal provides rich, real-time logging. Errors—such as failing to switch the repository base branch pointing to 'GitHub Actions'—were monitored strictly through the Actions dashboard UI.

## 8.2 Firebase Console Analytics
Uptime and interaction logging were monitored natively via Firebase Console. The console tracks active Daily Active Database Connections, OTP Request Volumes (preventing SMS brute-forcing), and payload limits per network request. 

---

# 9. Security Practices

## 9.1 Authentication & Authorisation
Authentication was locked heavily behind **Firebase Phone Authentication**. 
- Required real phone numbers.
- Integrated invisible **reCAPTCHA** to prevent bot-nets from flooding the user database.
- Implemented **Role-Based Routing**: Once logged in via OTP, the UI filters render states based strictly on the JSON payload attribute (`Worker`, `Employer`, `Admin`).

## 9.2 Firestore Security Rules
To prevent sensitive data breaches (since API keys are public), strict Document Rules are deployed on the Firebase backend:
- Unauthenticated users cannot read or write any Job data.
- Only the specific employer UID who created a job payload has the right to mutate or finalize its Escrow state.

---

# 10. Sprint Execution & Agile Artifacts

## 10.1 Sprint Summary

**Sprint 1: Architecture & UX Blueprint**
- Defined the "Old Money" aesthetic variables (`var(--primary-main) #8C7355`).
- Initialized core index arrays.
 
**Sprint 2: Firebase Integration & Mobile Auth**
- Connected `firebase-config.js`.
- Constructed `mobile-register.html` including the multi-step form workflow and role JSON selection.

**Sprint 3: Dashboard Discovery & State Machine**
- Engineered dynamic filtering (by Location, Category, Rate) in `jobs-discover.html`.
- Implemented the entire Workflow Lifecycle Machine natively (Pending -> Action -> Completed) alongside Mock Razorpay UI toggles.

**Sprint 4: DevOps & Final Polish**
- Integrated the `.github/workflows/deploy.yml` CI/CD pipeline.
- Audited horizontal flexbox overflows inside 480px constraints to ensure a responsive build layout across all screens.
- Overhauled overarching Typography logic to default to global `Georgia, serif` rendering.

---

# 11. DevOps Demo Results

**End-to-End Deployment Flow (April 2026):**
1. Bug discovered locally: Role selection cards were overflowing (`flex-direction: row` inside a `max-width: 480px` container).
2. Bug patched locally alongside global Typography adjustments.
3. Code pushed via Git Bash (`git push -u origin main`).
4. GitHub Actions runner picked up the webhook payload natively.
5. Ubuntu environment spun up natively, checked out code, bundled the archive.
6. The archive was successfully deployed to `github-pages`.
7. **Total Resolution Time:** < 2 minutes from Bug Identification to Live Global Patch. 

---

# 12. Lessons Learned

**What Went Well:**
- **Serverless Scaling:** Firebase completely freed up development time to focus purely on UI and business logic instead of spending weeks fighting with Python/Node.js configurations.
- **Pipeline Deployment:** Automating deployment via GitHub Actions removed the manual drag-and-drop bottlenecks associated with standard FTP or basic cloud uploads.

**What Could Be Improved:**
- **Git Credential Conflicts:** Initial pushes to GitHub were blocked by HTTP 403 errors due to cached Windows Credential Manager `cmdkey` states storing older school accounts. Navigating local OS caching was a steep learning curve.
- **Workflow Permissions:** The CI configuration initially failed because GitHub defaults newly generated repositories to restrict Workflow Read/Write permissions for Pages, requiring manual repository setting overrides.

---

# 13. Conclusion

This report has documented the agile lifecycle and CI/CD implementation for **GigMatch Elite**. By leveraging highly customized Serverless Architecture and automated Pipeline Deployments, the platform sidesteps traditional hardware constraints and focuses purely on high-fidelity user interactions and safe gig economy job tracking. The adoption of proper DevOps philosophy—automating testing environments and enforcing strict infrastructure-as-code deployments—ensures the code repository serves as a single, fully deployable source of truth.

---

# 14. References
1. GitHub Actions Documentation. (2024). Automate workflows. https://docs.github.com/en/actions
2. Firebase Authentication Documentation. (2024). Secure Auth limits. https://firebase.google.com/docs/auth
3. Cloud Firestore Documentation. (2024). Securing Data. https://firebase.google.com/docs/firestore

---

## Appendix A: Technology Stack
- **Languages:** HTML5, CSS3, Vanilla ES6 JavaScript
- **Backend:** Google Firebase (Auth, Firestore DB)
- **CI/CD Orchestration:** GitHub Actions
- **Hosting Infrastructure:** GitHub Pages
- **Development Editor:** Visual Studio Code

## Appendix B: Key Project Statistics two
- **Total Production Logic Pages:** 8 Core Workflows
- **Database Architecture:** Serverless NoSQL Document Collections
- **Sprint Duration:** 4 Active Sprints
- **CI/CD Pipeline Duration:** < 20 seconds
- **Authentication Method:** Phone OTP (+91) securely backed by reCAPTCHA

## Appendix C: Glossary
- **CI/CD:** Continuous Integration & Continuous Deployment.
- **Serverless / BaaS:** Backend-As-A-Service (e.g., Firebase) where server operations are abstracted away.
- **IaC:** Infrastructure as Code.
- **OTP:** One-Time Password format used in lieu of unsecure email/password hashing models.
- **Role-Based Access Control (RBAC):** UI and logic access strictly dictated by the user's defined account type (`Worker`, `Employer`).
