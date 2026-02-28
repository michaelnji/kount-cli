import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import path from 'node:path';
import React from 'react';
import type { ExecutionStage } from '../../plugins/types.js';
import { EXECUTION_STAGES, STAGE_LABELS } from '../../plugins/types.js';

export interface ExecutionChecklistProps {
    currentStage: ExecutionStage;
    activeFile?: string;
}

/**
 * Renders a vertical checklist of execution stages with visual state indicators:
 *  [✓] Completed (green)
 *  [⠋] Active (cyan, spinning)
 *  [ ] Pending (gray)
 *
 * If the active stage is ANALYZING, renders the truncated activeFile path below it.
 */
export function ExecutionChecklist({ currentStage, activeFile }: ExecutionChecklistProps): React.ReactElement {
    const currentIndex = EXECUTION_STAGES.indexOf(currentStage);
    const termWidth = process.stdout.columns ?? 80;

    return (
        <Box flexDirection="column" marginY={1} marginLeft={1}>
            {EXECUTION_STAGES.map((stage, i) => {
                const label = STAGE_LABELS[stage];
                const isCompleted = i < currentIndex;
                const isActive = i === currentIndex;

                return (
                    <Box key={stage} flexDirection="column">
                        <Box>
                            {isCompleted && (
                                <Text color="green" bold>✓ </Text>
                            )}
                            {isActive && (
                                <Text color="cyan">
                                    <Spinner type="dots" />{' '}
                                </Text>
                            )}
                            {!isCompleted && !isActive && (
                                <Text color="gray">○ </Text>
                            )}
                            <Text
                                color={isCompleted ? 'green' : isActive ? 'cyan' : 'gray'}
                                bold={isActive}
                            >
                                {label}
                            </Text>
                        </Box>

                        {/* Show active file path during ANALYZING stage */}
                        {isActive && stage === 'ANALYZING' && activeFile && (
                            <Box marginLeft={3}>
                                <Text color="gray" dimColor>
                                    {truncatePath(activeFile, termWidth - 6)}
                                </Text>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

/**
 * Truncates a file path to fit within maxLen characters,
 * showing the basename and as much of the parent as possible.
 */
function truncatePath(filePath: string, maxLen: number): string {
    const rel = filePath; // already absolute, show it directly
    if (rel.length <= maxLen) return rel;

    const base = path.basename(filePath);
    const dir = path.dirname(filePath);

    // Show .../<truncated_dir>/<basename>
    const available = maxLen - base.length - 5; // 5 = ".../ " + "/"
    if (available <= 0) return `…/${base}`;

    const truncDir = dir.slice(dir.length - available);
    return `…/${truncDir}/${base}`;
}
