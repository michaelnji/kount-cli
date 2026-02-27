import { Box, Text } from 'ink';
import React from 'react';

const LOGO = `
 ██╗  ██╗ ██████╗ ██╗   ██╗███╗   ██╗████████╗
 ██║ ██╔╝██╔═══██╗██║   ██║████╗  ██║╚══██╔══╝
 █████╔╝ ██║   ██║██║   ██║██╔██╗ ██║   ██║
 ██╔═██╗ ██║   ██║██║   ██║██║╚██╗██║   ██║
 ██║  ██╗╚██████╔╝╚██████╔╝██║ ╚████║   ██║
 ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝`;

/**
 * Splash screen component that displays the KOUNT ASCII logo.
 * Uses Ink's Box + Text for structured terminal rendering.
 * Follows render-single-write and tuicomp-border-styles guidelines.
 */
export function Splash(): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text color="cyan" bold>{LOGO}</Text>
      <Box marginTop={1}>
        <Text color="white" dimColor>  Project Intelligence for Codebases</Text>
      </Box>
    </Box>
  );
}
