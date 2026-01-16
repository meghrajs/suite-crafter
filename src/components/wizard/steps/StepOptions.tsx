import { ProjectConfig, validCombinations, labels, ReportingOption } from '@/lib/types';
import { OptionCard } from '../OptionCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlayCircle, FileText, Settings, Github, Container } from 'lucide-react';

interface StepOptionsProps {
  config: Partial<ProjectConfig>;
  onChange: (updates: Partial<ProjectConfig>) => void;
}

export function StepOptions({ config, onChange }: StepOptionsProps) {
  const language = config.language || 'typescript';
  const validOptions = validCombinations[language];

  const toggleReporting = (option: ReportingOption) => {
    const current = config.reporting || [];
    const updated = current.includes(option)
      ? current.filter(r => r !== option)
      : [...current, option];
    
    // Ensure at least one reporting option
    if (updated.length > 0) {
      onChange({ reporting: updated });
    }
  };

  return (
    <div className="step-content space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Framework Options</h2>
        <p className="text-muted-foreground">
          Configure test runner, reporting, and additional integrations.
        </p>
      </div>

      {/* Test Runner */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <PlayCircle className="w-4 h-4" />
          Test Runner
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {validOptions.testRunners.map((runner) => (
            <OptionCard
              key={runner}
              title={labels.testRunner[runner]}
              selected={config.testRunner === runner}
              onClick={() => onChange({ testRunner: runner })}
            />
          ))}
        </div>
      </div>

      {/* Reporting */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Reporting
          <span className="text-xs text-muted-foreground">(select multiple)</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {validOptions.reporting.map((option) => (
            <OptionCard
              key={option}
              title={labels.reporting[option]}
              selected={config.reporting?.includes(option)}
              onClick={() => toggleReporting(option)}
            />
          ))}
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Additional Options
        </h3>
        
        <div className="space-y-3">
          {/* Environment Config */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="envConfig" className="text-sm font-medium cursor-pointer">
                  Environment Configuration
                </Label>
                <p className="text-xs text-muted-foreground">
                  Config files for dev, stage, and prod environments
                </p>
              </div>
            </div>
            <Switch
              id="envConfig"
              checked={config.includeEnvConfig ?? true}
              onCheckedChange={(checked) => onChange({ includeEnvConfig: checked })}
            />
          </div>

          {/* GitHub Actions */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Github className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="ci" className="text-sm font-medium cursor-pointer">
                  GitHub Actions CI
                </Label>
                <p className="text-xs text-muted-foreground">
                  Workflow file for automated test runs
                </p>
              </div>
            </div>
            <Switch
              id="ci"
              checked={config.includeCI ?? false}
              onCheckedChange={(checked) => onChange({ includeCI: checked })}
            />
          </div>

          {/* Docker */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Container className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="docker" className="text-sm font-medium cursor-pointer">
                  Docker Support
                </Label>
                <p className="text-xs text-muted-foreground">
                  Dockerfile and docker-compose for containerized runs
                </p>
              </div>
            </div>
            <Switch
              id="docker"
              checked={config.includeDocker ?? false}
              onCheckedChange={(checked) => onChange({ includeDocker: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
