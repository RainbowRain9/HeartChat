# Gemini Project Context: HeartChat

This document provides a comprehensive overview of the HeartChat project for the Gemini AI assistant.

## 1. Project Overview

HeartChat is an AI-powered emotional companion application built as a WeChat mini-program. It aims to provide users with a safe and private space to express their feelings, gain self-awareness, and improve their emotional intelligence.

**Core Features:**

*   **AI Chat:** Users can converse with various AI personas (roles).
*   **Emotion Analysis:** Real-time analysis of user's emotions based on their text input.
*   **Daily Mood Reports:** Generates personalized daily reports summarizing the user's emotional state, key topics of conversation, and even a "fortune" for the day.
*   **User Profiling:** Creates a user profile based on conversations, identifying interests, personality traits, and communication style.
*   **Customizable Roles:** Users can create and customize their own AI chat partners.

## 2. Technical Architecture

The project follows a standard WeChat mini-program architecture, utilizing its cloud development ecosystem.

*   **Frontend:**
    *   **Framework:** Native WeChat Mini-program (JavaScript).
    *   **UI:** Uses custom components and makes use of the ECharts library for data visualization.
    *   **Styling:** WXSS.

*   **Backend:**
    *   **Platform:** WeChat Cloud Functions (Node.js).
    *   **Database:** WeChat Cloud Database (a MongoDB-like NoSQL database).

*   **AI Services:**
    *   The application is heavily reliant on the **Zhipu AI (智谱AI)** service for its intelligent features.
    *   **LLM:** GLM-4-Flash is used for chat responses, summaries, and analysis.
    *   **Embeddings:** Embedding-3 is used for generating word vectors for deeper analysis.

## 3. Building and Running

### 3.1. Prerequisites

*   **WeChat DevTools:** The primary IDE for development and debugging.
*   **Node.js & npm:** For dependency management.

### 3.2. Setup & Execution

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Open in DevTools:**
    *   Open the WeChat DevTools.
    *   Import the project from the `D:\Code\HeartChat` directory.
    *   The `project.config.json` file contains the necessary configuration, including the `appid`.
3.  **Running the Frontend:**
    *   The mini-program can be previewed and debugged directly within the WeChat DevTools.
4.  **Deploying the Backend:**
    *   Cloud functions are located in the `cloudfunctions/` directory.
    *   They must be deployed to the associated WeChat Cloud environment. This is typically done by right-clicking the function directory in the DevTools and selecting "Upload and Deploy".

### 3.3. Key Scripts

The `package.json` file defines the following utility scripts:

*   `npm test`: Runs the Jest test suite.
*   `npm run lint`: Lints the codebase using ESLint.
*   `npm run format`: Formats the code using Prettier.

## 4. Development Conventions

### 4.1. Code Style

*   The project uses **ESLint** for linting and **Prettier** for code formatting.
*   **Key Style Rules:**
    *   Indentation: 2 spaces.
    *   Quotes: Single quotes.
    *   Semicolons: Required at the end of statements.
    *   Trailing Commas: Not used.
*   These rules are automatically enforced on commit via a `pre-commit` hook managed by Husky and lint-staged.

### 4.2. Git Workflow

*   **Commit Messages:** Commits should follow a conventional format: `[type] description` (e.g., `feat: Add daily report feature`, `fix: Correct chat timestamp display`).
*   **Branching:** (Inferring from common practice) Use feature branches for new development and create pull requests to merge into a main branch.

### 4.3. Testing

*   **Framework:** Jest is configured for unit and integration testing.
*   **Test Files:** Test files are located alongside the source code in `__tests__` directories or with `.spec.ts`/`.test.ts` extensions.
*   **Configuration:** `jest.config.js` contains the full testing configuration.

### 4.4. Documentation

*   The `/docs` directory is a rich source of information, containing detailed design documents, development plans, and usage guides.
*   The `README.md` file provides a high-level overview and is the best starting point for understanding the project's history and structure.
