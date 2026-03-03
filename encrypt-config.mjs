#!/usr/bin/env node
/**
 * Encrypt a Firebase config (or any JSON with secrets) into config.enc.json
 * Usage: node encrypt-config.mjs path/to/config.json "super-secret-passphrase" [outputPath]
 */
import { readFileSync, writeFileSync } from "fs";
import { randomBytes, pbkdf2Sync, createCipheriv } from "crypto";

const [,, inputPath, secret, outputPath = "config.enc.json"] = process.argv;

if (!inputPath || !secret) {
    console.error("Usage: node encrypt-config.mjs path/to/config.json \"passphrase\" [outputPath]");
    process.exit(1);
}

const raw = readFileSync(inputPath, "utf8");
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(secret, salt, 120000, 32, "sha256");

const cipher = createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();
const payload = Buffer.concat([encrypted, tag]); // WebCrypto expects tag appended

const result = {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    data: payload.toString("base64"),
};

writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`Encrypted config written to ${outputPath}`);
