import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';

export interface ProgressIndicatorProps {
    status: string;
    details?: string;
}

/**
 * A clean, single-line loading state with an animated spinner.
 * Standardizes the "frozen terminal" UX polish requirement.
 */
export function ProgressIndicator({ status, details }: ProgressIndicatorProps): React.ReactElement {
    return (
        <Box marginY={1}>
            <Text color="cyan">
                <Spinner type="dots" />
            </Text>
            <Text color="cyan"> {status}</Text>
            {details && <Text color="gray"> ({details})</Text>}
        </Box>
    );
}
