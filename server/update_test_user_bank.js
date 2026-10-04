#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.update({
    where: { phone: '0987654321' },
    data: {
      isBankLocked: false,
      bankInfo: 'LÊ VĂN TEST',
      bankAccount: '0441000678999',
      bankName: 'Vietcombank',
      bankBranch: 'Chi nhánh Nam Sài Gòn'
    }
  });
  console.log('Test User Updated:', {
    fullName: updated.fullName,
    phone: updated.phone,
    bankInfo: updated.bankInfo,
    bankAccount: updated.bankAccount,
    bankName: updated.bankName,
    bankBranch: updated.bankBranch,
    isBankLocked: updated.isBankLocked
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
