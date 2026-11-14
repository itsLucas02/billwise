import type { ProviderId } from "./providers";

export interface SampleBill {
  id: string;
  provider: ProviderId;
  title: string;
  scenario: string;
  promised?: number;
  usual?: number;
  text: string;
}

/**
 * SIMULATED bills. Names, account numbers and amounts are invented for demonstration.
 * Plan names mirror real public plans so the analysis can compare against current prices.
 */
export const SAMPLE_BILLS: SampleBill[] = [
  {
    id: "unifi-promo",
    provider: "unifi",
    title: "Unifi Home — promo ended",
    scenario: "Signed up at RM129, now billed more, plus a late fee.",
    promised: 129,
    text: `unifi — TM Technology Services Sdn Bhd
Account No: 1-2345-6789
Bill Date: 05/10/2026
Billing Period: 01/10/2026 - 31/10/2026
Due Date: 26/10/2026

Previous Balance                         138.45
Payment Received - Thank You            -138.45

CURRENT CHARGES                      Amount (RM)
Unifi Home 300Mbps Monthly Fee           139.00
Unifi TV Add-on Pack                      49.00
Mesh Wi-Fi Add-on (2 units)               20.00
Late Payment Charge                       10.00
Service Tax 6%                            12.48
Rounding Adjustment                        0.02
Total Current Charges                    230.50
Total Amount Due                         230.50`,
  },
  {
    id: "maxis-roaming",
    provider: "maxis",
    title: "Maxis Postpaid — holiday bill shock",
    scenario: "Roaming in Thailand, a mystery game subscription charged twice.",
    usual: 330,
    text: `Maxis Broadband Sdn Bhd
Account Number: 4012 3456 7788
Statement Date: 12 Oct 2026
Bill Period: 12 Sep 2026 - 11 Oct 2026
Payment Due: 02 Nov 2026

Maxis Postpaid 139 Monthly Commitment     139.00
Share Line (012-345 6789)                  48.00
Device Instalment - iPhone 17 (9/24)      155.00
Roaming Data - Thailand (pay per use)     186.40
IDD Calls to Indonesia                     12.60
Content Subscription - GameZone Daily      22.00
Content Subscription - GameZone Daily      22.00
Service Tax 6%                             25.80
Total Current Charges                     610.80`,
  },
  {
    id: "celcomdigi-sst",
    provider: "celcomdigi",
    title: "CelcomDigi Postpaid — tax & data passes",
    scenario: "Auto-renewing data passes, a paper bill fee and tax at the wrong rate.",
    text: `CelcomDigi Telecommunication Sdn Bhd
Account No: 3001234567
Bill Date: 20/10/2026
Bill Cycle: 20 Sep 2026 - 19 Oct 2026
Due Date: 10/11/2026

CelcomDigi Postpaid 5G 80 Monthly Fee     80.00
Supplementary Line - Family               45.00
Data Pass 10GB (auto-renew) x3            30.00
Itemised Paper Bill Fee                    5.00
Calls to Non-local Numbers                 3.40
Service Tax 8%                            13.07
Total Current Charges                    176.47`,
  },
  {
    id: "time-healthy",
    provider: "time",
    title: "TIME Fibre — first full month",
    scenario: "A healthy bill with a partial-month charge and a promo rebate.",
    text: `TIME dotCom Berhad
Account No: 100234567
Invoice Date: 01/11/2026
Period: 01/11/2026 - 30/11/2026
Due Date: 21/11/2026

TIME Fibre 600Mbps Monthly Fee                    139.00
Promotional Rebate (Month 2 of 6)                 -40.00
TIME Fibre 600Mbps (Prorated 18/10 - 31/10)        44.71
Service Tax 6%                                      8.62
Total Current Charges                             152.33`,
  },
  {
    id: "umobile-idd",
    provider: "umobile",
    title: "U Mobile — family lines & IDD",
    scenario: "Three lines, long calls home to Bangladesh and a late fee.",
    text: `U Mobile Sdn Bhd
Account No: 7012345678
Bill Date: 08/10/2026
Billing Period: 08 Sep 2026 - 07 Oct 2026
Due Date: 29/10/2026

ULTRA Postpaid 68 Monthly Fee                 68.00
Supplementary Line x2 (RM38 each)             76.00
IDD Calls - Bangladesh (182 min)              54.60
ULTRA5G Priority Pass add-on                   5.00
Late Payment Charge                           10.00
Service Tax 6%                                12.22
Total Current Charges                        225.82`,
  },
  {
    id: "allo-double",
    provider: "allo",
    title: "Allo Fibre — charged twice",
    scenario: "The monthly fee appears twice, plus an unexpected router charge.",
    usual: 105,
    text: `Allo Technology Sdn Bhd
Account No: AL-5567123
Bill Date: 03/11/2026
Billing Period: 01/11/2026 - 30/11/2026
Due Date: 24/11/2026

Allo Fibre 300Mbps Monthly Fee                99.00
Allo Fibre 300Mbps Monthly Fee                99.00
Router Replacement Charge                    150.00
Service Tax 6%                                20.88
Total Current Charges                        368.88`,
  },
];
