# IRA HOMES & HEAR Categorical Eligibility Analysis

## NC Property Outreach Dashboard Dataset Review

**Prepared by:** Manus AI
**Date:** April 2, 2026

---

## Executive Summary

After reviewing the U.S. Department of Energy's official categorical eligibility list [1], the NC Energy Saver program guidelines [2], and HUD's own documentation on the distinction between insured and assisted properties [3] [4], **not all 4,104 properties in the current dashboard dataset categorically qualify for IRA HOMES (Section 50121) or HEAR (Section 50122) income eligibility.** Approximately 526 properties (12.8% of the dataset) fall into categories that either do not qualify or require individual income verification rather than categorical approval.

The primary concern you identified is correct: **properties that carry only FHA mortgage insurance (HUD-insured but not HUD-assisted) do not meet the categorical eligibility threshold.** FHA mortgage insurance is a financial product that insures the lender's loan — it does not restrict tenant incomes, control rents, or provide rental subsidies [3] [4]. The DOE's recognized housing programs for categorical eligibility are limited to Public Housing, project-based rental assistance (Section 8, Section 202, Section 811), tenant-based assistance, and LIHTC [1].

---

## What Is Categorical Eligibility?

The IRA Home Energy Rebate programs allow states to use "categorical eligibility" as a streamlined way to verify household income. Instead of requiring individual income documentation from every tenant, a property qualifies categorically if it participates in a recognized federal program that already imposes income restrictions. The DOE published the definitive list of these recognized programs in July 2023 [1].

For multifamily buildings, the DOE specifies a "whole building eligibility" pathway: if at least 50% of units in a building are income-restricted through a qualifying program, the entire building is categorically eligible at the below 80% AMI level [1].

---

## DOE-Recognized Housing Programs

The following table reproduces the DOE's Table 2, which lists the only housing programs that confer categorical eligibility for Home Energy Efficiency Rebates (HOMES) [1]:

| Recognized Housing Program | Income Requirement | Categorical Level | Whole Building Rule |
|---|---|---|---|
| Public Housing (owned/operated by PHAs) | <50% AMI | Below 80% AMI | Fully eligible |
| Project-Based Assistance (Section 8, Section 202, Section 811) | <50% AMI | Below 80% AMI | If 50%+ of units are subsidized |
| Tenant-Based Rental Assistance | <50% AMI | Below 80% AMI | If 50%+ of occupants receive TBA |
| Low Income Housing Tax Credit (LIHTC) | 50%+ of households below 80% AMI | Below 80% AMI | If 50%+ of units are income-restricted |

The same programs apply to HEAR (Section 50122) categorical eligibility, as confirmed in the DOE's Table 4 [1].

**Notably absent from this list:** FHA mortgage insurance programs (Sections 207, 220, 221, 223, 231, 232, 242), "Use Restriction" designations without active subsidies, and any healthcare facility programs.

---

## The HUD-Insured vs. HUD-Assisted Distinction

This is the critical distinction that affects your dataset. HUD operates two fundamentally different types of programs for multifamily properties:

**HUD-Assisted** properties receive direct rental subsidies. Tenants must meet income qualifications, and rents are controlled by HUD. These include Section 8 Project-Based Rental Assistance, Section 202 (elderly housing), and Section 811 (disabled housing). These programs appear on the DOE's categorical eligibility list.

**HUD-Insured** properties have FHA mortgage insurance on their financing. This is a financial product that protects the lender if the borrower defaults. As HUD's own research states:

> "FHA mortgage insurance programs are not limited to subsidized housing and are not restricted to low income tenants nor do they control rents charged." [4]

A separate HUD study further clarifies:

> "Unassisted means the units do not receive federal rent subsidies such as Section 8." [3]

A property can be both insured and assisted (e.g., an FHA-insured building that also receives Section 8 vouchers), but FHA insurance alone does not make a property "subsidized housing" for purposes of IRA categorical eligibility.

---

## Dataset Analysis

The dashboard contains 4,104 properties across 11 HUD categories. The following table maps each category to its IRA categorical eligibility status:

| Category | Count | % of Total | Categorically Eligible? | Rationale |
|---|---|---|---|---|
| LIHTC | 2,751 | 67.0% | **Yes** | Listed in DOE Table 2; must have 50%+ income-restricted units |
| Insured-Unsubsidized | 427 | 10.4% | **No** | FHA insurance only; no income restrictions or subsidies |
| 202/811 | 284 | 6.9% | **Yes** | Section 202/811 is a recognized program |
| Subsidized - Previously 202/811 | 196 | 4.8% | **Likely Yes** | If still receiving project-based assistance |
| Insured-Subsidized | 180 | 4.4% | **Yes** | Has both insurance and active subsidy (Section 8) |
| Subsidized - Previously Insured | 127 | 3.1% | **Yes** | Still receiving subsidy despite insurance expiring |
| Subsidized, No HUD Financing | 120 | 2.9% | **Yes** | Receiving Section 8 or equivalent subsidy |
| Use Restriction | 12 | 0.3% | **No** | No active subsidy; use restrictions alone do not qualify |
| HUD Held | 5 | 0.1% | **Yes** | All 5 have active Section 8 contracts |
| Insured - Previously Subsidized | 1 | <0.1% | **No** | Subsidy has ended; only insurance remains |
| Flexible Subsidy | 1 | <0.1% | **Uncertain** | Requires individual verification |

