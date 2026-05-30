import re

with open("index.html", "r") as f:
    html = f.read()

# Split to only process Selected Paper Publications
parts = re.split(r'(<h2 style="margin-bottom: 16px;">Awards</h2>)', html)
paper_part = parts[0]
rest = "".join(parts[1:])

# Process paper cards inside paper_part
paper_cards = paper_part.split('<div class="paper-card">')
new_paper_part = paper_cards[0]

for card in paper_cards[1:]:
    # 1. remove the prepended PDF icon div
    pdf_div_pattern = r'\s*<div style="margin-right: 15px; margin-top: 5px; min-width: 32px; display: flex; flex-direction: column; align-items: center;">\s*<a href="([^"]+)"[^>]*>\s*<img src="pics/pdf\.gif"[^>]*>\s*<span[^>]*>PDF</span>\s*</a>\s*</div>'
    pdf_match = re.search(pdf_div_pattern, card)
    pdf_url = None
    if pdf_match:
        pdf_url = pdf_match.group(1)
        card = card.replace(pdf_match.group(0), '')

    # 2. Extract conf badge and awards
    conf_pattern = r'<b><font color="blue">(.*?)</font></b>'
    conf_match = re.search(conf_pattern, card)
    if conf_match:
        raw_conf = conf_match.group(1)
        inner_font_match = re.search(r'(.*?)\s*<font color="[^"]+">\s*\((.*?)\)\s*</font>', raw_conf)
        if inner_font_match:
            conf_text = inner_font_match.group(1).strip()
            award_text = inner_font_match.group(2).strip()
            conf_html = f'<span class="conf-badge">{conf_text}</span>'
            award_html = f'<span class="award-badge">{award_text}</span>'
        else:
            paren_match = re.search(r'(.*?)\s*\((.*?)\)', raw_conf)
            if paren_match:
                conf_text = paren_match.group(1).strip()
                award_text = paren_match.group(2).strip()
                conf_html = f'<span class="conf-badge">{conf_text}</span>'
                award_html = f'<span class="award-badge">{award_text}</span>'
            else:
                conf_html = f'<span class="conf-badge">{raw_conf.strip()}</span>'
                award_html = ""

        card = card.replace(conf_match.group(0), conf_html + ('\n                        ' + award_html if award_html else ''))

    # 3. Replace [Code], [Project], [Video] with link-btn
    card = re.sub(r'<a href="([^"]+)">\[Code\]</a>', r'<a href="\1" class="link-btn">💻 Code</a>', card)
    card = re.sub(r'<a href="([^"]+)">\[Project\]</a>', r'<a href="\1" class="link-btn">🏠 Project</a>', card)
    card = re.sub(r'<a href="([^"]+)">\[Video\]</a>', r'<a href="\1" class="link-btn">📹 Video</a>', card)

    # 4. Insert PDF link-btn if we found one
    if pdf_url:
        pdf_btn = f'<a href="{pdf_url}" class="link-btn">📄 PDF</a>\n                        '
        # Insert it inside paper-badges right before conf_html or at the beginning of the badges div
        badges_match = re.search(r'<div class="paper-badges">\s*', card)
        if badges_match:
            # We want to put PDF next to Code/Project, but we can also just put it right after the badges.
            # Actually, paper-badges is now a flex container, so order matters. Let's put PDF, then Code, then Project, or Conference then Awards then PDF.
            # Conference is usually first. Let's insert PDF after Conference and Awards.
            # Wait, easier to just replace <div class="paper-badges">\s* with itself + pdf_btn if we want it at the start.
            pass
            # Or we can insert it after the conf-badge.
    
    # Let's reconstruct paper-badges properly
    # Extract all elements inside paper-badges
    badges_inner_match = re.search(r'<div class="paper-badges">(.*?)</div>\s*</div>\s*</div>', card, re.DOTALL)
    if badges_inner_match:
        badges_content = badges_inner_match.group(1)
        # remove old links and badges from badges_content if we want to reorder, but let's just prepend PDF.
        if pdf_url:
            new_badges_content = f'\n                        {pdf_btn}' + badges_content
            card = card.replace(badges_content, new_badges_content)

    # 5. Author list: replace <b>Mengqi Huang...</b> with <span class="my-name">...</span>
    card = re.sub(r'<b>(Mengqi Huang.*?)</b>', r'<span class="my-name">\1</span>', card)
    card = re.sub(r'<strong>(Mengqi Huang.*?)</strong>', r'<span class="my-name">\1</span>', card)

    new_paper_part += '<div class="paper-card">' + card

new_html = new_paper_part + rest

with open("index.html", "w") as f:
    f.write(new_html)
