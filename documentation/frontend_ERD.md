# Retro Tool Frontend ERD

**Note:**

* Some of the entities in this diagram do not have their own individual file declarations and are
part of other components. They are attributes in the diagram
* Diagram does not include the actual properties and methods.
* Not all UI components shown.

```mermaid
erDiagram
          feedbackBoardContainer ||--|{ feedbackBoard : has
          feedbackBoardContainer ||--|{ feedbackBoardMetadataForm : has
          feedbackBoard ||--o{ feedbackColumn : has
          feedbackColumn ||--o{ feedbackColumnItem : contains
          feedbackColumnItem ||--|| feedbackItem : "has/is"
          feedbackColumnItem ||--o{ actionItem : "has/is"
          feedbackColumnItem ||--o{ feedbackGroup : "has/is"
          feedbackGroup ||--|{ feedbackItem : contains
          feedbackItem ||..o{ actionItem : References
          actionItem ||..|| feedbackBoard : references
          feedbackBoardContainer ||..o{ actionItem : references
          feedbackBoardContainer {
              file feedbackBoardContainer
          }
          feedbackBoard {
              file feedbackBoard
          }
          feedbackBoardMetadataForm {
              file feedbackBoardMetadataForm
          }
          feedbackColumn {
              file feedbackColumn
          }
          feedbackColumnItem {
              file feedbackItem
          }
          feedbackGroup {
              file feedbackItemGroup
          }
          actionItem {
              file actionItem
          }
          feedbackItem {
              file feedbackItem
          }
```

