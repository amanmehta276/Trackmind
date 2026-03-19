async function saveLog() {
    const notesInput = document.getElementById("notes");
    const resultCard = document.getElementById("result-card");
    const aiResponseDiv = document.getElementById("ai-response");
    const btn = document.getElementById("saveBtn");
    const btnText = document.getElementById("btn-text");
    const btnDots = document.getElementById("btn-dots");
    const topicImage = document.getElementById("topic-image");

    if (!notesInput.value.trim()) {
        alert("Please write something first!");
        return;
    }

    // ✅ CHANGE 1: Only send notes — new backend only needs this
    const data = {
        notes: notesInput.value
    };

    // UI: loading state
    btn.disabled = true;
    btnText.style.display = "none";
    btnDots.style.display = "flex";
    resultCard.style.display = "block";
    aiResponseDiv.innerHTML = `<p style="color:var(--muted); text-align:center; padding: 20px 0;">Groq is thinking...</p>`;
    topicImage.style.display = "none";

    // ✅ CHANGE 2: Get token from localStorage (set after login)
    const token = localStorage.getItem("tm_token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        // ✅ CHANGE 3: Correct URL + send JWT token in header
        const response = await fetch("http://localhost:5000/api/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`   // JWT auth
            },
            body: JSON.stringify(data)
        });

        // If token expired, go back to login
        if (response.status === 401) {
            localStorage.removeItem("tm_token");
            localStorage.removeItem("tm_user");
            window.location.href = "index.html";
            return;
        }

        const result = await response.json();

        // ✅ CHANGE 4: New backend returns result.note.aiFeedback (not result.ai_analysis)
        const rawText = result.note?.aiFeedback || result.error || "No response received.";

        // Render formatted response
        aiResponseDiv.innerHTML = formatAIResponse(rawText);

        // Fetch a relevant image from Unsplash
        const topic = extractTopic(notesInput.value);
        fetchTopicImage(topic, topicImage);

    } catch (error) {
        console.error("Fetch error:", error);
        aiResponseDiv.innerHTML = `<p style="color:#ff6584;">Error connecting to backend. Is Flask running on port 5000?</p>`;
    } finally {
        btn.disabled = false;
        btnText.style.display = "inline";
        btnDots.style.display = "none";
    }
}

/**
 * Converts Groq's markdown-style response into clean HTML sections.
 * Handles: **bold**, numbered headings, bullet points (- and *)
 */
function formatAIResponse(text) {
    const sectionIcons = ["📋", "💪", "🎯", "⚡"];
    let html = "";
    text = text.replace(/^\s*\*\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
    const sections = text.split(/(?=\n?\*?\*?\d+\.\s)/);

    let sectionIndex = 0;

    sections.forEach(section => {
        section = section.trim();
        if (!section) return;

        const headingMatch = section.match(/^\*?\*?(\d+)\.\s+\*?\*?([^\n*]+)\*?\*?/);

        if (headingMatch) {
            const title = headingMatch[2].trim();
            const rest = section.replace(headingMatch[0], "").trim();
            const icon = sectionIcons[sectionIndex] || "•";

            html += `<div class="section">`;
            html += `<div class="section-title">${icon} ${title}</div>`;
            html += parseBody(rest);
            html += `</div>`;
            sectionIndex++;
        } else {
            html += `<div class="section"><p>${parseInline(section)}</p></div>`;
        }
    });

    return html || `<p>${parseInline(text)}</p>`;
}

function parseBody(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const bulletLines = lines.filter(l => /^[-*•]\s/.test(l) || /^\*\*/.test(l));

    if (bulletLines.length > 0) {
        const items = lines.map(line => {
            const clean = line.replace(/^[-*•]\s+/, "").trim();
            if (!clean) return "";
            return `<li>${parseInline(clean)}</li>`;
        }).filter(Boolean).join("");
        return `<ul>${items}</ul>`;
    }

    return `<p>${parseInline(lines.join(" "))}</p>`;
}

function parseInline(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function extractTopic(notes) {
    const keywords = ["javascript", "python", "math", "physics", "chemistry",
        "biology", "history", "arrays", "algorithms", "data structures",
        "react", "css", "html", "machine learning", "calculus", "english",
        "programming", "coding", "science", "geography"];

    const lower = notes.toLowerCase();
    for (const kw of keywords) {
        if (lower.includes(kw)) return kw;
    }
    return "studying books desk";
}

function fetchTopicImage(topic, imgEl) {
    const query = encodeURIComponent(topic + " study");
    imgEl.src = `https://source.unsplash.com/featured/720x180/?${query}&sig=${Date.now()}`;
    imgEl.style.display = "block";
    imgEl.onerror = () => { imgEl.style.display = "none"; };
}
// PWA — register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ SW registered:', reg.scope))
      .catch(err => console.warn('❌ SW failed:', err));
  });
}