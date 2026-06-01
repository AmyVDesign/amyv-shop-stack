# Add a Part — current state

**Flow type:** Admin / user task flow  
**Last updated:** June 1, 2026  
**Shipped through:** Phase 2.1 + Part profile page (Phase 2.2 deliverable #3)

> **Diagram key:** White nodes = shipped. Light blue nodes with thick border = planned (not yet built).

---

## Diagram

```mermaid
flowchart TD
    Start([Part arrives at marina]) --> Open[User opens admin]
    Open --> Login[Sign in]
    Login --> PartsList[Parts list]
    PartsList --> AddBtn[Click 'Add Part']

    AddBtn --> EntryChoice{Entry method?}

    EntryChoice -->|Photo| Upload[Upload photo from phone]
    EntryChoice -->|Manual| Form

    Upload --> PreFill[Smart pre-fill suggests:<br/>Title · Manufacturer · Part #]
    PreFill --> Review{User reviews<br/>and confirms}
    Review -->|Edits needed| Form
    Review -->|Looks right| Match

    Form[Fill in fields:<br/>SKU · Title · Price · Qty<br/>Visibility · Condition<br/>Part # · Manufacturer] --> Match

    Match{Part # + manufacturer<br/>already in inventory?}

    Match -->|Match found| LinkPrompt["Suggest: 'Same part —<br/>link or keep standalone?'"]

    LinkPrompt --> LinkChoice{User chooses}
    LinkChoice -->|Link| LinkedSave[Save linked<br/>to existing part]
    LinkChoice -->|Standalone| NewSave[Save as standalone listing]

    Match -->|No match| NewSave

    LinkedSave --> DB[(Supabase)]
    NewSave --> DB
    DB --> Display[Appears in Parts list]
    Display --> Profile[Part profile page<br/>Details + Related Listings<br/>condition · price · visibility]

    classDef planned  fill:#E8F0F8,stroke:#1E5F8E,stroke-width:3px,color:#0F3A57
    classDef shipped  fill:#ffffff,stroke:#0F3A57,stroke-width:1px,color:#0F3A57
    classDef terminal fill:#F8F5F0,stroke:#0F3A57,stroke-width:2px,color:#0F3A57
    classDef data     fill:#0F3A57,stroke:#0F3A57,color:#ffffff
    classDef decision fill:#fff7e6,stroke:#0F3A57,color:#0F3A57
    classDef decisionPlanned fill:#daeaf6,stroke:#1E5F8E,stroke-width:3px,color:#0F3A57

    class Start,Display terminal
    class Open,Login,PartsList,AddBtn,Form,NewSave,Profile shipped
    class Upload,PreFill,LinkPrompt,LinkedSave planned
    class DB data
    class EntryChoice,Review decisionPlanned
    class Match,LinkChoice decisionPlanned
```

---

## What's shipped

| Node | Status | Phase |
|---|---|---|
| Sign in → Parts list | ✅ Shipped | 2.1 |
| Add Part (manual form) | ✅ Shipped | 2.1 |
| Condition field on form | ✅ Shipped | 2.2 |
| Save → appears in Parts list | ✅ Shipped | 2.1 |
| Part profile page + Related Listings | ✅ Shipped | 2.2 |
| Photo upload + smart pre-fill | 🔄 Planned | 2.2 |
| Match detection at upload | 🔄 Planned | 2.2 |
| Link / standalone choice | 🔄 Planned | 2.2 |

## Current path (no planned nodes)

For the current shipped state, the effective flow is:

**Start → Sign in → Parts list → Add Part → Manual form → Save → Parts list → Click row → Part profile page**

Match detection and the photo path are the two remaining Phase 2.2 deliverables.

---

## Visual key

- **Cream rounded** = offline / real-world events
- **White rectangle** = user actions in the app (shipped)
- **Light blue with thick border** = planned / not yet built
- **Yellow diamond** = shipped decision points
- **Blue diamond with thick border** = planned decision points
- **Navy cylinder** = data store
