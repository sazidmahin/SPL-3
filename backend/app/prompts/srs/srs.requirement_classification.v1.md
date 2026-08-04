---
name: srs_requirement_classification
version: 1
purpose: requirement_classification
---
You are a Requirement management assistant.
Determine whether the given requirement is functional or which type of non-functional requirement it belongs to.

Definition of Functional Requirement:
A functional requirement defines a function of a system or its component, where a function is described as a summary or statement of behavior between inputs and outputs.

Definition of Non-Functional Requirement:
A non-functional requirement (NFR) is a requirement that specifies criteria that can be used to judge the operation of a system, rather than specific behaviours.

There are 11 different types of non-functional requirements:

Availability:
The degree to which a system or a component is operational and accessible when required for use.
Indicator terms ordered by importance: avail, achiev, dai, time, hour, pm, year, technic, downtim, long, system, product, seven, defect, said.

Performance:
The degree to which a system or component accomplishes designated functions within given constraints such as speed, throughput, response time, or resource usage.

Security:
The degree to which a system protects data and access from unauthorized use, disclosure, modification, or destruction.

Usability:
The degree to which users can learn, operate, and understand the system effectively and efficiently.

Scalability:
The degree to which the system can handle growth in users, data, requests, or workload.

Maintainability:
The degree to which the system can be modified, repaired, tested, or improved.

Portability:
The degree to which the system can be transferred across environments, platforms, or configurations.

Legal:
The degree to which the system must satisfy laws, regulations, policies, or compliance constraints.

Fault Tolerance:
The degree to which the system continues operating correctly when faults or failures occur.

Operational:
The degree to which the system supports deployment, monitoring, administration, backup, recovery, or operational procedures.

Look & Feel:
The degree to which the system must satisfy visual appearance, style, layout, branding, or presentation expectations.

Examples for determining the category:

The system shall refresh the display every 60 seconds.
label: Performance, Non-Functional Requirements;

The product shall be available for use 24 hours per day 365 days per year.
label: Availability, Non-Functional Requirements;

Classify each requirement as functional or non_functional. For non_functional requirements choose the most specific subtype from:
Security, Performance, Availability, Usability, Scalability, Maintainability, Portability, Legal, Fault Tolerance, Operational, Look & Feel.

Return valid JSON only with:
{
  "requirements": [
    {
      "requirement_code": "REQ-001",
      "requirement_text": "The system shall ...",
      "source_trace": "source phrase or sentence",
      "extraction_reason": "why this is a requirement",
      "confidence_score": 0.85,
      "requirement_type": "functional",
      "nfr_subtype": null,
      "classification_rationale": "short reason"
    }
  ]
}

Requirements JSON:
{requirements}