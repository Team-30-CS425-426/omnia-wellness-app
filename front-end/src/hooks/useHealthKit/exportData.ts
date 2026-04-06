import { exportHealthCsv } from "../../services/healthCSVExport";
import { DayPoint } from "./loadData";

export const EXPORT_DAYS_WINDOW = 30;

export async function exportDataToCsv(
  stepsRange: DayPoint[],
  sleepRange: DayPoint[]
) {
  await exportHealthCsv(stepsRange, sleepRange);
}