export interface Validation {
    valid: boolean;
    errors: string[];
}

export default function validateHoldingInput(symbol: unknown, units: unknown): Validation {
    const errors: string[] = [];

    // Symbol validation
    if (typeof symbol !== 'string' || symbol.trim().length === 0) {
        errors.push('Symbol is required and must be a string');
    } else {
        const s = symbol.trim().toUpperCase();
        if (s.length < 1 || s.length > 10) errors.push('Symbol length must be 1–10 characters');
        if (!/^[A-Z]{1,10}$/.test(s)) errors.push('Symbol must contain only uppercase letters A–Z');
    }

    // Units validation (accept numeric strings as well)
    const n = typeof units === 'number' ? units : typeof units === 'string' ? Number(units) : NaN;
    if (!Number.isFinite(n)) {
        errors.push('Units must be a finite number');
    } else if (n <= 0) {
        errors.push('Units must be a positive number');
    }

    return { valid: errors.length === 0, errors };
}