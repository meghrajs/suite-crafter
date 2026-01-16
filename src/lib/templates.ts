import { ProjectConfig } from './types';
import { FileEntry } from './folderTree';

// TypeScript Templates
function generateTypeScriptPackageJson(config: ProjectConfig): string {
  const scripts: Record<string, string> = {
    "test": "npx playwright test",
    "test:ui": "npx playwright test tests/ui",
    "test:headed": "npx playwright test --headed",
    "test:debug": "npx playwright test --debug",
    "report": "npx playwright show-report",
  };

  if (config.includeAPI) {
    scripts["test:api"] = "npx playwright test tests/api";
  }

  const dependencies: Record<string, string> = {
    "@playwright/test": "^1.40.0",
    "dotenv": "^16.3.1",
  };

  if (config.apiFramework === 'axios') {
    dependencies["axios"] = "^1.6.0";
  }

  return JSON.stringify({
    name: config.projectName,
    version: "1.0.0",
    description: config.description || "Automation test framework",
    author: config.author || "",
    scripts,
    devDependencies: dependencies,
  }, null, 2);
}

function generatePlaywrightConfig(config: ProjectConfig): string {
  return `import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`;
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      baseUrl: ".",
      paths: {
        "@/*": ["src/*"]
      }
    },
    include: ["src/**/*", "tests/**/*"],
    exclude: ["node_modules"]
  }, null, 2);
}

function generateTsBasePage(): string {
  return `import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  protected getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ path: \`screenshots/\${name}.png\` });
  }
}
`;
}

function generateTsLoginPage(): string {
  return `import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-testid="username"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.submitButton = page.locator('[data-testid="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/.*dashboard/);
  }
}
`;
}

function generateTsLoginSpec(): string {
  return `import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('Login Page Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('[data-testid="username"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async () => {
    await loginPage.login('invalid@email.com', 'wrongpassword');
    await loginPage.expectErrorMessage('Invalid credentials');
  });

  test('should login successfully with valid credentials', async () => {
    await loginPage.login('test@example.com', 'password123');
    await loginPage.expectLoginSuccess();
  });
});
`;
}

function generateTsApiSpec(): string {
  return `import { test, expect } from '@playwright/test';

test.describe('Users API Tests', () => {
  const baseURL = process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com';

  test('GET /users - should return list of users', async ({ request }) => {
    const response = await request.get(\`\${baseURL}/users\`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
  });

  test('GET /users/1 - should return single user', async ({ request }) => {
    const response = await request.get(\`\${baseURL}/users/1\`);
    
    expect(response.ok()).toBeTruthy();
    const user = await response.json();
    expect(user).toHaveProperty('id', 1);
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
  });

  test('POST /users - should create new user', async ({ request }) => {
    const newUser = {
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
    };

    const response = await request.post(\`\${baseURL}/users\`, {
      data: newUser,
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    
    const createdUser = await response.json();
    expect(createdUser).toHaveProperty('id');
    expect(createdUser.name).toBe(newUser.name);
  });

  test('DELETE /users/1 - should delete user', async ({ request }) => {
    const response = await request.delete(\`\${baseURL}/users/1\`);
    expect(response.ok()).toBeTruthy();
  });
});
`;
}

function generateTsUtils(): string {
  return `import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface Config {
  baseUrl: string;
  apiBaseUrl: string;
  timeout: number;
  retries: number;
  headless: boolean;
}

export function loadConfig(env: string = 'dev'): Config {
  const configPath = path.join(__dirname, '../../config', \`\${env}.json\`);
  
  if (fs.existsSync(configPath)) {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return {
      baseUrl: process.env.BASE_URL || fileConfig.baseUrl,
      apiBaseUrl: process.env.API_BASE_URL || fileConfig.apiBaseUrl,
      timeout: parseInt(process.env.TIMEOUT || fileConfig.timeout || '30000'),
      retries: parseInt(process.env.RETRIES || fileConfig.retries || '0'),
      headless: process.env.HEADLESS !== 'false',
    };
  }

  return {
    baseUrl: process.env.BASE_URL || 'https://example.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.example.com',
    timeout: 30000,
    retries: 0,
    headless: true,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateRandomEmail(): string {
  return \`test.\${Date.now()}@example.com\`;
}
`;
}

function generateEnvExample(): string {
  return `# Base URLs
BASE_URL=https://example.com
API_BASE_URL=https://api.example.com

# Test Configuration
TIMEOUT=30000
RETRIES=0
HEADLESS=true

# CI/CD
CI=false
`;
}

function generateGitignore(language: string): string {
  const common = `# Dependencies
node_modules/
.pnpm-store/

# Test Results
test-results/
playwright-report/
allure-results/
allure-report/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
`;

  if (language === 'java') {
    return common + `
# Java
target/
*.class
*.jar
*.war
.gradle/
build/
`;
  }

  if (language === 'python') {
    return common + `
# Python
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
.venv/
venv/
*.egg-info/
dist/
`;
  }

  return common;
}

function generateReadme(config: ProjectConfig): string {
  const { projectName, language, includeUI, includeAPI, buildTool, includeDocker } = config;
  
  let installCmd = '';
  let testCmd = '';
  
  if (language === 'typescript') {
    installCmd = buildTool === 'pnpm' ? 'pnpm install' : 'npm install';
    testCmd = buildTool === 'pnpm' ? 'pnpm test' : 'npm test';
  } else if (language === 'java') {
    installCmd = buildTool === 'maven' ? 'mvn clean install -DskipTests' : './gradlew build -x test';
    testCmd = buildTool === 'maven' ? 'mvn test' : './gradlew test';
  } else if (language === 'python') {
    installCmd = buildTool === 'poetry' ? 'poetry install' : 'pip install -r requirements.txt';
    testCmd = 'pytest';
  }

  return `# ${projectName}

${config.description || 'Automation test framework generated by SuiteMate'}

## Prerequisites

${language === 'typescript' ? '- Node.js 18+ and npm/pnpm' : ''}
${language === 'java' ? '- Java 17+ and Maven/Gradle' : ''}
${language === 'python' ? '- Python 3.9+ and pip/poetry' : ''}
${includeUI ? '- Chrome browser installed' : ''}

## Installation

\`\`\`bash
${installCmd}
${language === 'typescript' && includeUI ? 'npx playwright install' : ''}
\`\`\`

## Configuration

1. Copy \`.env.example\` to \`.env\`
2. Update the values as needed

## Running Tests

### Run all tests
\`\`\`bash
${testCmd}
\`\`\`

${includeUI ? `### Run UI tests only
\`\`\`bash
${language === 'typescript' ? 'npm run test:ui' : testCmd + ' -Dgroups=ui'}
\`\`\`` : ''}

${includeAPI ? `### Run API tests only
\`\`\`bash
${language === 'typescript' ? 'npm run test:api' : testCmd + ' -Dgroups=api'}
\`\`\`` : ''}

### Run in headed mode (UI tests)
\`\`\`bash
${language === 'typescript' ? 'npm run test:headed' : testCmd + ' -Dheadless=false'}
\`\`\`

## Reports

${language === 'typescript' ? `View HTML report:
\`\`\`bash
npm run report
\`\`\`` : ''}

${language === 'java' ? `Surefire reports: \`target/surefire-reports/\`` : ''}

## Project Structure

\`\`\`
${projectName}/
├── ${language === 'typescript' ? 'src/' : 'src/test/'}
│   ├── ${includeUI ? (language === 'typescript' ? 'pages/' : 'java/com/automation/pages/') : ''}
│   └── ${language === 'typescript' ? 'utils/' : 'java/com/automation/utils/'}
├── tests/
│   ${includeUI ? '├── ui/' : ''}
│   ${includeAPI ? '└── api/' : ''}
└── config/
\`\`\`

${includeDocker ? `## Docker

Build and run tests in Docker:
\`\`\`bash
docker-compose up --build
\`\`\`` : ''}

## Environment Configuration

Configuration files are in the \`config/\` directory:
- \`dev.json\` - Development environment
- \`stage.json\` - Staging environment  
- \`prod.json\` - Production environment

---
Generated by [SuiteMate](https://suitemate.dev)
`;
}

function generateConfigJson(env: string): string {
  const baseUrls: Record<string, { base: string; api: string }> = {
    dev: { base: 'https://dev.example.com', api: 'https://api.dev.example.com' },
    stage: { base: 'https://stage.example.com', api: 'https://api.stage.example.com' },
    prod: { base: 'https://example.com', api: 'https://api.example.com' },
  };

  return JSON.stringify({
    baseUrl: baseUrls[env]?.base || 'https://example.com',
    apiBaseUrl: baseUrls[env]?.api || 'https://api.example.com',
    timeout: 30000,
    retries: env === 'prod' ? 2 : 0,
  }, null, 2);
}

function generateGitHubWorkflow(config: ProjectConfig): string {
  const { language, buildTool, includeUI } = config;
  
  if (language === 'typescript') {
    return `name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${buildTool}'
      
      - name: Install dependencies
        run: ${buildTool} install
      
${includeUI ? `      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
` : ''}
      - name: Run tests
        run: ${buildTool} test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            playwright-report/
            test-results/
`;
  }

  if (language === 'java') {
    return `name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: '${buildTool}'
      
      - name: Run tests
        run: ${buildTool === 'maven' ? 'mvn test' : './gradlew test'}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: target/surefire-reports/
`;
  }

  return `name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        run: pytest --junitxml=test-results/junit.xml
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
`;
}

