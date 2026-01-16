import { ProjectConfig } from './types';

export interface FileEntry {
  path: string;
  content: string;
}

export function generateFolderTree(config: ProjectConfig): string[] {
  const paths: string[] = [];
  const { projectName, language, includeUI, includeAPI, includeCI, includeDocker, initGit } = config;

  // Root files
  paths.push(`${projectName}/`);
  paths.push(`${projectName}/README.md`);
  paths.push(`${projectName}/.env.example`);
  
  if (initGit) {
    paths.push(`${projectName}/.gitignore`);
  }

  if (language === 'typescript') {
    paths.push(`${projectName}/package.json`);
    paths.push(`${projectName}/tsconfig.json`);
    paths.push(`${projectName}/playwright.config.ts`);
    
    // Source structure
    paths.push(`${projectName}/src/`);
    paths.push(`${projectName}/src/utils/`);
    paths.push(`${projectName}/src/utils/config.ts`);
    paths.push(`${projectName}/src/utils/helpers.ts`);
    
    if (includeUI) {
      paths.push(`${projectName}/src/pages/`);
      paths.push(`${projectName}/src/pages/BasePage.ts`);
      paths.push(`${projectName}/src/pages/LoginPage.ts`);
      paths.push(`${projectName}/src/fixtures/`);
      paths.push(`${projectName}/src/fixtures/base.fixture.ts`);
    }
    
    // Tests
    paths.push(`${projectName}/tests/`);
    if (includeUI) {
      paths.push(`${projectName}/tests/ui/`);
      paths.push(`${projectName}/tests/ui/login.spec.ts`);
      paths.push(`${projectName}/tests/ui/home.spec.ts`);
    }
    if (includeAPI) {
      paths.push(`${projectName}/tests/api/`);
      paths.push(`${projectName}/tests/api/users.spec.ts`);
      paths.push(`${projectName}/tests/api/health.spec.ts`);
    }
    
    // Config
    paths.push(`${projectName}/config/`);
    paths.push(`${projectName}/config/dev.json`);
    paths.push(`${projectName}/config/stage.json`);
    paths.push(`${projectName}/config/prod.json`);
    
    // Scripts
    paths.push(`${projectName}/scripts/`);
    paths.push(`${projectName}/scripts/run-tests.sh`);
  }

  if (language === 'java') {
    if (config.buildTool === 'maven') {
      paths.push(`${projectName}/pom.xml`);
    } else {
      paths.push(`${projectName}/build.gradle`);
      paths.push(`${projectName}/settings.gradle`);
    }
    
    // Source structure
    paths.push(`${projectName}/src/`);
    paths.push(`${projectName}/src/test/`);
    paths.push(`${projectName}/src/test/java/`);
    paths.push(`${projectName}/src/test/java/com/`);
    paths.push(`${projectName}/src/test/java/com/automation/`);
    
    // Base classes
    paths.push(`${projectName}/src/test/java/com/automation/base/`);
    paths.push(`${projectName}/src/test/java/com/automation/base/BaseTest.java`);
    
    // Utils
    paths.push(`${projectName}/src/test/java/com/automation/utils/`);
    paths.push(`${projectName}/src/test/java/com/automation/utils/ConfigReader.java`);
    paths.push(`${projectName}/src/test/java/com/automation/utils/TestUtils.java`);
    
    if (includeUI) {
      paths.push(`${projectName}/src/test/java/com/automation/utils/WebDriverFactory.java`);
      paths.push(`${projectName}/src/test/java/com/automation/pages/`);
      paths.push(`${projectName}/src/test/java/com/automation/pages/BasePage.java`);
      paths.push(`${projectName}/src/test/java/com/automation/pages/LoginPage.java`);
      paths.push(`${projectName}/src/test/java/com/automation/pages/HomePage.java`);
      paths.push(`${projectName}/src/test/java/com/automation/tests/`);
      paths.push(`${projectName}/src/test/java/com/automation/tests/LoginTest.java`);
    }
    
    if (includeAPI) {
      paths.push(`${projectName}/src/test/java/com/automation/api/`);
      paths.push(`${projectName}/src/test/java/com/automation/api/BaseApiClient.java`);
      paths.push(`${projectName}/src/test/java/com/automation/api/UsersApiTest.java`);
      paths.push(`${projectName}/src/test/java/com/automation/api/PostsApiTest.java`);
    }
    
    // Resources
    paths.push(`${projectName}/src/test/resources/`);
    paths.push(`${projectName}/src/test/resources/config.properties`);
    paths.push(`${projectName}/src/test/resources/log4j2.xml`);
  }

  if (language === 'python') {
    paths.push(`${projectName}/requirements.txt`);
    if (config.buildTool === 'poetry') {
      paths.push(`${projectName}/pyproject.toml`);
    }
    paths.push(`${projectName}/pytest.ini`);
    paths.push(`${projectName}/conftest.py`);
    
    // Source structure
    paths.push(`${projectName}/src/`);
    paths.push(`${projectName}/src/__init__.py`);
    paths.push(`${projectName}/src/utils/`);
    paths.push(`${projectName}/src/utils/__init__.py`);
    paths.push(`${projectName}/src/utils/config.py`);
    paths.push(`${projectName}/src/utils/api_client.py`);
    
    if (includeUI) {
      paths.push(`${projectName}/src/pages/`);
      paths.push(`${projectName}/src/pages/__init__.py`);
      paths.push(`${projectName}/src/pages/base_page.py`);
      paths.push(`${projectName}/src/pages/login_page.py`);
    }
    
    // Tests
    paths.push(`${projectName}/tests/`);
    paths.push(`${projectName}/tests/__init__.py`);
    if (includeUI) {
      paths.push(`${projectName}/tests/ui/`);
      paths.push(`${projectName}/tests/ui/__init__.py`);
      paths.push(`${projectName}/tests/ui/test_login.py`);
    }
    if (includeAPI) {
      paths.push(`${projectName}/tests/api/`);
      paths.push(`${projectName}/tests/api/__init__.py`);
      paths.push(`${projectName}/tests/api/test_users.py`);
      paths.push(`${projectName}/tests/api/test_posts.py`);
    }
  }

  // CI/CD
  if (includeCI) {
    paths.push(`${projectName}/.github/`);
    paths.push(`${projectName}/.github/workflows/`);
    paths.push(`${projectName}/.github/workflows/tests.yml`);
  }

  // Docker
  if (includeDocker) {
    paths.push(`${projectName}/Dockerfile`);
    paths.push(`${projectName}/docker-compose.yml`);
  }

  return paths.sort();
}
