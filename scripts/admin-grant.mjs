// Makes an existing account an admin (unlocks /admin).
//
//   npm run admin:grant you@example.com            # database in .env.local
//   MONGODB_URI="mongodb+srv://…/angel" npm run admin:grant you@example.com   # e.g. Atlas
//
// The account must already exist: register on the site first. A MONGODB_URI set
// in the shell wins over .env.local, so the second form targets another database.

import { MongoClient } from "mongodb";

const email = process.argv[2]?.trim().toLowerCase();
const uri = process.env.MONGODB_URI;

if (!email) {
  console.error("Usage: npm run admin:grant <email>");
  process.exit(1);
}
if (!uri) {
  console.error("MONGODB_URI is not set (add it to .env.local or pass it in the shell).");
  process.exit(1);
}

const client = await MongoClient.connect(uri);
try {
  const db = client.db();
  const host = uri.replace(/^mongodb(\+srv)?:\/\/([^@]*@)?/, "").split(/[/?]/)[0];
  console.log(`Database: ${db.databaseName} on ${host}`);

  // Better Auth stores users in the "user" collection.
  const result = await db.collection("user").updateOne({ email }, { $set: { role: "admin", updatedAt: new Date() } });
  if (result.matchedCount === 0) {
    console.error(`No account with email ${email}. Register on the site first, then run this again.`);
    process.exitCode = 1;
  } else {
    console.log(result.modifiedCount ? `${email} is now an admin.` : `${email} was already an admin.`);
    console.log("Sign out and back in (or sign in at /admin/login) for it to take effect.");
  }
} finally {
  await client.close();
}