---

## Properties That Do Not Categorically Qualify

### 1. Insured-Unsubsidized (427 properties)

These 427 properties represent the largest concern. Of these, 379 have no LIHTC overlay and rely solely on FHA mortgage insurance. Their Section of Act (SOA) codes confirm they are financed through insurance programs, not assistance programs:

| SOA Program Type | Count | Description |
|---|---|---|
| 223(f) Refinance/Purchase Apartments | 114 | Market-rate apartment refinancing |
| 221(d)(4) New Construction/Substantial Rehab | 95 | Market-rate apartment construction |
| 223(f) Refinance of Section 232 Nursing/ICF | 64 | Nursing home refinancing |
| 223(f) Refinance of Section 232 Assisted Living | 27 | Assisted living refinancing |
| 223(f) Refinance of Section 232 Board & Care | 26 | Board & care refinancing |
| 223(a)(7) Refinance of 221(d)(4) | 22 | Streamlined apartment refinancing |
| 242 New Construction/Rehab Hospitals | 3 | Hospital construction |
| Other insurance programs | 28 | Various FHA insurance refinances |

The remaining 48 Insured-Unsubsidized properties also carry LIHTC designations and would qualify through the LIHTC pathway.

### 2. Healthcare Facilities (135 properties)

A significant subset of the dataset consists of non-residential healthcare facilities that do not qualify for IRA home energy rebates regardless of their HUD program status, because they are not dwelling units:

| Facility Type | Count |
|---|---|
| Nursing Homes / ICF | 75 |
| Assisted Living Facilities | 29 |
| Board & Care Homes | 28 |
| Hospitals | 3 |

These facilities are financed under HUD Section 232 (healthcare) and Section 242 (hospitals), not under residential housing programs. The IRA rebates apply to "dwelling units" — places where people live as their primary residence. Nursing homes, assisted living facilities, and hospitals are licensed healthcare facilities, not residential housing.

### 3. Use Restriction Properties (12 properties)

These 12 properties have "Use Restriction" designations but no active Section 8, Section 202/811, or LIHTC indicators. A use restriction may be a remnant of a former HUD program that has since expired. Without an active qualifying subsidy, these properties cannot claim categorical eligibility.

---

## Summary of Eligibility Concerns

| Issue | Properties Affected | Action Needed |
|---|---|---|
| Insured-Unsubsidized (no LIHTC) | 379 | Remove or flag as requiring individual income verification |
| Healthcare facilities (not dwelling units) | 135 | Remove from dataset — not eligible for home energy rebates |
| Use Restriction (no active subsidy) | 12 | Verify individually; likely not categorically eligible |
| **Total questionable** | **526** | **12.8% of dataset** |

---

## Recommendations

**First**, consider adding an "IRA Eligibility" indicator column to the dashboard that flags each property as "Categorically Eligible," "Requires Income Verification," or "Not Eligible (Non-Residential)." This would prevent your outreach team from spending time on properties that cannot use the categorical pathway.

**Second**, the 379 Insured-Unsubsidized residential properties (apartments) are not necessarily ineligible for IRA rebates — they simply cannot use the categorical eligibility shortcut. Their tenants could still qualify through individual income verification if their household income is below 150% AMI (for HEAR) or 80% AMI (for HOMES maximum rebates). These properties may still be worth outreach, but the enrollment process will be more complex.

**Third**, the 135 healthcare facilities (nursing homes, assisted living, board & care, hospitals) should be removed from the outreach priority list entirely, as they are not residential dwelling units and do not qualify for IRA home energy rebates under any pathway.

**Fourth**, for the 12 Use Restriction properties, individual research is needed to determine whether they have any active qualifying subsidy that is not reflected in the current HUD data.

---

## References

[1]: https://www.energy.gov/sites/default/files/2023-07/IRA-50121-%26-50122-Home-Energy-Rebates-Categorical-Eligibility-List%20.pdf "DOE - Federal Programs Approved for Categorical Eligibility for DOE Home Energy Rebates"

[2]: https://www.energysavernc.org/frequently-asked-questions/ "Energy Saver North Carolina - FAQs"

[3]: https://www.huduser.gov/portal/publications/pdf/wp_008.pdf "HUD User - Do FHA Multifamily Mortgage Insurance Programs Provide Affordable Housing and Serve Underserved Areas?"

[4]: https://www.lument.com/wp-content/uploads/2021/03/FHA-Common-Questions.pdf "Lument - FHA Common Questions"

[5]: https://www.energy.gov/sites/default/files/2024-02/LIHTC-Case-Study_21524.pdf "DOE - Home Efficiency Rebates LIHTC Case Study"
