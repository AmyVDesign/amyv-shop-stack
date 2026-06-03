# Consolidate-on-Add — Server Flow

**Flow type:** Server action / data mutation  
**Last updated:** June 1, 2026  
**Status:** Planned (not yet built)

> **Diagram key:** White nodes = shipped. Light blue nodes with thick border = planned (not yet built).

---

## Diagram

```mermaid
flowchart TD
    A([createPart called])
    B["Extract form fields:\ncondition, linked_listing_id,\nstandalone_listing,\nqty_on_hand, qty_for_sale"]
    C{"condition = 'new'\nAND linked_listing_id set\nAND standalone_listing = false?"}
    D["Standard path:\nINSERT INTO products\nexisting behavior"]
    E["Resolve canonical via chain,\nfind keeper:\nhighest-priced 'new' variant"]
    F{Keeper exists?}
    G["Transaction:\n1. UPDATE keeper SET\n   qty_on_hand += input,\n   qty_for_sale += input\n2. INSERT inventory_events\n   product_id = keeper.id,\n   deltas = input qty\nReturn keeper.id"]
    H["Transaction:\n1. INSERT new product row\n   as first 'new' variant\n2. INSERT inventory_events\n   product_id = new.id,\n   deltas = input qty,\n   note = 'Initial new inventory'\nReturn new.id"]
    I["Redirect to\n/admin/products/&lt;id&gt;"]
    J([Done])

    A --> B
    B --> C
    C -- No --> D
    C -- Yes --> E
    E --> F
    F -- Yes --> G
    F -- No --> H
    D --> I
    G --> I
    H --> I
    I --> J
```
