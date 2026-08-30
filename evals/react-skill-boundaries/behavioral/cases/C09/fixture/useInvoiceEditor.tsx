import { useReducer } from "react";

type Draft = {
  currency: string;
  discount: number;
  lines: Array<{ id: string; amount: number }>;
};

type Action =
  | { type: "set-field"; field: keyof Draft; value: Draft[keyof Draft] }
  | { type: "replace-lines"; lines: Draft["lines"] };

export function useInvoiceEditor(initial: Draft) {
  const [draft, dispatch] = useReducer(reducer, initial);
  return {
    draft,
    dispatch,
    setField: (field: keyof Draft, value: Draft[keyof Draft]) =>
      dispatch({ type: "set-field", field, value }),
  };
}

function reducer(state: Draft, action: Action): Draft {
  if (action.type === "replace-lines") return { ...state, lines: action.lines };
  return { ...state, [action.field]: action.value };
}
