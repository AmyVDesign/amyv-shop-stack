# Add a Part — Phase 2.1 (Current State)

**Phase:** 2.1 — shipped May 18, 2026  
**Flow type:** Admin / user task flow  
**Project:** Ess-Kay Yards Marina e-commerce platform

---

## Diagram

```mermaid
flowchart TD
    Start([Part arrives at marina]) --> Open[User opens admin]
    Open --> Login[Sign in with email + password]
    Login --> PartsList[Parts list]
    PartsList --> AddBtn[Click 'Add Part']
    AddBtn --> Form[Manually fill in:<br/>SKU · Title · Slug · Price<br/>Qty for Sale · Qty on Hand<br/>Visibility · Source<br/>Optional: Part #, Manufacturer]
    Form --> Validate{Required<br/>fields valid?}
    Validate -->|No| Form
    Validate -->|Yes| Save[Save]
    Save --> DB[(Supabase products table<br/>RLS-protected)]
    DB --> List[Appears in Parts list<br/>with visibility badge]
    List --> Edit[Click row to edit detail page]
    
    classDef offline fill:#F8F5F0,stroke:#0F3A57,stroke-width:2px,color:#0F3A57
    classDef online fill:#ffffff,stroke:#0F3A57,stroke-width:1px,color:#0F3A57
    classDef data fill:#0F3A57,stroke:#0F3A57,color:#ffffff
    classDef decision fill:#fff7e6,stroke:#0F3A57,color:#0F3A57
    
    class Start offline
    class Open,Login,PartsList,AddBtn,Form,Save,List,Edit online
    class DB data
    class Validate decision
```

---

## What this captures

The minimum viable inventory entry flow as shipped in Phase 2.1. The user signs in, navigates to Parts, clicks Add Part, fills in fields manually, and saves to a Supabase database with row-level security. The part appears in the Parts list with a visibility badge (Public / Internal / eBay Only).

## Workflow time

Approximately 3 minutes per part. Every field is typed manually.

## Known friction (drives Phase 2.2)

- Every field is entered manually, including frequently-repeated values like Manufacturer.
- No detection of duplicate part numbers — users can accidentally create multiple disconnected listings for the same physical part.
- The detail page shows only the individual item, with no context of related listings or sale history.

---

## Visual key

- **Cream rounded** = offline / real-world events
- **White rectangle** = user actions in the app
- **Yellow diamond** = decision points
- **Navy cylinder** = data store
