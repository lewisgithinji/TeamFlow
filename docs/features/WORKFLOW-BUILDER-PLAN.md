# Visual Workflow Builder - Implementation Plan

**Feature**: Complete Automated Workflows with Visual Builder
**Status**: In Progress (30% → 100%)
**Priority**: HIGH (ROI: 8.5/10)
**Timeline**: 2 weeks (10 working days)

---

## 📊 Current Status

### ✅ What's Already Done (30%):
- Backend automation engine
- Database schema (AutomationRule, AutomationAction, AutomationExecution)
- API endpoints (list, get, create, update, delete)
- Trigger types (10 triggers defined)
- Action types (11 actions defined)
- Execution tracking and history

### 🚧 What's Missing (70%):
- Visual workflow builder UI
- Drag-and-drop canvas
- Node-based workflow design
- Pre-built templates
- Testing/preview mode
- Enhanced condition logic

---

## 🎯 Implementation Goals

### Core Features:
1. **Visual Canvas** - Drag-and-drop workflow designer
2. **Trigger Nodes** - Visual representation of workflow triggers
3. **Action Nodes** - Visual representation of actions
4. **Connection Lines** - Show workflow flow
5. **Configuration Panels** - Edit trigger/action settings
6. **Templates** - Pre-built workflow examples
7. **Testing Mode** - Preview workflow execution

---

## 🗓️ 2-Week Timeline

### **Week 1: Foundation & Core Builder**

#### **Day 1-2: Workflow Canvas Setup**
- ✅ Install React Flow library
- [ ] Create workflow builder page layout
- [ ] Set up React Flow canvas component
- [ ] Implement basic node types (trigger, action)
- [ ] Add connection handling

#### **Day 3: Node Components**
- [ ] Create TriggerNode component
- [ ] Create ActionNode component
- [ ] Add node styling and icons
- [ ] Implement node selection/highlighting

#### **Day 4: Configuration Panels**
- [ ] Build TriggerConfigPanel
- [ ] Build ActionConfigPanel
- [ ] Add form controls for each trigger type
- [ ] Add form controls for each action type

#### **Day 5: Save/Load Functionality**
- [ ] Implement workflow to JSON conversion
- [ ] Integrate with automation API
- [ ] Add save button and validation
- [ ] Add load existing workflow

### **Week 2: Advanced Features & Polish**

#### **Day 6-7: Pre-built Templates**
- [ ] Design 5-10 common workflows
- [ ] Create template gallery UI
- [ ] Implement template loader
- [ ] Add "Create from Template" button

#### **Day 8: Testing Mode**
- [ ] Build workflow simulation UI
- [ ] Show execution path preview
- [ ] Add test data input
- [ ] Display expected results

#### **Day 9: Enhanced Features**
- [ ] Add workflow enable/disable toggle
- [ ] Show execution history
- [ ] Add workflow analytics
- [ ] Implement workflow duplication

#### **Day 10: Polish & Documentation**
- [ ] UI/UX improvements
- [ ] Add tooltips and help text
- [ ] Create user guide
- [ ] Final testing

---

## 🛠️ Technical Architecture

### **Frontend Stack:**
```
ReactFlow - Visual workflow canvas
React - UI framework
TanStack Query - API data fetching
Tailwind CSS - Styling
Heroicons - Icons
Zustand - State management (optional)
```

### **Component Structure:**
```
apps/web/src/
├── app/(dashboard)/[workspaceId]/automations/
│   ├── page.tsx                    # Automation list page
│   └── [ruleId]/
│       └── page.tsx                # Workflow builder page
├── components/automation/
│   ├── WorkflowCanvas.tsx          # Main canvas component
│   ├── nodes/
│   │   ├── TriggerNode.tsx         # Trigger node component
│   │   ├── ActionNode.tsx          # Action node component
│   │   └── NodeTypes.ts            # Node type definitions
│   ├── panels/
│   │   ├── TriggerConfigPanel.tsx  # Trigger configuration
│   │   ├── ActionConfigPanel.tsx   # Action configuration
│   │   └── ToolbarPanel.tsx        # Top toolbar
│   ├── templates/
│   │   ├── TemplateGallery.tsx     # Template selection
│   │   └── templates.ts            # Pre-built templates
│   └── testing/
│       └── TestingMode.tsx         # Workflow testing UI
└── lib/automation/
    ├── workflow-converter.ts       # Convert flow to/from API format
    ├── workflow-validator.ts       # Validate workflow structure
    └── types.ts                    # TypeScript types
```

---

## 🎨 UI Design Concept

