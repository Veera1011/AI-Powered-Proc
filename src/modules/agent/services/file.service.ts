import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
    constructor(private configService: ConfigService) { }

    async extractData(fileBuffer: Buffer, mimeType: string, promptType: 'stock' | 'sales' | 'usage') {
        // This will be used by the AgentService to get raw content for Gemini analysis
        // Since we are using @google/adk, we can leverage the agent's internal vision capabilities
        // by passing the file data in a message.
        return {
            data: fileBuffer.toString('base64'),
            mimeType: mimeType
        };
    }

    getExtractionPrompt(promptType: 'stock' | 'sales' | 'usage') {
        const base = "Analyze this file. Extract ONLY the relevant procurement data. Ignore any footers, unrelated headers, or decorative text.";

        const types = {
            stock: "Extract as an array of JSON objects with keys: name, quantity (number), unit (string), and suggested threshold (number).",
            sales: "Extract as an array of JSON objects with keys: itemName (match name in our stock), quantity (number), and date (ISO string).",
            usage: "Extract as an array of JSON objects with keys: itemName (match name in our stock), quantity (number), and date (ISO string)."
        };

        return `${base} ${types[promptType]} Return ONLY a raw JSON array. If no relevant data is found, return an empty array [].`;
    }
}
