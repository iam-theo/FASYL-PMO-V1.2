# `store/` — intentionally empty

**Decision: this module does not use Zustand.** The brief allowed it "only if
state management is required". It is not, and adding it would make the module
worse rather than better.

## Where state actually lives

| State | Home | Why |
| --- | --- | --- |
| Reports, projects, stages | `utils/requestCache.js`, read through `services/` | Server state. It is a cache of someone else's data, not state this app owns — it needs TTL, de-duplication and invalidation, none of which a store provides. |
| Filters, sort, page | The URL, via `useReportQueryState` | Makes a filtered list shareable, refresh-proof and back-button-correct. |
| Open dialog, pending delete, selected project | `useState` in the page that owns it | Dies with the page. Nothing else can observe it. |
| Form values | React Hook Form | Already a state manager, with validation attached. |
| Toasts | `ToastProvider` context | Genuinely cross-cutting, genuinely tiny. |

## What a store would cost

The two candidates for a store are the cache and the URL state, and both get
worse under one:

- **Duplicating the cache in a store** gives two places that believe they know
  the current list of reports. The classic failure: the browser Back button
  changes the URL, the store does not hear about it, and the table keeps
  rendering the previous page's filters.
- **Mirroring URL state into a store** means every filter change writes twice
  and the two writes can disagree. The URL is already a global, observable,
  serialisable store that the browser keeps in sync for free.

That leaves a store holding only dialog booleans — global state for something
one component uses.

## When to revisit

Add a store (or, more likely, TanStack Query) when one of these becomes true:

- Two sibling routes need to mutate the same data and see each other's writes
  immediately, without a refetch.
- The module needs optimistic updates across more than one screen at a time.
- You want retry policies, refetch-on-focus, or query cancellation — at which
  point use TanStack Query rather than building it inside a Zustand store.

The seam is deliberately narrow: `requestCache.read` is the only function that
would need replacing.