[![A relationship diagram that illustrates the way the components are realted to one another.](https://mermaid.ink/img/eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgICAgICAgZmVlZGJhY2tCb2FyZENvbnRhaW5lciB8fC0tfHsgZmVlZGJhY2tCb2FyZCA6IGhhc1xuICAgICAgICAgIGZlZWRiYWNrQm9hcmRDb250YWluZXIgfHwtLXx7IGZlZWRiYWNrQm9hcmRNZXRhZGF0YUZvcm0gOiBoYXNcbiAgICAgICAgICBmZWVkYmFja0JvYXJkIHx8LS1veyBmZWVkYmFja0NvbHVtbiA6IGhhc1xuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uIHx8LS1veyBmZWVkYmFja0NvbHVtbkl0ZW0gOiBjb250YWluc1xuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uSXRlbSB8fC0tfHwgZmVlZGJhY2tJdGVtIDogXCJoYXMvaXNcIlxuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uSXRlbSB8fC0tb3sgYWN0aW9uSXRlbSA6IFwiaGFzL2lzXCJcbiAgICAgICAgICBmZWVkYmFja0NvbHVtbkl0ZW0gfHwtLW97IGZlZWRiYWNrR3JvdXAgOiBcImhhcy9pc1wiXG4gICAgICAgICAgZmVlZGJhY2tHcm91cCB8fC0tfHsgZmVlZGJhY2tJdGVtIDogY29udGFpbnNcbiAgICAgICAgICBmZWVkYmFja0l0ZW0gfHwuLm97IGFjdGlvbkl0ZW0gOiBSZWZlcmVuY2VzXG4gICAgICAgICAgYWN0aW9uSXRlbSB8fC4ufHwgZmVlZGJhY2tCb2FyZCA6IHJlZmVyZW5jZXNcbiAgICAgICAgICBmZWVkYmFja0JvYXJkQ29udGFpbmVyIHx8Li5veyBhY3Rpb25JdGVtIDogcmVmZXJlbmNlc1xuICAgICAgICAgIGZlZWRiYWNrQm9hcmRDb250YWluZXIge1xuICAgICAgICAgICAgICBmaWxlIGZlZWRiYWNrQm9hcmRDb250YWluZXJcbiAgICAgICAgICB9XG4gICAgICAgICAgZmVlZGJhY2tCb2FyZCB7XG4gICAgICAgICAgICAgIGZpbGUgZmVlZGJhY2tCb2FyZFxuICAgICAgICAgIH1cbiAgICAgICAgICBmZWVkYmFja0JvYXJkTWV0YWRhdGFGb3JtIHtcbiAgICAgICAgICAgICAgZmlsZSBmZWVkYmFja0JvYXJkTWV0YWRhdGFGb3JtXG4gICAgICAgICAgfVxuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uIHtcbiAgICAgICAgICAgICAgZmlsZSBmZWVkYmFja0NvbHVtblxuICAgICAgICAgIH1cbiAgICAgICAgICBmZWVkYmFja0NvbHVtbkl0ZW0ge1xuICAgICAgICAgICAgICBmaWxlIGZlZWRiYWNrSXRlbVxuICAgICAgICAgIH1cbiAgICAgICAgICBmZWVkYmFja0dyb3VwIHtcbiAgICAgICAgICAgICAgZmlsZSBmZWVkYmFja0l0ZW1Hcm91cFxuICAgICAgICAgIH1cbiAgICAgICAgICBhY3Rpb25JdGVtIHtcbiAgICAgICAgICAgICAgZmlsZSBhY3Rpb25JdGVtXG4gICAgICAgICAgfVxuICAgICAgICAgIGZlZWRiYWNrSXRlbSB7XG4gICAgICAgICAgICAgIGZpbGUgZmVlZGJhY2tJdGVtXG4gICAgICAgICAgfSIsIm1lcm1haWQiOnsidGhlbWUiOiJkYXJrIn0sInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0)](https://mermaid.live/edit/#eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgICAgICAgZmVlZGJhY2tCb2FyZENvbnRhaW5lciB8fC0tfHsgZmVlZGJhY2tCb2FyZCA6IGhhc1xuICAgICAgICAgIGZlZWRiYWNrQm9hcmRDb250YWluZXIgfHwtLXx7IGZlZWRiYWNrQm9hcmRNZXRhZGF0YUZvcm0gOiBoYXNcbiAgICAgICAgICBmZWVkYmFja0JvYXJkIHx8LS1veyBmZWVkYmFja0NvbHVtbiA6IGhhc1xuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uIHx8LS1veyBmZWVkYmFja0NvbHVtbkl0ZW0gOiBjb250YWluc1xuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uSXRlbSB8fC0tfHwgZmVlZGJhY2tJdGVtIDogXCJoYXMvaXNcIlxuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uSXRlbSB8fC0tb3sgYWN0aW9uSXRlbSA6IFwiaGFzL2lzXCJcbiAgICAgICAgICBmZWVkYmFja0NvbHVtbkl0ZW0gfHwtLW97IGZlZWRiYWNrR3JvdXAgOiBcImhhcy9pc1wiXG4gICAgICAgICAgZmVlZGJhY2tHcm91cCB8fC0tfHsgZmVlZGJhY2tJdGVtIDogY29udGFpbnNcbiAgICAgICAgICBmZWVkYmFja0l0ZW0gfHwuLm97IGFjdGlvbkl0ZW0gOiBSZWZlcmVuY2VzXG4gICAgICAgICAgYWN0aW9uSXRlbSB8fC4ufHwgZmVlZGJhY2tCb2FyZCA6IHJlZmVyZW5jZXNcbiAgICAgICAgICBmZWVkYmFja0JvYXJkQ29udGFpbmVyIHx8Li5veyBhY3Rpb25JdGVtIDogcmVmZXJlbmNlc1xuICAgICAgICAgIGZlZWRiYWNrQm9hcmRDb250YWluZXIge1xuICAgICAgICAgICAgICBmaWxlIGZlZWRiYWNrQm9hcmRDb250YWluZXJcbiAgICAgICAgICB9XG4gICAgICAgICAgZmVlZGJhY2tCb2FyZCB7XG4gICAgICAgICAgICAgIGZpbGUgZmVlZGJhY2tCb2FyZFxuICAgICAgICAgIH1cbiAgICAgICAgICBmZWVkYmFja0JvYXJkTWV0YWRhdGFGb3JtIHtcbiAgICAgICAgICAgICAgZmlsZSBmZWVkYmFja0JvYXJkTWV0YWRhdGFGb3JtXG4gICAgICAgICAgfVxuICAgICAgICAgIGZlZWRiYWNrQ29sdW1uIHtcbiAgICAgICAgICAgICAgZmlsZSBmZWVkYmFja0NvbHVtblxuICAgICAgICAgIH1cbiAgICAgICAgICBmZWVkYmFja0NvbHVtbkl0ZW0ge1xuICAgICAgICAgICAgICBmaWxlIGZlZWRiYWNrSXRlbVxuICAgICAgICAgIH1cbiAgICAgICAgICBmZWVkYmFja0dyb3VwIHtcbiAgICAgICAgICAgICAgZmlsZSBmZWVkYmFja0l0ZW1Hcm91cFxuICAgICAgICAgIH1cbiAgICAgICAgICBhY3Rpb25JdGVtIHtcbiAgICAgICAgICAgICAgZmlsZSBhY3Rpb25JdGVtXG4gICAgICAgICAgfVxuICAgICAgICAgIGZlZWRiYWNrSXRlbSB7XG4gICAgICAgICAgICAgIGZpbGUgZmVlZGJhY2tJdGVtXG4gICAgICAgICAgfSIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkYXJrXCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)