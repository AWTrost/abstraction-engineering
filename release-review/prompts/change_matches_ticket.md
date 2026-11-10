You are given a Jira ticket and the code changes (merge requests or commits) that name it, as JSON on stdin: {"ticket": {...}, "changes": [...]}.

Judge one thing: does the set of changes, taken together, do what the ticket asks?

Answer with a verdict and a one-sentence reason:
- matches: the changes do what the ticket asks.
- partial: the changes do part of what the ticket asks.
- unrelated: the changes do something other than what the ticket asks.
- unclear: the text gives too little to judge.

Changes beyond what the ticket asks do not change the verdict.
If a later change reverts an earlier one, judge what is left.

Text longer than 4000 characters was cut off; judge from what is there.
