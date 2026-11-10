import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { MongoClient, ObjectId } from "mongodb";

// 會員資料（users / accounts / sessions）存在 MongoDB，與網站其他資料同一個資料庫
const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

const env = process.env;

/** 目前有設定憑證的登入方式（未設定的不會出現在登入頁） */
export const enabledProviders = {
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  line: Boolean(env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET),
};

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  socialProviders: {
    ...(enabledProviders.google
      ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET!, prompt: "select_account" as const } }
      : {}),
    ...(enabledProviders.line ? { line: { clientId: env.LINE_CLIENT_ID!, clientSecret: env.LINE_CLIENT_SECRET! } } : {}),
  },
  account: {
    // 同一個 Email 用 Google 與 LINE 登入時，自動合併成同一位會員
    accountLinking: { enabled: true, trustedProviders: ["google", "line"] },
  },
  user: {
    additionalFields: {
      /** member：一般會員；florist：合作花店；admin 由 OWNER_EMAILS 決定 */
      role: { type: "string", required: false, defaultValue: "member", input: false },
      /** 停權：無法登入，既有 session 也會失效 */
      banned: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  databaseHooks: {
    session: {
      create: {
        // 被管理員停權的會員無法再登入
        before: async (session) => {
          const id = String(session.userId);
          const user = await db
            .collection("user")
            .findOne(ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }, { projection: { banned: 1 } });
          if (user?.banned) return false;
        },
        // 記錄最後登入時間（強制登出刪除 session 後仍保留）
        after: async (session) => {
          const id = String(session.userId);
          if (ObjectId.isValid(id)) await db.collection("user").updateOne({ _id: new ObjectId(id) }, { $set: { lastSeenAt: new Date() } });
        },
      },
    },
  },
  plugins: [nextCookies()],
});
