// Creates the admin account from ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME.
//
//   npm run admin:create                                              # database in .env.local
//   MONGODB_URI="mongodb+srv://…/angel" npm run admin:create          # e.g. Atlas
//
// If the account already exists it is made an admin; its password is left
// alone unless you add --reset-password. Values set in the shell win over .env.local.

import { MongoClient } from "mongodb";
import { hashPassword } from "better-auth/crypto";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME?.trim() || "Store Admin";
const uri = process.env.MONGODB_URI;
const resetPassword = process.argv.includes("--reset-password");

if (!uri) fail("MONGODB_URI is not set (add it to .env.local or pass it in the shell).");
if (!email || !email.includes("@")) fail("Set ADMIN_EMAIL to the admin's email address.");
// Same minimum as sign-up (src/lib/auth.ts).
if (password.length < 8) fail("Set ADMIN_PASSWORD to at least 8 characters.");

function fail(message) {
  console.error(message);
  process.exit(1);
}

const client = await MongoClient.connect(uri);
try {
  const db = client.db();
  const host = uri.replace(/^mongodb(\+srv)?:\/\/([^@]*@)?/, "").split(/[/?]/)[0];
  console.log(`Database: ${db.databaseName} on ${host}`);
  if (db.databaseName === "test") {
    console.warn('Warning: the connection string has no database name, so this is the default "test" database.');
  }

  // Better Auth collections: "user" for profiles, "account" for the email/password login.
  const users = db.collection("user");
  const accounts = db.collection("account");
  const now = new Date();
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne({ _id: existing._id }, { $set: { role: "admin", updatedAt: now } });
    if (resetPassword) {
      await accounts.updateOne(
        { userId: existing._id, providerId: "credential" },
        {
          $set: { password: await hashPassword(password), updatedAt: now },
          $setOnInsert: { accountId: existing._id.toString(), createdAt: now },
        },
        { upsert: true },
      );
    }
    console.log(`${email} already existed and is now an admin${resetPassword ? ", with the password from ADMIN_PASSWORD" : ""}.`);
  } else {
    const { insertedId } = await users.insertOne({ name, email, emailVerified: false, role: "admin", createdAt: now, updatedAt: now });
    await accounts.insertOne({
      accountId: insertedId.toString(),
      providerId: "credential",
      userId: insertedId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created admin ${email}.`);
  }
  console.log("Sign in at /admin/login.");
} finally {
  await client.close();
}
