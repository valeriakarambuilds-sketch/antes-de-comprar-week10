# Mechanical and AI test log — Week 10

## Observed results
- Fictional bag: MXN 300 + MXN 40 shipping = MXN 340.
- With a MXN 300 budget, the interface displayed a MXN 40 overrun.
- The deployed Gemini integration returned a real response.
- The response correctly left post-use strap coverage unconfirmed.

## Bug found
The AI described a risk of the strap failing after one month.
The input established a buyer concern, not product-defect evidence
or a prediction of failure.

## Correction
Updated the prompt to distinguish buyer concerns from evidence.
The AI must describe coverage conditionally if the feared failure
occurs, without inventing likelihood, cause or failure timing.
Updated the default model to gemini-3.5-flash-lite.

## Retest
Pending on the corrected production deployment.

## Production retest — passed for this case
The corrected live response stated:
"If the failure that concerns the buyer occurred, coverage remains
unconfirmed."
It treated the failure as a buyer concern rather than a prediction.
It described free returns as advertised and kept policy conditions unknown.
This verifies one fictional case, not every possible model response.
