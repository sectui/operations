import bcryptjs from "bcryptjs";
import { OperationError } from "../../errors.ts";
import { defineOperation } from "../../operation.ts";

const SALT = /^[./A-Za-z0-9]{22}$/;

export const bcrypt = defineOperation({
  id: "bcrypt",
  name: "Bcrypt",
  description: "Hashes the input (a password) with bcrypt, using a random salt unless one is given. Only the first 72 bytes are used.",
  category: "Hashing",
  output: "text",
  aliases: ["password hash", "blowfish"],
  infoUrl: "https://wikipedia.org/wiki/Bcrypt",
  args: {
    rounds: {
      type: "number",
      name: "Cost",
      description: "Log2 of the number of rounds: each step doubles the computing time.",
      min: 4,
      max: 31,
      default: 10,
    },
    salt: {
      type: "string",
      name: "Salt",
      description: "22 characters from ./A-Za-z0-9. Leave empty for a random salt.",
      default: "",
    },
  },
  examples: [
    {
      input: "hello",
      args: { rounds: 4, salt: "abcdefghijklmnopqrstuu" },
      output: "$2b$04$abcdefghijklmnopqrstuuwHJMEGjfAzmL1lWmUmlphguIbWfjYey",
    },
  ],
  run(input, { rounds, salt }) {
    if (!Number.isInteger(rounds)) throw new OperationError(`Invalid cost: ${rounds} is not an integer`);
    if (salt && !SALT.test(salt)) throw new OperationError("Invalid salt: expected 22 characters from ./A-Za-z0-9");
    const fullSalt = salt ? `$2b$${String(rounds).padStart(2, "0")}$${salt}` : bcryptjs.genSaltSync(rounds);
    return new TextEncoder().encode(bcryptjs.hashSync(new TextDecoder().decode(input), fullSalt));
  },
});