function generateDockerfile(config: ProjectConfig): string {
  const { language } = config;
  
  if (language === 'typescript') {
    return `FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "test"]
`;
  }

  if (language === 'java') {
    return `FROM maven:3.9-eclipse-temurin-17

WORKDIR /app

COPY pom.xml ./
RUN mvn dependency:go-offline

COPY . .

CMD ["mvn", "test"]
`;
  }

  return `FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \\
    chromium \\
    chromium-driver \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV HEADLESS=true

CMD ["pytest"]
`;
}

function generateDockerCompose(config: ProjectConfig): string {
  return `version: '3.8'

services:
  tests:
    build: .
    environment:
      - CI=true
      - HEADLESS=true
      - BASE_URL=\${BASE_URL:-https://example.com}
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
`;
}

function generateRunScript(): string {
  return `#!/bin/bash

# Run all tests
run_all() {
    npm test
}

# Run UI tests only
run_ui() {
    npm run test:ui
}

# Run API tests only
run_api() {
    npm run test:api
}

# Run in headed mode
run_headed() {
    npm run test:headed
}

# Show report
show_report() {
    npm run report
}

case "$1" in
    all)
        run_all
        ;;
    ui)
        run_ui
        ;;
    api)
        run_api
        ;;
    headed)
        run_headed
        ;;
    report)
        show_report
        ;;
    *)
        echo "Usage: $0 {all|ui|api|headed|report}"
        exit 1
        ;;
esac
`;
}

function generateTsFixture(): string {
  return `import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type Fixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect } from '@playwright/test';
`;
}

function generateTsHelpers(): string {
  return `/**
 * Utility helper functions for tests
 */

export function generateRandomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
}
`;
}

function generateTsHomeSpec(): string {
  return `import { test, expect } from '@playwright/test';

test.describe('Home Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/Example/);
  });

  test('should have main navigation', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.locator('[data-testid="hero"]').or(page.locator('h1').first());
    await expect(hero).toBeVisible();
  });
});
`;
}

function generateTsHealthSpec(): string {
  return `import { test, expect } from '@playwright/test';

test.describe('Health Check API Tests', () => {
  const baseURL = process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com';

  test('API should be reachable', async ({ request }) => {
    const response = await request.get(\`\${baseURL}/posts/1\`);
    expect(response.ok()).toBeTruthy();
  });

  test('API should return valid JSON', async ({ request }) => {
    const response = await request.get(\`\${baseURL}/posts/1\`);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('API should handle not found gracefully', async ({ request }) => {
    const response = await request.get(\`\${baseURL}/posts/999999\`);
    expect(response.status()).toBe(404);
  });
});
`;
}

// ============ Java Templates ============

