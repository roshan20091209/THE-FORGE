PHYSICS_OSM = {
    2: {
        "label": "2 Marks",
        "steps": [
            {"step": 1, "desc": "Definition/Statement", "marks": 1},
            {"step": 2, "desc": "Formula/Example/Explanation", "marks": 1}
        ],
        "format_instruction": "2-mark: Point 1 (Definition/Statement) + Point 2 (Formula/Example). Max 3 lines."
    },
    3: {
        "label": "3 Marks",
        "steps": [
            {"step": 1, "desc": "Concept/Definition", "marks": 1},
            {"step": 2, "desc": "Formula + Substitution", "marks": 1},
            {"step": 3, "desc": "Final answer with unit", "marks": 1}
        ],
        "format_instruction": "3-mark: Step 1 (Concept) + Step 2 (Formula+Substitution) + Step 3 (Answer with unit)."
    },
    5: {
        "label": "5 Marks",
        "steps": [
            {"step": 1, "desc": "State the relevant law/principle", "marks": 1},
            {"step": 2, "desc": "Write the formula with symbols defined", "marks": 1},
            {"step": 3, "desc": "Substitute values with units", "marks": 1},
            {"step": 4, "desc": "Show calculation steps", "marks": 1},
            {"step": 5, "desc": "Final answer with proper units", "marks": 1}
        ],
        "format_instruction": "5-mark: Step 1 (Law/Principle) + Step 2 (Formula with symbols) + Step 3 (Substitution with units) + Step 4 (Calculation) + Step 5 (Final answer with unit). Include diagram if applicable."
    }
}

CHEMISTRY_OSM = {
    2: {
        "label": "2 Marks",
        "steps": [
            {"step": 1, "desc": "Definition/Name", "marks": 1},
            {"step": 2, "desc": "Key point / Reactants + Products (balanced)", "marks": 1}
        ],
        "format_instruction": "2-mark: Definition/Name (1) + Key point (1). For reactions: Reactants + Products (balanced)."
    },
    3: {
        "label": "3 Marks",
        "steps": [
            {"step": 1, "desc": "Concept", "marks": 1},
            {"step": 2, "desc": "Explanation / Reagent + Condition", "marks": 1},
            {"step": 3, "desc": "Example / Product", "marks": 1}
        ],
        "format_instruction": "3-mark: Concept (1) + Explanation (1) + Example (1). For organic: Reagent + Condition + Product."
    },
    5: {
        "label": "5 Marks",
        "steps": [
            {"step": 1, "desc": "Formula / Reagent + Condition", "marks": 1},
            {"step": 2, "desc": "Substitution / Mechanism steps", "marks": 1},
            {"step": 3, "desc": "Calculation / Intermediate formation", "marks": 1},
            {"step": 4, "desc": "Unit conversion / Named reaction", "marks": 1},
            {"step": 5, "desc": "Final answer with unit / Product", "marks": 1}
        ],
        "format_instruction": "5-mark: For numerical: Formula + Substitution + Calculation + Unit + Final. For organic: Reagent + Mechanism steps + Product + Name reaction."
    }
}

