import { create } from "zustand";

type Filters = {
  from: string | null;
  to: string | null;
  locationId: string | null;
  keyword: string;
};

const useSearchFilters = create<
  Filters & { replaceFilters(next: Filters): void }
>((set) => ({
  from: null,
  to: null,
  locationId: null,
  keyword: "",
  replaceFilters: (next) => set(next),
}));

export function AppointmentSearchPage() {
  const filters = useSearchFilters();
  return <AppointmentResults filters={filters} />;
}

export function CustomerSearchPage() {
  const filters = useSearchFilters();
  return <CustomerResults filters={filters} />;
}

declare function AppointmentResults(props: { filters: Filters }): JSX.Element;
declare function CustomerResults(props: { filters: Filters }): JSX.Element;