function generateJavaPom(config: ProjectConfig): string {
  const includeAllure = config.reporting.includes('allure');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.automation</groupId>
    <artifactId>${config.projectName}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>${config.projectName}</name>
    <description>${config.description || 'Automation test framework'}</description>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <selenium.version>4.15.0</selenium.version>
        <webdrivermanager.version>5.6.2</webdrivermanager.version>
        <junit.version>5.10.1</junit.version>
        <restassured.version>5.3.2</restassured.version>
        <log4j.version>2.22.0</log4j.version>
        <allure.version>2.24.0</allure.version>
        <aspectj.version>1.9.20.1</aspectj.version>
    </properties>

    <dependencies>
        <!-- JUnit 5 -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>\${junit.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-params</artifactId>
            <version>\${junit.version}</version>
            <scope>test</scope>
        </dependency>

${config.includeUI ? `        <!-- Selenium WebDriver -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>\${selenium.version}</version>
        </dependency>

        <!-- WebDriverManager for automatic driver management -->
        <dependency>
            <groupId>io.github.bonigarcia</groupId>
            <artifactId>webdrivermanager</artifactId>
            <version>\${webdrivermanager.version}</version>
        </dependency>
` : ''}
${config.includeAPI ? `        <!-- REST Assured for API Testing -->
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>rest-assured</artifactId>
            <version>\${restassured.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>json-path</artifactId>
            <version>\${restassured.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>json-schema-validator</artifactId>
            <version>\${restassured.version}</version>
            <scope>test</scope>
        </dependency>
` : ''}
${includeAllure ? `        <!-- Allure Reporting -->
        <dependency>
            <groupId>io.qameta.allure</groupId>
            <artifactId>allure-junit5</artifactId>
            <version>\${allure.version}</version>
            <scope>test</scope>
        </dependency>
` : ''}
        <!-- Logging -->
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>\${log4j.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <version>\${log4j.version}</version>
        </dependency>

        <!-- AssertJ for fluent assertions -->
        <dependency>
            <groupId>org.assertj</groupId>
            <artifactId>assertj-core</artifactId>
            <version>3.24.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.2</version>
                <configuration>
                    <testFailureIgnore>false</testFailureIgnore>
                    <argLine>
                        -javaagent:"\${settings.localRepository}/org/aspectj/aspectjweaver/\${aspectj.version}/aspectjweaver-\${aspectj.version}.jar"
                    </argLine>
                    <systemPropertyVariables>
                        <allure.results.directory>\${project.build.directory}/allure-results</allure.results.directory>
                    </systemPropertyVariables>
                </configuration>
                <dependencies>
                    <dependency>
                        <groupId>org.aspectj</groupId>
                        <artifactId>aspectjweaver</artifactId>
                        <version>\${aspectj.version}</version>
                    </dependency>
                </dependencies>
            </plugin>
${includeAllure ? `            <plugin>
                <groupId>io.qameta.allure</groupId>
                <artifactId>allure-maven</artifactId>
                <version>2.12.0</version>
                <configuration>
                    <reportVersion>\${allure.version}</reportVersion>
                </configuration>
            </plugin>
` : ''}
        </plugins>
    </build>
</project>
`;
}

function generateJavaBaseTest(config: ProjectConfig): string {
  return `package com.automation.base;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
${config.includeUI ? `import org.openqa.selenium.WebDriver;
import com.automation.utils.WebDriverFactory;
import com.automation.utils.ConfigReader;` : `import com.automation.utils.ConfigReader;`}

/**
 * Base test class providing common setup and teardown functionality.
 * All test classes should extend this class.
 */
public abstract class BaseTest {

    protected static final Logger logger = LogManager.getLogger(BaseTest.class);
    protected ConfigReader config;
${config.includeUI ? `    protected WebDriver driver;` : ''}

    @BeforeEach
    public void setUp() {
        logger.info("Setting up test...");
        config = new ConfigReader();
${config.includeUI ? `        
        String browser = config.getProperty("browser", "chrome");
        boolean headless = Boolean.parseBoolean(config.getProperty("headless", "true"));
        
        driver = WebDriverFactory.createDriver(browser, headless);
        driver.manage().window().maximize();
        
        String baseUrl = config.getProperty("baseUrl", "https://example.com");
        driver.get(baseUrl);
        logger.info("Navigated to: {}", baseUrl);` : ''}
    }

    @AfterEach
    public void tearDown() {
        logger.info("Tearing down test...");
${config.includeUI ? `        if (driver != null) {
            driver.quit();
            logger.info("Browser closed");
        }` : ''}
    }
}
`;
}

function generateJavaConfigReader(): string {
  return `package com.automation.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Configuration reader that loads properties from config.properties
 * and supports environment variable overrides.
 */
public class ConfigReader {

    private static final Logger logger = LogManager.getLogger(ConfigReader.class);
    private final Properties properties;

    public ConfigReader() {
        properties = new Properties();
        loadProperties();
    }

    private void loadProperties() {
        try (FileInputStream fis = new FileInputStream("src/test/resources/config.properties")) {
            properties.load(fis);
            logger.info("Configuration loaded successfully");
        } catch (IOException e) {
            logger.warn("Could not load config.properties: {}", e.getMessage());
        }
    }

    /**
     * Get property value with environment variable override support.
     * Environment variables take precedence over properties file.
     */
    public String getProperty(String key) {
        // Convert property key to env var format (e.g., base.url -> BASE_URL)
        String envKey = key.toUpperCase().replace(".", "_");
        String envValue = System.getenv(envKey);
        
        if (envValue != null && !envValue.isEmpty()) {
            return envValue;
        }
        return properties.getProperty(key);
    }

    /**
     * Get property value with default fallback.
     */
    public String getProperty(String key, String defaultValue) {
        String value = getProperty(key);
        return value != null ? value : defaultValue;
    }

    /**
     * Get property as integer.
     */
    public int getIntProperty(String key, int defaultValue) {
        String value = getProperty(key);
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Get property as boolean.
     */
    public boolean getBooleanProperty(String key, boolean defaultValue) {
        String value = getProperty(key);
        return value != null ? Boolean.parseBoolean(value) : defaultValue;
    }
}
`;
}

function generateJavaWebDriverFactory(): string {
  return `package com.automation.utils;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.time.Duration;

/**
 * Factory class for creating WebDriver instances.
 * Supports Chrome, Firefox, and Edge browsers.
 */
public class WebDriverFactory {

    private static final Logger logger = LogManager.getLogger(WebDriverFactory.class);
    private static final int DEFAULT_TIMEOUT = 10;

    private WebDriverFactory() {
        // Prevent instantiation
    }

    /**
     * Create a WebDriver instance for the specified browser.
     */
    public static WebDriver createDriver(String browser, boolean headless) {
        WebDriver driver;
        
        switch (browser.toLowerCase()) {
            case "firefox":
                driver = createFirefoxDriver(headless);
                break;
            case "edge":
                driver = createEdgeDriver(headless);
                break;
            case "chrome":
            default:
                driver = createChromeDriver(headless);
                break;
        }
        
        configureDriver(driver);
        return driver;
    }

    private static WebDriver createChromeDriver(boolean headless) {
        logger.info("Initializing Chrome driver (headless: {})", headless);
        WebDriverManager.chromedriver().setup();
        
        ChromeOptions options = new ChromeOptions();
        if (headless) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");
        options.addArguments("--remote-allow-origins=*");
        
        return new ChromeDriver(options);
    }

    private static WebDriver createFirefoxDriver(boolean headless) {
        logger.info("Initializing Firefox driver (headless: {})", headless);
        WebDriverManager.firefoxdriver().setup();
        
        FirefoxOptions options = new FirefoxOptions();
        if (headless) {
            options.addArguments("--headless");
        }
        options.addArguments("--width=1920");
        options.addArguments("--height=1080");
        
        return new FirefoxDriver(options);
    }

    private static WebDriver createEdgeDriver(boolean headless) {
        logger.info("Initializing Edge driver (headless: {})", headless);
        WebDriverManager.edgedriver().setup();
        
        EdgeOptions options = new EdgeOptions();
        if (headless) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        
        return new EdgeDriver(options);
    }

    private static void configureDriver(WebDriver driver) {
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(DEFAULT_TIMEOUT));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(30));
    }
}
`;
}

function generateJavaBasePage(): string {
  return `package com.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.JavascriptExecutor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.time.Duration;
import java.util.List;

/**
 * Base page object class providing common web interactions.
 * All page objects should extend this class.
 */
public abstract class BasePage {

    protected static final Logger logger = LogManager.getLogger(BasePage.class);
    protected final WebDriver driver;
    protected final WebDriverWait wait;
    private static final int DEFAULT_TIMEOUT = 10;

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(DEFAULT_TIMEOUT));
    }

    // ============ Wait Methods ============

    protected WebElement waitForElement(By locator) {
        logger.debug("Waiting for element: {}", locator);
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForClickable(By locator) {
        logger.debug("Waiting for clickable element: {}", locator);
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected List<WebElement> waitForElements(By locator) {
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(locator));
        return driver.findElements(locator);
    }

    // ============ Interaction Methods ============

    protected void click(By locator) {
        logger.info("Clicking element: {}", locator);
        waitForClickable(locator).click();
    }

    protected void type(By locator, String text) {
        logger.info("Typing '{}' into element: {}", text, locator);
        WebElement element = waitForElement(locator);
        element.clear();
        element.sendKeys(text);
    }

    protected void clearAndType(By locator, String text) {
        WebElement element = waitForElement(locator);
        element.clear();
        element.sendKeys(text);
    }

    protected String getText(By locator) {
        String text = waitForElement(locator).getText();
        logger.debug("Got text '{}' from element: {}", text, locator);
        return text;
    }

    protected String getAttribute(By locator, String attribute) {
        return waitForElement(locator).getAttribute(attribute);
    }

    protected boolean isDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    protected boolean isEnabled(By locator) {
        return waitForElement(locator).isEnabled();
    }

    // ============ Select Methods ============

    protected void selectByVisibleText(By locator, String text) {
        logger.info("Selecting '{}' from dropdown: {}", text, locator);
        Select select = new Select(waitForElement(locator));
        select.selectByVisibleText(text);
    }

    protected void selectByValue(By locator, String value) {
        Select select = new Select(waitForElement(locator));
        select.selectByValue(value);
    }

    protected void selectByIndex(By locator, int index) {
        Select select = new Select(waitForElement(locator));
        select.selectByIndex(index);
    }

    // ============ JavaScript Methods ============

    protected void scrollToElement(By locator) {
        WebElement element = waitForElement(locator);
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", element);
    }

    protected void clickWithJS(By locator) {
        WebElement element = waitForElement(locator);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    // ============ Navigation Methods ============

    protected void navigateTo(String url) {
        logger.info("Navigating to: {}", url);
        driver.get(url);
    }

    protected String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    protected String getTitle() {
        return driver.getTitle();
    }

    protected void refreshPage() {
        driver.navigate().refresh();
    }
}
`;
}

function generateJavaLoginPage(): string {
  return `package com.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for the Login Page.
 * Encapsulates all login page interactions.
 */
public class LoginPage extends BasePage {

    // ============ Locators ============
    private final By usernameField = By.cssSelector("[data-testid='username']");
    private final By passwordField = By.cssSelector("[data-testid='password']");
    private final By submitButton = By.cssSelector("[data-testid='submit']");
    private final By errorMessage = By.cssSelector("[data-testid='error-message']");
    private final By forgotPasswordLink = By.cssSelector("[data-testid='forgot-password']");
    private final By rememberMeCheckbox = By.cssSelector("[data-testid='remember-me']");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    // ============ Actions ============

    /**
     * Enter username into the username field.
     */
    public LoginPage enterUsername(String username) {
        type(usernameField, username);
        return this;
    }

    /**
     * Enter password into the password field.
     */
    public LoginPage enterPassword(String password) {
        type(passwordField, password);
        return this;
    }

    /**
     * Click the submit/login button.
     */
    public void clickSubmit() {
        click(submitButton);
    }

    /**
     * Perform complete login with username and password.
     */
    public void login(String username, String password) {
        logger.info("Attempting login with username: {}", username);
        enterUsername(username);
        enterPassword(password);
        clickSubmit();
    }

    /**
     * Check the "Remember Me" checkbox.
     */
    public LoginPage checkRememberMe() {
        click(rememberMeCheckbox);
        return this;
    }

    /**
     * Click "Forgot Password" link.
     */
    public void clickForgotPassword() {
        click(forgotPasswordLink);
    }

    // ============ Verifications ============

    /**
     * Get the error message text.
     */
    public String getErrorMessage() {
        return getText(errorMessage);
    }

    /**
     * Check if error message is displayed.
     */
    public boolean isErrorDisplayed() {
        return isDisplayed(errorMessage);
    }

    /**
     * Check if login was successful by verifying URL contains dashboard.
     */
    public boolean isLoginSuccessful() {
        return getCurrentUrl().contains("dashboard");
    }

    /**
     * Check if username field is displayed.
     */
    public boolean isUsernameFieldDisplayed() {
        return isDisplayed(usernameField);
    }

    /**
     * Check if password field is displayed.
     */
    public boolean isPasswordFieldDisplayed() {
        return isDisplayed(passwordField);
    }

    /**
     * Check if submit button is enabled.
     */
    public boolean isSubmitButtonEnabled() {
        return isEnabled(submitButton);
    }
}
`;
}

function generateJavaHomePage(): string {
  return `package com.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for the Home/Dashboard Page.
 */
public class HomePage extends BasePage {

    // ============ Locators ============
    private final By welcomeMessage = By.cssSelector("[data-testid='welcome-message']");
    private final By userMenu = By.cssSelector("[data-testid='user-menu']");
    private final By logoutButton = By.cssSelector("[data-testid='logout']");
    private final By navigationMenu = By.cssSelector("nav");

    public HomePage(WebDriver driver) {
        super(driver);
    }

    // ============ Actions ============

    /**
     * Click on user menu to open dropdown.
     */
    public HomePage openUserMenu() {
        click(userMenu);
        return this;
    }

    /**
     * Perform logout.
     */
    public void logout() {
        openUserMenu();
        click(logoutButton);
    }

    // ============ Verifications ============

    /**
     * Get welcome message text.
     */
    public String getWelcomeMessage() {
        return getText(welcomeMessage);
    }

    /**
     * Check if navigation menu is displayed.
     */
    public boolean isNavigationDisplayed() {
        return isDisplayed(navigationMenu);
    }

    /**
     * Check if user is on the home page.
     */
    public boolean isOnHomePage() {
        return getCurrentUrl().contains("dashboard") || getCurrentUrl().contains("home");
    }
}
`;
}

function generateJavaLoginTest(): string {
  return `package com.automation.tests;

import com.automation.base.BaseTest;
import com.automation.pages.LoginPage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;

import static org.assertj.core.api.Assertions.*;

/**
 * Test class for Login functionality.
 */
@Tag("ui")
@Tag("login")
public class LoginTest extends BaseTest {

    private LoginPage loginPage;

    @BeforeEach
    public void setUpPage() {
        loginPage = new LoginPage(driver);
        driver.get(config.getProperty("baseUrl") + "/login");
    }

    @Test
    @DisplayName("Login form should be visible")
    @Tag("smoke")
    public void testLoginFormIsVisible() {
        assertThat(loginPage.isUsernameFieldDisplayed())
            .as("Username field should be visible")
            .isTrue();
        
        assertThat(loginPage.isPasswordFieldDisplayed())
            .as("Password field should be visible")
            .isTrue();
        
        assertThat(loginPage.isSubmitButtonEnabled())
            .as("Submit button should be enabled")
            .isTrue();
    }

    @Test
    @DisplayName("Should show error for invalid credentials")
    public void testInvalidCredentialsShowError() {
        loginPage.login("invalid@email.com", "wrongpassword");
        
        assertThat(loginPage.isErrorDisplayed())
            .as("Error message should be displayed")
            .isTrue();
        
        assertThat(loginPage.getErrorMessage())
            .as("Error message should indicate invalid credentials")
            .containsIgnoringCase("invalid");
    }

    @Test
    @DisplayName("Should show error for empty username")
    public void testEmptyUsernameShowsError() {
        loginPage.enterPassword("somepassword");
        loginPage.clickSubmit();
        
        assertThat(loginPage.isErrorDisplayed())
            .as("Error should be shown for empty username")
            .isTrue();
    }

    @Test
    @DisplayName("Should show error for empty password")
    public void testEmptyPasswordShowsError() {
        loginPage.enterUsername("test@example.com");
        loginPage.clickSubmit();
        
        assertThat(loginPage.isErrorDisplayed())
            .as("Error should be shown for empty password")
            .isTrue();
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    @Tag("smoke")
    public void testValidCredentialsLogin() {
        String username = config.getProperty("testUsername", "test@example.com");
        String password = config.getProperty("testPassword", "password123");
        
        loginPage.login(username, password);
        
        assertThat(loginPage.isLoginSuccessful())
            .as("Should navigate to dashboard after successful login")
            .isTrue();
    }
}
`;
}

function generateJavaBaseApiClient(): string {
  return `package com.automation.api;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Map;

/**
 * Base API client providing common REST operations.
 * All API test classes should use this client.
 */
public class BaseApiClient {

    protected static final Logger logger = LogManager.getLogger(BaseApiClient.class);
    protected final RequestSpecification requestSpec;
    protected final String baseUrl;

    public BaseApiClient() {
        this.baseUrl = System.getenv().getOrDefault("API_BASE_URL", "https://jsonplaceholder.typicode.com");
        RestAssured.baseURI = baseUrl;
        
        this.requestSpec = RestAssured.given()
            .contentType(ContentType.JSON)
            .accept(ContentType.JSON)
            .log().ifValidationFails();
        
        logger.info("API Client initialized with base URL: {}", baseUrl);
    }

    public BaseApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
        RestAssured.baseURI = baseUrl;
        
        this.requestSpec = RestAssured.given()
            .contentType(ContentType.JSON)
            .accept(ContentType.JSON)
            .log().ifValidationFails();
    }

    // ============ HTTP Methods ============

    public Response get(String endpoint) {
        logger.info("GET {}", endpoint);
        return requestSpec.get(endpoint);
    }

    public Response get(String endpoint, Map<String, ?> queryParams) {
        logger.info("GET {} with params: {}", endpoint, queryParams);
        return requestSpec.queryParams(queryParams).get(endpoint);
    }

    public Response post(String endpoint, Object body) {
        logger.info("POST {} with body: {}", endpoint, body);
        return requestSpec.body(body).post(endpoint);
    }

    public Response put(String endpoint, Object body) {
        logger.info("PUT {} with body: {}", endpoint, body);
        return requestSpec.body(body).put(endpoint);
    }

    public Response patch(String endpoint, Object body) {
        logger.info("PATCH {} with body: {}", endpoint, body);
        return requestSpec.body(body).patch(endpoint);
    }

    public Response delete(String endpoint) {
        logger.info("DELETE {}", endpoint);
        return requestSpec.delete(endpoint);
    }

    // ============ Helper Methods ============

    public RequestSpecification withAuth(String token) {
        return requestSpec.header("Authorization", "Bearer " + token);
    }

    public RequestSpecification withHeaders(Map<String, String> headers) {
        return requestSpec.headers(headers);
    }
}
`;
}

function generateJavaUsersApiTest(): string {
  return `package com.automation.api;

import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Nested;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.*;

/**
 * API tests for Users endpoints.
 */
@Tag("api")
@Tag("users")
public class UsersApiTest {

    private BaseApiClient apiClient;

    @BeforeEach
    public void setUp() {
        apiClient = new BaseApiClient();
    }

    @Nested
    @DisplayName("GET /users")
    class GetUsers {

        @Test
        @DisplayName("Should return list of users")
        @Tag("smoke")
        public void testGetAllUsers() {
            Response response = apiClient.get("/users");
            
            assertThat(response.getStatusCode())
                .as("Status code should be 200")
                .isEqualTo(200);
            
            assertThat(response.jsonPath().getList("$"))
                .as("Should return a non-empty list")
                .isNotEmpty();
        }

        @Test
        @DisplayName("Should return users with correct structure")
        public void testUsersHaveCorrectStructure() {
            Response response = apiClient.get("/users");
            
            response.then()
                .body("[0].id", notNullValue())
                .body("[0].name", notNullValue())
                .body("[0].email", notNullValue())
                .body("[0].username", notNullValue());
        }
    }

    @Nested
    @DisplayName("GET /users/{id}")
    class GetUserById {

        @Test
        @DisplayName("Should return single user by ID")
        @Tag("smoke")
        public void testGetUserById() {
            Response response = apiClient.get("/users/1");
            
            assertThat(response.getStatusCode()).isEqualTo(200);
            assertThat(response.jsonPath().getInt("id")).isEqualTo(1);
            assertThat(response.jsonPath().getString("name")).isNotEmpty();
            assertThat(response.jsonPath().getString("email")).contains("@");
        }

        @Test
        @DisplayName("Should return 404 for non-existent user")
        public void testGetNonExistentUser() {
            Response response = apiClient.get("/users/999999");
            
            assertThat(response.getStatusCode()).isEqualTo(404);
        }
    }

    @Nested
    @DisplayName("POST /users")
    class CreateUser {

        @Test
        @DisplayName("Should create new user")
        @Tag("smoke")
        public void testCreateUser() {
            Map<String, Object> newUser = new HashMap<>();
            newUser.put("name", "Test User");
            newUser.put("username", "testuser");
            newUser.put("email", "test@example.com");
            newUser.put("phone", "1-234-567-8900");

            Response response = apiClient.post("/users", newUser);
            
            assertThat(response.getStatusCode()).isEqualTo(201);
            assertThat(response.jsonPath().getInt("id")).isPositive();
            assertThat(response.jsonPath().getString("name")).isEqualTo("Test User");
            assertThat(response.jsonPath().getString("email")).isEqualTo("test@example.com");
        }

        @Test
        @DisplayName("Should create user with all fields")
        public void testCreateUserWithAllFields() {
            Map<String, Object> address = new HashMap<>();
            address.put("street", "123 Test St");
            address.put("city", "Test City");
            address.put("zipcode", "12345");

            Map<String, Object> newUser = new HashMap<>();
            newUser.put("name", "Complete User");
            newUser.put("username", "completeuser");
            newUser.put("email", "complete@example.com");
            newUser.put("address", address);

            Response response = apiClient.post("/users", newUser);
            
            assertThat(response.getStatusCode()).isEqualTo(201);
            assertThat(response.jsonPath().getString("name")).isEqualTo("Complete User");
        }
    }

    @Nested
    @DisplayName("PUT /users/{id}")
    class UpdateUser {

        @Test
        @DisplayName("Should update existing user")
        public void testUpdateUser() {
            Map<String, Object> updatedUser = new HashMap<>();
            updatedUser.put("name", "Updated Name");
            updatedUser.put("email", "updated@example.com");

            Response response = apiClient.put("/users/1", updatedUser);
            
            assertThat(response.getStatusCode()).isEqualTo(200);
            assertThat(response.jsonPath().getString("name")).isEqualTo("Updated Name");
        }
    }

    @Nested
    @DisplayName("DELETE /users/{id}")
    class DeleteUser {

        @Test
        @DisplayName("Should delete existing user")
        public void testDeleteUser() {
            Response response = apiClient.delete("/users/1");
            
            assertThat(response.getStatusCode()).isEqualTo(200);
        }
    }
}
`;
}

function generateJavaPostsApiTest(): string {
  return `package com.automation.api;

import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * API tests for Posts endpoints.
 */
@Tag("api")
@Tag("posts")
public class PostsApiTest {

    private BaseApiClient apiClient;

    @BeforeEach
    public void setUp() {
        apiClient = new BaseApiClient();
    }

    @Test
    @DisplayName("GET /posts - Should return list of posts")
    @Tag("smoke")
    public void testGetAllPosts() {
        Response response = apiClient.get("/posts");
        
        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getList("$")).hasSizeGreaterThan(0);
    }

    @Test
    @DisplayName("GET /posts/1 - Should return single post")
    public void testGetPostById() {
        Response response = apiClient.get("/posts/1");
        
        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getInt("id")).isEqualTo(1);
        assertThat(response.jsonPath().getInt("userId")).isPositive();
        assertThat(response.jsonPath().getString("title")).isNotEmpty();
        assertThat(response.jsonPath().getString("body")).isNotEmpty();
    }

    @Test
    @DisplayName("GET /posts?userId=1 - Should filter posts by user")
    public void testGetPostsByUser() {
        Map<String, Integer> params = new HashMap<>();
        params.put("userId", 1);
        
        Response response = apiClient.get("/posts", params);
        
        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getList("$")).isNotEmpty();
        
        // Verify all returned posts belong to userId 1
        response.jsonPath().getList("userId", Integer.class)
            .forEach(userId -> assertThat(userId).isEqualTo(1));
    }

    @Test
    @DisplayName("POST /posts - Should create new post")
    public void testCreatePost() {
        Map<String, Object> newPost = new HashMap<>();
        newPost.put("title", "Test Post Title");
        newPost.put("body", "This is the body of the test post.");
        newPost.put("userId", 1);

        Response response = apiClient.post("/posts", newPost);
        
        assertThat(response.getStatusCode()).isEqualTo(201);
        assertThat(response.jsonPath().getInt("id")).isPositive();
        assertThat(response.jsonPath().getString("title")).isEqualTo("Test Post Title");
    }
}
`;
}

function generateJavaConfigProperties(): string {
  return `# ============================================
