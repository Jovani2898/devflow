# Contract: Board Persistence

Logical fields are in [data-model.md](../data-model.md). This contract is the storage boundary. Production code calls it with the browser `localStorage` object. Tests call it with an object that implements `getItem` and `setItem`.

## Key

`devflow.board.v1`

There is one key for the origin. There is no per-account key.

## Document

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "task-id",
      "title": "Trimmed title",
      "description": "",
      "priority": "Medium",
      "status": "To Do",
      "placedAt": 1
    }
  ]
}
```

`version` is the number `1`. `tasks` is an array. Every task has a non-empty string `id`, a title and description that already satisfy the validation rules, a priority of `Low`, `Medium`, or `High`, a status of `To Do`, `In Progress`, or `Done`, and an integer `placedAt`. Ids are unique inside the array. Unknown fields on the document or on a task make the document invalid.

The document has no filter selection and no draft.

## Load

`loadBoard(storage) → LoadResult`

| Condition | Result | Write |
|-----------|--------|-------|
| `getItem` returns `null` | `{ ok: true, tasks: [] }` | none |
| JSON and every task match this contract | `{ ok: true, tasks }` | none |
| JSON parsing fails, `version` is not `1`, or any task is invalid | `{ ok: false, reason: "corrupt" }` | none |
| `getItem` throws | `{ ok: false, reason: "unavailable" }` | none |

`corrupt` and `unavailable` are both shown as ES-005. The stored string is left as it was.

## Save

`saveBoard(storage, tasks) → SaveResult`

The module serializes the full document with `version: 1` and the given tasks, then calls `setItem` once.

| Condition | Result | Memory rule for the caller |
|-----------|--------|----------------------------|
| `setItem` returns normally | `{ ok: true }` | Replace the committed task list |
| `setItem` throws a quota error | `{ ok: false, reason: "quota" }` | Keep the previous task list and the user's entered values |
| `setItem` throws any other error | `{ ok: false, reason: "unavailable" }` | Same as quota |

The caller shows "The task could not be saved" for every failure reason. The contract does not retry and does not write a second key.

## Parser sharing

Load uses the domain task parser. A record the domain would refuse to save is corrupt on load. That keeps VR-001 through VR-005 attached to stored data as well as to the form.

## Logging and rendering

Load and save do not log task titles or descriptions. Callers render those strings as text.
