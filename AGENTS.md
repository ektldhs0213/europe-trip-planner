# Cross-computer Git workflow

- Work on this computer under the branch naming pattern `_날짜_renoba`.
- Work from the other computer uses the branch naming pattern `_날짜_gram`.
- Before starting any implementation, fetch and prune the remote branches.
- For the same date, merge the latest `_날짜_gram` source into `_날짜_renoba` before making changes here.
- Also incorporate the latest shared base branch (`main`) when needed so neither computer starts from stale shared code.
- Preserve both computers' changes when resolving overlaps. If a conflict cannot be resolved safely from context, stop and ask the user instead of discarding either side.
- Do not assume the peer branch exists locally; inspect remote branches after fetching and use the exact remote branch name.
