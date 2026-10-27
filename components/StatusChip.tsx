import { STATUS_LABEL } from '@/lib/status';
import type { Lang, Status } from '@/lib/types';

export default function StatusChip({ status, lang, pulse = false }: { status: Status; lang: Lang; pulse?: boolean }) {
  return (
    <span className={`chip chip-${status}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse && status !== 'normal' ? 'animate-pulseDot' : ''}`} />
      {STATUS_LABEL[status][lang]}
    </span>
  );
}
