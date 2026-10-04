export const BASE64_ALPHABETS = [
  { value: "base64", label: "Standard (RFC 4648): A-Za-z0-9+/=" },
  { value: "base64url", label: "URL safe (RFC 4648 §5): A-Za-z0-9-_" },
] as const;

export type Base64Alphabet = (typeof BASE64_ALPHABETS)[number]["value"];
