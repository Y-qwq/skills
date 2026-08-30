import { useInvoiceEditor } from "./useInvoiceEditor";

export function InvoiceEditor({ initial }: { initial: any }) {
  const editor = useInvoiceEditor(initial);
  const subtotal = editor.draft.lines.reduce(
    (sum: number, line: { amount: number }) => sum + line.amount,
    0,
  );
  const canSave = editor.draft.discount <= subtotal;
  return (
    <button disabled={!canSave} onClick={() => save(editor.draft)}>
      Save
    </button>
  );
}

declare function save(value: unknown): void;
