import { ProjectConfig } from '@/lib/types';
import { OptionCard } from '../OptionCard';
import { Monitor, Server, AlertCircle } from 'lucide-react';

interface StepCoverageProps {
  config: Partial<ProjectConfig>;
  onChange: (updates: Partial<ProjectConfig>) => void;
}

export function StepCoverage({ config, onChange }: StepCoverageProps) {
  const neitherSelected = !config.includeUI && !config.includeAPI;

  return (
    <div className="step-content space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Test Coverage</h2>
        <p className="text-muted-foreground">
          Choose what types of tests your framework should support. Select at least one.
        </p>
      </div>

      <div className="grid gap-4">
        <OptionCard
          title="UI Tests"
          description="Browser-based end-to-end testing with page objects, selectors, and visual verification."
          icon={<Monitor className="w-5 h-5" />}
          selected={config.includeUI}
          onClick={() => onChange({ includeUI: !config.includeUI })}
          badge="E2E"
        />

        <OptionCard
          title="API Tests"
          description="REST API testing with request builders, response assertions, and schema validation."
          icon={<Server className="w-5 h-5" />}
          selected={config.includeAPI}
          onClick={() => onChange({ includeAPI: !config.includeAPI })}
          badge="REST"
        />
      </div>

      {neitherSelected && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Selection Required</p>
            <p className="text-xs text-destructive/80 mt-1">
              You must select at least one test type to continue.
            </p>
          </div>
        </div>
      )}

      {config.includeUI && config.includeAPI && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">
            <span className="font-medium text-primary">Full Stack Testing</span> — 
            Your framework will include both UI and API test capabilities with shared utilities.
          </p>
        </div>
      )}
    </div>
  );
}
