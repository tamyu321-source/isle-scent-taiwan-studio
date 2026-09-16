"use client";
import type { ReactNode, ComponentProps } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Download } from "lucide-react";
import { csvText, dateText, details, statusName } from "@/lib/classnest-domain";
import type { Actor, Command, NestState } from "@/lib/classnest-domain";

export type NestUI = {
  data: NestState;
  actor: Actor;
  now: number;
  busy: boolean;
  run: (command: Command, success: string) => Promise<boolean>;
};
export function SelectField({
  label,
  children,
  ...props
}: ComponentProps<typeof NativeSelect> & { label: string }) {
  return (
    <label className="cn-field">
      <span>{label}</span>
      <NativeSelect {...props} aria-label={label}>
        {children}
      </NativeSelect>
    </label>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="cn-modal">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function ConfirmModal({
  open,
  onClose,
  title,
  description,
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <AlertDialogContent className="cn-modal">
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>返回</AlertDialogCancel>
          <AlertDialogAction
            className="cn-primary"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            確定
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function downloadCSV(rows: (string | number)[][], name: string) {
  const url = URL.createObjectURL(
    new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportBookings(
  data: NestState,
  familyId?: string,
  teacherId?: string,
) {
  const rows = data.bookings.filter(
    (b) =>
      (!familyId || b.familyId === familyId) &&
      (!teacherId || details(data, b.sessionId).teacher.id === teacherId),
  );
  downloadCSV(
    [
      [
        "預約編號",
        "家庭",
        "孩子",
        "課程",
        "老師",
        "開課時間（台北）",
        "堂數",
        "狀態",
        "備註",
      ],
      ...rows.map((b) => {
        const d = details(data, b.sessionId);
        return [
          b.id,
          data.families.find((f) => f.id === b.familyId)!.name,
          data.children.find((c) => c.id === b.childId)!.name,
          d.course.title,
          d.teacher.name,
          dateText(d.session.start, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          b.credits,
          statusName[b.status],
          b.note,
        ];
      }),
    ],
    "classnest-bookings.csv",
  );
}
export function ExportButton({
  onClick,
  children = "匯出 CSV",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button className="cn-button" onClick={onClick}>
      <Download size={15} />
      {children}
    </button>
  );
}
export function Ledger({
  data,
  familyId,
}: {
  data: NestState;
  familyId: string;
}) {
  const rows = data.ledger
    .filter((v) => v.familyId === familyId)
    .slice()
    .reverse();
  const names = {
    grant: "方案發放",
    freeze: "預約凍結",
    release: "堂數退回",
    settle: "上課扣堂",
    adjust: "教務調整",
  };
  return (
    <section className="cn-panel">
      <div className="cn-section-title">
        <div>
          <p className="cn-eyebrow">EVERY LESSON COUNTS</p>
          <h2>堂數帳本</h2>
        </div>
        <ExportButton
          onClick={() =>
            downloadCSV(
              [
                [
                  "異動編號",
                  "時間（台北）",
                  "類型",
                  "可用變動",
                  "凍結變動",
                  "已扣變動",
                  "原因",
                  "預約編號",
                ],
                ...rows.map((e) => [
                  e.id,
                  dateText(e.at, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }),
                  names[e.kind],
                  e.available,
                  e.frozen,
                  e.spent,
                  e.reason,
                  e.bookingId ?? "",
                ]),
              ],
              "classnest-ledger.csv",
            )
          }
        />
      </div>
      <p className="cn-description">
        家庭共用堂數。預約先凍結，老師完成點名才正式扣除；每筆異動都保留原因。
      </p>
      <div className="cn-table-scroll">
        <table className="cn-table">
          <thead>
            <tr>
              <th>日期 / 異動</th>
              <th>原因</th>
              <th>可用</th>
              <th>凍結</th>
              <th>已扣</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{names[e.kind]}</strong>
                  <small>
                    {dateText(e.at)}{" "}
                    {dateText(e.at, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </small>
                </td>
                <td>
                  {e.reason}
                  {e.bookingId && <small>#{e.bookingId.slice(0, 8)}</small>}
                </td>
                {[e.available, e.frozen, e.spent].map((n, i) => (
                  <td key={i} className={n > 0 ? "cn-positive" : ""}>
                    {n > 0 ? "+" : ""}
                    {n || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
