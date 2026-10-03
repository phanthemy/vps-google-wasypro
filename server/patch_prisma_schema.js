const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

if (!content.includes('bankAccount')) {
  content = content.replace(
    'bankInfo           String?',
    `bankInfo           String?
  email              String?
  address            String?
  bankAccount        String?
  bankName           String?
  bankBranch         String?
  isBankLocked       Boolean  @default(false)`
  );
}

if (!content.includes('model CompanyDocument')) {
  content += `

model CompanyDocument {
  id          String   @id @default(cuid())
  title       String
  category    String   @default("TERMS")
  fileUrl     String
  description String?
  version     String?  @default("1.0")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`;
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('schema.prisma updated successfully!');
