const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  var users = await p.user.findMany({ where: { userId: { startsWith: 'UAT-' } }, select: { userId:true,fullName:true,phone:true,role:true,rank:true,rankStatus:true,businessId:true,isSystemParticipant:true,qualifyingPoints:true,sPoints:true,isNpp:true,parentId:true }, orderBy: { userId: 'asc' } });
  console.log('=== UAT ACCOUNTS (' + users.length + ') ===');
  for(var i=0;i<users.length;i++) console.log(JSON.stringify(users[i]));
  
  var prods = await p.product.findMany({ select: { id:true,title:true,price:true,commissionPoints:true } });
  console.log('\n=== PRODUCTS (' + prods.length + ') ===');
  for(var j=0;j<prods.length;j++) console.log(JSON.stringify(prods[j]));
  
  var svcs = await p.service.findMany({ select: { id:true,name:true,price:true,commissionPoints:true } });
  console.log('\n=== SERVICES (' + svcs.length + ') ===');
  for(var k=0;k<svcs.length;k++) console.log(JSON.stringify(svcs[k]));
  
  var periods = await p.commissionPeriod.findMany({ select: { id:true,name:true,status:true } });
  console.log('\n=== PERIODS (' + periods.length + ') ===');
  for(var l=0;l<periods.length;l++) console.log(JSON.stringify(periods[l]));
  
  var oc = await p.order.count();
  var woc = await p.websiteOrder.count();
  var wsc = await p.wholesaleOrder.count();
  var cc = await p.commission.count();
  var ncc = await p.nppCommission.count();
  console.log('\n=== COUNTS ===');
  console.log('Orders:', oc, 'WebsiteOrders:', woc, 'WholesaleOrders:', wsc, 'Commissions:', cc, 'NppCommissions:', ncc);
  
  var custs = await p.customer.findMany({ select: { id:true,fullName:true,phone:true,sponsorUserId:true,linkedUserId:true } });
  console.log('\n=== ALL CUSTOMERS (' + custs.length + ') ===');
  for(var m=0;m<custs.length;m++) console.log(JSON.stringify(custs[m]));
  
  var totalUsers = await p.user.count();
  var uatUsers = await p.user.count({ where: { userId: { startsWith: 'UAT-' } } });
  console.log('\nTotal users:', totalUsers, 'UAT users:', uatUsers, 'Non-UAT:', totalUsers - uatUsers);
  
  var admins = await p.user.findMany({ where: { role: 'admin' }, select: { userId:true,phone:true,fullName:true } });
  console.log('\n=== ADMIN ACCOUNTS ===');
  for(var n=0;n<admins.length;n++) console.log(JSON.stringify(admins[n]));
  
  // Admin portal users
  var adminUsers = await p.adminUser.findMany({ select: { id:true,email:true,name:true,isActive:true } }).catch(function() { return []; });
  console.log('\n=== ADMIN PORTAL USERS ===');
  for(var o=0;o<adminUsers.length;o++) console.log(JSON.stringify(adminUsers[o]));
  
  process.exit(0);
}
main().catch(function(e) { console.error(e.message); process.exit(1); });
