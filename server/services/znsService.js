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

module.exports = {
  loadTokens,
  saveTokens,
  refreshAccessToken,
  formatPhoneForZns,
  sendOtpZns
};
