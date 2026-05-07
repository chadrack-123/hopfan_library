import { differenceInDays } from "date-fns";

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY ?? 5);

export function calculateFine(dueDate: Date, returnDate?: Date): number {
  const end = returnDate ?? new Date();
  const overdueDays = differenceInDays(end, dueDate);
  return overdueDays > 0 ? overdueDays * FINE_PER_DAY : 0;
}

export function generateMemberCode(): string {
  const prefix = "HOPFAN";
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
}