# Test Configuration Properties
# ============================================

# Base URLs
baseUrl=https://example.com
apiBaseUrl=https://api.example.com

# Browser Configuration
browser=chrome
headless=true

# Timeouts (in seconds)
implicitWait=10
pageLoadTimeout=30
scriptTimeout=30

# Test Credentials (override with environment variables in CI)
testUsername=test@example.com
testPassword=password123

# Retry Configuration
maxRetries=2
retryDelayMs=1000
`;
}

function generateJavaLog4j(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
    <Properties>
        <Property name="LOG_PATTERN">%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n</Property>
        <Property name="LOG_DIR">target/logs</Property>
    </Properties>

    <Appenders>
        <!-- Console Appender -->
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="\${LOG_PATTERN}"/>
        </Console>

        <!-- File Appender -->
        <RollingFile name="FileAppender" 
                     fileName="\${LOG_DIR}/test-automation.log"
                     filePattern="\${LOG_DIR}/test-automation-%d{yyyy-MM-dd}-%i.log.gz">
            <PatternLayout pattern="\${LOG_PATTERN}"/>
            <Policies>
                <TimeBasedTriggeringPolicy interval="1"/>
                <SizeBasedTriggeringPolicy size="10MB"/>
            </Policies>
            <DefaultRolloverStrategy max="10"/>
        </RollingFile>
    </Appenders>

    <Loggers>
        <!-- Application Logger -->
        <Logger name="com.automation" level="DEBUG" additivity="false">
            <AppenderRef ref="Console"/>
            <AppenderRef ref="FileAppender"/>
        </Logger>

        <!-- Selenium Logger - reduce noise -->
        <Logger name="org.openqa.selenium" level="WARN"/>
        
        <!-- REST Assured Logger -->
        <Logger name="io.restassured" level="WARN"/>

        <!-- Root Logger -->
        <Root level="INFO">
            <AppenderRef ref="Console"/>
            <AppenderRef ref="FileAppender"/>
        </Root>
    </Loggers>
</Configuration>
`;
}

