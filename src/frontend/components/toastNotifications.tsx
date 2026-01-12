import React from "react";

export type ToastIntent = "info" | "success" | "warning" | "error";

interface ToastRecord {
  id: string;
  content: React.ReactNode;
  intent: ToastIntent;
  autoClose?: number | null;
  timeoutHandle?: number;
  createdAt: number;
}

interface ToastOptions {
  id?: string;
  intent?: ToastIntent;
  autoClose?: number | null;
}

interface ToastUpdateOptions {
  render?: React.ReactNode;
  intent?: ToastIntent;
  autoClose?: number | null;
}

interface ToastContainerProps {
  className?: string;
  toastClassName?: string;
  progressClassName?: string;
}

const DEFAULT_AUTO_CLOSE_MS = 5000;

class ToastStore {
  private toasts = new Map<string, ToastRecord>();
  private listeners = new Set<(records: ToastRecord[]) => void>();

  public add(content: React.ReactNode, options?: ToastOptions): string {
    const id = options?.id ?? this.createId();
    const autoClose = options?.autoClose;
    const toastRecord: ToastRecord = {
      id,
      content,
      intent: options?.intent ?? "info",
      autoClose: typeof autoClose === "undefined" ? DEFAULT_AUTO_CLOSE_MS : autoClose,
      createdAt: Date.now(),
    };

    this.toasts.set(id, toastRecord);
    this.startAutoDismissTimer(toastRecord);
    this.emit();
    return id;
  }

  public update(id: string, updates: ToastUpdateOptions): void {
    const record = this.toasts.get(id);
    if (!record) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(updates, "render")) {
      record.content = updates.render;
    }

    if (updates.intent) {
      record.intent = updates.intent;
    }

    if (Object.prototype.hasOwnProperty.call(updates, "autoClose")) {
      record.autoClose = updates.autoClose;
    }

    record.createdAt = Date.now();
    this.startAutoDismissTimer(record);
    this.emit();
  }

  public dismiss(id?: string): void {
    if (typeof id === "undefined") {
      this.toasts.forEach(record => this.clearTimer(record));
      this.toasts.clear();
    } else {
      const record = this.toasts.get(id);
      if (record) {
        this.clearTimer(record);
        this.toasts.delete(id);
      }
    }

    this.emit();
  }

  public subscribe(listener: (records: ToastRecord[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getToasts());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getToasts(): ToastRecord[] {
    return Array.from(this.toasts.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  private emit(): void {
    const snapshot = this.getToasts();
    this.listeners.forEach(listener => listener(snapshot));
  }

  private startAutoDismissTimer(record: ToastRecord): void {
    this.clearTimer(record);

    if (typeof record.autoClose === "number" && record.autoClose > 0) {
      record.timeoutHandle = window.setTimeout(() => {
        this.dismiss(record.id);
      }, record.autoClose);
    }
  }

  private clearTimer(record: ToastRecord): void {
    if (record.timeoutHandle) {
      window.clearTimeout(record.timeoutHandle);
      record.timeoutHandle = undefined;
    }
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

const toastStore = new ToastStore();

const toastFunction = (message: React.ReactNode, options?: ToastOptions): string => toastStore.add(message, options);

type ToastApi = typeof toastFunction & {
  update: (id: string, updates: ToastUpdateOptions) => void;
  dismiss: (id?: string) => void;
};

function classNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const toast: ToastApi = Object.assign(toastFunction, {
  update: (id: string, updates: ToastUpdateOptions) => toastStore.update(id, updates),
  dismiss: (id?: string) => toastStore.dismiss(id),
});

export const ToastContainer: React.FC<ToastContainerProps> = ({ className, toastClassName, progressClassName }) => {
  const [records, setRecords] = React.useState<ToastRecord[]>(toastStore.getToasts());

  React.useEffect(() => toastStore.subscribe(setRecords), []);

  if (records.length === 0) {
    return null;
  }

  const roleForIntent = (intent: ToastIntent): "status" | "alert" => (intent === "warning" || intent === "error" ? "alert" : "status");

  return (
    <div className={classNames("retro-toast-container", className)}>
      {records.map(record => (
        <div key={record.id} className={classNames("retro-toast", toastClassName)}>
          <div className={`retro-message-bar retro-message-bar--${record.intent}`} role={roleForIntent(record.intent)} aria-live={roleForIntent(record.intent) === "alert" ? "assertive" : "polite"}>
            <div className="retro-message-bar__content">{record.content}</div>
            <button type="button" className="retro-message-bar__dismiss" onClick={() => toast.dismiss(record.id)} aria-label="Dismiss notification">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          {typeof record.autoClose === "number" && record.autoClose > 0 ? <div className={classNames("retro-toast-progress", progressClassName)} style={{ animationDuration: `${record.autoClose}ms` }} /> : null}
        </div>
      ))}
    </div>
  );
};

export default toast;
