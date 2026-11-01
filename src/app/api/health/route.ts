import { connectDB } from "@/lib/db/mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { connection } = await connectDB();
    await connection.db?.admin().ping();
    return Response.json({ status: "ok", db: "connected" });
  } catch {
    return Response.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
