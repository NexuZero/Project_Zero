You are a senior product designer, frontend engineer, Python engineer, and product architect.

Build a complete open-source application called "Project Zero" for now. The final product name can be changed later.

PRODUCT VISION
==============

Project Zero is a lightweight, standalone, offline-first "Project Idea Engine."

Its purpose is to help developers, students, builders, researchers, and creators turn a field, niche, and problem into structured software/open-source project ideas.

This is Project #0 of a larger initiative to build 100 useful open-source projects for the community.

IMPORTANT:
This application must NOT depend on:
- OpenAI API
- Anthropic API
- Gemini API
- Any paid API
- Any cloud AI service
- Any external LLM

The core generation engine must work completely offline.

I want this to feel like a real polished application, NOT a basic Python form, admin dashboard, Streamlit prototype, or hackathon demo.

Think:
modern AI product
+
beautiful developer tool
+
minimal desktop/web app
+
GitHub-ready open-source project.


==================================================
1. USER EXPERIENCE
==================================================

The main screen should be extremely simple.

Header:

PROJECT ZERO
Turn problems into projects.

Main creation area:

FIELD
[ Select or type a field ]

Examples:
Applied AI
Cybersecurity
DevOps
IT Operations
Education
Healthcare
Productivity
Data
Networking
Automation
Developer Tools
Finance
Accessibility

NICHE
[ Enter a niche ]

Example:
AI Agent Operations

PROBLEM
[ Describe the problem you want to solve ]

Example:
Companies deploying AI agents don't have a simple way
to track ownership, health, permissions and incidents.

Optional:

TARGET USER
[ Who experiences this problem? ]

Example:
IT Operations Teams


Large primary button:

[ GENERATE 10 PROJECTS ]


==================================================
2. RESULTS EXPERIENCE
==================================================

Generate 10 DIFFERENT project concepts.

Display them as beautiful project cards.

Example:

01

AgentWatch

AI agent health and ownership monitor.

Category:
AI Operations

Problem:
Organizations don't know which AI agents are active,
who owns them, or whether they are operating correctly.

Solution:
A lightweight local dashboard for registering and
monitoring enterprise AI agents.

Difficulty:
●●○○○

Build Time:
Weekend Project

AI Required:
No

Open Source Potential:
High


[ Explore Project ]


At the bottom:

[ GENERATE 10 MORE ]

Generating more projects MUST NOT simply repeat the
previous projects.


==================================================
3. PROJECT DETAIL VIEW
==================================================

Clicking "Explore Project" opens a detailed project page.

Show:

PROJECT NAME

TAGLINE

FIELD

NICHE

PROBLEM

TARGET USERS

WHY THIS PROJECT SHOULD EXIST

PROPOSED SOLUTION

CORE FEATURES

MVP FEATURES

FUTURE FEATURES

SUGGESTED TECH STACK

DIFFICULTY
1–5

ESTIMATED BUILD SIZE
Tiny
Small
Medium
Large

AI REQUIRED?
Yes / No / Optional

OPEN SOURCE POTENTIAL
Low / Medium / High

COMMUNITY VALUE
Low / Medium / High

POSSIBLE GITHUB DESCRIPTION

Example:

"Open-source local dashboard for monitoring
AI agent ownership, health and operational status."

Then provide:

[ Save Idea ]

[ Generate Similar ]

[ Back ]


==================================================
4. THE "BRAIN"
==================================================

Do NOT fake an AI API.

Instead create a local rule-based knowledge engine.

Architecture example:

engine/
    generator.py
    classifier.py
    naming.py
    scoring.py
    templates.py

knowledge/
    fields.json
    niches.json
    problem_types.json
    audiences.json
    capabilities.json
    naming_patterns.json
    tech_stacks.json
    project_templates.json


The engine should analyze the user's text using:

- keyword matching
- weighted keywords
- categories
- problem types
- domain mappings
- templates
- controlled randomness
- scoring rules


==================================================
5. PROBLEM CLASSIFICATION
==================================================

Create problem categories such as:

automation
monitoring
detection
organization
productivity
security
documentation
analysis
communication
collaboration
visualization
management
tracking
education
accessibility
integration
reliability
privacy
developer experience


