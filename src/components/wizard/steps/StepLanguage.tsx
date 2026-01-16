import { ProjectConfig, Language, BuildTool, UIFramework, APIFramework, validCombinations, labels } from '@/lib/types';
import { OptionCard } from '../OptionCard';
import { Code, Package, Monitor, Server } from 'lucide-react';

interface StepLanguageProps {
  config: Partial<ProjectConfig>;
  onChange: (updates: Partial<ProjectConfig>) => void;
}

const languageIcons: Record<Language, string> = {
  typescript: '🟦',
  java: '☕',
  python: '🐍',
};

const languageDescriptions: Record<Language, string> = {
  typescript: 'Modern, type-safe JavaScript with excellent Playwright support.',
  java: 'Enterprise-grade with Selenium and REST Assured ecosystem.',
  python: 'Clean syntax with powerful pytest framework.',
};

export function StepLanguage({ config, onChange }: StepLanguageProps) {
  const language = config.language || 'typescript';
  const validOptions = validCombinations[language];

  const handleLanguageChange = (newLanguage: Language) => {
    const newOptions = validCombinations[newLanguage];
    
    // Reset dependent options to first valid choice
    const updates: Partial<ProjectConfig> = {
      language: newLanguage,
      buildTool: newOptions.buildTools[0],
      testRunner: newOptions.testRunners[0],
      reporting: [newOptions.reporting[0]],
    };

    if (config.includeUI) {
      updates.uiFramework = newOptions.uiFrameworks[0];
    }
    if (config.includeAPI) {
      updates.apiFramework = newOptions.apiFrameworks[0];
    }

    onChange(updates);
  };

  return (
    <div className="step-content space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Language & Tools</h2>
        <p className="text-muted-foreground">
          Select your programming language and tooling preferences.
        </p>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Code className="w-4 h-4" />
          Programming Language
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['typescript', 'java', 'python'] as Language[]).map((lang) => (
            <OptionCard
              key={lang}
              title={`${languageIcons[lang]} ${labels.language[lang]}`}
              description={languageDescriptions[lang]}
              selected={language === lang}
              onClick={() => handleLanguageChange(lang)}
            />
          ))}
        </div>
      </div>

      {/* Build Tool */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Package className="w-4 h-4" />
          Build Tool
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {validOptions.buildTools.map((tool) => (
            <OptionCard
              key={tool}
              title={labels.buildTool[tool]}
              selected={config.buildTool === tool}
              onClick={() => onChange({ buildTool: tool })}
            />
          ))}
        </div>
      </div>

      {/* UI Framework (if UI tests enabled) */}
      {config.includeUI && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            UI Testing Framework
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {validOptions.uiFrameworks.map((framework) => (
              <OptionCard
                key={framework}
                title={labels.uiFramework[framework]}
                selected={config.uiFramework === framework}
                onClick={() => onChange({ uiFramework: framework })}
              />
            ))}
          </div>
        </div>
      )}

      {/* API Framework (if API tests enabled) */}
      {config.includeAPI && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Server className="w-4 h-4" />
            API Testing Framework
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {validOptions.apiFrameworks.map((framework) => (
              <OptionCard
                key={framework}
                title={labels.apiFramework[framework]}
                selected={config.apiFramework === framework}
                onClick={() => onChange({ apiFramework: framework })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
