import "server-only";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const globalForMongo = globalThis as unknown as {
  _auraMongo?: Promise<MongoClient>;
};

/** 共用連線（開發模式熱重載時不會重複建立連線） */
export function getMongoClient() {
  if (!uri) throw new Error("缺少 MONGODB_URI 環境變數");
  globalForMongo._auraMongo ??= new MongoClient(uri).connect();
  return globalForMongo._auraMongo;
}

export async function getDb() {
  return (await getMongoClient()).db();
}