function generateJavaTestUtils(): string {
  return `package com.automation.utils;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

/**
 * Utility class providing common test helper methods.
 */
public class TestUtils {

    private static final Logger logger = LogManager.getLogger(TestUtils.class);
    private static final Random random = new Random();

    private TestUtils() {
        // Prevent instantiation
    }

    /**
     * Take a screenshot and save to specified directory.
     */
    public static String takeScreenshot(WebDriver driver, String testName) {
        try {
            File screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = String.format("%s_%s.png", testName, timestamp);
            
            Path screenshotDir = Paths.get("target", "screenshots");
            Files.createDirectories(screenshotDir);
            
            Path destination = screenshotDir.resolve(fileName);
            Files.copy(screenshot.toPath(), destination);
            
            logger.info("Screenshot saved: {}", destination);
            return destination.toString();
        } catch (IOException e) {
            logger.error("Failed to save screenshot: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Generate a random email address.
     */
    public static String generateRandomEmail() {
        return String.format("test.%d@example.com", System.currentTimeMillis());
    }

    /**
     * Generate a random string of specified length.
     */
    public static String generateRandomString(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Wait for specified milliseconds.
     */
    public static void sleep(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Get current timestamp as formatted string.
     */
    public static String getTimestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
`;
}

// ============ Python Templates ============

function generatePythonPyprojectToml(config: ProjectConfig): string {
  const isSelenium = config.uiFramework === 'selenium';
  return `[tool.poetry]
name = "${config.projectName}"
version = "1.0.0"
description = "${config.description || 'Automation test framework'}"
authors = ["${config.author || 'Test Automation Team'}"]
readme = "README.md"

[tool.poetry.dependencies]
python = "^3.9"
pytest = "^7.4.0"
pytest-html = "^4.1.0"
pytest-xdist = "^3.5.0"
python-dotenv = "^1.0.0"
requests = "^2.31.0"
${config.includeUI ? (isSelenium ? `selenium = "^4.15.0"
webdriver-manager = "^4.0.0"` : `playwright = "^1.40.0"`) : ''}

[tool.poetry.group.dev.dependencies]
black = "^23.0.0"
flake8 = "^6.0.0"
mypy = "^1.7.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
markers = [
    "ui: UI tests",
    "api: API tests",
    "smoke: Smoke tests",
]
`;
}

function generatePythonRequirements(config: ProjectConfig): string {
  const isSelenium = config.uiFramework === 'selenium';
  return `# Core Testing
pytest>=7.4.0
pytest-html>=4.1.0
pytest-xdist>=3.5.0

# Environment
python-dotenv>=1.0.0

# API Testing
requests>=2.31.0

${config.includeUI ? (isSelenium ? `# UI Testing (Selenium)
selenium>=4.15.0
webdriver-manager>=4.0.0` : `# UI Testing (Playwright)
playwright>=1.40.0`) : ''}

# Utilities
Faker>=22.0.0

# Linting/Formatting (dev)
black>=23.0.0
flake8>=6.0.0
mypy>=1.7.0
`;
}

function generatePythonPytestIni(): string {
  return `[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --html=reports/report.html --self-contained-html
markers =
    ui: UI tests
    api: API tests  
    smoke: Smoke tests
    regression: Regression tests
filterwarnings =
    ignore::DeprecationWarning
`;
}

function generatePythonConftest(config: ProjectConfig): string {
  const isSelenium = config.uiFramework === 'selenium';
  
  if (isSelenium && config.includeUI) {
    return `"""
Pytest configuration and fixtures for Selenium.
"""
import pytest
import os
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# Load environment variables
load_dotenv()


def pytest_configure(config):
    """Configure pytest with custom markers and settings."""
    config.addinivalue_line("markers", "ui: UI tests")
    config.addinivalue_line("markers", "api: API tests")
    config.addinivalue_line("markers", "smoke: Smoke tests")
    config.addinivalue_line("markers", "regression: Regression tests")


def pytest_html_report_title(report):
    """Customize HTML report title."""
    report.title = "${config.projectName} Test Report"


@pytest.fixture(scope="session")
def base_url():
    """Get base URL from environment."""
    return os.getenv("BASE_URL", "https://example.com")


@pytest.fixture(scope="session")
def api_base_url():
    """Get API base URL from environment."""
    return os.getenv("API_BASE_URL", "https://jsonplaceholder.typicode.com")


@pytest.fixture(scope="function")
def driver(base_url):
    """Create WebDriver instance for each test."""
    chrome_options = Options()
    
    if os.getenv("HEADLESS", "true").lower() == "true":
        chrome_options.add_argument("--headless=new")
    
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    driver.get(base_url)
    
    yield driver
    
    driver.quit()


@pytest.fixture(scope="session")
def api_session():
    """Create requests session for API tests."""
    import requests
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    yield session
    session.close()
`;
  }

  return `"""
Pytest configuration and fixtures.
"""
import pytest
import os
from dotenv import load_dotenv
${config.includeUI ? `from playwright.sync_api import sync_playwright, Browser, Page, BrowserContext` : ''}

# Load environment variables
load_dotenv()


def pytest_configure(config):
    """Configure pytest with custom markers and settings."""
    config.addinivalue_line("markers", "ui: UI tests")
    config.addinivalue_line("markers", "api: API tests")
    config.addinivalue_line("markers", "smoke: Smoke tests")
    config.addinivalue_line("markers", "regression: Regression tests")


def pytest_html_report_title(report):
    """Customize HTML report title."""
    report.title = "${config.projectName} Test Report"


@pytest.fixture(scope="session")
def base_url():
    """Get base URL from environment."""
    return os.getenv("BASE_URL", "https://example.com")


@pytest.fixture(scope="session")
def api_base_url():
    """Get API base URL from environment."""
    return os.getenv("API_BASE_URL", "https://jsonplaceholder.typicode.com")

${config.includeUI ? `
@pytest.fixture(scope="session")
def browser():
    """Create browser instance for the test session."""
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=os.getenv("HEADLESS", "true").lower() == "true"
        )
        yield browser
        browser.close()


@pytest.fixture(scope="function")
def context(browser: Browser):
    """Create new browser context for each test."""
    context = browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir="test-results/videos" if os.getenv("RECORD_VIDEO") else None,
    )
    yield context
    context.close()


@pytest.fixture(scope="function")
def page(context: BrowserContext, base_url: str):
    """Create new page for each test."""
    page = context.new_page()
    page.set_default_timeout(30000)
    page.goto(base_url)
    yield page
    page.close()
` : ''}

@pytest.fixture(scope="session")
def api_session():
    """Create requests session for API tests."""
    import requests
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    yield session
    session.close()
`;
}

function generatePythonConfig(): string {
  return `"""
Configuration management module.
"""
import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Test configuration settings."""
    base_url: str
    api_base_url: str
    timeout: int
    headless: bool
    browser: str
    retries: int
    
    @classmethod
    def from_env(cls, env: str = "dev") -> "Config":
        """Load configuration from environment variables."""
        return cls(
            base_url=os.getenv("BASE_URL", "https://example.com"),
            api_base_url=os.getenv("API_BASE_URL", "https://api.example.com"),
            timeout=int(os.getenv("TIMEOUT", "30000")),
            headless=os.getenv("HEADLESS", "true").lower() == "true",
            browser=os.getenv("BROWSER", "chromium"),
            retries=int(os.getenv("RETRIES", "0")),
        )


# Default config instance
config = Config.from_env()


def get_config(env: Optional[str] = None) -> Config:
    """Get configuration for specified environment."""
    return Config.from_env(env or os.getenv("ENV", "dev"))
`;
}

