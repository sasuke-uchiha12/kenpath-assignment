from datetime import datetime, timedelta, timezone
from . import db
from .models import Application, Document

NAMES = [
    "Kavitha Raman",
    "Arun Kumar",
    "Meena Selvam",
    "Priya Rajan",
    "Karthik Mohan",
    "Lakshmi Devi",
    "Suresh Babu",
    "Divya Kumar",
    "Anitha Ravi",
    "Ramesh Mani",
    "Vasanthi Raj",
    "Selvam Gopal",
]
DISTRICTS = ["Chennai", "Madurai", "Coimbatore", "Tiruchirappalli"]


def tamil_sample(content: str) -> str:
    return (
        content.replace("Fictional identity record for ", "கற்பனை அடையாளப் பதிவு: ")
        .replace("Fictional address:", "கற்பனை முகவரி:")
        .replace("Fictional annual income statement:", "கற்பனை ஆண்டு வருமான விவரம்:")
        .replace("per year.", "ஆண்டுக்கு.")
    )


def seed():
    with db.Session() as session:
        for index, name in enumerate(NAMES, 1):
            if session.get(Application, index):
                # Fill missing translations for our own known sample documents only.
                for pos in range(3):
                    doc = session.get(Document, index * 10 + pos)
                    if doc is not None and not doc.content_ta:
                        doc.content_ta = tamil_sample(doc.content)
                continue
            annual = 120000 + index * 12000
            missing = index in (2, 6, 10)
            mismatch = index in (3, 7)
            address_mismatch = index == 4
            attention = (
                (["missing_income_proof"] if missing else [])
                + (["income_mismatch"] if mismatch else [])
                + (["address_mismatch"] if address_mismatch else [])
            )
            app = Application(
                id=index,
                reference=f"INC-2026-{index:04d}",
                applicant=name,
                district=DISTRICTS[(index - 1) % 4],
                address=f"{index} Sample Street, {DISTRICTS[(index - 1) % 4]}",
                submitted=datetime.now(timezone.utc) - timedelta(days=index * 2),
                annual_income=annual,
                occupation="Self-employed" if index % 2 else "Salaried",
                required_documents=["identity", "address", "income"],
                attention=attention,
            )
            session.add(app)
            docs = [
                (
                    "identity",
                    "Identity declaration",
                    f"Fictional identity record for {name}.",
                ),
                (
                    "address",
                    "Address proof",
                    f"Fictional address: {'Different Sample Road' if address_mismatch else app.address}.",
                ),
            ]
            if not missing:
                docs.append(
                    (
                        "income",
                        "Income statement",
                        f"Fictional annual income statement: ₹{annual + (24000 if mismatch else 0):,} per year.",
                    )
                )
            for pos, (kind, title, content) in enumerate(docs):
                session.add(
                    Document(
                        id=index * 10 + pos,
                        application_id=index,
                        kind=kind,
                        title=title,
                        content=content,
                        content_ta=tamil_sample(content),
                    )
                )
        session.commit()


if __name__ == "__main__":
    seed()
