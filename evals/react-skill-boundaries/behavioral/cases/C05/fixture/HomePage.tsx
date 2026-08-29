export function HomePage() {
  return (
    <main>
      <BookingsPanel />
      <TeamAnnouncementsPanel />
    </main>
  );
}

function BookingsPanel() {
  const bookings = useBookingsQuery();
  if (bookings.isError) return <button onClick={bookings.retry}>Retry bookings</button>;
  return <BookingList rows={bookings.data ?? []} />;
}

function TeamAnnouncementsPanel() {
  const news = useAnnouncementsQuery();
  if (news.isError) return <button onClick={news.retry}>Retry announcements</button>;
  return <AnnouncementList rows={news.data ?? []} />;
}

declare function useBookingsQuery(): QueryResult<unknown[]>;
declare function useAnnouncementsQuery(): QueryResult<unknown[]>;
declare function BookingList(props: { rows: unknown[] }): JSX.Element;
declare function AnnouncementList(props: { rows: unknown[] }): JSX.Element;
type QueryResult<T> = { data?: T; isError: boolean; retry(): void };