Example:

If the input contains:

"manually"
"repetitive"
"time consuming"

Increase probability of:

AUTOMATION


If input contains:

"don't know status"
"visibility"
"health"
"uptime"

Increase:

MONITORING


If input contains:

"attack"
"threat"
"phishing"
"vulnerability"

Increase:

SECURITY / DETECTION


==================================================
6. FEATURE INTELLIGENCE
==================================================

Different problem categories should generate different
feature recommendations.

AUTOMATION:

Triggers
Rules
Actions
Approval
Logs
Scheduling
Rollback


MONITORING:

Dashboard
Status
Alerts
History
Health Checks
Metrics


DETECTION:

Scanning
Classification
Risk Score
Alerts
History
Reports


DOCUMENTATION:

Templates
Structured Input
Export
History
Search
Versioning


MANAGEMENT:

Dashboard
Ownership
Status
Assignments
Priorities
Reports


The system should combine these intelligently depending
on the detected project type.


==================================================
7. PROJECT NAMING ENGINE
==================================================

Create a surprisingly good local naming engine.

Use:

domain words
problem words
action words
outcome words
technology words

Naming structures:

[Keyword] + Flow
[Keyword] + Guard
[Keyword] + Lens
[Keyword] + Watch
[Keyword] + Forge
[Keyword] + Pilot
[Keyword] + Kit
[Keyword] + Scout
[Keyword] + Hub
[Keyword] + Track

Also generate:

compound names
short names
descriptive names
developer-style names

Examples:

AgentWatch
IncidentForge
OpsLens
ThreatScout
DocPilot
FlowKit
StackGuard

Avoid ridiculous combinations.

Names should generally be:

short
memorable
pronounceable
GitHub-friendly

Do not repeat previously generated names during the
current session.


==================================================
8. SCORING ENGINE
==================================================

Score generated projects based on:

Usefulness
Originality
Buildability
Community value
Open-source suitability
Scope
Difficulty

Use simple deterministic rules.

Do NOT pretend these scores were generated by machine
learning.

The engine should prioritize projects that:

solve one clear problem
can realistically be built
have a clearly identifiable user
provide obvious value
can work as open source


==================================================
9. "SURPRISE ME" MODE
==================================================

Add:

[ SURPRISE ME ]

This should generate projects without requiring input.

But do NOT use pure randomness.

Combine fields + niches + problem categories that make
logical sense.

Examples:

Cybersecurity × Small Business × Detection

Applied AI × IT Operations × Reliability

Education × Accessibility × Productivity

Developer Tools × Documentation × Automation


==================================================
10. FAVORITES
==================================================

Users should be able to favorite/save ideas.

Because this is offline-first, store favorites locally.

No account should be required.

Allow:

Favorite
Remove favorite
View favorites
Export favorite


==================================================
11. EXPORT
==================================================

Allow exporting an idea as Markdown.

The Markdown should already resemble the beginning of
a GitHub README.

Example:

# AgentWatch

> Lightweight AI-agent health and ownership monitor.

## Problem

...

## Solution

...

## Features

...

## MVP

...

## Tech Stack

...

## Roadmap

...


==================================================
12. DESIGN
==================================================

This part is VERY IMPORTANT.

The application must look like a polished modern
product.

Do NOT make it look like:

Streamlit
Bootstrap demo
admin template
student project
generic HTML page


Use a modern application-style interface.

Design characteristics:

minimal
premium
clean
developer-focused
large typography
excellent spacing
subtle animations
beautiful cards
rounded components
responsive
dark/light mode
professional icons
excellent empty states

Avoid excessive gradients.

Avoid excessive colors.

Avoid clutter.

The interface should immediately make someone think:

"This looks like a real startup product."


Desktop should feel like a desktop application.

Mobile should feel like a native mobile application.


==================================================
13. APP-LIKE BEHAVIOR
==================================================

Build it as a responsive Progressive Web App (PWA).

It should be installable where supported.

Include:

manifest
application icons/placeholders
offline support
responsive layout
mobile navigation
desktop navigation
loading states
transitions

