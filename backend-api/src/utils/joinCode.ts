import { customAlphabet } from 'nanoid';

// Generate readable join codes (no confusing characters)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // No 0, 1, I, O
const generateCode = customAlphabet(alphabet, 6);

export function generateJoinCode(): string {
  return generateCode();
}

export function validateJoinCode(code: string): boolean {
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code);
}
