#!/usr/bin/env python3
"""
parse_modsec_log.py
Parses a ModSecurity serial audit log and generates a daily markdown report.

Usage: parse_modsec_log.py <audit_log_path> <target_date YYYY-MM-DD> <output_file>
"""

import re
import sys
from collections import Counter, defaultdict
from datetime import datetime


# Internal / known IPs treated as potential false positives
INTERNAL_IP_PREFIXES = ("192.168.", "10.", "172.16.", "172.17.", "172.18.",
                        "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
                        "172.24.", "172.25.", "172.26.", "172.27.", "172.28.",
                        "172.29.", "172.30.", "172.31.", "127.")

# Meta rules that are scoring/evaluation, not actual attack detections
META_RULE_IDS = {"949110", "980130", "959100", "980140"}


def parse_entries(log_path):
    """Parse the ModSecurity serial audit log into individual entries."""
    entries = []
    current_entry = {}
    current_section = None
    current_lines = []

    with open(log_path, "r", errors="replace") as f:
        for line in f:
            # Check for section boundary: ---<unique_id>---<section>--
            m = re.match(r"^---(\w+)---([A-Z])--$", line.rstrip())
            if m:
                uid, section = m.group(1), m.group(2)

                # Save previous section content
                if current_section and current_entry:
                    current_entry[current_section] = "".join(current_lines)

                if section == "A":
                    # Start of a new entry
                    if current_entry:
                        entries.append(current_entry)
                    current_entry = {"uid": uid}
                elif section == "Z":
                    # End of entry
                    if current_entry:
                        entries.append(current_entry)
                    current_entry = {}
                    current_section = None
                    current_lines = []
                    continue

                current_section = section
                current_lines = []
            else:
                current_lines.append(line)

    # Handle last entry if log doesn't end with Z
    if current_entry:
        if current_section:
            current_entry[current_section] = "".join(current_lines)
        entries.append(current_entry)

    return entries


def parse_a_section(text):
    """Extract timestamp, source IP, destination IP, port from section A."""
    m = re.match(
        r"\[(\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2})\s+[^\]]+\]\s+\S+\s+(\S+)\s+\d+\s+(\S+)\s+(\d+)",
        text.strip(),
    )
    if m:
        ts_str, src_ip, dst_ip, dst_port = m.groups()
        ts = datetime.strptime(ts_str, "%d/%b/%Y:%H:%M:%S")
        return ts, src_ip, dst_ip, int(dst_port)
    return None, None, None, None


def parse_b_section(text):
    """Extract request method, URI, and protocol from section B (request line)."""
    lines = text.strip().split("\n")
    if lines:
        parts = lines[0].split()
        if len(parts) >= 2:
            method = parts[0]
            uri = parts[1]
            return method, uri
    return None, None


def parse_h_section(text):
    """Extract all ModSecurity messages from section H."""
    rules = []
    total_score = 0

    for line in text.strip().split("\n"):
        if not line.startswith("ModSecurity:"):
            continue

        rule_id_m = re.search(r'\[id "(\d+)"\]', line)
        msg_m = re.search(r'\[msg "([^"]+)"\]', line)
        severity_m = re.search(r'\[severity "(\d+)"\]', line)
        uri_m = re.search(r'\[uri "([^"]+)"\]', line)
        tags = re.findall(r'\[tag "([^"]+)"\]', line)
        data_m = re.search(r'\[data "([^"]+)"\]', line)

        rule_id = rule_id_m.group(1) if rule_id_m else "unknown"
        msg = msg_m.group(1) if msg_m else "unknown"
        severity = int(severity_m.group(1)) if severity_m else -1
        uri = uri_m.group(1) if uri_m else ""

        # Extract anomaly score from the 949110 rule (score is in the msg field)
        if rule_id == "949110":
            score_m = re.search(r"Total Score:\s*(\d+)", msg)
            if score_m:
                total_score = int(score_m.group(1))

        rules.append({
            "id": rule_id,
            "msg": msg,
            "severity": severity,
            "uri": uri,
            "tags": tags,
            "data": data_m.group(1) if data_m else "",
        })

    return rules, total_score


