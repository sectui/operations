import { createHash } from "node:crypto";
import { defineOperation } from "../../operation.ts";

/** An OpenSSL digest name, as accepted by node:crypto createHash(). */
type Algorithm = "md5" | "sha1" | "sha224" | "sha256" | "sha384" | "sha512" | "sha3-224" | "sha3-256" | "sha3-384" | "sha3-512";

function defineHash<const Id extends string>(id: Id, name: string, algorithm: Algorithm, infoUrl: string, hello: string) {
  return defineOperation({
    id,
    name,
    description: `Computes the ${name} digest of the input, as lowercase hex.`,
    category: "Hashing",
    output: "text",
    aliases: [`${id}sum`, name],
    infoUrl,
    args: {},
    examples: [{ input: "hello", output: hello }],
    run: (input) => new TextEncoder().encode(createHash(algorithm).update(input).digest("hex")),
  });
}

const SHA2 = "https://wikipedia.org/wiki/SHA-2";
const SHA3 = "https://wikipedia.org/wiki/SHA-3";

export const md5 = defineHash("md5", "MD5", "md5", "https://wikipedia.org/wiki/MD5", "5d41402abc4b2a76b9719d911017c592");
export const sha1 = defineHash("sha1", "SHA-1", "sha1", "https://wikipedia.org/wiki/SHA-1", "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
export const sha224 = defineHash("sha224", "SHA-224", "sha224", SHA2, "ea09ae9cc6768c50fcee903ed054556e5bfc8347907f12598aa24193");
export const sha256 = defineHash("sha256", "SHA-256", "sha256", SHA2, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
export const sha384 = defineHash(
  "sha384",
  "SHA-384",
  "sha384",
  SHA2,
  "59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f",
);
export const sha512 = defineHash(
  "sha512",
  "SHA-512",
  "sha512",
  SHA2,
  "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043",
);
export const sha3_224 = defineHash("sha3-224", "SHA3-224", "sha3-224", SHA3, "b87f88c72702fff1748e58b87e9141a42c0dbedc29a78cb0d4a5cd81");
export const sha3_256 = defineHash(
  "sha3-256",
  "SHA3-256",
  "sha3-256",
  SHA3,
  "3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392",
);
export const sha3_384 = defineHash(
  "sha3-384",
  "SHA3-384",
  "sha3-384",
  SHA3,
  "720aea11019ef06440fbf05d87aa24680a2153df3907b23631e7177ce620fa1330ff07c0fddee54699a4c3ee0ee9d887",
);
export const sha3_512 = defineHash(
  "sha3-512",
  "SHA3-512",
  "sha3-512",
  SHA3,
  "75d527c368f2efe848ecf6b073a36767800805e9eef2b1857d5f984f036eb6df891d75f72d9b154518c1cd58835286d1da9a38deba3de98b5a53e5ed78a84976",
);
