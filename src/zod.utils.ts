import { ZodIssue } from 'zod';

export const flattenIssues = (issues: ZodIssue[]): string => issues.map((issue, index) => `${index + 1}. ${issue.path.join('.')}: ${issue.message}`).join(', ');
