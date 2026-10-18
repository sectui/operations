export const BASE32_ALPHABETS = [
  { value: "base32", label: "Standard (RFC 4648): A-Z2-7=" },
  { value: "base32hex", label: "Extended hex (RFC 4648 §7): 0-9A-V=" },
] as const;

export type Base32Alphabet = (typeof BASE32_ALPHABETS)[number]["value"];

export const BASE32_CHARS: Record<Base32Alphabet, string> = {
  base32: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  base32hex: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
};

export const BASE58_ALPHABETS = [
  { value: "bitcoin", label: "Bitcoin: 1-9A-HJ-NP-Za-km-z" },
  { value: "flickr", label: "Flickr: 1-9a-km-zA-HJ-NP-Z" },
  { value: "ripple", label: "Ripple: rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz" },
] as const;

export const BASE58_CHARS: Record<(typeof BASE58_ALPHABETS)[number]["value"], string> = {
  bitcoin: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  flickr: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  ripple: "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz",
};

export const BASE62_ALPHABETS = [
  { value: "0-9A-Za-z", label: "Digits, uppercase, lowercase (GMP)" },
  { value: "0-9a-zA-Z", label: "Digits, lowercase, uppercase" },
] as const;

export const BASE62_CHARS: Record<(typeof BASE62_ALPHABETS)[number]["value"], string> = {
  "0-9A-Za-z": "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  "0-9a-zA-Z": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
};
