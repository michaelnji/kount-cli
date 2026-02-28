#!/usr/bin/env node

import { Box, render, Text, useApp } from 'ink';
import React, { useCallback, useEffect, useState } from 'react';
import type { KountConfig } from './cli/config-resolver.js';
import { resolveConfig } from './cli/config-resolver.js';
import { createCli } from './cli/parser.js';
import { Aggregator } from './core/aggregator.js';
import { checkQualityGates } from './core/quality-gates.js';
import type { ProjectStats } from './plugins/types.js';
import { writeCsvReport } from './reporters/csv.js';
import { serveHtmlDashboard } from './reporters/html.js';
import { writeJsonReport } from './reporters/json.js';
import { writeMarkdownReport } from './reporters/markdown.js';
import { Progress } from './reporters/terminal/Progress.js';
import { Splash } from './reporters/terminal/Splash.js';
import { Summary } from './reporters/terminal/Summary.js';
import type { WizardResult } from './reporters/terminal/Wizard.js';
import { Wizard } from './reporters/terminal/Wizard.js';

// ---------------------------------------------------------------------------
// Non-interactive execution (markdown / html modes, or terminal with flags)
// ---------------------------------------------------------------------------

async function runHeadless(config: KountConfig): Promise<void> {
    const aggregator = new Aggregator(config.rootDir, {
        respectGitignore: config.respectGitignore,
        cacheEnabled: config.cache.enabled,
        clearCache: config.cache.clearFirst,
    });

    const stats = await aggregator.run();

    // Quality gate check
    const failures = checkQualityGates(config, stats);
    if (failures.length > 0) {
        for (const msg of failures) {
            process.stderr.write(`❌ Quality Gate Failed: ${msg}\n`);
        }
        process.exit(1);
    }

    if (config.outputMode === 'markdown') {
        const outputPath = await writeMarkdownReport(stats, config.outputPath, config.force);
        process.stdout.write(`Markdown report written to ${outputPath}\n`);
    } else if (config.outputMode === 'html') {
        const { url } = await serveHtmlDashboard(stats);
        process.stdout.write(`Dashboard running at ${url}\nPress Ctrl+C to stop.\n`);
    } else if (config.outputMode === 'json') {
        const outputPath = await writeJsonReport(stats, config.outputPath);
        process.stdout.write(`JSON report written to ${outputPath}\n`);
    } else if (config.outputMode === 'csv') {
        const outputPath = await writeCsvReport(stats, config.outputPath);
        process.stdout.write(`CSV report written to ${outputPath}\n`);
    }
}

// ---------------------------------------------------------------------------
// Ink Terminal UI App
// ---------------------------------------------------------------------------

type AppPhase = 'splash' | 'wizard' | 'scanning' | 'done';

interface AppProps {
    config: KountConfig;
    needsWizard: boolean;
}

function App({ config: initialConfig, needsWizard }: AppProps): React.ReactElement {
    const { exit } = useApp();
    const [phase, setPhase] = useState<AppPhase>(needsWizard ? 'splash' : 'scanning');
    const [config, setConfig] = useState<KountConfig>(initialConfig);
    const [progress, setProgress] = useState({ current: 0, total: 0, file: '' });
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Show splash briefly, then move to wizard
    useEffect(() => {
        if (phase === 'splash') {
            const timer = setTimeout(() => setPhase('wizard'), 1500);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [phase]);

    // Run the scan when entering the scanning phase
    useEffect(() => {
        if (phase !== 'scanning') return;

        const aggregator = new Aggregator(config.rootDir, {
            respectGitignore: config.respectGitignore,
            cacheEnabled: config.cache.enabled,
            clearCache: config.cache.clearFirst,
        });

        aggregator
            .run((current, total, filePath) => {
                setProgress({ current, total, file: filePath });
            })
            .then((result) => {
                // Quality gate check in terminal mode
                const failures = checkQualityGates(config, result);
                if (failures.length > 0) {
                    for (const msg of failures) {
                        process.stderr.write(`❌ Quality Gate Failed: ${msg}\n`);
                    }
                    exit();
                    setTimeout(() => process.exit(1), 100);
                    return;
                }
                setStats(result);
                setPhase('done');
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : String(err));
                setPhase('done');
            });
    }, [phase, config]);

    const handleWizardComplete = useCallback((result: WizardResult) => {
        const updatedConfig: KountConfig = {
            ...config,
            rootDir: result.rootDir,
            outputMode: result.outputMode,
            includeTests: result.includeTests,
        };

        if (result.outputMode !== 'terminal') {
            // Non-terminal mode selected in wizard — exit Ink and run headless
            exit();
            setTimeout(() => {
                runHeadless(updatedConfig).catch((err: unknown) => {
                    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
                    process.exit(1);
                });
            }, 100);
            return;
        }

        setConfig(updatedConfig);
        setPhase('scanning');
    }, [config, exit]);

    // Auto-exit after done phase is displayed
    useEffect(() => {
        if (phase === 'done' && stats) {
            // Give the user a moment to see the results
            const timer = setTimeout(() => exit(), 500);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [phase, stats, exit]);

    return (
        <Box flexDirection= "column" >
        { phase === 'splash' && <Splash />
}
{ phase === 'wizard' && <Wizard onComplete={ handleWizardComplete } /> }
{
    phase === 'scanning' && (
        <Box flexDirection="column" >
            <Progress
            current={ progress.current }
    total = { progress.total }
    currentFile = { progress.file }
        />
        </Box>
      )
}
{
    phase === 'done' && error && (
        <Box marginY={ 1 }>
            <Text color="red" bold > Error: { error } </Text>
                </Box>
      )
}
{ phase === 'done' && stats && <Summary stats={ stats } /> }
</Box>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const cliFlags = createCli(process.argv);
    const config = await resolveConfig(cliFlags);

    if (config.outputMode === 'terminal') {
        // Determine if we need the wizard (no explicit flags were passed)
        const hasExplicitFlags = cliFlags.rootDir !== undefined || cliFlags.outputMode !== undefined;

        render(
            React.createElement(App, {
                config,
                needsWizard: !hasExplicitFlags,
            })
        );
    } else {
        // Markdown, HTML, JSON, CSV — run headless (no Ink UI)
        await runHeadless(config);
    }
}

main().catch((err: unknown) => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
});
