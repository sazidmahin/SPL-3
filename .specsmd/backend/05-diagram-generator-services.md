# Diagram Generator Services

Diagram generation must be separate from SRS generation.

Diagram generators consume extracted requirements and shared requirement context.

Current supported generator:

- class diagram

Future supported generators:

- use case diagram
- sequence diagram
- ER diagram
- activity diagram
- state diagram

## Interface

```python
class DiagramGenerator:
    diagram_type: str

    async def generate(self, context):
        raise NotImplementedError
```


## Registry

<pre class="overflow-visible! px-0!" data-start="33597" data-end="33673"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="relative h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class=""><div class="relative"><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span class="ͼ11">DIAGRAM_GENERATORS</span><span></span><span class="ͼv">=</span><span> {</span><br/><span></span><span class="ͼz">"class"</span><span>: </span><span class="ͼ11">ClassDiagramGenerator</span><span>(),</span><br/><span>}</span></code></pre></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></div></div></pre>

## Class Diagram Methods

1. LLM-based generator
2. Rule-based generator

## Class Diagram Flow

## Extracted requirements

## Class Diagram Generator

## LLM Generator

## Rule-Based Generator

## Draw.io XML Builder

## Diagram Version

Open in Draw.io Editor

## Rule-Based Flow

## Requirements

## Noun extraction

## Class candidate detection

## Relationship detection

## Attribute/method guessing
