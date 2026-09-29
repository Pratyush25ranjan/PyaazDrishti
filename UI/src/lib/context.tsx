import { createContext, useContext } from 'react';
import type { Batch, EdgeState, GradingPolicy } from './data';

export type PortalUser = { name: string; id: string; role: string; center: string } | null;

export type PortalContextValue = {
  records: Batch[];
  saveBatch: (batch: Batch) => void;
  clearRecords: () => void;
  language: 'en' | 'hi';
  setLanguage: (language: 'en' | 'hi') => void;
  textSize: number;
  setTextSize: (size: number) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  notify: (message: string) => void;
  t: (text: string) => string;
  user: PortalUser;
  login: (user: Exclude<PortalUser, null>) => void;
  logout: () => void;
  policy: GradingPolicy;
  updatePolicy: (policy: GradingPolicy) => void;
  online: boolean;
  edge: EdgeState;
  addCorrection: (batchId: string, note: string) => void;
  syncEdge: () => void;
};

export const PortalContext = createContext<PortalContextValue | null>(null);

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error('Portal context is unavailable.');
  return context;
}