function generatePythonBasePage(config: ProjectConfig): string {
  const isSelenium = config.uiFramework === 'selenium';
  
  if (isSelenium) {
    return `"""
Base page object class providing common web interactions for Selenium.
"""
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class BasePage:
    """
    Base page object class for Selenium.
    All page objects should inherit from this class.
    """

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    # ============ Navigation ============

    def navigate(self, url: str) -> None:
        """Navigate to a URL."""
        logger.info(f"Navigating to: {url}")
        self.driver.get(url)

    def get_current_url(self) -> str:
        """Get current page URL."""
        return self.driver.current_url

    def reload(self) -> None:
        """Reload the current page."""
        self.driver.refresh()

    # ============ Wait Methods ============

    def wait_for_element(self, locator: tuple, timeout: int = 10) -> WebElement:
        """Wait for element to be visible."""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.visibility_of_element_located(locator))

    def wait_for_clickable(self, locator: tuple, timeout: int = 10) -> WebElement:
        """Wait for element to be clickable."""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.element_to_be_clickable(locator))

    def wait_for_url_contains(self, text: str, timeout: int = 10) -> bool:
        """Wait for URL to contain text."""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.url_contains(text))

    # ============ Interaction Methods ============

    def click(self, locator: tuple) -> None:
        """Click on an element."""
        logger.debug(f"Clicking: {locator}")
        element = self.wait_for_clickable(locator)
        element.click()

    def fill(self, locator: tuple, text: str) -> None:
        """Fill text into an input field."""
        logger.debug(f"Filling '{text}' into: {locator}")
        element = self.wait_for_element(locator)
        element.clear()
        element.send_keys(text)

    def clear(self, locator: tuple) -> None:
        """Clear an input field."""
        element = self.wait_for_element(locator)
        element.clear()

    def select_option(self, locator: tuple, value: str) -> None:
        """Select option from dropdown by value."""
        element = self.wait_for_element(locator)
        Select(element).select_by_value(value)

    # ============ Element State ============

    def is_visible(self, locator: tuple) -> bool:
        """Check if element is visible."""
        try:
            element = self.driver.find_element(*locator)
            return element.is_displayed()
        except Exception:
            return False

    def is_enabled(self, locator: tuple) -> bool:
        """Check if element is enabled."""
        try:
            element = self.driver.find_element(*locator)
            return element.is_enabled()
        except Exception:
            return False

    def get_text(self, locator: tuple) -> str:
        """Get text content of element."""
        element = self.wait_for_element(locator)
        return element.text

    def get_attribute(self, locator: tuple, attribute: str) -> Optional[str]:
        """Get attribute value of element."""
        element = self.wait_for_element(locator)
        return element.get_attribute(attribute)

    # ============ Screenshots ============

    def take_screenshot(self, name: str) -> bool:
        """Take a screenshot."""
        return self.driver.save_screenshot(f"screenshots/{name}.png")
`;
  }
  
  return `"""
Base page object class providing common web interactions.
"""
from playwright.sync_api import Page, Locator, expect
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class BasePage:
    """
    Base page object class.
    All page objects should inherit from this class.
    """

    def __init__(self, page: Page):
        self.page = page

    # ============ Navigation ============

    def navigate(self, path: str = "/") -> None:
        """Navigate to a specific path."""
        logger.info(f"Navigating to: {path}")
        self.page.goto(path)

    def get_current_url(self) -> str:
        """Get current page URL."""
        return self.page.url

    def reload(self) -> None:
        """Reload the current page."""
        self.page.reload()

    # ============ Wait Methods ============

    def wait_for_element(self, selector: str, timeout: int = 10000) -> Locator:
        """Wait for element to be visible."""
        locator = self.page.locator(selector)
        locator.wait_for(state="visible", timeout=timeout)
        return locator

    def wait_for_url(self, url_pattern: str, timeout: int = 10000) -> None:
        """Wait for URL to match pattern."""
        self.page.wait_for_url(url_pattern, timeout=timeout)

    def wait_for_load_state(self, state: str = "networkidle") -> None:
        """Wait for page load state."""
        self.page.wait_for_load_state(state)

    # ============ Interaction Methods ============

    def click(self, selector: str) -> None:
        """Click on an element."""
        logger.debug(f"Clicking: {selector}")
        self.page.click(selector)

    def fill(self, selector: str, text: str) -> None:
        """Fill text into an input field."""
        logger.debug(f"Filling '{text}' into: {selector}")
        self.page.fill(selector, text)

    def type_text(self, selector: str, text: str, delay: int = 50) -> None:
        """Type text character by character."""
        self.page.type(selector, text, delay=delay)

    def clear(self, selector: str) -> None:
        """Clear an input field."""
        self.page.fill(selector, "")

    def select_option(self, selector: str, value: str) -> None:
        """Select option from dropdown."""
        self.page.select_option(selector, value)

    def check(self, selector: str) -> None:
        """Check a checkbox."""
        self.page.check(selector)

    def uncheck(self, selector: str) -> None:
        """Uncheck a checkbox."""
        self.page.uncheck(selector)

    # ============ Element State ============

    def is_visible(self, selector: str) -> bool:
        """Check if element is visible."""
        return self.page.locator(selector).is_visible()

    def is_enabled(self, selector: str) -> bool:
        """Check if element is enabled."""
        return self.page.locator(selector).is_enabled()

    def get_text(self, selector: str) -> str:
        """Get text content of element."""
        return self.page.locator(selector).text_content() or ""

    def get_input_value(self, selector: str) -> str:
        """Get value of input field."""
        return self.page.locator(selector).input_value()

    def get_attribute(self, selector: str, attribute: str) -> Optional[str]:
        """Get attribute value of element."""
        return self.page.locator(selector).get_attribute(attribute)

    # ============ Assertions ============

    def expect_visible(self, selector: str) -> None:
        """Assert element is visible."""
        expect(self.page.locator(selector)).to_be_visible()

    def expect_hidden(self, selector: str) -> None:
        """Assert element is hidden."""
        expect(self.page.locator(selector)).to_be_hidden()

    def expect_text(self, selector: str, text: str) -> None:
        """Assert element contains text."""
        expect(self.page.locator(selector)).to_contain_text(text)

    def expect_url(self, url_pattern: str) -> None:
        """Assert current URL matches pattern."""
        expect(self.page).to_have_url(url_pattern)

    # ============ Screenshots ============

    def take_screenshot(self, name: str) -> bytes:
        """Take a screenshot."""
        return self.page.screenshot(path=f"screenshots/{name}.png")
`;
}

