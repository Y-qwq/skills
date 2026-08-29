type SingleSave = {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
};

type SeriesSave = {
  seriesId: string;
  recurrenceRule: string;
  scope: "occurrence" | "series";
};

type Props = {
  isRecurring: boolean;
  appointmentId?: string;
  seriesId?: string;
  startsAt: string;
  endsAt: string;
  recurrenceRule?: string;
  onSaveSingle?: (payload: SingleSave) => void;
  onSaveSeries?: (payload: SeriesSave) => void;
};

export function ScheduleEditor(props: Props) {
  if (props.isRecurring) {
    return (
      <section>
        <RecurrencePreview rule={props.recurrenceRule!} />
        <button
          onClick={() =>
            props.onSaveSeries!({
              seriesId: props.seriesId!,
              recurrenceRule: props.recurrenceRule!,
              scope: "series",
            })
          }
        >
          Update series
        </button>
      </section>
    );
  }

  return (
    <section>
      <TimeRange startsAt={props.startsAt} endsAt={props.endsAt} />
      <button
        onClick={() =>
          props.onSaveSingle!({
            appointmentId: props.appointmentId!,
            startsAt: props.startsAt,
            endsAt: props.endsAt,
          })
        }
      >
        Update appointment
      </button>
    </section>
  );
}

declare function RecurrencePreview(props: { rule: string }): JSX.Element;
declare function TimeRange(props: {
  startsAt: string;
  endsAt: string;
}): JSX.Element;
