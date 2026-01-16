import { z } from 'zod';

// Language options
export const Language = z.enum(['typescript', 'java', 'python']);
export type Language = z.infer<typeof Language>;

// Build tools per language
export const BuildTool = z.enum(['npm', 'pnpm', 'maven', 'gradle', 'pip', 'poetry']);
export type BuildTool = z.infer<typeof BuildTool>;

// UI frameworks
export const UIFramework = z.enum(['playwright', 'selenium']);
export type UIFramework = z.infer<typeof UIFramework>;

// API frameworks
export const APIFramework = z.enum(['playwright-api', 'axios', 'rest-assured', 'requests']);
export type APIFramework = z.infer<typeof APIFramework>;

// Test runners
export const TestRunner = z.enum(['playwright-test', 'junit', 'testng', 'pytest']);
export type TestRunner = z.infer<typeof TestRunner>;

// Reporting options
export const ReportingOption = z.enum(['allure', 'html', 'junit-xml', 'pytest-html', 'surefire']);
export type ReportingOption = z.infer<typeof ReportingOption>;

// Main configuration schema
export const ProjectConfigSchema = z.object({
  // Step 1: Project Basics
  projectName: z.string()
    .min(1, 'Project name is required')
    .max(50, 'Project name must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Project name must be lowercase with hyphens only'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  author: z.string().max(50, 'Author name must be less than 50 characters').optional(),
  initGit: z.boolean().default(true),

  // Step 2: Test Coverage
  includeUI: z.boolean(),
  includeAPI: z.boolean(),

  // Step 3: Language + Tools
  language: Language,
  buildTool: BuildTool,
  uiFramework: UIFramework.optional(),
  apiFramework: APIFramework.optional(),

  // Step 4: Framework Options
  testRunner: TestRunner,
  reporting: z.array(ReportingOption),
  includeEnvConfig: z.boolean().default(true),
  includeCI: z.boolean().default(false),
  includeDocker: z.boolean().default(false),
}).refine(
  (data) => data.includeUI || data.includeAPI,
  { message: 'At least one test type (UI or API) must be selected', path: ['includeUI'] }
);

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

// Default configuration
export const defaultConfig: Partial<ProjectConfig> = {
  projectName: '',
  description: '',
  author: '',
  initGit: true,
  includeUI: true,
  includeAPI: false,
  language: 'typescript',
  buildTool: 'npm',
  uiFramework: 'playwright',
  testRunner: 'playwright-test',
  reporting: ['html'],
  includeEnvConfig: true,
  includeCI: false,
  includeDocker: false,
};

// Valid combinations mapping
export const validCombinations = {
  typescript: {
    buildTools: ['npm', 'pnpm'] as BuildTool[],
    uiFrameworks: ['playwright'] as UIFramework[],
    apiFrameworks: ['playwright-api', 'axios'] as APIFramework[],
    testRunners: ['playwright-test'] as TestRunner[],
    reporting: ['html', 'junit-xml'] as ReportingOption[],
  },
  java: {
    buildTools: ['maven', 'gradle'] as BuildTool[],
    uiFrameworks: ['selenium'] as UIFramework[],
    apiFrameworks: ['rest-assured'] as APIFramework[],
    testRunners: ['junit', 'testng'] as TestRunner[],
    reporting: ['allure', 'surefire', 'junit-xml'] as ReportingOption[],
  },
  python: {
    buildTools: ['pip', 'poetry'] as BuildTool[],
    uiFrameworks: ['playwright', 'selenium'] as UIFramework[],
    apiFrameworks: ['requests'] as APIFramework[],
    testRunners: ['pytest'] as TestRunner[],
    reporting: ['pytest-html', 'junit-xml', 'allure'] as ReportingOption[],
  },
} as const;

// Helper to check if a combination is valid
export function isValidBuildTool(language: Language, tool: BuildTool): boolean {
  return validCombinations[language].buildTools.includes(tool);
}

export function isValidUIFramework(language: Language, framework: UIFramework): boolean {
  return validCombinations[language].uiFrameworks.includes(framework);
}

export function isValidAPIFramework(language: Language, framework: APIFramework): boolean {
  return validCombinations[language].apiFrameworks.includes(framework);
}

export function isValidTestRunner(language: Language, runner: TestRunner): boolean {
  return validCombinations[language].testRunners.includes(runner);
}

export function isValidReporting(language: Language, option: ReportingOption): boolean {
  return validCombinations[language].reporting.includes(option);
}

// Labels for display
export const labels = {
  language: {
    typescript: 'TypeScript',
    java: 'Java',
    python: 'Python',
  },
  buildTool: {
    npm: 'npm',
    pnpm: 'pnpm',
    maven: 'Maven',
    gradle: 'Gradle',
    pip: 'pip',
    poetry: 'Poetry',
  },
  uiFramework: {
    playwright: 'Playwright',
    selenium: 'Selenium',
  },
  apiFramework: {
    'playwright-api': 'Playwright API',
    axios: 'Axios',
    'rest-assured': 'REST Assured',
    requests: 'Requests',
  },
  testRunner: {
    'playwright-test': 'Playwright Test',
    junit: 'JUnit 5',
    testng: 'TestNG',
    pytest: 'Pytest',
  },
  reporting: {
    allure: 'Allure Report',
    html: 'HTML Report',
    'junit-xml': 'JUnit XML',
    'pytest-html': 'Pytest HTML',
    surefire: 'Surefire Reports',
  },
} as const;