### **Workflow Builder Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back  |  My Workflow           [Save] [Test] [☰ Menu]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [+ Trigger]  [+ Action]  [📋 Templates]                    │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │                                                 │         │
│  │           🎯 TRIGGER                           │         │
│  │     ┌─────────────────┐                        │         │
│  │     │  Task Created   │                        │         │
│  │     └────────┬────────┘                        │         │
│  │              │                                  │         │
│  │              ▼                                  │         │
│  │     ┌─────────────────┐                        │         │
│  │     │  Update Status  │  ⚙️                    │         │
│  │     │   → DONE        │                        │         │
│  │     └────────┬────────┘                        │         │
│  │              │                                  │         │
│  │              ▼                                  │         │
│  │     ┌─────────────────┐                        │         │
│  │     │ Send Notification│  ⚙️                   │         │
│  │     │  "Task Complete" │                       │         │
│  │     └─────────────────┘                        │         │
│  │                                                 │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
│  ┌─── Configuration Panel ──────────────┐                   │
│  │                                        │                   │
│  │  Action: Send Notification             │                   │
│  │                                        │                   │
│  │  Title: [Task Complete              ] │                   │
│  │  Message: [A task was completed...  ] │                   │
│  │                                        │                   │
│  │  [Cancel]  [Apply]                    │                   │
│  └────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Pre-built Templates

### **Template 1: Auto-Complete Tasks**
**Name**: "Move Completed Tasks to Done"
**Trigger**: Task Status Changed → IN_PROGRESS → DONE
**Actions**:
1. Update Status → DONE
2. Send Notification → "Task completed!"

### **Template 2: High Priority Alert**
**Name**: "Alert on High Priority Tasks"
**Trigger**: Priority Changed → HIGH or CRITICAL
**Actions**:
1. Send Notification → "High priority task created"
2. Add Comment → "⚠️ High priority - needs attention"

### **Template 3: Auto-Assign Round Robin**
**Name**: "Auto-Assign Tasks to Team"
**Trigger**: Task Created
**Actions**:
1. Assign User → [Next available team member]
2. Send Notification → "New task assigned to you"

### **Template 4: Due Date Reminder**
**Name**: "Remind Before Due Date"
**Trigger**: Due Date Approaching (24 hours)
**Actions**:
1. Send Notification → "Task due tomorrow"
2. Add Comment → "⏰ Due date reminder"

### **Template 5: Task Labeler**
**Name**: "Auto-Label by Keywords"
**Trigger**: Task Created
**Actions**:
1. Add Label → "bug" (if title contains "bug")
2. Add Label → "feature" (if title contains "feature")

---

## 🔄 Workflow Conversion

### **React Flow Format → API Format:**
```typescript
// React Flow format
{
  nodes: [
    { id: '1', type: 'trigger', data: { triggerType: 'TASK_CREATED', config: {} } },
    { id: '2', type: 'action', data: { actionType: 'UPDATE_STATUS', config: { status: 'DONE' } } }
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2' }
  ]
}

// API format
{
  name: 'My Workflow',
  triggerType: 'TASK_CREATED',
  triggerConfig: {},
  actions: [
    { order: 0, actionType: 'UPDATE_STATUS', actionConfig: { status: 'DONE' } }
  ]
}
```

---

## ✅ Acceptance Criteria

### **Must Have:**
- [ ] Visual canvas with drag-and-drop
- [ ] All 10 trigger types supported
- [ ] All 11 action types supported
- [ ] Save and load workflows
- [ ] At least 5 pre-built templates
- [ ] Basic testing/preview mode

### **Should Have:**
- [ ] Workflow enable/disable toggle
- [ ] Execution history viewer
- [ ] Template gallery with search
- [ ] Workflow duplication
- [ ] Error handling and validation

### **Nice to Have:**
- [ ] Keyboard shortcuts
- [ ] Workflow export/import
- [ ] Workflow analytics dashboard
- [ ] Multi-select and bulk operations

---

## 🧪 Testing Checklist

- [ ] Create workflow from scratch
- [ ] Save workflow successfully
- [ ] Load existing workflow
- [ ] Edit workflow and update
- [ ] Delete workflow
- [ ] Create from template
- [ ] Test workflow execution (dry run)
- [ ] View execution history
- [ ] Enable/disable workflow
- [ ] Handle validation errors

---

## 📚 User Guide Outline

### **Getting Started:**
1. Navigate to Automations page
2. Click "Create Workflow"
3. Choose trigger event
4. Add actions
5. Configure settings
6. Save and enable

### **Using Templates:**
1. Click "Templates"
2. Browse pre-built workflows
3. Select template
4. Customize as needed
5. Save

### **Testing Workflows:**
1. Click "Test" button
2. Provide test data
3. See execution preview
4. Adjust if needed

---

## 🚀 Next Steps

1. ✅ Install React Flow
2. Create workflow builder page
3. Build canvas component
4. Implement node types
5. Add configuration panels
6. Create templates
7. Add testing mode
8. Polish and test

---

## 📊 Success Metrics

- **User Adoption**: 50%+ of workspaces create at least 1 automation
- **Template Usage**: 70%+ of automations start from templates
- **Execution Success**: 95%+ automation executions succeed
- **User Satisfaction**: 4.5+ stars on feedback

---

**Status**: 🟡 In Progress
**Next Task**: Create workflow builder page layout
