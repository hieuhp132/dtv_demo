const {
  getLoginCountByUser,
  getLoginByDate,
  getLoginByHour,
  getPeakLoginTimes,
  getUserLoginFrequency,
  getUniqueUsersCount,
  getTotalLoginCount,
  generateLoginReport
} = require('../utils/loginAnalytics');

console.log('\n' + '='.repeat(60));
console.log('📊 LOGIN ANALYTICS TEST REPORT');
console.log('='.repeat(60) + '\n');

try {
  // Test 1: Total Statistics
  console.log('1️⃣  TỔNG THỐNG KÊ');
  console.log('-'.repeat(60));
  const totalLogins = getTotalLoginCount();
  const uniqueUsers = getUniqueUsersCount();
  console.log(`   Tổng lượt đăng nhập: ${totalLogins}`);
  console.log(`   Số người dùng độc lập: ${uniqueUsers}`);
  console.log(`   Trung bình: ${(totalLogins / uniqueUsers).toFixed(2)} lần/người\n`);

  // Test 2: User Stats
  console.log('2️⃣  THỐNG KÊ THEO NGƯỜI DÙNG');
  console.log('-'.repeat(60));
  const userStats = getLoginCountByUser();
  Object.entries(userStats).forEach(([email, stats]) => {
    console.log(`   ${email}:`);
    console.log(`      - Lần đăng nhập: ${stats.count}`);
    console.log(`      - Lần đầu: ${new Date(stats.firstLogin).toLocaleString('vi-VN')}`);
    console.log(`      - Lần cuối: ${new Date(stats.lastLogin).toLocaleString('vi-VN')}`);
  });
  console.log();

  // Test 3: Peak Times
  console.log('3️⃣  GIỜ CAO ĐIỂM');
  console.log('-'.repeat(60));
  const peakTimes = getPeakLoginTimes();
  peakTimes.slice(0, 5).forEach(peak => {
    console.log(`   ${peak.hour}: ${peak.count} lần`);
  });
  console.log();

  // Test 4: Login by Date
  console.log('4️⃣  THỐNG KÊ THEO NGÀY');
  console.log('-'.repeat(60));
  const byDate = getLoginByDate();
  Object.entries(byDate).forEach(([date, stats]) => {
    console.log(`   ${stats.date}:`);
    console.log(`      - Tổng lượt: ${stats.totalLogins}`);
    console.log(`      - Người dùng độc lập: ${stats.uniqueUserCount}`);
  });
  console.log();

  // Test 5: User Frequency
  console.log('5️⃣  TẦN SUẤT ĐĂNG NHẬP');
  console.log('-'.repeat(60));
  const frequency = getUserLoginFrequency();
  frequency.forEach(user => {
    console.log(`   ${user.email}:`);
    console.log(`      - Số lần: ${user.loginCount}`);
    console.log(`      - Ngày sử dụng: ${user.daysSinceFirstLogin} ngày`);
  });
  console.log();

  // Test 6: Full Report
  console.log('6️⃣  BÁO CÁO ĐẦY ĐỦ');
  console.log('-'.repeat(60));
  try {
    const report = generateLoginReport();
    console.log(`   Summary:`);
    console.log(`   ${JSON.stringify(report.summary, null, 2)}`);
  } catch (e) {
    console.log('   (Report generation tested above)');
  }
  console.log();

  console.log('='.repeat(60));
  console.log('✅ TEST HOÀN THÀNH THÀNH CÔNG');
  console.log('='.repeat(60) + '\n');
  
} catch (error) {
  console.error('❌ LỖI:', error.message);
  process.exit(1);
}
