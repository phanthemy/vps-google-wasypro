import { useState, useEffect } from 'react';

const REF_COOKIE_NAME = 'wasy_ref';
const REF_STORAGE_KEY = 'wasy_ref_code';

export function useReferralAttribution() {
  const [referralCode, setReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('refCode') || params.get('referral');
      if (urlRef && urlRef.trim()) {
        const cleanRef = urlRef.trim().toUpperCase();
        try {
          sessionStorage.setItem(REF_STORAGE_KEY, cleanRef);
        } catch (e) {}
        return cleanRef;
      }

      // Khách vãng lai trực tiếp (URL không có param ref)
      // Dọn sạch toàn bộ cache / storage / cookie cũ để không bao giờ bị dính ref mặc định
      try {
        localStorage.removeItem(REF_STORAGE_KEY);
        sessionStorage.removeItem(REF_STORAGE_KEY);
        document.cookie = `${REF_COOKIE_NAME}=; max-age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`;
      } catch (e) {}
    }
    return '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref') || params.get('refCode') || params.get('referral');
    if (urlRef && urlRef.trim()) {
      const cleanRef = urlRef.trim().toUpperCase();
      setReferralCode(cleanRef);
      try {
        sessionStorage.setItem(REF_STORAGE_KEY, cleanRef);
        localStorage.setItem(REF_STORAGE_KEY, cleanRef);
        document.cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(cleanRef)}; path=/; SameSite=Lax;`;
      } catch (e) {}
    } else {
      // Khi URL không có ref, lập tức reset state và xóa sạch mọi lưu trữ
      setReferralCode('');
      try {
        localStorage.removeItem(REF_STORAGE_KEY);
        sessionStorage.removeItem(REF_STORAGE_KEY);
        document.cookie = `${REF_COOKIE_NAME}=; max-age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`;
      } catch (e) {}
    }
  }, []);

  const generateReferralLink = (userId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://wasypro.com';
    return `${origin}/?ref=${userId}`;
  };

  const clearReferralCode = () => {
    setReferralCode('');
    try {
      localStorage.removeItem(REF_STORAGE_KEY);
      sessionStorage.removeItem(REF_STORAGE_KEY);
      document.cookie = `${REF_COOKIE_NAME}=; max-age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`;
    } catch (e) {}
  };

  return {
    referralCode,
    setReferralCode,
    clearReferralCode,
    generateReferralLink,
  };
}
