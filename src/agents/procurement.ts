import { LlmAgent } from '@google/adk';

export const procurementExpert = new LlmAgent({
    name: 'procurement_expert',
    model: 'gemini-2.5-flash',
    description: 'An AI expert for procurement and stock management.',
    instruction: 'You are a procurement expert. Help the user analyze stock levels, predict shortages, and identify trends in sales and usage. Use the provided tools to fetch real-time data.',
    tools: [], // Tools will be wired up by the NestJS service
});
