import { Box, Text } from 'ink';
import React from 'react';

interface ProgressProps {
  current: number;
  total: number;
  currentFile: string;
}

/**
 * Real-time progress indicator for the streaming scan.
 * Shows a progress bar, percentage, and current file being processed.
 * Follows ux-progress-indicators and render-partial-updates guidelines.
 */
export function Progress({ current, total, currentFile }: ProgressProps): React.ReactElement {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const barWidth = 30;
  const filled = Math.round((percentage / 100) * barWidth);
  const empty = barWidth - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  // Color transitions: red < 33%, yellow < 66%, green >= 66%
  const barColor = percentage < 33 ? 'red' : percentage < 66 ? 'yellow' : 'green';

  return (
    <Box flexDirection="column" marginY={1}>
      <Box>
        <Text color="white" bold>Scanning: </Text>
        <Text color={barColor}>{bar}</Text>
        <Text color="white"> {percentage}%</Text>
        <Text color="gray"> ({current}/{total})</Text>
      </Box>
      <Box marginTop={0}>
        <Text color="gray" wrap="truncate-end">  {currentFile}</Text>
      </Box>
    </Box>
  );
}