def categorize_rule(rule_id, tags):
    """Map a rule to an attack category based on its ID range and tags."""
    rid = int(rule_id) if rule_id.isdigit() else 0

    tag_categories = {
        "attack-sqli": "SQL Injection",
        "attack-xss": "Cross-Site Scripting (XSS)",
        "attack-rce": "Remote Code Execution",
        "attack-lfi": "Local File Inclusion",
        "attack-rfi": "Remote File Inclusion",
        "attack-injection-php": "PHP Injection",
        "attack-fixation": "Session Fixation",
        "attack-reputation-ip": "IP Reputation",
        "attack-generic": "Generic Attack",
    }

    for tag in tags:
        if tag in tag_categories:
            return tag_categories[tag]

    # Fallback to rule ID ranges
    ranges = [
        (911000, 911999, "Method Enforcement"),
        (913000, 913999, "Scanner Detection"),
        (920000, 920999, "Protocol Enforcement"),
        (921000, 921999, "Protocol Attack"),
        (930000, 930999, "Local File Inclusion"),
        (931000, 931999, "Remote File Inclusion"),
        (932000, 932999, "Remote Code Execution"),
        (933000, 933999, "PHP Injection"),
        (934000, 934999, "Node.js / Generic Injection"),
        (941000, 941999, "Cross-Site Scripting (XSS)"),
        (942000, 942999, "SQL Injection"),
        (943000, 943999, "Session Fixation"),
        (944000, 944999, "Java Attack"),
    ]
    for lo, hi, cat in ranges:
        if lo <= rid <= hi:
            return cat

    return "Other"


