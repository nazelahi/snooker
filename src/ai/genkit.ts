
'use server';
/**
 * @fileoverview This file initializes and configures the Genkit AI library.
 *
 * It sets up the necessary plugins, specifically the Google AI plugin,
 * and exports a single `ai` object that can be used throughout the
VStack.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize the Genkit AI instance with the Google AI plugin.
// This single `ai` object will be used to define flows, prompts, and other
// AI-related functionalities.
export const ai = genkit({
  plugins: [googleAI()],
});
