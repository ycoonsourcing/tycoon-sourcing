import React, { createContext, useContext } from 'react';
import { SITE } from '@/content';

// LKR-ONLY MODE
// The site displays all prices in LKR. Internal calculations remain in AUD
// (since fees are defined in AUD), but the fmt() function always converts
// and labels as LKR for the client-facing UI.

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const rate = SITE.rate_lkr || 200;

  const fmt = (audAmt, dp) => {
    if (audAmt === null || audAmt === undefined) return '—';
    const lkr = audAmt * rate;
    const decimals = dp !== undefined ? dp : 0;
    return `LKR ${lkr.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const convert = (audAmt) => audAmt * rate;
  const symbol = () => 'LKR';

  return (
    <CurrencyContext.Provider value={{ currency:'LKR', setCurrency:()=>{}, rates:{LKR:rate}, live:false, fmt, convert, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
