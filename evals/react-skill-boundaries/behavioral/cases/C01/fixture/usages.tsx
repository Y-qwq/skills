import { AssigneePicker } from "./AssigneePicker";

export function TicketEditor({ ticket }: { ticket: { assigneeId: string | null } }) {
  return (
    <AssigneePicker
      assigneeId={ticket.assigneeId}
      defaultAssigneeId="current-user"
      onAssigneeChange={(id) => saveTicket(ticket, id)}
    />
  );
}

export function QuickCreate() {
  return (
    <AssigneePicker
      defaultAssigneeId="current-user"
      onAssigneeChange={(id) => markDraftDirty(id)}
    />
  );
}

declare function saveTicket(
  ticket: { assigneeId: string | null },
  id: string | null,
): void;
declare function markDraftDirty(id: string | null): void;