def generate_report(entries, target_date):
    """Generate markdown report content from parsed entries."""
    target_date_str = target_date.strftime("%d/%b/%Y")
    target_iso = target_date.strftime("%Y-%m-%d")

    # Filter entries for the target date
    day_entries = []
    for entry in entries:
        a_text = entry.get("A", "")
        ts, src_ip, dst_ip, dst_port = parse_a_section(a_text)
        if ts and ts.strftime("%d/%b/%Y") == target_date_str:
            day_entries.append(entry)

    lines = []
    lines.append(f"# OWASP CRS Daily Report — {target_iso}")
    lines.append("")
    lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"**Log file:** `/var/log/modsec_audit.log`")
    lines.append("")

    if not day_entries:
        lines.append("## No Hits")
        lines.append("")
        lines.append(f"No ModSecurity audit log entries found for {target_iso}.")
        lines.append("")
        return "\n".join(lines)

    lines.append(f"## Summary")
    lines.append("")
    lines.append(f"- **Total audit entries:** {len(day_entries)}")
    lines.append("")

    # Collect stats
    src_ips = Counter()
    uris = Counter()
    rule_counter = Counter()     # (rule_id, msg) -> count
    category_counter = Counter()
    high_severity_incidents = []
    internal_ip_entries = []

    for entry in day_entries:
        a_text = entry.get("A", "")
        b_text = entry.get("B", "")
        h_text = entry.get("H", "")

        ts, src_ip, dst_ip, dst_port = parse_a_section(a_text)
        method, uri = parse_b_section(b_text)
        rules, anomaly_score = parse_h_section(h_text)

        if src_ip:
            src_ips[src_ip] += 1

        if uri:
            uris[uri] += 1

        is_internal = src_ip and any(src_ip.startswith(p) for p in INTERNAL_IP_PREFIXES)

        for rule in rules:
            if rule["id"] in META_RULE_IDS:
                continue
            rule_counter[(rule["id"], rule["msg"])] += 1
            cat = categorize_rule(rule["id"], rule["tags"])
            category_counter[cat] += 1

        if anomaly_score >= 10:
            high_severity_incidents.append({
                "time": ts.strftime("%H:%M:%S") if ts else "??:??:??",
                "src_ip": src_ip or "unknown",
                "method": method or "?",
                "uri": uri or "?",
                "score": anomaly_score,
                "rules": [(r["id"], r["msg"]) for r in rules if r["id"] not in META_RULE_IDS],
            })

        if is_internal:
            internal_ip_entries.append({
                "time": ts.strftime("%H:%M:%S") if ts else "??:??:??",
                "src_ip": src_ip,
                "method": method or "?",
                "uri": uri or "?",
                "rules": [(r["id"], r["msg"]) for r in rules if r["id"] not in META_RULE_IDS],
            })

    # Top Source IPs
    lines.append("## Top Source IPs")
    lines.append("")
    lines.append("| IP Address | Hits | Internal? |")
    lines.append("|------------|------|-----------|")
    for ip, count in src_ips.most_common(15):
        is_int = "Yes" if any(ip.startswith(p) for p in INTERNAL_IP_PREFIXES) else "No"
        lines.append(f"| `{ip}` | {count} | {is_int} |")
    lines.append("")

    # Top Triggered Rules
    lines.append("## Top Triggered Rules")
    lines.append("")
    lines.append("| Rule ID | Message | Hits |")
    lines.append("|---------|---------|------|")
    for (rid, msg), count in rule_counter.most_common(20):
        lines.append(f"| {rid} | {msg} | {count} |")
    lines.append("")

    # Top Targeted URIs
    lines.append("## Top Targeted URIs")
    lines.append("")
    lines.append("| URI | Hits |")
    lines.append("|-----|------|")
    for uri, count in uris.most_common(15):
        lines.append(f"| `{uri}` | {count} |")
    lines.append("")

    # Attack Categories
    lines.append("## Attack Categories")
    lines.append("")
    lines.append("| Category | Hits |")
    lines.append("|----------|------|")
    for cat, count in category_counter.most_common():
        lines.append(f"| {cat} | {count} |")
    lines.append("")

    # High-Severity Incidents
    lines.append("## High-Severity Incidents (Anomaly Score >= 10)")
    lines.append("")
    if high_severity_incidents:
        lines.append(f"**Count:** {len(high_severity_incidents)}")
        lines.append("")
        for i, inc in enumerate(high_severity_incidents, 1):
            lines.append(f"### Incident {i}")
            lines.append("")
            lines.append(f"- **Time:** {inc['time']}")
            lines.append(f"- **Source IP:** `{inc['src_ip']}`")
            lines.append(f"- **Request:** `{inc['method']} {inc['uri']}`")
            lines.append(f"- **Anomaly Score:** {inc['score']}")
            lines.append(f"- **Triggered Rules:**")
            for rid, msg in inc["rules"]:
                lines.append(f"  - {rid}: {msg}")
            lines.append("")
    else:
        lines.append("No high-severity incidents for this day.")
        lines.append("")

    # False Positive Summary (Internal IPs)
    lines.append("## Potential False Positives (Internal IPs)")
    lines.append("")
    if internal_ip_entries:
        lines.append(f"**Entries from internal IPs:** {len(internal_ip_entries)}")
        lines.append("")
        lines.append("These may be legitimate application traffic that triggered CRS rules.")
        lines.append("Review and consider adding exclusions if confirmed as false positives.")
        lines.append("")
        lines.append("| Time | Source IP | Request | Rules |")
        lines.append("|------|----------|---------|-------|")
        for entry in internal_ip_entries[:30]:  # Limit to 30 rows
            rule_list = ", ".join(f"{rid}" for rid, msg in entry["rules"])
            lines.append(
                f"| {entry['time']} | `{entry['src_ip']}` "
                f"| `{entry['method']} {entry['uri']}` | {rule_list} |"
            )
        if len(internal_ip_entries) > 30:
            lines.append(f"| ... | ... | ... | ... |")
            lines.append("")
            lines.append(f"*({len(internal_ip_entries) - 30} more entries omitted)*")
        lines.append("")
    else:
        lines.append("No entries from internal IPs.")
        lines.append("")

    return "\n".join(lines)


def main():
    if len(sys.argv) != 4:
        print(f"Usage: {sys.argv[0]} <audit_log> <YYYY-MM-DD> <output_file>",
              file=sys.stderr)
        sys.exit(1)

    log_path = sys.argv[1]
    date_str = sys.argv[2]
    output_path = sys.argv[3]

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        print(f"Invalid date format: {date_str}. Expected YYYY-MM-DD.", file=sys.stderr)
        sys.exit(1)

    entries = parse_entries(log_path)
    report = generate_report(entries, target_date)

    with open(output_path, "w") as f:
        f.write(report)


if __name__ == "__main__":
    main()
