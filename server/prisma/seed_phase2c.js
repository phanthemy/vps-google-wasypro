const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const POLICY_VERSION = "1.3.0";

const configs = [
  // Ambassador thresholds & rates (FINAL SPEC v3.6)
  { key: "AMBASSADOR_THRESHOLD",            value: "5000",           desc: "Diem S tich luy toi thieu de dat rank Dai su Thuong mai (Ambassador)" },
  { key: "AMBASSADOR_SELF_BUY",             value: "0.20",           desc: "Dai su thuong mai tu mua hang (20%)" },
  { key: "AMBASSADOR_DIRECT_NO_ID",         value: "0.20",           desc: "Dai su ban cho khach CHUA co ID (ban le 20%)" },
  { key: "AMBASSADOR_DIRECT_WITH_ID",       value: "0.10",           desc: "Dai su ban cho khach DA co ID (10% - SPEC v3.6)" },

  // Manager rates (FINAL SPEC v3.6)
  { key: "MANAGER_SELF_BUY",                value: "0.25",           desc: "Quan ly tu mua hang (25%)" },
  { key: "MANAGER_DIRECT_NO_ID",            value: "0.25",           desc: "Quan ly ban cho khach CHUA co ID (25%)" },
  { key: "MANAGER_DIRECT_WITH_ID",          value: "0.10",           desc: "Quan ly ban cho khach DA co ID (10% - SPEC v3.6)" },
  { key: "MANAGER_F1_PURCHASE",             value: "0.10",           desc: "F1 cua Manager tu mua - Manager huong 10%" },
  { key: "MANAGER_F2_PURCHASE",             value: "0.05",           desc: "F2 cua Manager tu mua - Manager huong 5%" },
  { key: "MANAGER_F1_SELL_TO_CUSTOMER_NO_ID", value: "0.05",           desc: "Quan ly huong chenh lech khi F1 ban khach chua ID (5%)" },

  // Director rates (FINAL SPEC v3.6)
  { key: "DIRECTOR_SELF_BUY",               value: "0.30",           desc: "Giam doc tu mua hang (30%)" },
  { key: "DIRECTOR_DIRECT_NO_ID",           value: "0.30",           desc: "Giam doc ban cho khach CHUA co ID (30%)" },
  { key: "DIRECTOR_DIRECT_WITH_ID",         value: "0.10",           desc: "Giam doc ban cho khach DA co ID (10%)" },
  { key: "DIRECTOR_F1",                     value: "0.10",           desc: "Giam doc upstream tu F1 (D1) (10% - Boss chot)" },
  { key: "DIRECTOR_F2",                     value: "0.05",           desc: "Giam doc upstream tu F2 (D2) (5% - Boss chot)" },

  // System
  { key: "POLICY_VERSION",                  value: POLICY_VERSION,   desc: "Version policy hien tai - snapshot immutable tren Commission" },
];

async function main() {
  console.log("=== SEEDING PHASE 2C SYSTEM POLICY CONFIGS (SPEC v3.6) ===");

  for (const cfg of configs) {
    const existing = await prisma.systemPolicyConfig.findUnique({ where: { key: cfg.key } });
    if (existing) {
      if (existing.value !== cfg.value) {
        // Value difference detected -> update and record audit log with reason
        await prisma.systemPolicyConfig.update({
          where: { key: cfg.key },
          data: { value: cfg.value, description: cfg.desc, version: POLICY_VERSION, updatedBy: "SYSTEM_SEED_CORRECTION" },
        });
        await prisma.systemPolicyAuditLog.create({
          data: {
            policyId: existing.id,
            key: cfg.key,
            oldValue: existing.value,
            newValue: cfg.value,
            version: POLICY_VERSION,
            updatedBy: "SYSTEM_SEED_CORRECTION",
            reason: "CORRECT_RATE_TO_FINAL_SPEC_V3_6",
          },
        });
        console.log(`[SEED] UPDATED: ${cfg.key} from ${existing.value} -> ${cfg.value} (Audit logged)`);
      } else {
        // Same value -> only update description if changed
        await prisma.systemPolicyConfig.update({
          where: { key: cfg.key },
          data: { description: cfg.desc, version: POLICY_VERSION },
        });
        console.log(`[SEED] KEPT:    ${cfg.key} = ${existing.value}`);
      }
    } else {
      const created = await prisma.systemPolicyConfig.create({
        data: {
          key: cfg.key,
          value: cfg.value,
          description: cfg.desc,
          version: POLICY_VERSION,
          updatedBy: "SYSTEM_INITIAL_SEED",
        },
      });
      await prisma.systemPolicyAuditLog.create({
        data: {
          policyId: created.id,
          key: cfg.key,
          oldValue: null,
          newValue: cfg.value,
          version: POLICY_VERSION,
          updatedBy: "SYSTEM_INITIAL_SEED",
          reason: "INITIAL_CREATION",
        },
      });
      console.log(`[SEED] CREATED: ${cfg.key} = ${cfg.value}`);
    }
  }

  // Sequence for BusinessId
  const seq = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
  if (!seq) {
    await prisma.businessIdSequence.create({ data: { id: 1, nextVal: 10001 } });
    console.log("[SEED] BusinessIdSequence created: id=1, nextVal=10001");
  } else {
    console.log(`[SEED] BusinessIdSequence exists: nextVal=${seq.nextVal}`);
  }

  console.log("=== SEEDING PHASE 2C COMPLETE ===");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("[SEED ERROR]", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });