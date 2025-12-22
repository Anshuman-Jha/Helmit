import re
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/privacy", tags=["Privacy"])

class PrivacyInput(BaseModel):
    text: str

SENSITIVE_PATTERNS = {
    "Home Address": [
        r"\b\d{1,5}\s+\w+\s+(street|st|road|rd|lane|ln|avenue|ave)\b",
    ],
    "House Number": [
        r"(house|home)\s*(no|number|#)?\s*(is|:)?\s*\d{4,}",
        r"\b\d{4,}\s*(house|home)\b",
    ],
    "Phone Number": [
        r"\b\d{10}\b",
        r"\+\d{1,3}\s?\d{6,12}",
    ],
    "Bank Account Number": [
        r"(bank|account)\s*(no|number|#|detail|details)?\s*(is|:)?\s*\d{4,}",
        r"bank\s+detail.*?(?:account\s*)?(?:no|number|#)?\s*(?:is|:)?\s*\d{4,}",
    ],
    "Password": [
        r"password\s*[:=]",
        r"pwd\s*[:=]",
    ],
    "Government ID": [
        r"\b\d{4}\s\d{4}\s\d{4}\b",  # Aadhaar
        r"\b[A-Z]{5}\d{4}[A-Z]\b",  # PAN
    ],
    "Email": [
        r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    ]
}

@router.post("/check")
def privacy_check(data: PrivacyInput):
    text = data.text.lower()

    for label, patterns in SENSITIVE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text):
                return {
                    "flagged": True,
                    "type": label,
                    "category": "privacy"
                }

    return {"flagged": False}
