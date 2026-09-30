const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '../zalo_token.json');

function loadTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      if (data.accessToken) return data;
    }
  } catch (e) {
    console.error('[ZNS] loadTokens error:', e.message);
  }
  return {
    accessToken: process.env.ZALO_OA_ACCESS_TOKEN || '',
    refreshToken: process.env.ZALO_OA_REFRESH_TOKEN || '',
    updatedAt: Date.now()
  };
}

function saveTokens(tokens) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ ...tokens, updatedAt: Date.now() }, null, 2));
  } catch (e) {
    console.error('[ZNS] saveTokens error:', e.message);
  }
}

async function refreshAccessToken() {
  const appId = process.env.ZALO_APP_ID || '2470893331175666168';
  const secretKey = process.env.ZALO_APP_SECRET || 'RdN7drFQAFVXf8187gHC';
  const current = loadTokens();

  if (!current.refreshToken) {
    throw new Error('Chưa cấu hình ZALO_OA_REFRESH_TOKEN');
  }

  const params = new URLSearchParams();
  params.append('app_id', appId);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', current.refreshToken);

  const res = await fetch('https://oauth.zalo.me/v4/oa/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'secret_key': secretKey
    },
    body: params.toString()
  });

  const data = await res.json();
  if (data.error && data.error !== 0) {
    console.error('[ZNS] Refresh token failed:', data);
    throw new Error(data.message || data.error_description || 'Không thể làm mới Zalo token');
  }

  const newTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || current.refreshToken,
    expiresIn: data.expires_in
  };
  saveTokens(newTokens);
  console.log('[ZNS] Zalo token refreshed successfully');
  return newTokens.accessToken;
}

function formatPhoneForZns(phone) {
  let p = phone.trim().replace(/\D/g, '');
  if (p.startsWith('84')) return p;
  if (p.startsWith('0')) return '84' + p.slice(1);
  return '84' + p;
}

async function sendOtpZns(rawPhone, otpCode) {
  const phone = formatPhoneForZns(rawPhone);
  const templateId = process.env.ZALO_ZNS_TEMPLATE_OTP || '643438';
  let tokens = loadTokens();
  let accessToken = tokens.accessToken;

  async function callZns(token) {
    return await fetch('https://business.openapi.zalo.me/message/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': token
      },
      body: JSON.stringify({
        phone: phone,
        template_id: templateId,
        template_data: {
          otp: String(otpCode)
        },
        tracking_id: `otp_${Date.now()}`
      })
    });
  }

  let res = await callZns(accessToken);
  let resData = await res.json();

  if (resData.error === -124 || resData.error === -216) {
    console.log('[ZNS] Access token expired, attempting auto-refresh...');
    try {
      accessToken = await refreshAccessToken();
      res = await callZns(accessToken);
      resData = await res.json();
    } catch (refreshErr) {
      console.error('[ZNS] Auto-refresh failed:', refreshErr.message);
    }
  }

  console.log(`[ZNS] Send OTP to ${phone}:`, resData);
  return resData;
}

/**
 * Gửi tin nhắn text qua Zalo OA đến 1 UID (miễn phí nếu user đã follow OA)
 */
async function sendOaTextMessage(recipientUid, text) {
  let tokens = loadTokens();
  let accessToken = tokens.accessToken;

  async function callApi(token) {
    return await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': token
      },
      body: JSON.stringify({
        recipient: { user_id: recipientUid },
        message: { text }
      })
    });
  }

  let res = await callApi(accessToken);
  let data = await res.json();

  if (data.error === -124 || data.error === -216) {
    accessToken = await refreshAccessToken();
    res = await callApi(accessToken);
    data = await res.json();
  }

  return data;
}

/**
 * Gửi OTP song song cho: Admin UIDs + Sponsor (CTV/NPP) nếu có zaloUid
 * @param {string} customerPhone - SĐT khách đăng ký
 * @param {string} otpCode - Mã OTP 6 số
 * @param {object|null} sponsor - { userId, fullName, zaloUid } của CTV/NPP giới thiệu
 */
async function broadcastOtpNotification(customerPhone, otpCode, sponsor) {
  const recipients = [];

  // 1. Admin UIDs from .env (comma-separated)
  const adminUids = (process.env.ZALO_ADMIN_UIDS || process.env.ZALO_ADMIN_UID || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const uid of adminUids) {
    recipients.push({ uid, label: 'ADMIN' });
  }

  // 2. Sponsor (CTV/NPP) if they have zaloUid
  if (sponsor && sponsor.zaloUid) {
    // Tránh trùng với admin
    if (!adminUids.includes(sponsor.zaloUid)) {
      recipients.push({ uid: sponsor.zaloUid, label: `CTV ${sponsor.userId} ${sponsor.fullName}` });
    }
  }

  if (recipients.length === 0) {
    console.log('[ZNS BROADCAST] No recipients configured');
    return [];
  }

  const sponsorInfo = sponsor ? `\n👤 Người giới thiệu: ${sponsor.fullName} (${sponsor.userId})` : '';
  const message = `🔐 MÃ OTP ĐĂNG KÝ\n━━━━━━━━━━━━━\n📱 SĐT khách: ${customerPhone}\n🔑 Mã OTP: ${otpCode}\n⏱ Hiệu lực: 5 phút${sponsorInfo}\n━━━━━━━━━━━━━\nCopy mã gửi cho khách nếu khách không nhận được qua Zalo.`;

  const results = await Promise.allSettled(
    recipients.map(async (r) => {
      try {
        const data = await sendOaTextMessage(r.uid, message);
        console.log(`[ZNS BROADCAST] ${r.label} (${r.uid}):`, data.error === 0 ? 'SUCCESS' : data);
        return { ...r, success: data.error === 0, data };
      } catch (err) {
        console.error(`[ZNS BROADCAST] ${r.label} (${r.uid}) ERROR:`, err.message);
        return { ...r, success: false, error: err.message };
      }
    })
  );

  return results;
}

module.exports = {
  loadTokens,
  saveTokens,
  refreshAccessToken,
  formatPhoneForZns,
  sendOtpZns,
  sendOaTextMessage,
  broadcastOtpNotification
};
