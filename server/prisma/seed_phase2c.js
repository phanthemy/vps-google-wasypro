const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("[SEED v2.2] Phase 2C: SystemPolicyConfig update");

  const POLICY_VERSION = "1.0.0";

  const configs = [
    // Ambassador
    { key: "AMBASSADOR_THRESHOLD",           value: "5000",           desc: "Nguong qualifyingPoints kich hoat Ambassador" },
    { key: "AMBASSADOR_QUALIFYING_PORTION",  value: "0.20",           desc: "Rate phan diem thieu <= nguong (split-point qualifying)" },
    { key: "AMBASSADOR_EXCESS_PORTION",      value: "0.10",           desc: "Rate phan diem vuot nguong (split-point excess)" },
    { key: "AMBASSADOR_DIRECT_NO_ID",        value: "0.20",           desc: "Dai su ban cho khach CHUA co Business ID" },
    { key: "AMBASSADOR_DIRECT_WITH_ID",      value: "0.10",           desc: "Dai su ban cho khach DA co Business ID" },
    // Manager
    { key: "MANAGER_SELF_BUY",               value: "0.25",           desc: "Truong phong tu mua hang" },
    { key: "MANAGER_DIRECT_NO_ID",           value: "0.25",           desc: "Truong phong ban cho khach CHUA co ID" },
    { key: "MANAGER_DIRECT_WITH_ID",         value: "0.10",           desc: "Truong phong ban cho khach DA co ID" },
    { key: "MANAGER_F1_PURCHASE",            value: "0.10",           desc: "F1 cua Manager tu mua - Manager huong 10%" },
    { key: "MANAGER_F2_PURCHASE",            value: "0.05",           desc: "F2 cua Manager tu mua - Manager huong 5%" },
    { key: "MANAGER_F1_SELL_TO_CUSTOMER_NO_ID", value: "NOT_CONFIGURED", desc: "OPEN-F: F1 cua Manager ban cho khach chua ID. Cho Ban dieu hanh." },
    // Director
    { key: "DIRECTOR_SELF_BUY",              value: "0.30",           desc: "Giam doc tu mua hang" },
    { key: "DIRECTOR_DIRECT_NO_ID",          value: "0.30",           desc: "Giam doc ban cho khach CHUA co ID" },
    { key: "DIRECTOR_DIRECT_WITH_ID",        value: "0.10",           desc: "Giam doc ban cho khach DA co ID" },
    { key: "DIRECTOR_F1",                    value: "NOT_CONFIGURED", desc: "OPEN-D: F1 cua Director. Cho Ban dieu hanh." },
    { key: "DIRECTOR_F2",                    value: "NOT_CONFIGURED", desc: "OPEN-E: F2 cua Director. Cho Ban dieu hanh." },
    // System
    { key: "POLICY_VERSION",                 value: "1.0.0",          desc: "Version policy hien tai - snapshot immutable tren Commission" },
  ];

  for (const cfg of configs) {
    const existing = await prisma.systemPolicyConfig.findUnique({ where: { key: cfg.key } });
    if (existing) {
      // Update description only ? never overwrite manually set values
      await prisma.systemPolicyConfig.update({
        where: { key: cfg.key },
        data: { description: cfg.desc, version: POLICY_VERSION },
      });
      // For NOT_CONFIGURED ? also sync value (still not configured)
      // For real values ? only sync if it was previously NOT_CONFIGURED
      if (existing.value === "NOT_CONFIGURED" && cfg.value !== "NOT_CONFIGURED") {
        await prisma.systemPolicyConfig.update({
          where: { key: cfg.key },
          data: { value: cfg.value },
        });
        console.log("[SEED v2.2] UPDATED (was NOT_CONFIGURED): " + cfg.key + " = " + cfg.value);
      } else {
        console.log("[SEED v2.2] KEPT:    " + cfg.key + " = " + existing.value);
      }
    } else {
      await prisma.systemPolicyConfig.create({
        data: { key: cfg.key, value: cfg.value, description: cfg.desc, version: POLICY_VERSION },
      });
      console.log("[SEED v2.2] CREATED: " + cfg.key + " = " + cfg.value);
    }
  }

  // BusinessIdSequence (idempotent)
  const seq = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
  if (!seq) {
    await prisma.businessIdSequence.create({ data: { id: 1, nextVal: 10001 } });
    console.log("[SEED v2.2] BusinessIdSequence created: nextVal=10001");
  } else {
    console.log("[SEED v2.2] BusinessIdSequence OK: nextVal=" + seq.nextVal);
  }

  console.log("[SEED v2.2] Done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error("[SEED v2.2] ERROR:", e.message); await prisma.$disconnect(); process.exit(1); });
