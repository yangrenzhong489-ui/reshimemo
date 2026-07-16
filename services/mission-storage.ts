import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Expense } from '@/types/expense';
import { getWeekRange, todayString } from '@/utils/date';
import { generateMissions, type MissionDefinition } from '@/utils/saving-missions';

const STORAGE_KEY = '@recimemo/saving-missions';

interface StoredMissions {
  /** ミッションを生成した週・月を表すキー。変わったら再生成する。 */
  generationKey: string;
  missions: MissionDefinition[];
}

async function readStored(): Promise<StoredMissions | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.generationKey === 'string' && Array.isArray(parsed?.missions)) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn('[mission-storage] 節約ミッションの読み込みに失敗しました', error);
    return null;
  }
}

async function saveMissions(generationKey: string, missions: MissionDefinition[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ generationKey, missions }));
  } catch (error) {
    console.warn('[mission-storage] 節約ミッションの保存に失敗しました', error);
  }
}

function buildGenerationKey(today: string): string {
  const { start } = getWeekRange(today);
  const yearMonth = today.slice(0, 7);
  return `${start}|${yearMonth}`;
}

/**
 * 今週・今月の節約ミッションを取得する。
 * 同じ週・月であれば保存済みのミッションをそのまま返し、週・月が変わっていれば新しく生成して保存する。
 */
export async function loadMissions(
  expenses: Expense[],
  today: string = todayString()
): Promise<MissionDefinition[]> {
  const generationKey = buildGenerationKey(today);
  const stored = await readStored();

  if (stored && stored.generationKey === generationKey) {
    return stored.missions;
  }

  const missions = generateMissions(expenses, today);
  await saveMissions(generationKey, missions);
  return missions;
}
