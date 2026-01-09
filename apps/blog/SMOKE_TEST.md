# SMOKE_TEST (Blog)

## Rich HTML body rendering

When CMS posts store Quill HTML in `body_md`, the blog should render the HTML tags instead of escaping them.

1. Create a post in CMS with an inserted image and aligned text (e.g., center alignment in the editor).
2. Publish the post and trigger a build.
3. Load the post page on the blog.

Expected:

- The `<img>` renders as an image (not literal HTML text).
- Alignment classes such as `ql-align-center` apply visual alignment.
- Code blocks (Quill `.ql-syntax`) render with a dark background.
