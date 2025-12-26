archivos que la IA use como contexto estable para no depender de la ventana de contexto del chat.

05_ai/
  00_ai_readme.md
  01_personas/
    equity_analyst.md
    portfolio_manager.md
  02_policies/
    safety_and_disclaimers.md
    no_financial_advice.md
    citation_rules.md
  03_tools/
    tool_contracts.md
    examples_get_post_portfolio.md
  04_response_formats/
    equity_answer_format.md
    portfolio_answer_format.md
  05_memory/
    project_summary.md
    current_state.md
    known_issues.md

Qué es cada cosa (y por qué sirve)

01_personas/: “quién es” cada agente, tono, objetivos.

02_policies/: reglas duras (ej: no advice).

03_tools/: cómo la IA usa GET/POST al portfolio (contratos + ejemplos).

04_response_formats/: para que responda siempre consistente (secciones fijas).

05_memory/: esto reemplaza ventana de contexto:

project_summary.md: 20–40 líneas con el estado global

current_state.md: qué está hecho / qué falta (muy concreto)

known_issues.md: bugs, limitaciones, riesgos

La IA primero lee project_summary.md + current_state.md y ya “entra en personaje” sin que vos le pegues 2000 líneas.