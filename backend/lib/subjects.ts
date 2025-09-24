export type SubjectEnum = 'korean' | 'mathematics' | 'english' | 'others';

export function mapSubjectNameToEnum(name: string): SubjectEnum {
  const s = (name || '').toString().toLowerCase();
  if (s === 'korean' || s.includes('국어')) return 'korean';
  if (s === 'mathematics' || s.includes('수학') || s === 'math') return 'mathematics';
  if (s === 'english' || s.includes('영어')) return 'english';
  return 'others';
}

export function isValidRawScore(subject: SubjectEnum, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (!Number.isInteger(value)) return false;
  if (subject === 'korean' || subject === 'mathematics' || subject === 'english') {
    return value >= 0 && value <= 100 && value !== 1 && value !== 99;
  }
  return value >= 0 && value <= 50 && value !== 1 && value !== 49;
}
