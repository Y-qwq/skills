# Proposed change

The proposal adds one page-level controller that waits for both queries, combines their errors, and refreshes both together. It also moves the existing panels into `presentation/`, query wrappers into `application/`, and response types into `domain/`. No business operation currently consumes both results.
