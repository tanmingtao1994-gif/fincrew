import { withErrorHandling } from '../../utils/error.ts';

interface RequestUserConfirmationInput {
  action: string;
  details: string;
}

export async function requestUserConfirmation(input: RequestUserConfirmationInput): Promise<{ confirmed: boolean; userNotes?: string }> {
  return withErrorHandling(async () => {
    console.log(`\n[USER CONFIRMATION REQUIRED]`);
    console.log(`Action: ${input.action}`);
    console.log(`Details: ${input.details}`);
    console.log(`Type "yes" to confirm:`);
    
    // If MOCK_USER_CONFIRM is set, auto confirm/deny
    if (process.env.MOCK_USER_CONFIRM === 'true') {
        console.log('[Mock] User confirmed.');
        return { confirmed: true, userNotes: 'Mock confirmation' };
    } else if (process.env.MOCK_USER_CONFIRM === 'false') {
        console.log('[Mock] User denied.');
        return { confirmed: false, userNotes: 'Mock denial' };
    }
    
    // In real CLI, we would use readline here.
    // For now, return false to be safe in non-interactive environment
    return { confirmed: false, userNotes: 'Waiting for user input not supported in this context' };
  }, 'requestUserConfirmation');
}
