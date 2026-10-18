import { OperationError } from "../../errors.ts";

/**
 * Encodes bytes as a big number in the given base. Each leading zero byte becomes the alphabet's
 * first character, so they survive a round trip (as in Bitcoin's Base58).
 */
export function encodeBaseX(input: Uint8Array, alphabet: string): string {
  const base = alphabet.length;
  let zeros = 0;
  while (zeros < input.length && input[zeros] === 0) zeros++;
  // Little-endian digits of the number.
  const digits: number[] = [];
  for (let i = zeros; i < input.length; i++) {
    let carry = input[i]!;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j]! << 8;
      digits[j] = carry % base;
      carry = Math.floor(carry / base);
    }
    while (carry > 0) {
      digits.push(carry % base);
      carry = Math.floor(carry / base);
    }
  }
  return (
    alphabet[0]!.repeat(zeros) +
    digits
      .reverse()
      .map((d) => alphabet[d])
      .join("")
  );
}

export function decodeBaseX(text: string, alphabet: string, name: string): Uint8Array {
  const base = alphabet.length;
  let zeros = 0;
  while (zeros < text.length && text[zeros] === alphabet[0]) zeros++;
  // Little-endian bytes of the number.
  const bytes: number[] = [];
  for (let i = zeros; i < text.length; i++) {
    let carry = alphabet.indexOf(text[i]!);
    if (carry < 0) throw new OperationError(`Invalid ${name}: unexpected character "${text[i]}"`);
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j]! * base;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  return new Uint8Array([...new Array<number>(zeros).fill(0), ...bytes.reverse()]);
}
