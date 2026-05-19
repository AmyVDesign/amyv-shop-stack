# Add a Part — Phase 2.2 (Evolution)

**Phase:** 2.2 — planned  
**Flow type:** Admin / user task flow  
**Project:** Ess-Kay Yards Marina e-commerce platform  
**Evolves from:** `01-add-part-flow-phase-2-1.md`

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
    
    Form[Fill in remaining fields:<br/>SKU · Price · Qty<br/>Visibility · Condition] --> Match
    
    Match{Part # + manufacturer<br/>already in inventory?}
    
    Match -->|Match found| LinkPrompt[Suggest: 'Same part as<br/>Mercury 1985 Carburetor.<br/>Link or keep standalone?']
    
    LinkPrompt --> LinkChoice{User chooses}
    LinkChoice -->|Link| LinkedSave[Save linked<br/>to existing part]
    LinkChoice -->|Standalone| NewSave[Save as standalone listing]
    
    Match -->|No match| NewSave
    
    LinkedSave --> DB[(Supabase)]
    NewSave --> DB
    DB --> Display[Appears in Parts list]
    Display --> Profile[Click in: 'Part profile' page<br/>This item + Related Listings<br/>channel · condition · price · status]
    
    classDef new fill:#E8F0F8,stroke:#1E5F8E,stroke-width:3px,color:#0F3A57
    classDef existing fill:#ffffff,stroke:#0F3A57,stroke-width:1px,color:#0F3A57
    classDef terminal fill:#F8F5F0,stroke:#0F3A57,stroke-width:2px,color:#0F3A57
    classDef data fill:#0F3A57,stroke:#0F3A57,color:#ffffff
    classDef decision fill:#fff7e6,stroke:#0F3A57,color:#0F3A57
    
    class Start,Display terminal
    class Open,Login,PartsList,AddBtn,Form,NewSave existing
    class Upload,PreFill,LinkPrompt,LinkedSave,Profile new
    class DB data
    class EntryChoice,Review,Match,LinkChoice decision
```

---

## What changed and why

Phase 2.1 worked but had real workflow friction. Users had to manually re-type the same part numbers each time duplicate inventory arrived (constant with obsolete marine parts), and there was no way to see "we've had three of these before — here's what we sold them for."

Phase 2.2 adds three deliberate evolutions.

### 1. Photo-first entry path

The user takes a photo on their phone. The system suggests title, manufacturer, and part number based on the image. They confirm or edit.

**Impact:** Time-to-add drops from ~3 minutes to ~30 seconds per part.

**Language note:** Presented to users as "smart pre-fill," never as "AI" or "automation." Change-averse users stay confident in the tool.

### 2. Match detection at upload time

When the part number matches an existing part already in inventory, the system surfaces a soft prompt: *"Same part as Mercury 1985 Carburetor — link or keep standalone?"*

**Impact:** Solves the data-quality problem from Phase 2.1 (typos breaking grouping) and gives the user explicit control over public-facing structure.

### 3. "Part profile" detail page

Clicking any part now shows that item plus a Related Listings section — every other instance of the same part with channel (website / eBay / in-store), condition, price, and status.

**Impact:**
- **For staff:** single source of truth for inventory across channels.
- **For customers:** provenance and pricing context for obsolete parts.

---

## The unlock

**The source-of-truth admin view is always linked; the public-facing display is configurable per item.**

Internal staff never lose the relationship between identical parts. Customers see whatever curation the user chose — link to an existing listing for a unified product page, or keep standalone for a fresh listing.

---

## Visual key

- **Cream rounded** = offline / real-world events
- **White rectangle** = user actions in the app (existed in Phase 2.1)
- **Light blue with thick border** = NEW in Phase 2.2
- **Yellow diamond** = decision points
- **Navy cylinder** = data store