Once installed, it should feel much closer to an app
than a website.


==================================================
14. TECH STACK
==================================================

Prefer:

Frontend:
React
TypeScript
Vite

Styling:
Tailwind CSS

Icons:
Lucide

Local persistence:
localStorage or IndexedDB

Backend:
Avoid a backend unless genuinely necessary.

Generation engine:
TypeScript/JavaScript locally in the application.

IMPORTANT:

If we can implement the rule engine entirely client-side,
do that.

This would make Project Zero:

- completely standalone
- privacy friendly
- deployable as static files
- extremely cheap to host
- usable offline
- easy for the community to fork

Do not introduce Python merely because this project was
originally discussed as a Python project.

Choose the simplest architecture.


==================================================
15. PRIVACY
==================================================

The user's project ideas should remain on their device.

No analytics in V1.

No trackers.

No account.

No unnecessary network requests.

Show somewhere subtly:

"Your ideas stay on your device."


==================================================
16. OPEN SOURCE
==================================================

Create a professional repository structure.

Include:

README.md
LICENSE
CONTRIBUTING.md
CHANGELOG.md
.gitignore

src/
engine/
knowledge/
components/
pages/
utils/

Include documentation explaining:

How the generation engine works

How contributors can add fields

How contributors can add niches

How contributors can add naming patterns

How contributors can add project templates


==================================================
17. COMMUNITY EXTENSIBILITY
==================================================

This is extremely important.

The knowledge engine should be DATA DRIVEN.

Someone should be able to contribute:

a new field
new niche
new project type
new feature mapping
new naming pattern

without rewriting the entire application.

For example:

knowledge/fields.json

could contain:

{
    "id": "cybersecurity",
    "name": "Cybersecurity",
    "keywords": [
        "security",
        "threat",
        "attack",
        "vulnerability"
    ]
}

This allows GitHub contributors to expand the
intelligence of Project Zero.


==================================================
18. FUTURE LOCAL AI
==================================================

Architect the project so that later we COULD add:

Local LLM support
Ollama
WebLLM
Transformers.js
small browser models

BUT:

DO NOT implement these in V0.1.

The rule engine must remain fully functional without AI.


==================================================
19. V0.1 SCOPE
==================================================

Do not overengineer.

V0.1 needs:

Beautiful home screen
Field selection
Niche input
Problem description
Generate 10 projects
Generate 10 more
Project cards
Project detail screen
Rule-based engine
Naming engine
Basic scoring
Favorites
Markdown export
Dark/light mode
Responsive design
PWA/offline functionality

That's enough.


==================================================
20. BUILD QUALITY
==================================================

Before considering the project complete:

Run the application.

Fix compilation errors.

Fix TypeScript errors.

Test the primary workflow.

Test Generate 10.

Test Generate 10 More.

Verify names do not immediately repeat.

Test favorites.

Test Markdown export.

Test mobile layout.

Test dark mode.

Verify the application works without an API key.

Verify core functionality works without internet access.

Do not leave placeholder functionality pretending to
work.

If something cannot be implemented properly, document
it rather than faking it.


==================================================
21. FIRST-RUN EXPERIENCE
==================================================

When the user opens Project Zero for the first time,
they should understand the product within approximately
5 seconds.

Main message:

"Turn a problem into your next project."

Secondary message:

"Describe what interests you. Project Zero turns it
into practical open-source project concepts."

Primary action:

"Create Projects"

Secondary action:

"Surprise Me"


==================================================
22. PRODUCT PHILOSOPHY
==================================================

Project Zero is NOT trying to imitate ChatGPT.

It is a focused idea engine.

Its advantage is:

fast
offline
private
open source
zero API cost
community expandable
focused on actionable projects

Every generated result should make the user think:

"I could actually build this."


Now build V0.1 as a complete working application.

Start by:
1. defining the architecture,
2. creating the project structure,
3. implementing the generation engine,
4. building the interface,
5. connecting the engine to the interface,
6. implementing offline/PWA support,
7. testing the complete application,
8. writing the README.

Do not stop after creating a mockup.
Do not give me only sample code.
Build the working project.
