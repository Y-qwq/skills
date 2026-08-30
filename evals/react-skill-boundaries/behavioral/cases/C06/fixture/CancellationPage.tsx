export function CancellationPage({ reservationId }: { reservationId: string }) {
  const reservation = useReservationQuery(reservationId);
  const quote = useCancellationQuoteQuery({
    reservationId,
    reservationVersion: reservation.data?.version,
  });

  const canConfirm = reservation.isSuccess && quote.isSuccess;
  return (
    <main>
      <ReservationSummary value={reservation.data} />
      <QuoteSummary value={quote.data} />
      <button
        disabled={!canConfirm}
        onClick={() =>
          confirmCancellation({
            reservationId,
            reservationVersion: reservation.data!.version,
            policyRevision: quote.data!.policyRevision,
          })
        }
      >
        Confirm cancellation
      </button>
    </main>
  );
}

declare function useReservationQuery(id: string): any;
declare function useCancellationQuoteQuery(input: any): any;
declare function confirmCancellation(input: any): void;
declare function ReservationSummary(props: { value: any }): JSX.Element;
declare function QuoteSummary(props: { value: any }): JSX.Element;
