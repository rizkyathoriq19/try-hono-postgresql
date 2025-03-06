import crypto from "crypto";

export const encrypt = (password: string): { salt: string; hash: string } => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

  return { salt, hash };
};
