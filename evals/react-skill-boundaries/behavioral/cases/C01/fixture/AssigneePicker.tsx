import { useState } from "react";

type Props = {
  assigneeId?: string | null;
  defaultAssigneeId?: string | null;
  onAssigneeChange?: (id: string | null) => void;
};

export function AssigneePicker({
  assigneeId,
  defaultAssigneeId,
  onAssigneeChange,
}: Props) {
  const [draftId, setDraftId] = useState<string | null>(
    defaultAssigneeId ?? null,
  );
  const selectedId = assigneeId !== undefined ? assigneeId : draftId;

  function select(nextId: string | null) {
    setDraftId(nextId);
    onAssigneeChange?.(nextId);
  }

  return (
    <div>
      <button onClick={() => select("staff-42")}>Alex</button>
      <button onClick={() => select(null)}>Unassigned</button>
      <span>Selected: {selectedId ?? "none"}</span>
    </div>
  );
}
