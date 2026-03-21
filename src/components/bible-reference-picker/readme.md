# bible-reference-picker



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description                                         | Type     | Default |
| --------------- | ---------------- | --------------------------------------------------- | -------- | ------- |
| `maxReferences` | `max-references` | Maximum number of references that can be collected. | `number` | `100`   |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `referencesChange` |             | `CustomEvent<BibleReference[]>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*


```text
Prompt info: - TODO: Make Actual documentation.
Can you help me complete the bible-reference-picker component?

There are several inline comments for todo information; however, here are the requirements in case nothing is clear in code:

1. The bible reference picker will guide users through selecting a single bible passage.
2. The process of selecting a passage should support manual typing, auto-complete typing, and selecting individual components with a mouse click.
3. The ui should update based on the state of the component:
    a. When a book is selected, load the chapters.
    b. When a chapter is selected, a user can complete the reference, pick a verse, or specify an ending chapter.
    c. If the user has picked a verse, they may specify an ending verse or ending chapter and verse.
    d. The component should limit the number of references a user can enter by an parameter.
4. The auto-complete functionality should support the following:
    a. pasting a reference:
        i. If the pasted text results in a valid reference, it should automatically be added as a full reference and the input should reset.
        ii. If the pasted text results in a partial reference, the state should reflect where the user would be had the text been input manually.
        iii. If the pasted text is invalid, the input should reject the text.
    b. Pressing tab should auto-complete the current step with the most relevant result. For instance Gen + tab should result in selecting "Genesis" for the book and moving to the start chapter state.
    c. Pressing enter or semi-colon should result in auto-completing the current step and submitting reference, if it is a valid reference.
5. Other hotkeys are:
    a. Escape should cancel entry for the current reference and reset the control.
6. Backspace should  update the state of the control if it results in an unclear or deleted part of a state, for instance deleting a colon should revert back to a chapter state.
7. Invalid keystrokes should be rejected for a given state; however, any non text keystroke, such as shortcuts and function keys should not be rejected.
    a. When at the select book state, only alpha numeric values should be accepted.
    b. When at the select chapter state, only numbers, colons, and hyphons should be accepted.
        i. Colons and hyphons should only be accepted after a number has been entered.
        ii. If a colon or hyphon is entered while the multiple chapters are available, then the exact match should be used.
        iii. If the start chapter has already been selected, hyphons should not be allowed.
     c. When at the select verse state, only numbers and hyphons should be allowed.
        i. If the start verse has already been selected, hyphons should not be allowed.
```