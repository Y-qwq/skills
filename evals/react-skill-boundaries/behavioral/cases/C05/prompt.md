# Home page structure review

一个 PR 因为 Home page 新增了第二个 query，提议把页面升级成 `domain/application/presentation` 分层并由 application controller 统一 loading、error 和 refresh。请 review 这个结构选择。

Bookings 和 team announcements 只是并排展示。它们可以独立 loading、独立 retry、独立刷新；任一失败不阻塞另一块，没有跨两者的业务规则、提交动作或一致性要求。未来 announcements 也可能被移出 Home page。

请判断这个 unit 的合适层级，以及你会如何安排两个 panel 的 ownership。