MATHS_OSM = {
    1: {
        "label": "1 Mark",
        "steps": [
            {"step": 1, "desc": "Direct answer with brief reason", "marks": 1}
        ],
        "format_instruction": "1-mark: Direct answer with brief reason."
    },
    2: {
        "label": "2 Marks",
        "steps": [
            {"step": 1, "desc": "Formula", "marks": 1},
            {"step": 2, "desc": "Working + Answer", "marks": 1}
        ],
        "format_instruction": "2-mark: Formula + Working + Answer."
    },
    3: {
        "label": "3 Marks",
        "steps": [
            {"step": 1, "desc": "Given + Formula", "marks": 1},
            {"step": 2, "desc": "Working", "marks": 1},
            {"step": 3, "desc": "Answer", "marks": 1}
        ],
        "format_instruction": "3-mark: Given + Formula + Working + Answer."
    },
    4: {
        "label": "4 Marks (Case Study)",
        "steps": [
            {"step": 1, "desc": "Part (i): Concept application", "marks": 1},
            {"step": 2, "desc": "Part (ii): Calculation", "marks": 1},
            {"step": 3, "desc": "Part (iii): Interpretation", "marks": 1},
            {"step": 4, "desc": "Part (iv): Conclusion", "marks": 1}
        ],
        "format_instruction": "4-mark (Case study): Part-wise answers. Each part 1 mark."
    },
    5: {
        "label": "5 Marks",
        "steps": [
            {"step": 1, "desc": "Given/To Find + Concept", "marks": 1},
            {"step": 2, "desc": "Formula/Method selection", "marks": 1},
            {"step": 3, "desc": "Detailed working", "marks": 1},
            {"step": 4, "desc": "Calculation steps", "marks": 1},
            {"step": 5, "desc": "Boxed final answer", "marks": 1}
        ],
        "format_instruction": "5-mark: Given/To Find + Concept + Formula + Detailed working + Boxed final answer."
    }
}

SUBJECT_OSM = {
    "Physics": PHYSICS_OSM,
    "Chemistry": CHEMISTRY_OSM,
    "Mathematics": MATHS_OSM
}


def get_osm_steps(subject: str, marks: int) -> list:
    subject_rules = SUBJECT_OSM.get(subject, {})
    rule = subject_rules.get(marks, {})
    return rule.get("steps", [])


def get_osm_format_instruction(subject: str, marks: int) -> str:
    subject_rules = SUBJECT_OSM.get(subject, {})
    rule = subject_rules.get(marks, {})
    return rule.get("format_instruction", "")


def build_osm_system_prompt(subject: str, marks: int) -> str:
    base = (
        "You are FORGE, a CBSE Class 12 study assistant specifically trained for Chettinad Vidyashram "
        "students appearing for the 2026-27 board exams under the On-Screen Marking (OSM) system.\n\n"
        "CRITICAL RULES:\n"
        "- You ONLY use information from the provided NCERT textbook context.\n"
        "- If the topic is NOT in the context, respond: 'This topic is not in your CBSE 2026-27 syllabus. Please verify with your textbook.'\n"
        "- NEVER use outside knowledge, Wikipedia, or general internet facts.\n"
        "- ALWAYS format answers according to OSM marking scheme step breakdown.\n"
        "- ALWAYS include units in Physics and Chemistry numericals.\n"
        "- ALWAYS balance chemical equations.\n"
        "- For Organic Chemistry: Name reaction + Reagent + Condition + Product.\n"
        "- For Physics: State law -> Formula -> Substitution -> Calculation -> Final answer.\n"
        "- For Maths: Given -> Formula -> Working -> Boxed final answer.\n"
        "- Cite NCERT page numbers when possible.\n\n"
        "TONE: Helpful but strict. Like a good tuition teacher. Encourage understanding, not blind copying. "
        "Use simple English. Avoid complex jargon.\n\n"
    )

    osm_instruction = get_osm_format_instruction(subject, marks)
    if osm_instruction:
        base += f"OSM FORMAT ({marks} marks): {osm_instruction}\n\n"

    return base


def parse_osm_answer(answer_text: str) -> dict:
    import re
    steps = []
    lines = answer_text.strip().split("\n")

    step_pattern = re.compile(r"Step\s*(\d+)", re.IGNORECASE)
    current_step = None
    current_content = []

    for line in lines:
        match = step_pattern.search(line)
        if match:
            if current_step is not None and current_content:
                steps.append({"step": current_step, "content": "\n".join(current_content).strip()})
            current_step = int(match.group(1))
            clean_line = re.sub(r"Step\s*\d+\s*[:\-)\s]*", "", line, flags=re.IGNORECASE).strip()
            current_content = [clean_line] if clean_line else []
        else:
            if current_step is not None:
                current_content.append(line)

    if current_step is not None and current_content:
        steps.append({"step": current_step, "content": "\n".join(current_content).strip()})

    return {"steps": steps, "full_text": answer_text}
