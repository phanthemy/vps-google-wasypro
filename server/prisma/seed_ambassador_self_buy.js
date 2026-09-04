const {PrismaClient} = require("@prisma/client");
const p = new PrismaClient();
p.systemPolicyConfig.upsert({
  where: { key: "AMBASSADOR_SELF_BUY" },
  create: { key: "AMBASSADOR_SELF_BUY", value: "0.20", description: "Dai su tu mua hang (sau khi co Business ID)", version: "1.0.0" },
  update: { description: "Dai su tu mua hang (sau khi co Business ID)" }
}).then(function(r) {
  console.log("[SEED] AMBASSADOR_SELF_BUY =", r.value);
  return p.$disconnect();
}).catch(function(e) { console.error(e.message); process.exit(1); });
