import { Box, Text, useApp, useInput } from 'ink';
import React, { useCallback, useState } from 'react';

export interface WizardResult {
  rootDir: string;
  outputMode: 'terminal' | 'markdown' | 'html';
  includeTests: boolean;
}

interface WizardProps {
  onComplete: (result: WizardResult) => void;
}

type Step = 'rootDir' | 'outputMode' | 'includeTests';

const OUTPUT_MODES = ['terminal', 'markdown', 'html'] as const;

/**
 * Minimal interactive step-based wizard when no CLI flags are provided.
 * Follows prompt-group-flow, input-useinput-hook, input-escape-routes guidelines.
 */
export function Wizard({ onComplete }: WizardProps): React.ReactElement {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('rootDir');
  const [rootDir, setRootDir] = useState('.');
  const [rootDirInput, setRootDirInput] = useState('.');
  const [outputModeIndex, setOutputModeIndex] = useState(0);
  const [includeTestsIndex, setIncludeTestsIndex] = useState(0);

  const boolOptions = ['Yes', 'No'] as const;

  useInput(useCallback((input: string, key: { return?: boolean; escape?: boolean; upArrow?: boolean; downArrow?: boolean; backspace?: boolean; delete?: boolean }) => {
    // Escape route
    if (key.escape) {
      exit();
      return;
    }

    if (step === 'rootDir') {
      if (key.return) {
        setRootDir(rootDirInput || '.');
        setStep('outputMode');
      } else if (key.backspace || key.delete) {
        setRootDirInput(prev => prev.slice(0, -1));
      } else if (input && !key.upArrow && !key.downArrow) {
        setRootDirInput(prev => prev + input);
      }
    } else if (step === 'outputMode') {
      if (key.upArrow) {
        setOutputModeIndex(prev => (prev - 1 + OUTPUT_MODES.length) % OUTPUT_MODES.length);
      } else if (key.downArrow) {
        setOutputModeIndex(prev => (prev + 1) % OUTPUT_MODES.length);
      } else if (key.return) {
        setStep('includeTests');
      }
    } else if (step === 'includeTests') {
      if (key.upArrow || key.downArrow) {
        setIncludeTestsIndex(prev => (prev + 1) % 2);
      } else if (key.return) {
        onComplete({
          rootDir: rootDir,
          outputMode: OUTPUT_MODES[outputModeIndex],
          includeTests: includeTestsIndex === 0,
        });
      }
    }
  }, [step, rootDirInput, rootDir, outputModeIndex, includeTestsIndex, onComplete, exit]));

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Text color="cyan" bold>KOUNT Setup Wizard</Text>
      <Text color="gray">Press ESC to cancel at any time.</Text>
      <Box marginTop={1} flexDirection="column">

        {/* Step 1: Root Directory */}
        <Box flexDirection="column">
          <Text color={step === 'rootDir' ? 'white' : 'green'} bold>
            {step === 'rootDir' ? '>' : '✓'} Root directory:
            {step !== 'rootDir' && <Text color="cyan"> {rootDir}</Text>}
          </Text>
          {step === 'rootDir' && (
            <Box marginLeft={2}>
              <Text color="cyan">{rootDirInput}</Text>
              <Text color="gray">█</Text>
            </Box>
          )}
        </Box>

        {/* Step 2: Output Mode */}
        {(step === 'outputMode' || step === 'includeTests') && (
          <Box flexDirection="column" marginTop={1}>
            <Text color={step === 'outputMode' ? 'white' : 'green'} bold>
              {step === 'outputMode' ? '>' : '✓'} Output mode:
              {step !== 'outputMode' && <Text color="cyan"> {OUTPUT_MODES[outputModeIndex]}</Text>}
            </Text>
            {step === 'outputMode' && (
              <Box marginLeft={2} flexDirection="column">
                {OUTPUT_MODES.map((mode, i) => (
                  <Text key={mode} color={i === outputModeIndex ? 'cyan' : 'gray'}>
                    {i === outputModeIndex ? '> ' : '  '}{mode}
                  </Text>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Step 3: Include Tests */}
        {step === 'includeTests' && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="white" bold>{'>'} Include test files?</Text>
            <Box marginLeft={2} flexDirection="column">
              {boolOptions.map((opt, i) => (
                <Text key={opt} color={i === includeTestsIndex ? 'cyan' : 'gray'}>
                  {i === includeTestsIndex ? '> ' : '  '}{opt}
                </Text>
              ))}
            </Box>
          </Box>
        )}

      </Box>
    </Box>
  );
}
