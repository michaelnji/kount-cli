#!/usr/bin/env node

import { Box, render, Text, useApp } from 'ink';
import React, { useCallback, useEffect, useState } from 'react';
import type { KountConfig } from './cli/config-resolver.js';
import { resolveConfig } from './cli/config-resolver.js';
import { createCli } from './cli/parser.js';
import { Aggregator } from './core/aggregator.js';
import { checkQualityGates } from './core/quality-gates.js';
import type { ExecutionStage, ProjectStats } from './plugins/types.js';
import { writeCsvReport } from './reporters/csv.js';
import { serveHtmlDashboard } from './reporters/html.js';
import { writeJsonReport } from './reporters/json.js';
import { writeMarkdownReport } from './reporters/markdown.js';
import { ExecutionChecklist } from './reporters/terminal/ExecutionChecklist.js';
import { Splash } from './reporters/terminal/Splash.js';
import { Summary } from './reporters/terminal/Summary.js';
import type { WizardResult } from './reporters/terminal/Wizard.js';
import { Wizard } from './reporters/terminal/Wizard.js';
import { saveRun } from './state/history.js';

// ---------------------------------------------------------------------------
// Non-interactive execution (markdown / html modes)
// ---------------------------------------------------------------------------

async function runHeadless(config: KountConfig): Promise<void> {
    const aggregator = new Aggregator(config.rootDir, {
        respectGitignore: config.respectGitignore,
        cacheEnabled: config.cache.enabled,
        clearCache: config.cache.clearFirst,
        diffBranch: config.diffBranch,
        deepGit: config.deepGit,
        staleThreshold: config.staleThreshold,
    });

    // Silent mode — no progress callback
    const stats = await aggregator.run();

    // Persist run for trend tracking
    await saveRun(config.rootDir, stats);

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
    const [currentStage, setCurrentStage] = useState<ExecutionStage>('DISCOVERING');
    const [activeFile, setActiveFile] = useState<string | undefined>();
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reportMsg, setReportMsg] = useState<string>('');

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
            diffBranch: config.diffBranch,
            deepGit: config.deepGit,
            staleThreshold: config.staleThreshold,
        });

        aggregator
            .run((stage, file) => {
                setCurrentStage(stage);
                setActiveFile(file);
            })
            .then(async (result) => {
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
                // Persist run for trend tracking
                saveRun(config.rootDir, result).catch(() => {});
                setStats(result);

                // Generate report
                if (config.outputMode === 'markdown') {
                    const outputPath = await writeMarkdownReport(result, config.outputPath, config.force);
                    setReportMsg(`Markdown report written to ${outputPath}`);
                } else if (config.outputMode === 'html') {
                    const { url } = await serveHtmlDashboard(result);
                    setReportMsg(`Dashboard running at ${url}\nPress Ctrl+C to stop.`);
                } else if (config.outputMode === 'json') {
                    const outputPath = await writeJsonReport(result, config.outputPath);
                    setReportMsg(`JSON report written to ${outputPath}`);
                } else if (config.outputMode === 'csv') {
                    const outputPath = await writeCsvReport(result, config.outputPath);
                    setReportMsg(`CSV report written to ${outputPath}`);
                }

                setPhase('done');
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : String(err));
                setPhase('done');
            });
    }, [phase, config, exit]);

    const handleWizardComplete = useCallback((result: WizardResult) => {
        const updatedConfig: KountConfig = {
            ...config,
            rootDir: result.rootDir,
            outputMode: result.outputMode,
            includeTests: result.includeTests,
        };

        setConfig(updatedConfig);
        setPhase('scanning');
    }, [config]);

    // Auto-exit after done phase is displayed
    useEffect(() => {
        if (phase === 'done' && stats) {
            if (config.outputMode === 'html') {
                return; // Keep running for HTML serve
            }
            // Give the user a moment to see the results
            const timer = setTimeout(() => exit(), 500);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [phase, stats, exit, config.outputMode]);

    return (
        <Box flexDirection="column">
            {phase === 'splash' && <Splash />}
            {phase === 'wizard' && <Wizard onComplete={handleWizardComplete} />}
            {phase === 'scanning' && (
                <ExecutionChecklist
                    currentStage={currentStage}
                    activeFile={activeFile}
                />
            )}
            {phase === 'done' && error && (
                <Box marginY={1}>
                    <Text color="red" bold>Error: {error}</Text>
                </Box>
            )}
            {phase === 'done' && stats && config.outputMode === 'terminal' && <Summary stats={stats} />}
            {phase === 'done' && stats && config.outputMode !== 'terminal' && (
                <Box marginY={1}>
                    <Text color="green" bold>{reportMsg}</Text>
                </Box>
            )}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const cliFlags = createCli(process.argv);
    const config = await resolveConfig(cliFlags);

    // Non-TTY Bypass Only:
    // If stdout is not a TTY (piping), bypass Ink entirely.
    const isSilentMode = !process.stdout.isTTY;

    if (isSilentMode) {
        // Run engine silently with no-op callback, output raw data
        const aggregator = new Aggregator(config.rootDir, {
            respectGitignore: config.respectGitignore,
            cacheEnabled: config.cache.enabled,
            clearCache: config.cache.clearFirst,
            diffBranch: config.diffBranch,
            deepGit: config.deepGit,
            staleThreshold: config.staleThreshold,
        });

        const stats = await aggregator.run(); // silent — no callback

        await saveRun(config.rootDir, stats);

        const failures = checkQualityGates(config, stats);
        if (failures.length > 0) {
            for (const msg of failures) {
                process.stderr.write(`❌ Quality Gate Failed: ${msg}\n`);
            }
            process.exit(1);
        }

        if (config.outputMode === 'json') {
            const outputPath = await writeJsonReport(stats, config.outputPath);
            process.stdout.write(`JSON report written to ${outputPath}\n`);
        } else if (config.outputMode === 'csv') {
            const outputPath = await writeCsvReport(stats, config.outputPath);
            process.stdout.write(`CSV report written to ${outputPath}\n`);
        } else {
            // Non-TTY but terminal/markdown/html mode — fall through to headless
            await runHeadless(config);
        }

        process.exit(0);
    }

    // Determine if we need the wizard (no explicit flags were passed)
    const hasExplicitFlags = cliFlags.rootDir !== undefined || cliFlags.outputMode !== undefined;

    render(
        React.createElement(App, {
            config,
            needsWizard: !hasExplicitFlags,
        })
    );
}

main().catch((err: unknown) => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
});
