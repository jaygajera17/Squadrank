## Assumption
- Creator of the group should be added to the members list by default. This way, when a group is created, the creator will automatically be a member of that group without needing to be added separately.

- In GroupGoal, we have a field subjectIds which is an array of strings. This allows us to associate multiple subjects with a single group goal. For example, if a group goal is to Solve 100 Math OR Science Questions, we can include the subject IDs for both Math and Science in the subjectIds array. This way, the group goal can be linked to multiple subjects, allowing for more flexibility in defining the goals for the group.

- If user is adding activities with different subject , outside time window , invalid status , duplicate activity etc., we will not throw error and we will store those activities , we will not count it towards the goal progress. This way, we can maintain a complete record of all activities while ensuring that only valid contributions are considered for goal progress. We can also provide feedback to the user about why certain activities are not counted, which can help them understand the requirements for contributing to the group goals.


## Future considerations
- if we allow deleting an activity or kicking members out of the group, we may need to handle the case where a user is removed after contributing to the goal progress. In such cases, we might want to decide whether to keep their contributions towards the goal or remove them as well. This would require additional logic to adjust the goal progress accordingly when a member is removed or an activity is deleted.