import { Box, Text } from 'ink';
import path from 'node:path';
import React from 'react';
import type { ProjectStats } from '../../plugins/types.js';

interface SummaryProps {
  stats: ProjectStats;
}

/**
 * Final summary display after scan completes.
 * Strict color-coding: green for success-like values, no emojis.
 * Follows ux-color-semantics and ux-next-steps guidelines.
 */
export function Summary({ stats }: SummaryProps): React.ReactElement {
  const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
  const blankLines = stats.pluginResults.get('BlankLines')?.summaryValue ?? 0;
  const commentLines = stats.pluginResults.get('CommentLines')?.summaryValue ?? 0;
  const totalBytes = stats.pluginResults.get('FileSize')?.summaryValue ?? 0;
  const codeLines = totalLines - blankLines - commentLines;
  const codeRatio = totalLines > 0 ? ((codeLines / totalLines) * 100).toFixed(1) : '0.0';

  // Format bytes
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Sort language distribution descending
  const sortedLangs = [...stats.languageDistribution.entries()]
    .sort((a, b) => b[1] - a[1]);

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Summary Section */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="green"
        paddingX={2}
        paddingY={1}
      >
        <Text color="green" bold>  SCAN RESULTS</Text>
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Box width={20}><Text color="white">Files</Text></Box>
            <Text color="cyan" bold>{stats.totalFiles.toLocaleString()}</Text>
          </Box>
          <Box>
            <Box width={20}><Text color="white">Total Lines</Text></Box>
            <Text color="cyan" bold>{totalLines.toLocaleString()}</Text>
          </Box>
          <Box>
            <Box width={20}><Text color="white">Code Lines</Text></Box>
            <Text color="green" bold>{codeLines.toLocaleString()}</Text>
          </Box>
          <Box>
            <Box width={20}><Text color="white">Comment Lines</Text></Box>
            <Text color="yellow" bold>{commentLines.toLocaleString()}</Text>
          </Box>
          <Box>
            <Box width={20}><Text color="white">Blank Lines</Text></Box>
            <Text color="gray" bold>{blankLines.toLocaleString()}</Text>
          </Box>
          <Box>
            <Box width={20}><Text color="white">Code Ratio</Text></Box>
            <Text color="green" bold>{codeRatio}%</Text>
          </Box>
          <Box>
            <Box width={20}><Text color="white">Total Size</Text></Box>
            <Text color="cyan" bold>{formatSize(totalBytes)}</Text>
          </Box>
        </Box>
      </Box>

      {/* Language Distribution */}
      {sortedLangs.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="blue"
          paddingX={2}
          paddingY={1}
          marginTop={1}
        >
          <Text color="blue" bold>  LANGUAGE DISTRIBUTION</Text>
          <Box marginTop={1} flexDirection="column">
            {sortedLangs.map(([lang, count]) => {
              const pct = ((count / stats.totalFiles) * 100).toFixed(1);
              return (
                <Box key={lang}>
                  <Box width={22}><Text color="white">{lang}</Text></Box>
                  <Box width={8}><Text color="cyan">{count} files</Text></Box>
                  <Text color="gray"> ({pct}%)</Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Largest Files */}
      {stats.largestFiles.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="magenta"
          paddingX={2}
          paddingY={1}
          marginTop={1}
        >
          <Text color="magenta" bold>  TOP {stats.largestFiles.length} LARGEST FILES</Text>
          <Box marginTop={1} flexDirection="column">
            {stats.largestFiles.map((file, i) => {
              const relPath = path.relative(stats.rootDir, file.filePath);
              return (
                <Box key={file.filePath}>
                  <Box width={4}><Text color="gray">{i + 1}.</Text></Box>
                  <Box width={40}><Text color="white" wrap="truncate-end">{relPath}</Text></Box>
                  <Text color="yellow">{formatSize(file.size)}</Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text color="gray">Scanned at {stats.scannedAt.toLocaleString()}</Text>
      </Box>
    </Box>
  );
}
