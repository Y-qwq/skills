# Scheduling editor boundary review

请 review `ScheduleEditor` 的 component contract。最初它只编辑单次 appointment，后来通过 `isRecurring` 加入 recurring series；现在两个产品小组分别维护这两条流程，调用方也总是明确知道自己正在编辑哪一种对象。

Series 编辑需要 recurrence rule、preview 和“只改本次 / 修改整个 series”的业务选择；单次编辑只允许修改一个 appointment 的开始与结束时间。未来两条流程的发布节奏也可能不同。

请判断当前 component 是否仍是合适边界，并提出调整方案。重点说明判断依据，而不仅是给出拆分结果。