function generatePythonLoginPage(config: ProjectConfig): string {
  const isSelenium = config.uiFramework === 'selenium';
  
  if (isSelenium) {
    return `"""
Login page object for Selenium.
"""
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.by import By
from src.pages.base_page import BasePage
import logging

logger = logging.getLogger(__name__)


class LoginPage(BasePage):
    """
    Page object for the Login page (Selenium).
    """

    # Locators (By.CSS_SELECTOR)
    USERNAME_INPUT = (By.CSS_SELECTOR, '[data-testid="username"]')
    PASSWORD_INPUT = (By.CSS_SELECTOR, '[data-testid="password"]')
    SUBMIT_BUTTON = (By.CSS_SELECTOR, '[data-testid="submit"]')
    ERROR_MESSAGE = (By.CSS_SELECTOR, '[data-testid="error-message"]')
    REMEMBER_ME_CHECKBOX = (By.CSS_SELECTOR, '[data-testid="remember-me"]')
    FORGOT_PASSWORD_LINK = (By.CSS_SELECTOR, '[data-testid="forgot-password"]')

    def __init__(self, driver: WebDriver):
        super().__init__(driver)

    # ============ Actions ============

    def enter_username(self, username: str) -> "LoginPage":
        """Enter username."""
        logger.info(f"Entering username: {username}")
        self.fill(self.USERNAME_INPUT, username)
        return self

    def enter_password(self, password: str) -> "LoginPage":
        """Enter password."""
        logger.info("Entering password")
        self.fill(self.PASSWORD_INPUT, password)
        return self

    def click_submit(self) -> None:
        """Click the submit button."""
        logger.info("Clicking submit button")
        self.click(self.SUBMIT_BUTTON)

    def login(self, username: str, password: str) -> None:
        """Perform complete login flow."""
        logger.info(f"Logging in as: {username}")
        self.enter_username(username)
        self.enter_password(password)
        self.click_submit()

    # ============ Validations ============

    def is_username_field_displayed(self) -> bool:
        """Check if username field is visible."""
        return self.is_visible(self.USERNAME_INPUT)

    def is_password_field_displayed(self) -> bool:
        """Check if password field is visible."""
        return self.is_visible(self.PASSWORD_INPUT)

    def is_submit_button_enabled(self) -> bool:
        """Check if submit button is enabled."""
        return self.is_enabled(self.SUBMIT_BUTTON)

    def is_error_displayed(self) -> bool:
        """Check if error message is displayed."""
        return self.is_visible(self.ERROR_MESSAGE)

    def get_error_message(self) -> str:
        """Get error message text."""
        return self.get_text(self.ERROR_MESSAGE)

    def is_login_successful(self) -> bool:
        """Check if login was successful (redirected to dashboard)."""
        return "dashboard" in self.get_current_url() or "home" in self.get_current_url()
`;
  }
  
  return `"""
Login page object.
"""
from playwright.sync_api import Page, expect
from src.pages.base_page import BasePage
import logging

logger = logging.getLogger(__name__)


class LoginPage(BasePage):
    """
    Page object for the Login page.
    """

    # Selectors
    USERNAME_INPUT = '[data-testid="username"]'
    PASSWORD_INPUT = '[data-testid="password"]'
    SUBMIT_BUTTON = '[data-testid="submit"]'
    ERROR_MESSAGE = '[data-testid="error-message"]'
    REMEMBER_ME_CHECKBOX = '[data-testid="remember-me"]'
    FORGOT_PASSWORD_LINK = '[data-testid="forgot-password"]'

    def __init__(self, page: Page):
        super().__init__(page)

    # ============ Actions ============

    def enter_username(self, username: str) -> "LoginPage":
        """Enter username."""
        logger.info(f"Entering username: {username}")
        self.fill(self.USERNAME_INPUT, username)
        return self

    def enter_password(self, password: str) -> "LoginPage":
        """Enter password."""
        logger.info("Entering password")
        self.fill(self.PASSWORD_INPUT, password)
        return self

    def click_submit(self) -> None:
        """Click the submit button."""
        logger.info("Clicking submit button")
        self.click(self.SUBMIT_BUTTON)

    def login(self, username: str, password: str) -> None:
        """Perform complete login flow."""
        logger.info(f"Logging in as: {username}")
        self.enter_username(username)
        self.enter_password(password)
        self.click_submit()

    def check_remember_me(self) -> "LoginPage":
        """Check the remember me checkbox."""
        self.check(self.REMEMBER_ME_CHECKBOX)
        return self

    def click_forgot_password(self) -> None:
        """Click forgot password link."""
        self.click(self.FORGOT_PASSWORD_LINK)

    # ============ Validations ============

    def is_username_field_displayed(self) -> bool:
        """Check if username field is visible."""
        return self.is_visible(self.USERNAME_INPUT)

    def is_password_field_displayed(self) -> bool:
        """Check if password field is visible."""
        return self.is_visible(self.PASSWORD_INPUT)

    def is_submit_button_enabled(self) -> bool:
        """Check if submit button is enabled."""
        return self.is_enabled(self.SUBMIT_BUTTON)

    def is_error_displayed(self) -> bool:
        """Check if error message is displayed."""
        return self.is_visible(self.ERROR_MESSAGE)

    def get_error_message(self) -> str:
        """Get error message text."""
        return self.get_text(self.ERROR_MESSAGE)

    def is_login_successful(self) -> bool:
        """Check if login was successful (redirected to dashboard)."""
        return "dashboard" in self.get_current_url() or "home" in self.get_current_url()

    # ============ Assertions ============

    def expect_error_message(self, message: str) -> None:
        """Assert error message contains text."""
        self.expect_text(self.ERROR_MESSAGE, message)

    def expect_login_success(self) -> None:
        """Assert successful login (URL contains dashboard)."""
        expect(self.page).to_have_url(r".*dashboard.*")
`;
}

function generatePythonLoginTest(config: ProjectConfig): string {
  const isSelenium = config.uiFramework === 'selenium';
  
  if (isSelenium) {
    return `"""
Login page UI tests for Selenium.
"""
import pytest
from src.pages.login_page import LoginPage


@pytest.mark.ui
class TestLogin:
    """Test class for Login functionality."""

    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        """Set up login page for each test."""
        self.login_page = LoginPage(driver)
        driver.get(f"{base_url}/login")

    @pytest.mark.smoke
    def test_login_form_is_visible(self):
        """Test that login form elements are visible."""
        assert self.login_page.is_username_field_displayed(), \\
            "Username field should be visible"
        assert self.login_page.is_password_field_displayed(), \\
            "Password field should be visible"
        assert self.login_page.is_submit_button_enabled(), \\
            "Submit button should be enabled"

    def test_invalid_credentials_shows_error(self):
        """Test that invalid credentials show error message."""
        self.login_page.login("invalid@email.com", "wrongpassword")
        
        assert self.login_page.is_error_displayed(), \\
            "Error message should be displayed"
        error_text = self.login_page.get_error_message().lower()
        assert "invalid" in error_text or "incorrect" in error_text, \\
            "Error should mention invalid credentials"

    def test_empty_username_shows_error(self):
        """Test that empty username shows error."""
        self.login_page.enter_password("somepassword")
        self.login_page.click_submit()
        
        assert self.login_page.is_error_displayed(), \\
            "Error should be shown for empty username"

    @pytest.mark.smoke
    def test_valid_credentials_login(self):
        """Test successful login with valid credentials."""
        self.login_page.login("test@example.com", "password123")
        
        assert self.login_page.is_login_successful(), \\
            "Should navigate to dashboard after successful login"
`;
  }
  
  return `"""
Login page UI tests.
"""
import pytest
from src.pages.login_page import LoginPage


@pytest.mark.ui
class TestLogin:
    """Test class for Login functionality."""

    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        """Set up login page for each test."""
        self.login_page = LoginPage(page)
        page.goto(f"{base_url}/login")

    @pytest.mark.smoke
    def test_login_form_is_visible(self):
        """Test that login form elements are visible."""
        assert self.login_page.is_username_field_displayed(), \\
            "Username field should be visible"
        assert self.login_page.is_password_field_displayed(), \\
            "Password field should be visible"
        assert self.login_page.is_submit_button_enabled(), \\
            "Submit button should be enabled"

    def test_invalid_credentials_shows_error(self):
        """Test that invalid credentials show error message."""
        self.login_page.login("invalid@email.com", "wrongpassword")
        
        assert self.login_page.is_error_displayed(), \\
            "Error message should be displayed"
        error_text = self.login_page.get_error_message().lower()
        assert "invalid" in error_text or "incorrect" in error_text, \\
            "Error should mention invalid credentials"

    def test_empty_username_shows_error(self):
        """Test that empty username shows error."""
        self.login_page.enter_password("somepassword")
        self.login_page.click_submit()
        
        assert self.login_page.is_error_displayed(), \\
            "Error should be shown for empty username"

    def test_empty_password_shows_error(self):
        """Test that empty password shows error."""
        self.login_page.enter_username("test@example.com")
        self.login_page.click_submit()
        
        assert self.login_page.is_error_displayed(), \\
            "Error should be shown for empty password"

    @pytest.mark.smoke
    def test_valid_credentials_login(self):
        """Test successful login with valid credentials."""
        # Use test credentials from environment or defaults
        self.login_page.login("test@example.com", "password123")
        
        assert self.login_page.is_login_successful(), \\
            "Should navigate to dashboard after successful login"
`;
}

function generatePythonApiClient(): string {
  return `"""
Base API client for making HTTP requests.
"""
import requests
from typing import Any, Dict, Optional
import logging
import os

logger = logging.getLogger(__name__)


class BaseApiClient:
    """
    Base API client providing common REST operations.
    All API clients should inherit from this class.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv(
            "API_BASE_URL", "https://jsonplaceholder.typicode.com"
        )
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
        logger.info(f"API Client initialized with base URL: {self.base_url}")

    # ============ HTTP Methods ============

    def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        """Send GET request."""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"GET {url}")
        return self.session.get(url, params=params, headers=headers)

    def post(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        """Send POST request."""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"POST {url}")
        return self.session.post(url, data=data, json=json, headers=headers)

    def put(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        """Send PUT request."""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"PUT {url}")
        return self.session.put(url, data=data, json=json, headers=headers)

    def patch(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        """Send PATCH request."""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"PATCH {url}")
        return self.session.patch(url, data=data, json=json, headers=headers)

    def delete(
        self,
        endpoint: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        """Send DELETE request."""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"DELETE {url}")
        return self.session.delete(url, headers=headers)

    # ============ Helper Methods ============

    def set_auth_token(self, token: str) -> None:
        """Set authorization bearer token."""
        self.session.headers["Authorization"] = f"Bearer {token}"

    def set_headers(self, headers: Dict[str, str]) -> None:
        """Update session headers."""
        self.session.headers.update(headers)

    def close(self) -> None:
        """Close the session."""
        self.session.close()
`;
}

function generatePythonUsersApiTest(): string {
  return `"""
Users API tests.
"""
import pytest
from src.utils.api_client import BaseApiClient


@pytest.mark.api
class TestUsersApi:
    """Test class for Users API endpoints."""

    @pytest.fixture(autouse=True)
    def setup(self, api_base_url):
        """Set up API client for each test."""
        self.api = BaseApiClient(api_base_url)

    def teardown_method(self):
        """Clean up after each test."""
        self.api.close()

    @pytest.mark.smoke
    def test_get_all_users(self):
        """Test GET /users returns list of users."""
        response = self.api.get("/users")
        
        assert response.status_code == 200, \\
            f"Expected 200, got {response.status_code}"
        
        users = response.json()
        assert isinstance(users, list), "Response should be a list"
        assert len(users) > 0, "Should return at least one user"

    def test_users_have_correct_structure(self):
        """Test that users have required fields."""
        response = self.api.get("/users")
        users = response.json()
        
        required_fields = ["id", "name", "email", "username"]
        first_user = users[0]
        
        for field in required_fields:
            assert field in first_user, f"User should have '{field}' field"

    @pytest.mark.smoke
    def test_get_user_by_id(self):
        """Test GET /users/{id} returns single user."""
        response = self.api.get("/users/1")
        
        assert response.status_code == 200
        user = response.json()
        assert user["id"] == 1
        assert "name" in user
        assert "@" in user["email"]

    def test_get_non_existent_user(self):
        """Test GET /users/{id} returns 404 for non-existent user."""
        response = self.api.get("/users/999999")
        
        assert response.status_code == 404

    @pytest.mark.smoke
    def test_create_user(self):
        """Test POST /users creates new user."""
        new_user = {
            "name": "Test User",
            "username": "testuser",
            "email": "test@example.com",
            "phone": "1-234-567-8900",
        }
        
        response = self.api.post("/users", json=new_user)
        
        assert response.status_code == 201
        created_user = response.json()
        assert "id" in created_user
        assert created_user["name"] == new_user["name"]
        assert created_user["email"] == new_user["email"]

    def test_update_user(self):
        """Test PUT /users/{id} updates existing user."""
        updated_data = {
            "name": "Updated Name",
            "email": "updated@example.com",
        }
        
        response = self.api.put("/users/1", json=updated_data)
        
        assert response.status_code == 200
        user = response.json()
        assert user["name"] == updated_data["name"]

    def test_delete_user(self):
        """Test DELETE /users/{id} deletes user."""
        response = self.api.delete("/users/1")
        
        assert response.status_code == 200
`;
}

