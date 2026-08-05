# bible-reference-picker



<!-- Auto Generated Below -->


## Properties

| Property                | Attribute                  | Description | Type     | Default |
| ----------------------- | -------------------------- | ----------- | -------- | ------- |
| `maxNumberOfReferences` | `max-number-of-references` |             | `number` | `1`     |


## Events

| Event               | Description | Type                            |
| ------------------- | ----------- | ------------------------------- |
| `referencesUpdated` |             | `CustomEvent<BibleReference[]>` |


## Dependencies

### Depends on

- [multiselect-results](../multiselect-results)

### Graph
```mermaid
graph TD;
  bible-reference-picker --> multiselect-results
  multiselect-results --> multiselect-item
  style bible-reference-picker fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
