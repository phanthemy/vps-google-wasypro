import { useState, useEffect } from 'react';

const REF_COOKIE_NAME = 'wasy_ref';
const REF_STORAGE_KEY = 'wasy_ref_code';

export function useReferralAttribution() {
  const [referralCode, setReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('refCode') || params.get('referral');
      if (urlRef && urlRef.trim()) {
        return urlRef.trim().toUpperCase();
      }
      const sessionRef = sessionStorage.getItem(REF_STORAGE_KEY);
      if (sessionRef && sessionRef.trim()) return sessionRef.trim().toUpperCase();
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
      document.cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(cleanRef)}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax;`;
      localStorage.setItem(REF_STORAGE_KEY, cleanRef);
      sessionStorage.setItem(REF_STORAGE_KEY, cleanRef);
    }
  }, []);

  const generateReferralLink = (userId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://wasypro.com';
    return `${origin}/?ref=${userId}`;
  };

  const clearReferralCode = () => {
    setReferralCode('');
    document.cookie = `${REF_COOKIE_NAME}=; max-age=0; path=/;`;
    localStorage.removeItem(REF_STORAGE_KEY);
    sessionStorage.removeItem(REF_STORAGE_KEY);
  };

  return {
    referralCode,
    setReferralCode,
    clearReferralCode,
    generateReferralLink,
  };
}