function generatePythonPostsApiTest(): string {
  return `"""
Posts API tests.
"""
import pytest
from src.utils.api_client import BaseApiClient


@pytest.mark.api
class TestPostsApi:
    """Test class for Posts API endpoints."""

    @pytest.fixture(autouse=True)
    def setup(self, api_base_url):
        """Set up API client for each test."""
        self.api = BaseApiClient(api_base_url)

    def teardown_method(self):
        """Clean up after each test."""
        self.api.close()

    @pytest.mark.smoke
    def test_get_all_posts(self):
        """Test GET /posts returns list of posts."""
        response = self.api.get("/posts")
        
        assert response.status_code == 200
        posts = response.json()
        assert len(posts) > 0, "Should return posts"

    def test_get_post_by_id(self):
        """Test GET /posts/{id} returns single post."""
        response = self.api.get("/posts/1")
        
        assert response.status_code == 200
        post = response.json()
        assert post["id"] == 1
        assert "title" in post
        assert "body" in post
        assert "userId" in post

    def test_filter_posts_by_user(self):
        """Test GET /posts with userId filter."""
        response = self.api.get("/posts", params={"userId": 1})
        
        assert response.status_code == 200
        posts = response.json()
        assert all(post["userId"] == 1 for post in posts), \\
            "All posts should belong to userId 1"

    def test_create_post(self):
        """Test POST /posts creates new post."""
        new_post = {
            "title": "Test Post Title",
            "body": "This is the body of the test post.",
            "userId": 1,
        }
        
        response = self.api.post("/posts", json=new_post)
        
        assert response.status_code == 201
        created_post = response.json()
        assert "id" in created_post
        assert created_post["title"] == new_post["title"]
`;
}

function generatePythonInit(): string {
  return `"""
Package initialization.
"""
`;
}

// Main generator function
export function generateFiles(config: ProjectConfig): FileEntry[] {
  const files: FileEntry[] = [];
  const { projectName, language, includeUI, includeAPI, includeCI, includeDocker, initGit } = config;

  // Common files
  files.push({ path: `${projectName}/README.md`, content: generateReadme(config) });
  files.push({ path: `${projectName}/.env.example`, content: generateEnvExample() });
  
  if (initGit) {
    files.push({ path: `${projectName}/.gitignore`, content: generateGitignore(language) });
  }

  // TypeScript specific files
  if (language === 'typescript') {
    files.push({ path: `${projectName}/package.json`, content: generateTypeScriptPackageJson(config) });
    files.push({ path: `${projectName}/tsconfig.json`, content: generateTsConfig() });
    files.push({ path: `${projectName}/playwright.config.ts`, content: generatePlaywrightConfig(config) });
    files.push({ path: `${projectName}/src/utils/config.ts`, content: generateTsUtils() });
    files.push({ path: `${projectName}/src/utils/helpers.ts`, content: generateTsHelpers() });
    
    if (includeUI) {
      files.push({ path: `${projectName}/src/pages/BasePage.ts`, content: generateTsBasePage() });
      files.push({ path: `${projectName}/src/pages/LoginPage.ts`, content: generateTsLoginPage() });
      files.push({ path: `${projectName}/src/fixtures/base.fixture.ts`, content: generateTsFixture() });
      files.push({ path: `${projectName}/tests/ui/login.spec.ts`, content: generateTsLoginSpec() });
      files.push({ path: `${projectName}/tests/ui/home.spec.ts`, content: generateTsHomeSpec() });
    }
    
    if (includeAPI) {
      files.push({ path: `${projectName}/tests/api/users.spec.ts`, content: generateTsApiSpec() });
      files.push({ path: `${projectName}/tests/api/health.spec.ts`, content: generateTsHealthSpec() });
    }
    
    files.push({ path: `${projectName}/config/dev.json`, content: generateConfigJson('dev') });
    files.push({ path: `${projectName}/config/stage.json`, content: generateConfigJson('stage') });
    files.push({ path: `${projectName}/config/prod.json`, content: generateConfigJson('prod') });
    files.push({ path: `${projectName}/scripts/run-tests.sh`, content: generateRunScript() });
  }

  // Java specific files
  if (language === 'java') {
    files.push({ path: `${projectName}/pom.xml`, content: generateJavaPom(config) });
    files.push({ path: `${projectName}/src/test/java/com/automation/base/BaseTest.java`, content: generateJavaBaseTest(config) });
    files.push({ path: `${projectName}/src/test/java/com/automation/utils/ConfigReader.java`, content: generateJavaConfigReader() });
    files.push({ path: `${projectName}/src/test/java/com/automation/utils/TestUtils.java`, content: generateJavaTestUtils() });
    
    if (includeUI) {
      files.push({ path: `${projectName}/src/test/java/com/automation/utils/WebDriverFactory.java`, content: generateJavaWebDriverFactory() });
      files.push({ path: `${projectName}/src/test/java/com/automation/pages/BasePage.java`, content: generateJavaBasePage() });
      files.push({ path: `${projectName}/src/test/java/com/automation/pages/LoginPage.java`, content: generateJavaLoginPage() });
      files.push({ path: `${projectName}/src/test/java/com/automation/pages/HomePage.java`, content: generateJavaHomePage() });
      files.push({ path: `${projectName}/src/test/java/com/automation/tests/LoginTest.java`, content: generateJavaLoginTest() });
    }
    
    if (includeAPI) {
      files.push({ path: `${projectName}/src/test/java/com/automation/api/BaseApiClient.java`, content: generateJavaBaseApiClient() });
      files.push({ path: `${projectName}/src/test/java/com/automation/api/UsersApiTest.java`, content: generateJavaUsersApiTest() });
      files.push({ path: `${projectName}/src/test/java/com/automation/api/PostsApiTest.java`, content: generateJavaPostsApiTest() });
    }
    
    files.push({ path: `${projectName}/src/test/resources/config.properties`, content: generateJavaConfigProperties() });
    files.push({ path: `${projectName}/src/test/resources/log4j2.xml`, content: generateJavaLog4j() });
  }

  // Python specific files
  if (language === 'python') {
    files.push({ path: `${projectName}/requirements.txt`, content: generatePythonRequirements(config) });
    if (config.buildTool === 'poetry') {
      files.push({ path: `${projectName}/pyproject.toml`, content: generatePythonPyprojectToml(config) });
    }
    files.push({ path: `${projectName}/pytest.ini`, content: generatePythonPytestIni() });
    files.push({ path: `${projectName}/conftest.py`, content: generatePythonConftest(config) });
    
    // Source structure
    files.push({ path: `${projectName}/src/__init__.py`, content: generatePythonInit() });
    files.push({ path: `${projectName}/src/utils/__init__.py`, content: generatePythonInit() });
    files.push({ path: `${projectName}/src/utils/config.py`, content: generatePythonConfig() });
    files.push({ path: `${projectName}/src/utils/api_client.py`, content: generatePythonApiClient() });
    
    if (includeUI) {
      files.push({ path: `${projectName}/src/pages/__init__.py`, content: generatePythonInit() });
      files.push({ path: `${projectName}/src/pages/base_page.py`, content: generatePythonBasePage(config) });
      files.push({ path: `${projectName}/src/pages/login_page.py`, content: generatePythonLoginPage(config) });
    }
    
    // Tests
    files.push({ path: `${projectName}/tests/__init__.py`, content: generatePythonInit() });
    if (includeUI) {
      files.push({ path: `${projectName}/tests/ui/__init__.py`, content: generatePythonInit() });
      files.push({ path: `${projectName}/tests/ui/test_login.py`, content: generatePythonLoginTest(config) });
    }
    if (includeAPI) {
      files.push({ path: `${projectName}/tests/api/__init__.py`, content: generatePythonInit() });
      files.push({ path: `${projectName}/tests/api/test_users.py`, content: generatePythonUsersApiTest() });
      files.push({ path: `${projectName}/tests/api/test_posts.py`, content: generatePythonPostsApiTest() });
    }
  }

  // CI/CD
  if (includeCI) {
    files.push({ path: `${projectName}/.github/workflows/tests.yml`, content: generateGitHubWorkflow(config) });
  }

  // Docker
  if (includeDocker) {
    files.push({ path: `${projectName}/Dockerfile`, content: generateDockerfile(config) });
    files.push({ path: `${projectName}/docker-compose.yml`, content: generateDockerCompose(config) });
  }

  return files;
}
