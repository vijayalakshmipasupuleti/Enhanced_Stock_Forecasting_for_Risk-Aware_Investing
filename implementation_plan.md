# Add XIRR Calculator Feature

This plan outlines the approach to adding an Extended Internal Rate of Return (XIRR) calculator feature. XIRR is essential for calculating exact annualized returns of an investment portfolio combining SIPs, top-ups, partial withdrawals, and varying cash inflows/outflows over time.

## User Review Required

> [!NOTE]
> Please review this approach. Running the XIRR calculation entirely in the browser (frontend) ensures it is fast and interactive without requiring you to store transaction data on the backend. This means the frontend code will self-host a lightweight Math calculation algorithm to solve the XIRR equation.

> [!IMPORTANT]
> The XIRR section will be added directly into the main Dashboard interface (`App.jsx`), allowing you to manually input transaction dates and amounts to see real-time return percentages.

## Proposed Changes

### Frontend Component

#### [NEW] `frontend/src/components/XirrCalculator.jsx`
*   Create a complete React component for the calculator.
*   **State:** A list of transactions (each having a `date` and `amount`).
*   **Logic:** Implement the Newton-Raphson method or equivalent mathematical approximation to find the precise discount rate where Net Present Value (NPV) equates to 0. (This calculates the XIRR).
*   **UI Layout:** 
    *   A form to add positive cash flows (Withdrawals / Current Portfolio Value) and negative cash flows (Investments / SIP tranches).
    *   A table displaying the ledger/history of entered cash flows.
    *   A prominently displayed "XIRR" result metric that updates responsively.

#### [MODIFY] `frontend/src/App.jsx`
*   Import and render the new `XirrCalculator` component, likely separating it via an aesthetic division section below the current market analysis modules.

#### [MODIFY] `frontend/src/index.css` or component-level CSS
*   Add relevant beautiful, modern styles for the new inputs, transaction ledger grid, and the result display according to the aesthetic preferences of the application.

## Open Questions

> [!TIP]
> Do you prefer the XIRR feature to be added as a **new section** directly on the dashboard page, or would you prefer a **modal/pop-up window** that opens when you click a "Calculate XIRR" button? (The plan defaults to a new section).

## Verification Plan

### Automated Tests
*   We'll use standard industry examples of cashflows to verify the math outputs correctly. (e.g., Invest $10,000 on Jan 1, Wait 1 Year, Value is $11,000 -> Should return ~10%).

### Manual Verification
*   Check the UI layout aligns well with the existing dashboard metrics.
*   Validate responsiveness and ease of adding/removing cash flow entries.
*   Verify that clicking away or resetting clears the calculations as intended.
